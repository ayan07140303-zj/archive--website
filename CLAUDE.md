# 档案资政案例管理与展示平台

## 项目概述

面向政务档案管理场景的全栈应用，前端 React SPA + 后端 Express API + PostgreSQL 数据库。提供案例管理、专题案例库、作者库、个性化服务、用户权限管理等模块，支持 admin/contributor/auditor/manager 四种角色。

**前端**: React 19 + TypeScript 5.8 + Vite 6 + Tailwind CSS 4 + React Router 7
**后端**: Express 4 + TypeScript + pg (node-postgres) + JWT + bcrypt + multer
**数据库**: PostgreSQL 16+（26 张表，含 enum 类型和自动触发器）
**动画**: Framer Motion | **图标**: Lucide React
**颜色主基调**: `#0056b7`（蓝色系），CSS 通过 `@theme` 定义语义化 token（`--color-primary`）

## 后端 API

启动 (`server/` 目录)：`npx tsx src/index.ts` → `http://localhost:4000`
前端开发服务器通过 Vite proxy (`/api` → `:4000`) 转发请求。

端点速查：

| 模块 | 路径前缀 | 关键端点 |
|------|---------|----------|
| 认证 | `/api/v1/auth` | POST login, POST register |
| 用户 | `/api/v1/users` | GET me, PUT me, PUT me/password, GET/PUT me/preferences |
| 门户 | `/api/v1/portal` | GET announcements, GET highlights |
| 搜索 | `/api/v1/search` | GET ?q=（案例+专题+文献+作者统一搜索） |
| 专题 | `/api/v1/library` | GET/POST topics, GET/POST topics/:id/documents, POST documents/:id/comments |
| 案例 | `/api/v1/cases` | GET/POST/PUT/DELETE cases, POST/DELETE cases/:id/files, POST :id/view |
| 专家 | `/api/v1/experts` | GET experts, POST :id/consult, POST apply |
| 作者 | `/api/v1/authors` | GET authors, GET :userId, GET :userId/cases |
| 服务 | `/api/v1/services` | GET recommendations, GET/PUT subscriptions, GET/PUT regions, GET overview, GET tags-and-regions |
| 管理员 | `/api/v1/admin` | GET dashboard, GET/POST/PUT/DELETE users, GET authors, GET/PUT submissions, GET/POST/PUT/DELETE announcements |
| 投稿 | `/api/v1/submissions` | GET me, DELETE :id |

搜索端点为独立路由（`app.get` 直接注册），不挂载在任何子 router 下。
文件上传通过 multer 存入 `server/uploads/`，通过 `/api/v1/uploads/` 静态服务访问。
种子数据位于 `server/seeds/seed.sql`，登录密码统一为 `password123`。

## 项目结构

