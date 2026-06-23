import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/reports
router.get('/', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { category, type, search, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 12;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT * FROM reports WHERE 1=1';
    const vals: any[] = [];
    let idx = 1;

    if (category && category !== '全部报告') { sql += ` AND category = $${idx++}`; vals.push(category); }
    if (search) { sql += ` AND (title ILIKE $${idx++} OR description ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }
    if (type === 'collected') { sql += ' AND is_premium = false'; }

    sql += ' ORDER BY published_at DESC';
    const rows = await query(sql + ` LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]);
    res.json({ success: true, data: rows, pagination: { page, pageSize, total: rows.length, totalPages: 1 } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/reports/analytics/trend
router.get('/analytics/trend', optionalAuth, async (req: Request, res: Response) => {
  try {
    const trend = [
      { name: '1月', value: 400 }, { name: '2月', value: 300 }, { name: '3月', value: 600 },
      { name: '4月', value: 800 }, { name: '5月', value: 500 }, { name: '6月', value: 900 },
    ];
    res.json({ success: true, data: trend });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/reports/:reportId
router.get('/:reportId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const report = await queryOne('SELECT * FROM reports WHERE id = $1', [req.params.reportId]);
    if (!report) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '报告不存在' } }); return; }

    // 记录下载
    await queryOne('UPDATE reports SET download_count = download_count + 1 WHERE id = $1', [report.id]);

    res.json({ success: true, data: report });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/reports/:reportId/download
router.get('/:reportId/download', optionalAuth, async (req: Request, res: Response) => {
  try {
    const report = await queryOne<{ is_premium: boolean; file_url: string | null }>(
      'SELECT is_premium, file_url FROM reports WHERE id = $1', [req.params.reportId]
    );
    if (!report) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '报告不存在' } }); return; }
    if (report.is_premium && !req.user) {
      res.status(403).json({ success: false, error: { code: 'FORBIDDEN', message: '请登录后下载 Premium 报告' } });
      return;
    }

    res.json({ success: true, data: { downloadUrl: report.file_url || '#' }, message: '文件流应在此返回' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
