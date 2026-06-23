import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/experts/stats
router.get('/stats', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const [totalRes, fieldRes, consultRes, institutionRes] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM experts WHERE status = $1', ['active']),
      queryOne<{ count: string }>('SELECT COUNT(DISTINCT field) as count FROM experts WHERE status = $1', ['active']),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM expert_consultations'),
      queryOne<{ count: string }>('SELECT COUNT(DISTINCT institution) as count FROM experts WHERE status = $1', ['active']),
    ]);
    const stats = [
      { label: '注册专家', value: `${parseInt(totalRes?.count || '0')}+` },
      { label: '覆盖领域', value: `${parseInt(fieldRes?.count || '0')} 个` },
      { label: '成功咨询', value: `${parseInt(consultRes?.count || '0').toLocaleString()}+` },
      { label: '机构分布', value: `${parseInt(institutionRes?.count || '0')}+` },
    ];
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/experts
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { tab, field, search, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 20;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM experts WHERE status = $1';
    const vals: any[] = ['active'];
    let idx = 2;

    if (tab === 'active') { sql += ' AND review_count > 50'; }
    if (tab === 'academic') { sql += ' AND is_verified = true'; }
    if (tab === 'new') { sql += ` AND joined_at > CURRENT_DATE - INTERVAL '90 days'`; }
    if (field) { sql += ` AND field ILIKE $${idx++}`; vals.push(`%${field}%`); }
    if (search) { sql += ` AND (name ILIKE $${idx++} OR institution ILIKE $${idx++} OR field ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    sql += ' ORDER BY rating DESC';

    // Count
    let countSql = 'SELECT COUNT(*) as count FROM experts WHERE status = $1';
    const countVals: any[] = ['active'];
    let countIdx = 2;
    if (tab === 'active') { countSql += ' AND review_count > 50'; }
    if (tab === 'academic') { countSql += ' AND is_verified = true'; }
    if (tab === 'new') { countSql += ` AND joined_at > CURRENT_DATE - INTERVAL '90 days'`; }
    if (field) { countSql += ` AND field ILIKE $${countIdx++}`; countVals.push(`%${field}%`); }
    if (search) { countSql += ` AND (name ILIKE $${countIdx++} OR institution ILIKE $${countIdx++} OR field ILIKE $${countIdx++})`; countVals.push(`%${search}%`, `%${search}%`, `%${search}%`); }

    const [rows, cnt] = await Promise.all([
      query(sql + ` LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]),
      queryOne<{ count: string }>(countSql, countVals),
    ]);

    const total = parseInt(cnt?.count || '0');
    res.json({ success: true, data: rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/experts/:expertId
router.get('/:expertId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const expert = await queryOne('SELECT * FROM experts WHERE id = $1', [req.params.expertId]);
    if (!expert) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '专家不存在' } }); return; }

    res.json({ success: true, data: expert });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/experts/:expertId/consult
router.post('/:expertId/consult', requireAuth, async (req: Request, res: Response) => {
  try {
    const { topic, message } = req.body;
    if (!topic || !message) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '咨询主题和内容为必填项' } }); return; }

    const c = await queryOne(
      `INSERT INTO expert_consultations (expert_id, user_id, topic, message) VALUES ($1,$2,$3,$4) RETURNING *`,
      [req.params.expertId, req.user!.userId, topic, message]
    );
    res.status(201).json({ success: true, data: c, message: '咨询已发送' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/experts/apply
router.post('/apply', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, role_title, institution, field, location, bio } = req.body;
    if (!name || !institution) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '姓名和机构为必填项' } }); return; }

    await queryOne(
      `INSERT INTO experts (name, role_title, institution, field, location, bio, status, is_verified)
       VALUES ($1,$2,$3,$4,$5,$6,'inactive',false)`,
      [name, role_title, institution, field || null, location || null, bio || null]
    );
    res.status(201).json({ success: true, message: '入驻申请已提交，等待审核' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
