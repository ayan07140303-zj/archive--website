import express from 'express';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import { errorHandler, notFoundHandler } from './middleware/errorHandler.js';
import { autoMigrate } from './db.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

import authRoutes from './modules/auth/routes.js';
import portalRoutes from './modules/portal/routes.js';
import topicsRoutes from './modules/topics/routes.js';
import casesRoutes from './modules/cases/routes.js';
import taxonomyRoutes from './modules/taxonomy/routes.js';
import reportsRoutes from './modules/reports/routes.js';
import datasetsRoutes from './modules/datasets/routes.js';
import expertsRoutes from './modules/experts/routes.js';
import authorsRoutes from './modules/authors/routes.js';
import submissionsRoutes from './modules/submissions/routes.js';
import servicesRoutes from './modules/services/routes.js';
import adminRoutes from './modules/admin/routes.js';
import favoritesRoutes from './modules/favorites/routes.js';

const app = express();
const PORT = parseInt(process.env.PORT || '4000');

// ─── 全局中间件 ───
app.use(cors({ origin: ['http://localhost:3000', 
    'http://localhost:5173',
    'https://archive--website.pages.dev',
    'https://archive--website.ayan07140303.workers.dev',
    'https://*.pages.dev'  ], 
    credentials: true }));
app.use(express.json());
app.use('/api/v1/uploads', express.static(path.resolve(__dirname, '../uploads')));

// ─── 请求日志 ───
app.use((req, _res, next) => {
  const ts = new Date().toISOString().slice(11, 19);
  console.log(`[${ts}] ${req.method} ${req.path}`);
  next();
});

// ─── API v1 路由 ───
app.use('/api/v1/auth', authRoutes);
app.use('/api/v1/portal', portalRoutes);
app.use('/api/v1/library', topicsRoutes);
app.use('/api/v1/cases', casesRoutes);
app.use('/api/v1/taxonomy', taxonomyRoutes);
app.use('/api/v1/reports', reportsRoutes);
app.use('/api/v1/datasets', datasetsRoutes);
app.use('/api/v1/experts', expertsRoutes);
app.use('/api/v1/authors', authorsRoutes);
app.use('/api/v1/submissions', submissionsRoutes);
app.use('/api/v1/services', servicesRoutes);
app.use('/api/v1/favorites', favoritesRoutes);
app.use('/api/v1/admin', adminRoutes);

// ─── 用户信息（复用 auth/me） ───
app.use('/api/v1/users', authRoutes);

// ─── 全局搜索 ───
import { optionalAuth } from './middleware/auth.js';
import { query } from './db.js';
app.get('/api/v1/search', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q as string) || '';
    const pageSize = parseInt(req.query.pageSize as string) || 20;
    if (!q.trim()) { res.json({ success: true, data: [] }); return; }
    const like = `%${q}%`;
    const [topics, docs, cases, authors] = await Promise.all([
      query('SELECT id, title, description, \'topic\' as type FROM topics WHERE title ILIKE $1 OR description ILIKE $1 LIMIT $2', [like, pageSize]),
      query('SELECT d.id, d.topic_id, d.title, d.description, \'document\' as type FROM documents d WHERE d.title ILIKE $1 OR d.description ILIKE $1 LIMIT $2', [like, pageSize]),
      query('SELECT id, case_number, title, description, \'case\' as type FROM cases WHERE title ILIKE $1 OR description ILIKE $1 LIMIT $2', [like, pageSize]),
      query(`SELECT u.id, u.real_name as name, u.email, u.organization, u.avatar_url, \'author\' as type,
                    (SELECT COUNT(*) FROM cases WHERE created_by = u.id)::int as case_count
             FROM users u WHERE u.real_name ILIKE $1 OR u.email ILIKE $2 OR u.organization ILIKE $3 LIMIT $4`,
        [like, like, like, pageSize]),
    ]);
    const results = [...topics, ...docs, ...cases, ...authors].slice(0, pageSize);
    res.json({ success: true, data: results });
  } catch (err: any) {
    res.status(500).json({ success: false, error: { code: 'INTERNAL_ERROR', message: err.message } });
  }
});

// ─── 健康检查 ───
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 错误处理 ───
app.use(notFoundHandler);
app.use(errorHandler);

app.listen(PORT, async () => {
  await autoMigrate();
  console.log(`\n  🏛️  档案资政管理平台 API 服务已启动`);
  console.log(`  📡 http://localhost:${PORT}`);
  console.log(`  📋 API 前缀: /api/v1\n`);
  console.log(`  可用端点:`);
  console.log(`    POST /api/v1/auth/login         — 登录`);
  console.log(`    POST /api/v1/auth/register      — 注册`);
  console.log(`    GET  /api/v1/portal/announcements — 公告`);
  console.log(`    GET  /api/v1/library/topics      — 专题列表`);
  console.log(`    GET  /api/v1/cases              — 案例列表`);
  console.log(`    GET  /api/v1/taxonomy/tree      — 分类树`);
  console.log(`    GET  /api/v1/admin/dashboard    — 管理员看板`);
  console.log(`    ... 共 37+ 个端点\n`);
});