```
├── index.html                # SPA 入口，lang=zh-CN
├── package.json              # name: archive-case-management-platform
├── vite.config.ts            # Vite 配置：React + Tailwind + /api→:4000 proxy
├── tsconfig.json             # 路径别名 @/* → ./*
├── server/                   # 后端 Express API（独立 npm 项目）
│   ├── package.json          # 后端依赖
│   ├── tsconfig.json
│   ├── uploads/              # 文件上传存储目录
│   ├── migrations/001_init.sql  # 26 张核心表 DDL（含 submissions 投稿表）
│   ├── seeds/seed.sql        # 种子数据（4 用户/6 专题/13 案例等）
│   ├── types/db.ts           # 数据库实体 TypeScript 类型
│   └── src/
│       ├── index.ts          # Express 入口，挂载路由模块 + 搜索独立路由 + 自动迁移
│       ├── db.ts             # pg Pool 连接 + autoMigrate
│       ├── types/index.ts    # JWT/API 响应类型
│       ├── middleware/
│       │   ├── auth.ts       # JWT sign/verify/requireAuth/requireAdmin/optionalAuth
│       │   └── errorHandler.ts
│       └── modules/
│           ├── auth/routes.ts       # 登录/注册/个人资料/修改密码/偏好设置
│           ├── portal/routes.ts     # 公告/首页高亮案例
│           ├── topics/routes.ts     # 专题+案例关联 CRUD
│           ├── cases/routes.ts      # 案例 CRUD+文件上传+浏览量
│           ├── experts/routes.ts    # 专家库
│           ├── authors/routes.ts    # 案例作者库（users + cases 聚合）
│           ├── submissions/routes.ts # 用户投稿管理
│           ├── services/routes.ts   # 个性化服务（推荐/订阅/区域/标签）
│           └── admin/routes.ts      # 管理看板/用户CRUD/作者管理/公告CRUD/投稿审核
└── src/
    ├── main.tsx              # ReactDOM.createRoot 入口
    ├── App.tsx               # 路由根组件 + 全局 auth 状态
    ├── index.css             # Tailwind + @theme token
    ├── types.ts              # Status / Case / NavItem / User 类型定义
    ├── api/client.ts         # API 客户端：get/post/put/delete/upload + Token 注入
    ├── lib/utils.ts          # cn() 工具函数 + formatDate()
    └── components/
        ├── Layout.tsx                # 全局布局（顶部导航+搜索+<Outlet/>+页脚）
        ├── PortalPage.tsx            # 首页（Hero+分类导航+公告+最新/热门案例）
        ├── HeroCarousel.tsx          # Hero 轮播组件
        ├── Dashboard.tsx             # 按角色路由到 AdminDashboard / UserDashboard
        ├── AdminDashboard.tsx        # 管理员看板（5统计卡+5模块+侧栏）
        ├── UserDashboard.tsx         # 用户首页（复用 PortalPage）
        ├── CaseManagement.tsx        # 案例列表页（卡片+筛选+点击跳详情）
        ├── CaseManagementModal.tsx   # 案卷管理弹窗（CRUD+文件+专题关联）
        ├── CaseDetail.tsx            # 案例详情页（多格式附件预览/下载+浏览量）
        ├── CaseSubmission.tsx        # 案例投稿表单（四维分类+文件上传）
        ├── AdminCases.tsx            # 管理员案例管理（表格+行内编辑+专题筛选）
        ├── AdminAuthors.tsx          # 管理员作者管理（增删改查+案例统计）
        ├── SubmissionReview.tsx      # 管理员投稿审核（通过/拒绝+反馈）
        ├── UserManagement.tsx        # 用户权限管理（表格+创建/编辑+快捷改角色）
        ├── FileUploadZone.tsx        # 拖拽文件上传区
        ├── SpecialLibrary.tsx        # 专题案例库（卡片网格+Tab+实时案例数）
        ├── TopicDetail.tsx           # 专题详情（本专题案例列表+搜索）
        ├── LoginPage.tsx             # 全屏登录页（email+密码，统一入口）
        ├── RegisterPage.tsx          # 全屏注册页（多字段表单+前端校验）
        ├── PersonalizedServices.tsx  # 个性化服务（订阅标签+关注区域+偏好+案例推荐）
        ├── ProfilePage.tsx           # 个人资料页（个人信息+我的投稿+收藏+改密码）
        ├── MySubmissions.tsx         # 我的投稿（状态+审核反馈+删除）
        ├── AnnouncementList.tsx      # 公告列表
        ├── AnnouncementDetail.tsx    # 公告详情
        ├── AnnouncementManagement.tsx # 管理员公告管理
        ├── ExpertLibrary.tsx         # 案例作者列表（姓名/机构/邮箱+搜索）
        └── ExpertDetail.tsx          # 作者详情（信息卡+投稿案例列表）
```

## 路由架构

所有路由定义在 [src/App.tsx](src/App.tsx)。根 `<Routes>` 包裹在 `<BrowserRouter>` 中：

| 路由 | 组件 | 权限控制 |
|------|------|----------|
| `/` (index) | `PortalPage`（未登录）或 `Navigate → /admin/dashboard`（admin）或 `Navigate → /dashboard`（已登录） | 包裹在 `Layout` 内 |
| `/dashboard` | `Dashboard` → `AdminDashboard` 或 `UserDashboard` | 需登录，admin 自动重定向到 /admin/dashboard |
| `/cases` | `CaseManagement` | 公开 |
| `/cases/:caseId` | `CaseDetail` | 未登录可看信息，预览/下载需登录 |
| `/library` | `SpecialLibrary`（专题案例库） | 公开 |
| `/library/:topicId` | `TopicDetail` | 公开 |
| `/library/:topicId/case/:caseId` | `CaseDetail`（专题内案例详情） | 未登录可看信息，操作需登录 |
| `/announcements` | `AnnouncementList` | 公开 |
| `/announcement/:annId` | `AnnouncementDetail` | 公开 |
| `/submit` | `CaseSubmission` | 公开（提交需登录） |
| `/services` | `PersonalizedServices` | 公开（订阅/偏好需登录） |
| `/profile` | `ProfilePage` | 需登录 |
| `/users` | `UserManagement`（admin）或 `ExpertLibrary`（其他角色） | admin 管理用户；其他看案例作者库 |
| `/experts/:expertId` | `ExpertDetail` | 公开 |
| `/admin/dashboard` | `Dashboard`（admin 通道） | 仅 admin |
| `/admin/announcements` | `AnnouncementManagement` | 仅 admin |
| `/admin/cases` | `AdminCases` | 仅 admin |
| `/admin/experts` | `AdminAuthors` | 仅 admin |
| `/admin/users` | `UserManagement` | 仅 admin |
| `/admin/submissions` | `SubmissionReview` | 仅 admin |
| `*` | `Navigate → /` | 兜底 |

