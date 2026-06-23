import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/authors — 案例作者列表（创建过案例的用户）
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let sql = `SELECT u.id,
                      u.real_name as name,
                      u.email,
                      u.organization as institution,
                      u.department,
                      u.avatar_url,
                      u.role,
                      COUNT(c.id)::int as case_count
               FROM users u
               JOIN cases c ON c.created_by = u.id
               WHERE 1=1`;
    const vals: any[] = [];
    let idx = 1;

    if (search) {
      sql += ` AND (u.real_name ILIKE $${idx} OR u.email ILIKE $${idx+1} OR u.organization ILIKE $${idx+2})`;
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
      idx += 3;
    }

    sql += ` GROUP BY u.id ORDER BY case_count DESC, u.real_name`;

    const rows = await query(sql, vals);

    const stats: { label: string; value: string }[] = [
      { label: '案例作者', value: `${rows.length} 位` },
      { label: '累计案例', value: `${rows.reduce((s: number, r: any) => s + (r.case_count || 0), 0)} 篇` },
    ];

    res.json({ success: true, data: rows, stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/authors/:userId — 作者详情
router.get('/:userId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      `SELECT u.id, u.real_name as name, u.email, u.organization as institution,
              u.department, u.avatar_url, u.role, u.status,
              (SELECT COUNT(*) FROM cases WHERE created_by = u.id)::int as case_count
       FROM users u WHERE u.id = $1 AND u.id IN (SELECT created_by FROM cases)`,
      [req.params.userId]
    );

    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '作者不存在' } }); return; }

    res.json({ success: true, data: user });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/authors/:userId/cases — 作者投稿的案例+投稿列表
router.get('/:userId/cases', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let sql = `SELECT id, case_number, title, category, status, priority,
                      description, created_at, updated_at,
                      'case' as source
               FROM cases
               WHERE created_by = $1`;
    const vals: any[] = [req.params.userId];
    let idx = 2;

    if (search) {
      sql += ` AND (title ILIKE $${idx} OR case_number ILIKE $${idx+1} OR category ILIKE $${idx+2})`;
      vals.push(`%${search}%`, `%${search}%`, `%${search}%`);
      idx += 3;
    }

    sql += ` ORDER BY created_at DESC`;

    const rows = await query(sql, vals);
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
