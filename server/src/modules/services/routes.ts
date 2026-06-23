import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/services/tags-and-regions — 可用的订阅标签和区域（基于实际案例数据）
router.get('/tags-and-regions', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const [categories, regionalNames] = await Promise.all([
      query<{ tag: string }>(
        `SELECT DISTINCT category as tag FROM cases WHERE category IS NOT NULL AND category != ''
         UNION SELECT DISTINCT category as tag FROM topics WHERE is_active = true`
      ),
      query<{ tag: string }>('SELECT DISTINCT region_name as tag FROM user_regions'),
    ]);
    const tags = categories.map(r => r.tag).filter(t => t.length > 0 && t.length <= 20);
    const regionPresets = ['京津冀地区', '长三角经济圈', '粤港澳大湾区', '成渝双城经济圈', '长江中游城市群'];
    const usedRegions = regionalNames.map(r => r.tag).filter(r => r && r.length > 0);
    const regions = [...new Set([...regionPresets, ...usedRegions])];
    res.json({ success: true, data: { tags, regions } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/services/recommendations
router.get('/recommendations', optionalAuth, async (req: Request, res: Response) => {
  try {
    let recs: any[] = [];

    if (req.user) {
      const [subs, regions, prefs] = await Promise.all([
        query<{ tag: string }>('SELECT tag FROM user_subscriptions WHERE user_id = $1', [req.user.userId]),
        query<{ region_name: string }>('SELECT region_name FROM user_regions WHERE user_id = $1', [req.user.userId]),
        queryOne<{ search_weights: string[] }>('SELECT search_weights FROM user_preferences WHERE user_id = $1', [req.user.userId]),
      ]);
      const tags = subs.map(s => s.tag);
      const regionNames = regions.map(r => r.region_name);
      const weights: string[] = Array.isArray(prefs?.search_weights) ? prefs!.search_weights : ['latest', 'core'];

      // 构建查询：每个标签一个参数 $1, $2, ...
      const conditions: string[] = [];
      const vals: any[] = [];
      let idx = 1;

      if (tags.length > 0) {
        const parts = tags.map((_, i) => {
          const p = idx + i;
          return `(c.title ILIKE $${p} OR c.category ILIKE $${p} OR c.description ILIKE $${p})`;
        });
        conditions.push(`(${parts.join(' OR ')})`);
        tags.forEach(t => { vals.push(`%${t}%`); idx++; });
      }

      if (regionNames.length > 0) {
        const parts = regionNames.map((_, i) => {
          const p = idx + i;
          return `(c.title ILIKE $${p} OR c.description ILIKE $${p})`;
        });
        conditions.push(`(${parts.join(' OR ')})`);
        regionNames.forEach(r => { vals.push(`%${r}%`); idx++; });
      }

      let sql = `SELECT c.id, c.topic_id, c.case_number, c.title, c.category, c.status, c.priority,
                        c.description, c.view_count, c.created_at, c.updated_at,
                        t.title as topic_title
                 FROM cases c
                 LEFT JOIN topics t ON c.topic_id = t.id
                 WHERE c.status IN ('open', 'completed')`;
      if (conditions.length > 0) {
        sql += ` AND (${conditions.join(' AND ')})`;
      }

      const preferLatest = weights.includes('latest');
      const preferCore = weights.includes('core');
      if (preferLatest && preferCore) {
        sql += ` ORDER BY c.view_count * 0.01 + (CASE WHEN c.created_at > NOW() - INTERVAL '30 days' THEN 1 ELSE 0 END) DESC`;
      } else if (preferLatest) {
        sql += ` ORDER BY c.created_at DESC`;
      } else if (preferCore) {
        sql += ` ORDER BY c.view_count DESC`;
      } else {
        sql += ` ORDER BY c.view_count DESC`;
      }
      sql += ` LIMIT 6`;

      recs = await query(sql, vals);

      // 不够 4 条用热门补足
      if (recs.length < 4) {
        const existingIds = recs.map(r => r.id);
        const excludeClause = existingIds.length > 0
          ? `AND c.id NOT IN (${existingIds.map((_,i) => `$${i+1}`).join(',')})`
          : '';
        const limitNum = 6 - recs.length;
        const fillVals = existingIds.length > 0 ? existingIds : [];
        const fill = await query(
          `SELECT c.id, c.topic_id, c.case_number, c.title, c.category, c.status, c.priority,
                  c.description, c.view_count, c.created_at, c.updated_at,
                  t.title as topic_title
           FROM cases c LEFT JOIN topics t ON c.topic_id = t.id
           WHERE c.status IN ('open', 'completed') ${excludeClause}
           ORDER BY c.view_count DESC LIMIT ${limitNum}`,
          fillVals
        );
        recs = [...recs, ...fill].slice(0, 6);
      }

      res.json({
        success: true,
        data: recs,
        personalized: (tags.length + regionNames.length) > 0,
        meta: { subscriptionTags: tags, regions: regionNames, weights },
      });
    } else {
      recs = await query(
        `SELECT c.id, c.topic_id, c.case_number, c.title, c.category, c.status, c.priority,
                c.description, c.view_count, c.created_at, c.updated_at,
                t.title as topic_title
         FROM cases c LEFT JOIN topics t ON c.topic_id = t.id
         WHERE c.status IN ('open', 'completed')
         ORDER BY c.view_count DESC LIMIT 6`
      );
      res.json({ success: true, data: recs, personalized: false });
    }
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/services/subscriptions
router.get('/subscriptions', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT tag FROM user_subscriptions WHERE user_id = $1', [req.user!.userId]);
    res.json({ success: true, data: rows.map(r => r.tag) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/services/subscriptions
router.put('/subscriptions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { tags } = req.body; // string[]
    if (!Array.isArray(tags)) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: 'tags 应为字符串数组' } }); return; }

    await query('DELETE FROM user_subscriptions WHERE user_id = $1', [req.user!.userId]);
    for (const tag of tags) {
      await query('INSERT INTO user_subscriptions (user_id, tag) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user!.userId, tag]);
    }
    res.json({ success: true, message: '订阅已更新' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/services/regions
router.get('/regions', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await query('SELECT region_name FROM user_regions WHERE user_id = $1', [req.user!.userId]);
    res.json({ success: true, data: rows.map(r => r.region_name) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/services/regions
router.put('/regions', requireAuth, async (req: Request, res: Response) => {
  try {
    const { regions } = req.body;
    await query('DELETE FROM user_regions WHERE user_id = $1', [req.user!.userId]);
    for (const r of regions || []) {
      await query('INSERT INTO user_regions (user_id, region_name) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user!.userId, r]);
    }
    res.json({ success: true, message: '关注区域已更新' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/services/overview
router.get('/overview', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const [docs, experts, datasets] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM documents'),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM experts WHERE status = $1', ['active']),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM datasets WHERE status = $1', ['active']),
    ]);
    res.json({
      success: true,
      data: {
        totalResources: `${((parseInt(docs?.count || '0') / 1000) || 0).toFixed(1)}M+`,
        connectedInstitutions: parseInt(experts?.count || '0'),
        dailyActiveUsers: 894,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