**关键路由规则**:
- `Layout` 组件是父路由，所有子页面通过 `<Outlet />` 渲染在导航栏下方
- 未登录时 `user === null`，Layout 导航显示访客模式（首页/案例库/作者库/个性化服务/投稿 + 登录/注册）
- admin 自动重定向到 `/admin/dashboard`，普通用户到 `/dashboard`
- 已登录时导航按角色分化（admin → 后台导航，普通用户 → 前台导航）
- `/admin/*` 路径均为 admin 专属，非 admin 重定向到 `/`
- `LoginPage` / `RegisterPage` 通过 `authMode` state 控制，全屏覆盖
- `CaseDetail` 面包屑根据来源路由自动切换：`/cases/:caseId` → "首页→案例库→标题"，`/library/:topicId/case/:caseId` → "首页→专题案例库→专题名→标题"

## 认证流程

1. 用户点击"登录" → `setAuthMode('login')` → `LoginPage` 全屏渲染
2. `LoginPage` 统一邮箱+密码登录，无角色 tab 区分
3. 登录 → `handleLogin(email, password)` → `api.post('/auth/login', { email, password })` → 后端 bcrypt 验证 → 返回 JWT token + user 对象
4. token 和 user 存入 `localStorage`（key: `'auth'`），刷新后 `App.tsx` 通过 `GET /users/me` 验证 token
5. 登出 → `handleLogout()` → 清除 auth state + localStorage
6. 注册 → RegisterPage 表单 → `api.post('/auth/register', form)` → 自动激活 + 默认偏好
7. 登录/注册页无验证码

**角色定义**（四种）:
- `'admin'` → 后台管理系统（管理看板/案例管理/作者管理/用户管理/公告管理/投稿审核）
- `'contributor'` → 用户首页（浏览案例/投稿/我的投稿/个性化服务）
- `'auditor'` → 用户首页
- `'manager'` → 用户首页

**种子账号**（密码统一 `password123`）: admin@archives.gov.cn / elena@archives.gov.cn / sarah@archives.gov.cn / michael@archives.gov.cn

## 组件层级

```
App
├── LoginPage (authMode === 'login' 时全屏覆盖)
├── RegisterPage (authMode === 'register' 时全屏覆盖)
└── Layout (始终渲染，包裹所有页面)
    ├── Header (Logo + 全局搜索下拉 + 登录/注册 或 用户头像)
    ├── 导航栏 (角色导航)
    ├── Outlet
    │   ├── PortalPage (首页)
    │   │   ├── HeroCarousel (轮播)
    │   │   ├── 左侧：案例分类导航 + 专题动态 + 平台数据
    │   │   └── 右侧：通知公告 + 最新案例 + 热门案例
    │   ├── Dashboard
    │   │   ├── AdminDashboard (管理员看板：5统计卡+5模块网格+系统状态+安全日志)
    │   │   └── UserDashboard (用户首页，复用 PortalPage)
    │   ├── CaseManagement (案例卡片列表 + 分类筛选)
    │   │   └── CaseManagementModal (新建/编辑案例弹窗 + 文件 + 专题关联)
    │   ├── CaseDetail (案例详情 + 多格式附件预览/下载 + 浏览量 + 登录提示)
    │   ├── CaseSubmission (案例投稿表单 + 登录提示)
    │   ├── AdminCases (后台案例表格 + 行内编辑 + 专题筛选 + 批量操作)
    │   ├── AdminAuthors (后台作者管理表格 + 新建/编辑弹窗 + 删除)
    │   ├── SubmissionReview (后台投稿审核列表 + 通过/拒绝 + 反馈信息)
    │   ├── UserManagement (用户权限表格 + 创建/编辑 + 快捷切换角色)
    │   ├── SpecialLibrary (专题案例卡片网格 + Tab 分类 + 实时案例数统计)
    │   ├── TopicDetail (专题头部 + 本专题案例表格 + 搜索)
    │   ├── PersonalizedServices (订阅标签/关注区域/偏好/案例推荐)
    │   ├── ProfilePage (侧栏：个人资料/我的投稿/收藏/账号安全)
    │   │   └── MySubmissions (投稿状态 + 审核反馈 + 删除)
    │   ├── ExpertLibrary (案例作者列表)
    │   ├── ExpertDetail (作者详情 + 贡献案例)
    │   └── AnnouncementList / AnnouncementDetail / AnnouncementManagement
    └── Footer (平台名 + 版权 + 链接)
```

