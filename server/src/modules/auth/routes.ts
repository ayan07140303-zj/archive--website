import { Router, Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import multer from 'multer';
import path from 'path';
import crypto from 'crypto';
import { queryOne } from '../../db.js';
import { signToken, requireAuth } from '../../middleware/auth.js';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.resolve(__dirname, '../../../uploads');

// multer for submission attachments
const submissionStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname);
    cb(null, `submission_${crypto.randomUUID()}${ext}`);
  },
});
const submissionUpload = multer({ storage: submissionStorage, limits: { fileSize: 50 * 1024 * 1024 } });

const router = Router();

// POST /api/v1/auth/login
router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password, captcha } = req.body;
    if (!email || !password) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '邮箱和密码为必填项' } });
      return;
    }

    const user = await queryOne('SELECT * FROM users WHERE email = $1 AND status = $2', [email, 'active']);
    if (!user) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '邮箱或密码错误' } });
      return;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);

    if (!isValid) {
      res.status(401).json({ success: false, error: { code: 'UNAUTHORIZED', message: '邮箱或密码错误' } });
      return;
    }

    const token = signToken({ userId: user.id, role: user.role });

    // 记录登录历史
    await queryOne(
      `INSERT INTO login_history (user_id, location, ip_address, device_type)
       VALUES ($1, $2, $3, $4)`,
      [user.id, req.body.location || null, req.ip, req.headers['user-agent']?.includes('Mobile') ? 'mobile' : 'desktop']
    );

    // 记录安全日志
    await queryOne(
      `INSERT INTO security_logs (event_type, severity, user_id, message, metadata) VALUES ($1,$2,$3,$4,$5)`,
      ['LOGIN', 'info', user.id, `${user.real_name} 已登录`, JSON.stringify({ ip: req.ip })]
    );

    res.json({
      success: true,
      data: {
        token,
        user: {
          id: user.id,
          name: user.real_name,
          email: user.email,
          role: user.role,
          organization: user.organization,
          avatar: user.avatar_url,
          employeeId: user.employee_id,
          department: user.department,
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/register
router.post('/register', async (req: Request, res: Response) => {
  try {
    const { realName, department, email, phone, password, reason, agreeTerms } = req.body;
    if (!realName || !department || !email || !phone || !password || !agreeTerms) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '所有带*字段为必填项' } });
      return;
    }

    const existing = await queryOne('SELECT id FROM users WHERE email = $1', [email]);
    if (existing) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '该邮箱已被注册' } });
      return;
    }

    const hash = await bcrypt.hash(password, 10);
    const newUser = await queryOne(
      `INSERT INTO users (email, password_hash, real_name, department, phone, role, status)
       VALUES ($1,$2,$3,$4,$5,'contributor','active') RETURNING id`,
      [email, hash, realName, department, phone]
    );

    // 为新用户创建默认偏好
    if (newUser) {
      await queryOne(
        `INSERT INTO user_preferences (user_id) VALUES ($1) ON CONFLICT DO NOTHING`,
        [(newUser as any).id]
      );
    }

    res.status(201).json({ success: true, message: '注册成功，请登录' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// POST /api/v1/auth/submit — 案例投稿（支持PDF上传）
router.post('/submit', requireAuth, submissionUpload.array('files', 10), async (req: Request, res: Response) => {
  try {
    const { title, category, achievement_type, target_audience, consulting_form, description, author, organization } = req.body;
    if (!title) { res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '标题为必填' } }); return; }

    const uploadedFiles = req.files as Express.Multer.File[];
    const fileList = (uploadedFiles || []).map(f => ({
      name: Buffer.from(f.originalname, 'latin1').toString('utf8'),
      url: `/api/v1/uploads/${f.filename}`,
      size: f.size,
    }));

    const s = await queryOne(
      `INSERT INTO submissions (title, category, achievement_type, target_audience, consulting_form, description, author, organization, submitted_by, status, attachments)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,'pending',$10::jsonb) RETURNING *`,
      [title, category || '政治建设', achievement_type || null, target_audience || null, consulting_form || null,
       description || null, author || null, organization || null, req.user!.userId, JSON.stringify(fileList)]
    );
    res.status(201).json({ success: true, data: s, message: '投稿已提交，请等待管理员审核' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/auth/captcha
router.get('/captcha', (_req: Request, res: Response) => {
  const code = String(Math.floor(1000 + Math.random() * 9000));
  res.json({ success: true, data: { captchaId: 'dev_captcha', captchaCode: code } });
});

// GET /api/v1/users/me
router.get('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = await queryOne(
      `SELECT u.*, up.push_frequency, up.display_mode, up.search_weights
       FROM users u LEFT JOIN user_preferences up ON u.id = up.user_id
       WHERE u.id = $1`,
      [req.user!.userId]
    );
    if (!user) {
      res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } });
      return;
    }

    res.json({
      success: true,
      data: {
        id: user.id,
        name: user.real_name,
        email: user.email,
        role: user.role,
        organization: user.organization,
        department: user.department,
        phone: user.phone,
        avatar: user.avatar_url,
        status: user.status,
        employeeId: user.employee_id,
        creditScore: user.credit_score,
        verifiedAt: user.verified_at,
        preferences: {
          pushFrequency: user.push_frequency || 'daily',
          displayMode: user.display_mode || 'light',
          searchWeights: user.search_weights || ['latest', 'core'],
        },
      },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/users/me/password
router.put('/me/password', requireAuth, async (req: Request, res: Response) => {
  try {
    const { oldPassword, newPassword } = req.body;
    if (!oldPassword || !newPassword) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '旧密码和新密码为必填项' } });
      return;
    }
    if (newPassword.length < 8) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '新密码长度不能少于8位' } });
      return;
    }

    const user = await queryOne('SELECT password_hash FROM users WHERE id = $1', [req.user!.userId]);
    if (!user) { res.status(404).json({ success: false, error: { code: 'NOT_FOUND', message: '用户不存在' } }); return; }

    const isValid = await bcrypt.compare(oldPassword, (user as any).password_hash);
    if (!isValid) {
      res.status(422).json({ success: false, error: { code: 'VALIDATION_ERROR', message: '旧密码不正确' } });
      return;
    }

    const hash = await bcrypt.hash(newPassword, 10);
    await queryOne('UPDATE users SET password_hash = $1 WHERE id = $2', [hash, req.user!.userId]);

    res.json({ success: true, message: '密码修改成功' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/users/me
router.put('/me', requireAuth, async (req: Request, res: Response) => {
  try {
    const { email, phone, avatar } = req.body;
    const sets: string[] = [];
    const vals: any[] = [];
    let idx = 1;

    if (email !== undefined) { sets.push(`email = $${idx++}`); vals.push(email); }
    if (phone !== undefined) { sets.push(`phone = $${idx++}`); vals.push(phone); }
    if (avatar !== undefined) { sets.push(`avatar_url = $${idx++}`); vals.push(avatar); }

    if (sets.length > 0) {
      vals.push(req.user!.userId);
      await queryOne(`UPDATE users SET ${sets.join(', ')} WHERE id = $${idx}`, vals);
    }

    res.json({ success: true, message: '个人资料已更新' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// GET /api/v1/users/me/preferences
router.get('/me/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const prefs = await queryOne(
      'SELECT push_frequency, display_mode, search_weights FROM user_preferences WHERE user_id = $1',
      [req.user!.userId]
    );
    res.json({
      success: true,
      data: prefs || { push_frequency: 'daily', display_mode: 'light', search_weights: ['latest', 'core'] },
    });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// PUT /api/v1/users/me/preferences
router.put('/me/preferences', requireAuth, async (req: Request, res: Response) => {
  try {
    const { pushFrequency, displayMode, searchWeights } = req.body;
    await queryOne(
      `INSERT INTO user_preferences (user_id, push_frequency, display_mode, search_weights)
       VALUES ($1, $2, $3, $4::jsonb)
       ON CONFLICT (user_id) DO UPDATE
       SET push_frequency = $2, display_mode = $3, search_weights = $4::jsonb, updated_at = NOW()`,
      [req.user!.userId, pushFrequency || 'daily', displayMode || 'light', JSON.stringify(searchWeights || ['latest', 'core'])]
    );
    res.json({ success: true, message: '偏好已保存' });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

export default router;
