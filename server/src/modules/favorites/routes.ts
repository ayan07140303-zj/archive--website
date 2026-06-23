import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/favorites — 我的收藏列表
router.get('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT uf.case_id, uf.created_at as favorited_at,
              c.title, c.case_number, c.category, c.achievement_type, c.target_audience, c.consulting_form,
              c.description, c.status, c.created_at
       FROM user_favorites uf
       JOIN cases c ON uf.case_id = c.id
       WHERE uf.user_id = $1
       ORDER BY uf.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/favorites/:caseId — 收藏案例
router.post('/:caseId', requireAuth, async (req: Request, res: Response) => {
  try {
    await queryOne(
      'INSERT INTO user_favorites (user_id, case_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [req.user!.userId, req.params.caseId]
    );
    res.json({ success: true, message: '收藏成功' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/favorites/:caseId — 取消收藏
router.delete('/:caseId', requireAuth, async (req: Request, res: Response) => {
  try {
    await queryOne(
      'DELETE FROM user_favorites WHERE user_id = $1 AND case_id = $2',
      [req.user!.userId, req.params.caseId]
    );
    res.json({ success: true, message: '已取消收藏' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/favorites/:caseId/status — 查询是否已收藏
router.get('/:caseId/status', requireAuth, async (req: Request, res: Response) => {
  try {
    const row = await queryOne(
      'SELECT 1 FROM user_favorites WHERE user_id = $1 AND case_id = $2',
      [req.user!.userId, req.params.caseId]
    );
    res.json({ success: true, data: { favorited: !!row } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
