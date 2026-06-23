import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { requireAuth } from '../../middleware/auth.js';

const router = Router();

// GET /api/v1/submissions/me — 当前用户的投稿列表
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const rows = await query(
      `SELECT s.*,
              COALESCE(r.real_name, '') as reviewer_name
       FROM submissions s
       LEFT JOIN users r ON s.reviewed_by = r.id
       WHERE s.submitted_by = $1
       ORDER BY s.created_at DESC`,
      [req.user!.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/submissions/:id — 删除自己的投稿（仅 pending 或 rejected 可删）
router.delete('/:id', requireAuth, async (req: Request, res: Response) => {
  try {
    const s = await queryOne(
      `SELECT * FROM submissions WHERE id = $1 AND submitted_by = $2`,
      [req.params.id, req.user!.userId]
    );
    if (!s) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '投稿不存在或无权操作' } });
      return;
    }
    if ((s as any).status === 'approved') {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '已通过的投稿不可删除（案例已入库）' } });
      return;
    }

    await queryOne('DELETE FROM submissions WHERE id = $1', [req.params.id]);
    res.json({ success: true, message: '投稿已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
