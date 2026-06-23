import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { query, queryOne } from '../../db.js';
import { optionalAuth, requireAuth } from '../../middleware/auth.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

// multer 配置：磁盘文件名使用 uuid + 原扩展名，避免中文乱码
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

// GET /api/v1/cases
router.get('/', async (req: Request, res: Response) => {
  try {
    const { status, search, priority, category, topic_id, achievement_type, target_audience, consulting_form, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 20;
    const offset = (page - 1) * pageSize;

    let sql = `SELECT c.*, u.real_name as assignee_name, u.avatar_url as assignee_avatar,
               COALESCE(
                 (SELECT json_agg(
                   json_build_object('id', cf.id, 'file_name', cf.file_name, 'file_size', cf.file_size, 'file_type', cf.file_type, 'storage_url', cf.storage_url)
                 ) FROM case_files cf WHERE cf.case_id = c.id),
                 '[]'::json
               ) as files
               FROM cases c LEFT JOIN users u ON c.assignee_id = u.id WHERE 1=1`;
    const vals: any[] = [];
    let idx = 1;

    if (status && status !== 'all') { sql += ` AND c.status = $${idx++}`; vals.push(status); }
    if (priority) { sql += ` AND c.priority = $${idx++}`; vals.push(priority); }
    if (category) { sql += ` AND c.category = $${idx++}`; vals.push(category); }
    if (topic_id) { sql += ` AND c.topic_id = $${idx++}`; vals.push(topic_id); }
    if (achievement_type) { sql += ` AND c.achievement_type = $${idx++}`; vals.push(achievement_type); }
    if (target_audience) { sql += ` AND c.target_audience = $${idx++}`; vals.push(target_audience); }
    if (consulting_form) { sql += ` AND c.consulting_form = $${idx++}`; vals.push(consulting_form); }
    if (search) { sql += ` AND (c.title ILIKE $${idx++} OR c.case_number ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }

    if (req.user?.role === 'contributor') {
      sql += ` AND (c.assignee_id = $${idx++} OR c.created_by = $${idx++})`;
      vals.push(req.user.userId, req.user.userId);
    }

    // 非管理员前台展示：只显示公开可浏览的案例（open/completed，排除 flagged/archived/pending）
    if (!req.user || req.user.role !== 'admin') {
      if (!status || status === 'all') {
        sql += ` AND c.status IN ('open','completed')`;
      }
    }

    sql += ' ORDER BY c.created_at DESC';

    // 构建 COUNT 查询（仅外层 FROM）
    let countSql = `SELECT COUNT(*) FROM cases c WHERE 1=1`;
    let countIdx = 1;
    const countVals: any[] = [];
    if (status && status !== 'all') { countSql += ` AND c.status = $${countIdx++}`; countVals.push(status); }
    if (priority) { countSql += ` AND c.priority = $${countIdx++}`; countVals.push(priority); }
    if (category) { countSql += ` AND c.category = $${countIdx++}`; countVals.push(category); }
    if (topic_id) { countSql += ` AND c.topic_id = $${countIdx++}`; countVals.push(topic_id); }
    if (achievement_type) { countSql += ` AND c.achievement_type = $${countIdx++}`; countVals.push(achievement_type); }
    if (target_audience) { countSql += ` AND c.target_audience = $${countIdx++}`; countVals.push(target_audience); }
    if (consulting_form) { countSql += ` AND c.consulting_form = $${countIdx++}`; countVals.push(consulting_form); }
    if (search) { countSql += ` AND (c.title ILIKE $${countIdx++} OR c.case_number ILIKE $${countIdx++})`; countVals.push(`%${search}%`, `%${search}%`); }
    if (req.user?.role === 'contributor') { countSql += ` AND (c.assignee_id = $${countIdx++} OR c.created_by = $${countIdx++})`; countVals.push(req.user.userId, req.user.userId); }
    if (!req.user || req.user.role !== 'admin') {
      if (!status || status === 'all') { countSql += ` AND c.status IN ('open','completed')`; }
    }

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

// GET /api/v1/cases/:caseId
router.get('/:caseId', optionalAuth, async (req: Request, res: Response) => {
  try {
    const c = await queryOne(
      `SELECT c.*, u.real_name as assignee_name, u.avatar_url as assignee_avatar
       FROM cases c LEFT JOIN users u ON c.assignee_id = u.id WHERE c.id = $1`,
      [req.params.caseId]
    );
    if (!c) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '案例不存在' } }); return; }

    const files = await query('SELECT * FROM case_files WHERE case_id = $1', [c.id]);

    res.json({ success: true, data: { ...c, files } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/cases/:caseId/view — 浏览量 +1（仅前端用户浏览时调用）
router.post('/:caseId/view', optionalAuth, async (req: Request, res: Response) => {
  try {
    const updated = await queryOne(
      `UPDATE cases SET view_count = view_count + 1 WHERE id = $1 RETURNING view_count`,
      [req.params.caseId]
    );
    if (!updated) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '案例不存在' } }); return; }
    res.json({ success: true, data: { view_count: (updated as any).view_count } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/cases
router.post('/', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, category, status, priority, description, topic_id } = req.body;
    if (!title || !category) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题和分类为必填项' } });
      return;
    }

    // 生成唯一案件编号（时间戳+随机避免碰撞）
    const ts = Date.now().toString(36).toUpperCase();
    const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
    const caseNumber = `CASE-${new Date().getFullYear()}-${ts}${rnd}`;

    const c = await queryOne(
      `INSERT INTO cases (case_number, title, category, topic_id, status, priority, description, assignee_id, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [caseNumber, title, category, topic_id || null, status || 'open', priority || 'medium', description || null, null, req.user!.userId]
    );

    res.status(201).json({ success: true, data: c });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/cases/:caseId
router.put('/:caseId', requireAuth, async (req: Request, res: Response) => {
  try {
    const { title, category, status, priority, description, assignee_id, topic_id, achievement_type, target_audience, consulting_form } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (title !== undefined) { sets.push(`title = $${idx++}`); vals.push(title); }
    if (category !== undefined) { sets.push(`category = $${idx++}`); vals.push(category); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); vals.push(status); }
    if (priority !== undefined) { sets.push(`priority = $${idx++}`); vals.push(priority); }
    if (description !== undefined) { sets.push(`description = $${idx++}`); vals.push(description); }
    if (assignee_id !== undefined) { sets.push(`assignee_id = $${idx++}`); vals.push(assignee_id); }
    if (topic_id !== undefined) { sets.push(`topic_id = $${idx++}`); vals.push(topic_id); }
    if (achievement_type !== undefined) { sets.push(`achievement_type = $${idx++}`); vals.push(achievement_type); }
    if (target_audience !== undefined) { sets.push(`target_audience = $${idx++}`); vals.push(target_audience); }
    if (consulting_form !== undefined) { sets.push(`consulting_form = $${idx++}`); vals.push(consulting_form); }

    if (sets.length === 0) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '未提供更新字段' } });
      return;
    }

    vals.push(req.params.caseId);
    const updated = await queryOne(`UPDATE cases SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (!updated) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '案例不存在' } }); return; }

    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/cases/:caseId
router.delete('/:caseId', requireAuth, async (req: Request, res: Response) => {
  try {
    const result = await queryOne('DELETE FROM cases WHERE id = $1 RETURNING id', [req.params.caseId]);
    if (!result) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '案例不存在' } }); return; }
    res.json({ success: true, message: '案例已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/cases/:caseId/files — 上传文件（如果 case 关联了 topic，同步创建 document）
router.post('/:caseId/files', requireAuth, upload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const caseId = req.params.caseId;
    const c = await queryOne<{ id: string; title: string; category: string }>('SELECT * FROM cases WHERE id = $1', [caseId]);
    if (!c) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '案例不存在' } }); return; }

    const uploadedFiles = req.files as Express.Multer.File[];
    if (!uploadedFiles || uploadedFiles.length === 0) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '未选择文件' } });
      return;
    }

    const results = [];
    for (const f of uploadedFiles) {
      const ext = (path.extname(f.originalname).replace('.', '').toUpperCase()) || 'FILE';
      const fileType = ext.length <= 20 ? ext : (ext.slice(0, 20)); // 任意文件类型，上限20字符
      const fileUrl = `/api/v1/uploads/${f.filename}`;
      const row = await queryOne(
        `INSERT INTO case_files (case_id, file_name, file_size, file_type, storage_url, original_name, uploaded_by)
         VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
        [caseId, f.filename, f.size, fileType, fileUrl, Buffer.from(f.originalname, 'latin1').toString('utf8'), req.user!.userId]
      );
      results.push(row);
    }

    // 如果案卷关联了专题，同步创建文献记录（取第一个文件作为文献附件）
    const topicId = req.body.topic_id as string || (c as any).topic_id;
    if (topicId) {
      const topic = await queryOne<{ id: string }>('SELECT id FROM topics WHERE id = $1', [topicId]);
      if (topic) {
        const firstFile = uploadedFiles[0];
        const fileUrl = `/api/v1/uploads/${firstFile.filename}`;
        await queryOne(
          `INSERT INTO documents (topic_id, title, author, description, content_type, file_url, file_size, published_at, security_level)
           VALUES ($1,$2,$3,$4,'实践案例',$5,$6,CURRENT_DATE,'public')`,
          [topicId, c.title, req.body.author || (req.user && (req.user as any).real_name) || '系统', c.title, fileUrl, firstFile.size]
        );
        await queryOne('UPDATE topics SET doc_count = (SELECT COUNT(*) FROM documents WHERE topic_id = $1), updated_at = NOW() WHERE id = $1', [topicId]);
      }
    }

    res.status(201).json({ success: true, data: results, message: `成功上传 ${results.length} 个文件` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/cases/:caseId/files/:fileId — 删除文件
router.delete('/:caseId/files/:fileId', requireAuth, async (req: Request, res: Response) => {
  try {
    const f = await queryOne('DELETE FROM case_files WHERE id = $1 AND case_id = $2 RETURNING *', [req.params.fileId, req.params.caseId]);
    if (!f) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '文件不存在' } }); return; }
    res.json({ success: true, message: '文件已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
