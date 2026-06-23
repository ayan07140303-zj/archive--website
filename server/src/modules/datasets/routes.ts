import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/datasets/stats
router.get('/stats', optionalAuth, async (_req: Request, res: Response) => {
  try {
    const stats = {
      totalScale: '42.8 PB',
      activeCount: 1452,
      crossBorderNodes: 18,
      monthlyApiCalls: '852k',
    };
    res.json({ success: true, data: stats });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/datasets
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { search, security, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 20;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM datasets WHERE status = $1';
    const vals: any[] = ['active'];
    let idx = 2;

    if (search) { sql += ` AND (name ILIKE $${idx++} OR description ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }
    if (security) { sql += ` AND security_level = $${idx++}`; vals.push(security); }

    sql += ' ORDER BY updated_at DESC';

    const rows = await query(sql + ` LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]);
    res.json({ success: true, data: rows, pagination: { page, pageSize, total: rows.length, totalPages: 1 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/datasets/export
router.post('/export', requireAuth, async (req: Request, res: Response) => {
  try {
    const ids = req.body.ids as string[];
    if (!ids?.length) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '请选择要导出的数据集' } }); return; }
    // TODO: 实际文件生成
    res.json({ success: true, data: { message: `已提交 ${ids.length} 个数据集的导出任务` } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
