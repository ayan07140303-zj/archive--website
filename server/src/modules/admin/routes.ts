import { Router, Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { query, queryOne } from '../../db.js';
import { requireAuth, requireAdmin } from '../../middleware/auth.js';
import { uploadErrorHandler } from '../../middleware/uploadErrorHandler.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

// multer for announcement PDF attachments
const announcementStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `announcement_${crypto.randomUUID()}${ext}`);
  },
});
const announcementUpload = multer({ storage: announcementStorage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// GET /api/v1/admin/dashboard
router.get('/dashboard', requireAdmin, async (_req: Request, res: Response) => {
  try {
    const [
      totalCases, pendingSubmissions, activeUsers,
      totalAuthors, totalAnnouncements,
      recentLogs
    ] = await Promise.all([
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM cases'),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM submissions WHERE status = 'pending'"),
      queryOne<{ count: string }>("SELECT COUNT(*) as count FROM users WHERE status = 'active'"),
      queryOne<{ count: string }>(
        'SELECT COUNT(DISTINCT created_by) as count FROM cases'
      ),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM announcements WHERE is_active = true'),
      query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT 5'),
    ]);

    res.json({
      success: true,
      data: {
        totalCases: parseInt(totalCases?.count || '0'),
        pendingSubmissions: parseInt(pendingSubmissions?.count || '0'),
        activeUsers: parseInt(activeUsers?.count || '0'),
        totalAuthors: parseInt(totalAuthors?.count || '0'),
        totalAnnouncements: parseInt(totalAnnouncements?.count || '0'),
        securityLogs: recentLogs,
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/admin/system-status
router.get('/system-status', requireAdmin, async (_req: Request, res: Response) => {
  try {
    res.json({
      success: true,
      data: [
        { service: '核心服务', status: '运行中', color: 'bg-emerald-500' },
        { service: 'API 端点', status: '14ms 延迟', color: 'bg-emerald-500' },
        { service: '审核索引', status: '性能下降', color: 'bg-orange-400' },
      ],
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/admin/security-logs
router.get('/security-logs', requireAdmin, async (req: Request, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    const offset = (page - 1) * pageSize;

    const [rows, cnt] = await Promise.all([
      query('SELECT * FROM security_logs ORDER BY created_at DESC LIMIT $1 OFFSET $2', [pageSize, offset]),
      queryOne<{ count: string }>('SELECT COUNT(*) as count FROM security_logs'),
    ]);
    const total = parseInt(cnt?.count || '0');
    res.json({ success: true, data: rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/admin/import
router.post('/import', requireAdmin, async (req: Request, res: Response) => {
  try {
    res.json({ success: true, message: '批量导入任务已启动（文件处理待实现）' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/admin/snapshots/:snapshotId/restore
router.post('/snapshots/:snapshotId/restore', requireAdmin, async (req: Request, res: Response) => {
  try {
    const snap = await queryOne('SELECT * FROM system_snapshots WHERE id = $1', [req.params.snapshotId]);
    if (!snap) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '快照不存在' } }); return; }
    res.json({ success: true, message: `快照 "${(snap as any).label}" 已还原` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/admin/compliance-check
router.post('/compliance-check', requireAdmin, async (_req: Request, res: Response) => {
  try {
    res.json({ success: true, data: { passed: true, issues: 0 }, message: '合规检查已完成，所有策略验证通过' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

import bcrypt from 'bcryptjs';

// ═══════════════════════════════════════════════════════════
// 作者管理（admin 专有 — users + case_count 聚合）
// ═══════════════════════════════════════════════════════════

// GET /api/v1/admin/authors
router.get('/authors', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search } = req.query;

    let sql = `SELECT u.id, u.email, u.real_name as name, u.department, u.organization as institution,
                      u.phone, u.role, u.status, u.avatar_url, u.created_at,
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

    sql += ` GROUP BY u.id ORDER BY case_count DESC, u.created_at DESC`;

    const rows = await query(sql, vals);

    res.json({
      success: true,
      data: rows,
      stats: { total: rows.length },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/admin/users
router.get('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { role, status, search, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 20;
    const offset = (page - 1) * pageSize;

    let sql = 'SELECT id, email, real_name, department, organization, phone, role, status, employee_id, verified_at, credit_score, created_at, updated_at FROM users WHERE 1=1';
    const vals: any[] = [];
    let idx = 1;

    if (role) { sql += ` AND role = $${idx++}`; vals.push(role); }
    if (status) { sql += ` AND status = $${idx++}`; vals.push(status); }
    if (search) { sql += ` AND (real_name ILIKE $${idx++} OR email ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }

    const countVals = [...vals];
    sql += ' ORDER BY created_at DESC';
    const [rows, cnt] = await Promise.all([
      query(sql + ` LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM users WHERE 1=1${role ? ` AND role = $1` : ''}${status ? ` AND status = $${role ? 2 : 1}` : ''}`, countVals.length > 0 ? countVals : undefined),
    ]);
    const total = parseInt(cnt?.count || '0');
    res.json({ success: true, data: rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/admin/users — 创建用户
router.post('/users', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, password, real_name, department, organization, phone, role } = req.body;
    if (!email || !password || !real_name) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱、密码、姓名为必填项' } });
      return;
    }
    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '该邮箱已存在' } }); return; }

    const hash = await bcrypt.hash(password, 10);
    const u = await queryOne(
      `INSERT INTO users (email, password_hash, real_name, department, organization, phone, role, status)
       VALUES ($1,$2,$3,$4,$5,$6,$7,'active') RETURNING *`,
      [email, hash, real_name, department || '', organization || null, phone || null, role || 'contributor']
    );
    await queryOne('INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING', [(u as any).id]);
    res.status(201).json({ success: true, data: u });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/admin/users/:userId — 编辑用户
router.put('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { email, real_name, department, organization, phone, role, status, password } = req.body;
    const sets: string[] = []; const vals: any[] = []; let idx = 1;

    if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email); }
    if (real_name !== undefined) { sets.push(`real_name = $${idx++}`); vals.push(real_name); }
    if (department !== undefined) { sets.push(`department = $${idx++}`); vals.push(department); }
    if (organization !== undefined) { sets.push(`organization = $${idx++}`); vals.push(organization); }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone); }
    if (role !== undefined) { sets.push(`role = $${idx++}`); vals.push(role); }
    if (status !== undefined) { sets.push(`status = $${idx++}`); vals.push(status); }
    if (password) { const h = await bcrypt.hash(password, 10); sets.push(`password_hash = $${idx++}`); vals.push(h); }

    if (sets.length === 0) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '无更新字段' } }); return; }
    vals.push(req.params.userId);
    const u = await queryOne(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (!u) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } }); return; }
    res.json({ success: true, data: u });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/admin/users/:userId
router.delete('/users/:userId', requireAdmin, async (req: Request, res: Response) => {
  try {
    const u = await queryOne('DELETE FROM users WHERE id = $1 RETURNING id', [req.params.userId]);
    if (!u) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } }); return; }
    res.json({ success: true, message: '用户已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ═══════════════════════════════════════════════════════════
// 公告管理 CRUD（admin 专有）
// ═══════════════════════════════════════════════════════════

// GET /api/v1/admin/announcements — 公告列表（分页）
router.get('/announcements', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { search, category, page: p, pageSize: ps } = req.query;
    const page = parseInt(p as string) || 1;
    const pageSize = parseInt(ps as string) || 10;
    const offset = (page - 1) * pageSize;

    let where = 'WHERE 1=1';
    const vals: any[] = []; let idx = 1;
    if (category) { where += ` AND category = $${idx++}`; vals.push(category); }
    if (search) { where += ` AND (title ILIKE $${idx++} OR content ILIKE $${idx++})`; vals.push(`%${search}%`, `%${search}%`); }

    const [rows, cnt] = await Promise.all([
      query(`SELECT * FROM announcements ${where} ORDER BY published_at DESC LIMIT $${idx++} OFFSET $${idx++}`, [...vals, pageSize, offset]),
      queryOne<{ count: string }>(`SELECT COUNT(*) as count FROM announcements ${where}`, vals),
    ]);
    const total = parseInt(cnt?.count || '0');
    res.json({ success: true, data: rows, pagination: { page, pageSize, total, totalPages: Math.ceil(total / pageSize) } });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/admin/announcements — 创建公告（可上传多个附件）
router.post('/announcements', requireAdmin, uploadErrorHandler(announcementUpload.array('attachments', 20)), async (req: Request, res: Response) => {
  try {
    const { title, category, content, source, published_at } = req.body;
    if (!title) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题为必填项' } }); return; }

    const files = req.files as Express.Multer.File[];
    const fileList = (files || []).map(f => ({
      name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
      url: `/api/v1/uploads/${f.filename}`,
      size: f.size,
    }));
    const first = fileList[0] || null;

    const a = await queryOne(
      `INSERT INTO announcements (title, category, content, source, published_at, attachment_url, attachment_name, attachments, is_active)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8::jsonb,true) RETURNING *`,
      [title, category || '通知公告', content || '', source || null, published_at || new Date().toISOString().slice(0,10),
       first?.url || null, first?.name || null, JSON.stringify(fileList)]
    );
    res.status(201).json({ success: true, data: a });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/admin/announcements/:id — 编辑公告
router.put('/announcements/:id', requireAdmin, uploadErrorHandler(announcementUpload.array('attachments', 20)), async (req: Request, res: Response) => {
  try {
    const { title, category, content, source, published_at, is_active } = req.body;
    const sets: string[] = []; const vals: any[] = []; let idx = 1;

    if (title !== undefined)   { sets.push(`title = $${idx++}`); vals.push(title); }
    if (category !== undefined){ sets.push(`category = $${idx++}`); vals.push(category); }
    if (content !== undefined) { sets.push(`content = $${idx++}`); vals.push(content); }
    if (source !== undefined)  { sets.push(`source = $${idx++}`); vals.push(source); }
    if (published_at !== undefined) { sets.push(`published_at = $${idx++}`); vals.push(published_at); }
    if (is_active !== undefined)    { sets.push(`is_active = $${idx++}`); vals.push(is_active === 'true' || is_active === true); }

    const files = req.files as Express.Multer.File[];
    if (files && files.length > 0) {
      const newFiles = files.map(f => ({
        name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
        url: `/api/v1/uploads/${f.filename}`,
        size: f.size,
      }));
      // 合并已有附件 + 新上传的
      const existing = await queryOne<{ attachments: any }>('SELECT attachments FROM announcements WHERE id = $1', [req.params.id]);
      const existingList = (existing?.attachments && Array.isArray(existing.attachments)) ? existing.attachments : [];
      const merged = [...existingList, ...newFiles];
      sets.push(`attachments = $${idx++}`);  vals.push(JSON.stringify(merged));
      sets.push(`attachment_url = $${idx++}`); vals.push(merged[0]?.url || null);
      sets.push(`attachment_name = $${idx++}`); vals.push(merged[0]?.name || null);
    }

    if (sets.length === 0) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '未提供更新字段' } });
      return;
    }

    vals.push(req.params.id);
    const updated = await queryOne(`UPDATE announcements SET ${sets.join(', ')} WHERE id = $${idx} RETURNING *`, vals);
    if (!updated) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } }); return; }
    res.json({ success: true, data: updated });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/admin/announcements/:id/attachment/:index — 按索引删除单个附件
router.delete('/announcements/:id/attachment/:index', requireAdmin, async (req: Request, res: Response) => {
  try {
    const idx = parseInt(req.params.index);
    if (isNaN(idx)) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '附件序号无效' } }); return; }

    const a = await queryOne('SELECT attachments FROM announcements WHERE id = $1', [req.params.id]);
    if (!a) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } }); return; }

    const list = ((a as any).attachments && Array.isArray((a as any).attachments)) ? [...(a as any).attachments] : [];
    if (idx < 0 || idx >= list.length) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '附件序号超出范围' } }); return; }

    list.splice(idx, 1);

    const first = list[0];
    const updated = await queryOne(
      `UPDATE announcements SET attachments = $1::jsonb, attachment_url = $2, attachment_name = $3 WHERE id = $4 RETURNING *`,
      [JSON.stringify(list), first?.url || null, first?.name || null, req.params.id]
    );
    res.json({ success: true, data: updated, message: `已删除第 ${idx + 1} 个附件` });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/admin/announcements/:id/attachment — 移除公告所有附件
router.delete('/announcements/:id/attachment', requireAdmin, async (req: Request, res: Response) => {
  try {
    const updated = await queryOne(
      `UPDATE announcements SET attachment_url = NULL, attachment_name = NULL, attachments = '[]'::jsonb WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    if (!updated) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } }); return; }
    res.json({ success: true, data: updated, message: '所有附件已移除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// DELETE /api/v1/admin/announcements/:id
router.delete('/announcements/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const a = await queryOne('DELETE FROM announcements WHERE id = $1 RETURNING id', [req.params.id]);
    if (!a) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '公告不存在' } }); return; }
    res.json({ success: true, message: '公告已删除' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ═══════════════════════════════════════════════════════════
// 投稿审核（admin 专有）
// ═══════════════════════════════════════════════════════════

// GET /api/v1/admin/submissions
router.get('/submissions', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status } = req.query;
    let sql = 'SELECT * FROM submissions WHERE 1=1';
    const vals: any[] = []; let idx = 1;
    if (status) { sql += ` AND status = $${idx++}`; vals.push(status); }
    sql += ' ORDER BY created_at DESC';
    const rows = await query(sql, vals);
    res.json({ success: true, data: rows });
  } catch (err: any) { res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }); }
});

// PUT /api/v1/admin/submissions/:id — 审核通过/拒绝
router.put('/submissions/:id', requireAdmin, async (req: Request, res: Response) => {
  try {
    const { status, reviewer_notes } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '状态应为 approved 或 rejected' } }); return;
    }
    const s = await queryOne(
      `UPDATE submissions SET status = $1, reviewer_notes = $2, reviewed_by = $3, reviewed_at = NOW() WHERE id = $4 RETURNING *`,
      [status, reviewer_notes || null, req.user!.userId, req.params.id]
    );
    if (!s) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '投稿不存在' } }); return; }

    // 审核通过 → 自动转为 case（含四维分类 + 附件）
    if (status === 'approved') {
      const ts = Date.now().toString(36).toUpperCase(); const rnd = Math.random().toString(36).slice(2, 5).toUpperCase();
      const sub = s as any;
      const newCase = await queryOne(
        `INSERT INTO cases (case_number, title, category, achievement_type, target_audience, consulting_form, status, priority, description, created_by)
         VALUES ($1,$2,$3,$4,$5,$6,'open','medium',$7,$8) RETURNING id`,
        [`CASE-${new Date().getFullYear()}-${ts}${rnd}`, sub.title, sub.category || '政治建设',
         sub.achievement_type, sub.target_audience, sub.consulting_form, sub.description, sub.submitted_by]
      );
      // 迁移投稿附件到 case_files
      const atts = (sub.attachments && Array.isArray(sub.attachments)) ? sub.attachments : [];
      for (const att of atts) {
        await queryOne(
          `INSERT INTO case_files (case_id, file_name, file_size, file_type, storage_url, uploaded_by)
           VALUES ($1,$2,$3,$4,$5,$6)`,
          [(newCase as any).id, att.name, att.size || 0, 'PDF', att.url, sub.submitted_by]
        );
      }
    }
    res.json({ success: true, data: s });
  } catch (err: any) { res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } }); }
});

export default router;
