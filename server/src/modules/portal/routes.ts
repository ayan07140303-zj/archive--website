import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/portal/announcements
router.get('/announcements', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search, category, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE is_active = true';
    const vals: any[] = []; let idx = 1;
    if (category && category !== '全部') { where += ` AND category = $${idx++}`; vals.push(category); }
    if (search) { where += ` AND (title ILIKE $${idx++} OR content ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }

    const [rows, cnt] = await Promise.all([
      query(`SELECT * FROM announcements ${where} ORDER BY published_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM announcements ${where}`, vals),
    ]);

    const total = parseInt(cnt?.count || '0');
    res.json({
      success: true,
      data: rows,
      pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/portal/regional-updates
router.get('/regional-updates', optionalAuth, async (req: Request, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 3;
    const rows = await query('SELECT * FROM regional_updates ORDER BY published_at DESC LIMIT $1', [limit]);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/portal/latest-releases
router.get('/latest-releases', optionalAuth, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 5;
    const offset = (page - 1) * pageSize;

    // 获取最新文档作为"档案发布"
    const rows = await query(
      `SELECT d.id, d.title, d.author, d.organization, d.description,
              d.content_type, d.published_at, d.view_count,
              t.title as topic_title,
              (SELECT array_agg(tag) FROM document_tags WHERE document_id = d.id) as tags
       FROM documents d LEFT JOIN topics t ON d.topic_id = t.id
       ORDER BY d.published_at DESC LIMIT $1 OFFSET $2`,
      [pageSize, offset]
    );

    // 存储统计
    const stats = {
      storageDensityPB: 8.4,
      densityGrowthPercent: 12,
      requestQueueCount: 3842,
      avgProcessingDays: 1.8,
    };

    res.json({ success: true, data: { documents: rows, stats } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/portal/highlights — 首页最新案例 + 热门案例
router.get('/highlights', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const [latest, hot] = await Promise.all([
      query(`SELECT id, case_number, title, category, status, priority, description, view_count, created_at FROM cases ORDER BY created_at DESC LIMIT 5`),
      query(`SELECT id, case_number, title, category, status, priority, description, view_count, created_at FROM cases ORDER BY view_count DESC LIMIT 5`),
    ]);
    res.json({ success: true, data: { latest, hot } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/portal/announcements/:id — 公告详情
router.get('/announcements/:id', optionalAuth, async (req: Request, res: Response) => {
  try {
    const a = await queryOne(
      'SELECT * FROM announcements WHERE id = $1 AND is_active = true',
      [req.params.id]
    );
    if (!a) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } }); return; }

    // 增加阅读计数
    await queryOne('UPDATE announcements SET view_count = COALESCE(view_count, 0) + 1 WHERE id = $1', [a.id]);

    res.json({ success: true, data: a });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