## 状态管理

- **无需状态管理库**，纯 React `useState` + props 传递
- 全局 `user` 状态定义在 [App.tsx](src/App.tsx)，向下流经 `Layout` → `Outlet context`
- `useOutletContext` 传递 `{ user, onLoginRequest, onRegisterRequest, setIsCaseModalOpen }`
- API 客户端 [src/api/client.ts](src/api/client.ts) 提供 `api.get/post/put/delete/upload`，自动注入 JWT token
- 页面返回时通过 `location.key` 触发数据刷新（如 SpecialLibrary）

## 颜色 / 主题体系

所有颜色 token 通过 Tailwind CSS v4 的 `@theme` 指令定义在 [src/index.css](src/index.css)，主色系为蓝色（`primary: #0056b7`），辅助语义色涵盖：
- Surface 层级（6级）
- Primary/Secondary/Tertiary 固定色与容器色
- 状态色（error / status-green / red / yellow / blue / purple）
- Outline 层级色

自定义 spacing 变量：`--spacing-unit`, `--spacing-gutter`, `--spacing-stack-gap`, `--spacing-sidebar-width`

## 数据类型

见 [src/types.ts](src/types.ts)：
- `Status`: `'open' | 'pending' | 'completed' | 'archived' | 'flagged'`
- `Case`: 案例实体（id, title, category, status, priority, dates, assignee）
- `NavItem`: 导航条目（label, href, icon, badge?）
- `User`: 用户实体（id, name, email, role, organization, avatar?）

## 关键依赖说明

| 包 | 用途 |
|---|------|
| `@vitejs/plugin-react` | Vite React JSX 编译 |
| `@tailwindcss/vite` | Tailwind CSS v4 Vite 插件 |
| `clsx` + `tailwind-merge` | `cn()` 条件类名合并 |
| `framer-motion` / `motion` | 进场动画、hover 动效、布局动画 |
| `lucide-react` | SVG 图标库 |
| `react-router-dom` | 路由 |

## 开发注意事项

1. **样式 token 类名**：全局使用 Tailwind 自定义语义类（如 `text-on-surface-variant`、`bg-surface-container-low`、`text-headline-md` 等），修改颜色统一在 `index.css` 的 `@theme` 块中
2. **路径别名**：`@/` 映射到项目根目录
3. **构建产物**：JS chunk 较大（约 1MB），原因是未做代码分割
4. **访客模式**：未登录用户可浏览首页/案例库/作者库/专题案例库，预览/下载/投稿/偏好需登录后弹出登录窗
5. **前端已对接后端**：所有列表/详情/搜索数据通过 `src/api/client.ts` 调用 Express API，Token 自动注入
6. **自动迁移**：后端启动时 `autoMigrate()` 自动补 `cases.topic_id`、`cases.view_count` 等缺失列，无需手动执行 SQL
7. **浏览量**：独立的 `POST /cases/:id/view` 接口，前端 `useRef` 防 React StrictMode 双调用
8. **文件上传**：支持任意格式上传和下载，PDF/图片支持在线预览，Office 文档提示下载查看
9. **搜索**：Layout 顶部全局搜索栏支持实时下拉结果，可搜索案例/作者/专题/文献
10. **登录注册**：统一邮箱+密码登录，自动根据角色进入对应工作台（admin→后台，其他→用户首页）
