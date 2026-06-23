# 档案资政案例管理与展示平台

面向政务档案管理场景的全栈应用，提供案例管理、专题案例库、个性化服务、作者库、用户权限管理等模块，支持 admin/contributor/auditor/manager 四种角色。

## 功能模块

- **案例管理** — 档案案例的创建、编辑、检索、预览与下载
- **专题案例库** — 按主题组织的案例分类库，支持关联专题与实时案例数统计
- **个性化服务** — 订阅标签、关注区域、偏好设置，基于偏好生成案例推荐
- **案例投稿** — 用户提交案例，管理员审核后自动入库
- **作者库** — 案例投稿作者信息管理与检索
- **后台管理** — 案例管理、作者管理、用户管理、公告管理、投稿审核

## 技术栈

- **前端框架**: React 19 + TypeScript
- **构建工具**: Vite 6
- **样式方案**: Tailwind CSS 4
- **路由**: React Router 7
- **动画**: Framer Motion

## 本地运行

**前置条件:** Node.js 20+、PostgreSQL 16+（推荐 [Postgres.app](https://postgresapp.com/)）

### 1. 数据库初始化

```bash
# 创建数据库并导入表结构 + 种子数据
createdb archive_platform
psql archive_platform < server/migrations/001_init.sql
psql archive_platform < server/seeds/seed.sql
```

### 2. 启动后端（终端 1）

```bash
cd server
npm install
npx tsx src/index.ts
# → http://localhost:4000
# 启动时自动执行 autoMigrate() 补齐缺失的数据库列
```

### 3. 启动前端（终端 2）

```bash
npm install
npm run dev
# → http://localhost:3000
```

### 4. 登录

| 角色 | 邮箱 | 密码 |
|------|------|------|
| 管理员 | admin@archives.gov.cn | password123 |
| 研究员 | elena@archives.gov.cn | password123 |
| 审计员 | sarah@archives.gov.cn | password123 |
| 经理 | michael@archives.gov.cn | password123 |

> 登录后根据账户角色自动进入对应工作台（admin → 后台管理，其他 → 用户首页）

## 项目结构

```
├── src/                      # 前端 React SPA
│   ├── components/            # 27 个 UI 组件
│   ├── api/client.ts          # API 客户端（get/post/put/delete/upload + Token）
│   ├── App.tsx                # 路由与全局 auth 状态
│   └── ...
├── server/                    # 后端 Express API
│   ├── src/
│   │   ├── index.ts           # 入口（10 个路由模块 + 搜索独立路由 + 静态文件 + 自动迁移）
│   │   ├── db.ts              # PostgreSQL 连接池 + autoMigrate
│   │   ├── middleware/         # JWT auth 中间件
│   │   └── modules/           # auth/portal/topics/cases/experts/authors/submissions/services/admin
│   ├── migrations/001_init.sql # 26 张核心表 DDL
│   ├── seeds/                 # 种子数据（4 用户/6 专题/13 案例）
│   └── uploads/               # 文件上传存储
├── docs/                      # 设计阶段文档（参考用，非当前实现）
└── CLAUDE.md                  # AI 协作项目文档
```

## 构建部署

```bash
npm run build    # 前端生成 dist/ 目录
npm run preview  # 本地预览前端构建结果
```
