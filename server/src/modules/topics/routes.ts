import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    const safeName = crypto.randomUUID();
    cb(null, `${safeName}${ext}`);
  },
});
const upload = multer({ storage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// GET /api/v1/library/topics
router.get('/topics', optionalAuth, async (req: Request, res: Response) => {
  try {
    const { category, search, sort, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 12;
    const offset = (page - 1) * pageSize;

    // 先拿纯 topic 数据（不依赖 topic_id 列）
    let sql = `SELECT t.*, 0::int as case_count, NULL::timestamptz as latest_update FROM topics t WHERE t.is_active = true`;
    const vals: any[] = [];
    let idx = 1;

    if (category && category !== '全部领域') { sql += ` AND t.category = $${idx++}`; vals.push(category); }
    if (search) { sql += ` AND (t.title ILIKE $${idx++} OR t.description ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }

    const orderMap: Record<string, string> = { latest: 't.created_at DESC', popular: 'case_count DESC', updated: 't.updated_at DESC' };
    sql += ` ORDER BY ${orderMap[sort as string] || 't.created_at DESC'}`;
    vals.push(pageSize, offset);
    sql += ` LIMIT $${idx++} OFFSET $${idx++}`;

    const rows = await query(sql, vals);

    // 尝试 JOIN cases 拿真实案例数（topic_id 列可能存在也可能不存在）
    try {
      const enriched = await query(
        `SELECT id, case_count, latest_case_at FROM (
           SELECT t.id,
             COALESCE((SELECT COUNT(*) FROM cases c WHERE c.topic_id = t.id), 0)::int as case_count,
             (SELECT MAX(updated_at) FROM cases c WHERE c.topic_id = t.id) as latest_case_at
           FROM topics t WHERE t.is_active = true
         ) sub`
      );
      const map = new Map(enriched.map((e: any) => [e.id, { case_count: e.case_count, latest_update: e.latest_case_at }]));
      for (const row of rows) {
        const e = map.get((row as any).id);
        if (e) {
          (row as any).case_count = e.case_count;
          (row as any).latest_update = e.latest_update;
        }
      }
    } catch { /* topic_id 列不存在时静默降级 */ }

    const countRow = await queryOne<{ count: string }>(
      `SELECT COUNT(*) as count FROM topics t WHERE t.is_active = true${category && category !== '全部领域' ? ` AND t.category = '${category}'` : ''}`
    );
    const total = parseInt(countRow?.count || '0');
    res.json({ success: true, data: rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/library/topics/:topicId
router.get('/topics/:topicId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const topic = await queryOne('SELECT * FROM topics WHERE id = $1', [req.params.topicId]);
    if (!topic) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '专题不存在' } }); return; }

    const [docs, experts, typeDist] = await Promise.all([
      query(
        `SELECT d.*, (SELECT array_agg(tag) FROM document_tags WHERE document_id = d.id) as tags
         FROM documents d WHERE d.topic_id = $1 ORDER BY d.published_at DESC LIMIT 10`,
        [topic.id]
      ),
      query('SELECT e.* FROM experts e JOIN topic_experts te ON e.id = te.expert_id WHERE te.topic_id = $1', [topic.id]),
      query('SELECT content_type as label, COUNT(*)::int as value FROM documents WHERE topic_id = $1 GROUP BY content_type', [topic.id]),
    ]);

    res.json({ success: true, data: { ...topic, documents: docs, experts, doc_type_distribution: typeDist } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/library/topics — 创建专题
router.post('/topics', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, description, category, cover_image } = req.body;
    if (!title) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题为必填' } }); return; }
    const t = await queryOne(
      `INSERT INTO topics (title, description, category, cover_image) VALUES ($1,$2,$3,$4) RETURNING *`,
      [title, description || null, category || '全部领域', cover_image || null]
    );
    res.status(201).json({ success: true, data: t });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/library/topics/:topicId/documents — 向专题添加文献（+文件上传）
router.post('/topics/:topicId/documents', requireAuth, upload.array('files', 5), async (req: Request, res: Response) => {
  try {
    const { title, author, organization, description, content_type, published_at } = req.body;
    if (!title) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题为必填' } }); return; }

    const uploadedFiles = (req.files as Express.Multer.File[]) || [];
    const fileUrl = uploadedFiles.length > 0 ? `/api/v1/uploads/${uploadedFiles[0].filename}` : null;

    const doc = await queryOne(
      `INSERT INTO documents (topic_id, title, author, organization, description, content_type, file_url, file_size, published_at, security_level)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'public') RETURNING *`,
      [req.params.topicId, title, author || null, organization || null, description || null,
       content_type || '实践案例', fileUrl,
       uploadedFiles[0]?.size || null, published_at || new Date().toISOString().slice(0, 10)]
    );

    // 更新专题文献计数
    await queryOne('UPDATE topics SET doc_count = (SELECT COUNT(*) FROM documents WHERE topic_id = $1), updated_at = NOW() WHERE id = $1', [req.params.topicId]);

    res.status(201).json({ success: true, data: doc, message: '文献已添加' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/library/topics/:topicId/follow
router.post('/topics/:topicId/follow', requireAuth, async (req: Request, res: Response) => {
  try {
    await queryOne('INSERT INTO user_followed_topics (user_id, topic_id) VALUES ($1,$2) ON CONFLICT DO NOTHING', [req.user!.userId, req.params.topicId]);
    res.json({ success: true, message: '关注成功' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/library/topics/:topicId/follow
router.delete('/topics/:topicId/follow', requireAuth, async (req: Request, res: Response) => {
  try {
    await queryOne('DELETE FROM user_followed_topics WHERE user_id = $1 AND topic_id = $2', [req.user!.userId, req.params.topicId]);
    res.json({ success: true, message: '已取消关注' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/library/documents/:docId
router.get('/documents/:docId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const doc = await queryOne(
      `SELECT d.*, t.title as topic_title,
              (SELECT array_agg(tag) FROM document_tags WHERE document_id = d.id) as tags
       FROM documents d LEFT JOIN topics t ON d.topic_id = t.id WHERE d.id = $1`,
      [req.params.docId]
    );
    if (!doc) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '文献不存在' } }); return; }

    const comments = await query(
      `SELECT dc.*, u.real_name as user_name, u.role as user_role
       FROM document_comments dc JOIN users u ON dc.user_id = u.id
       WHERE dc.document_id = $1 ORDER BY dc.created_at DESC`,
      [doc.id]
    );

    res.json({ success: true, data: { ...doc, comments } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/library/documents/:docId/comments — 发表评论
router.post('/documents/:docId/comments', requireAuth, async (req: Request, res: Response) => {
  try {
    const { content } = req.body;
    if (!content) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '评论内容为必填' } }); return; }
    const c = await queryOne(
      `INSERT INTO document_comments (document_id, user_id, content) VALUES ($1,$2,$3) RETURNING *`,
      [req.params.docId, req.user!.userId, content]
    );
    res.status(201).json({ success: true, data: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
