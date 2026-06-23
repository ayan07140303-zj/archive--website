import { Router, Request, Response } from 'express';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';

const router = Router();

function buildTree(rows: any[], parentId: string | null = null): any[] {
  return rows
    .filter(r => r.parent_id === parentId)
    .sort((a, b) => a.sort_order - b.sort_order)
    .map(r => ({ ...r, children: buildTree(rows, r.id) }));
}

// GET /api/v1/taxonomy/tree
router.get('/tree', optionalAuth, async (req: Request, res: Response) => {
  try {
    const search = req.query.search as string;
    let rows;
    if (search) {
      rows = await query('SELECT * FROM taxonomy_nodes WHERE name ILIKE $1 ORDER BY sort_order', [`%${search}%`]);
    } else {
      rows = await query('SELECT * FROM taxonomy_nodes ORDER BY sort_order');
    }
    res.json({ success: true, data: buildTree(rows) });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/taxonomy/nodes/:nodeId
router.get('/nodes/:nodeId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const node = await queryOne('SELECT * FROM taxonomy_nodes WHERE id = $1', [req.params.nodeId]);
    if (!node) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '节点不存在' } }); return; }

    const children = await query('SELECT * FROM taxonomy_nodes WHERE parent_id = $1 ORDER BY sort_order', [node.id]);
    const access = req.user
      ? await query('SELECT * FROM taxonomy_node_access WHERE node_id = $1', [node.id])
      : [];

    res.json({ success: true, data: { ...node, children, access_permissions: access } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/taxonomy/nodes
router.post('/nodes', requireAuth, async (req: Request, res: Response) => {
  try {
    const { parent_id, name, type, retention, security, sort_order } = req.body;
    if (!name || !type) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '名称和类型为必填项' } });
      return;
    }
    const node = await queryOne(
      `INSERT INTO taxonomy_nodes (parent_id, name, type, retention, security, sort_order)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [parent_id || null, name, type, retention || null, security || 'Public', sort_order || 0]
    );
    res.status(201).json({ success: true, data: node });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/taxonomy/nodes/:nodeId
router.put('/nodes/:nodeId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { name, type, retention, security, sort_order, record_count } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let i = 1;
    if (name !== undefined) { sets.push(`name = $${i++}`); vals.push(name); }
    if (type !== undefined) { sets.push(`type = $${i++}`); vals.push(type); }
    if (retention !== undefined) { sets.push(`retention = $${i++}`); vals.push(retention); }
    if (security !== undefined) { sets.push(`security = $${i++}`); vals.push(security); }
    if (sort_order !== undefined) { sets.push(`sort_order = $${i++}`); vals.push(sort_order); }
    if (record_count !== undefined) { sets.push(`record_count = $${i++}`); vals.push(record_count); }
    if (sets.length === 0) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '无更新字段' } }); return; }

    vals.push(req.params.nodeId);
    const node = await queryOne(`UPDATE taxonomy_nodes SET ${sets.join(', ')} WHERE id = $${i} RETURNING *`, vals);
    if (!node) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '节点不存在' } }); return; }
    res.json({ success: true, data: node });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/taxonomy/nodes/:nodeId
router.delete('/nodes/:nodeId', requireAuth, async (req: Request, res: Response) => {
  try {
    const node = await queryOne('DELETE FROM taxonomy_nodes WHERE id = $1 RETURNING id', [req.params.nodeId]);
    if (!node) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '节点不存在' } }); return; }
    res.json({ success: true, message: '节点已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
