# 档案资政案例管理与展示平台 — API 需求清单

> 文档 1/3 | 版本 v1.0 | 2024-06-10
> **⚠️ 本文档为设计阶段需求规格，描述待实现的 API 接口。当前后端已实现大部分端点（40+ 个），详情见 `CLAUDE.md` 后端 API 章节。Redis / Elasticsearch 部分为规划建议，暂未实施。**

## 1. 概述

本文档定义后端需实现的所有 RESTful API 接口。前端 Demo 目前全部使用硬编码模拟数据，需替换为真实 API 调用。

**基础约定**：
- Base URL: `/api/v1`
- Content-Type: `application/json`
- 认证方式: Bearer Token（Header: `Authorization: Bearer <token>`）
- 所有时间字段为 ISO 8601 格式
- 分页参数统一: `page` (从1开始), `pageSize` (默认20)
- 角色: `admin` / `contributor` / `auditor` / `manager`

---

## 2. 认证模块

### 2.1 登录
```
POST /api/v1/auth/login
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| email | string | 是 | 邮箱 |
| password | string | 是 | 密码 |
| captcha | string | 是 | 验证码 |
| rememberMe | boolean | 否 | 是否记住登录（延长 token 有效期） |

**响应**：
```json
{
  "token": "eyJ...",
  "user": {
    "id": "u_001",
    "name": "埃琳娜·罗德里格斯",
    "email": "elena@archives.gov.cn",
    "role": "contributor",
    "organization": "档案管理部",
    "avatar": "https://..."
  }
}
```

### 2.2 注册
```
POST /api/v1/auth/register
```
| 字段 | 类型 | 必填 | 说明 |
|------|------|------|------|
| realName | string | 是 | 真实姓名 |
| department | string | 是 | 所属部门/机构 |
| email | string | 是 | 工作邮箱 |
| phone | string | 是 | 手机号码 |
| password | string | 是 | 密码（≥8位） |
| reason | string | 是 | 申请权限原因 |
| agreeTerms | boolean | 是 | 同意服务条款 |

**响应**：`{ "message": "注册申请已提交，请等待审核" }`

### 2.3 获取验证码
```
GET /api/v1/auth/captcha
```
响应: `{ "captchaId": "cap_...", "captchaImage": "data:image/png;base64,..." }`

---

## 3. 用户模块

### 3.1 获取当前用户信息
```
GET /api/v1/users/me
```
响应: `User` 对象（含 profile、认证状态、活跃度积分等）

### 3.2 更新个人资料
```
PUT /api/v1/users/me
```
| 字段 | 说明 |
|------|------|
| email | 邮箱 |
| phone | 手机号 |
| avatar | 头像（文件上传 URL） |

### 3.3 修改密码
```
PUT /api/v1/users/me/password
```
| 字段 | 说明 |
|------|------|
| oldPassword | 旧密码 |
| newPassword | 新密码 |

### 3.4 获取用户偏好设置
```
GET /api/v1/users/me/preferences
```
响应: `{ pushFrequency, displayMode, searchWeights }`

### 3.5 更新偏好设置
```
PUT /api/v1/users/me/preferences
```

### 3.6 获取登录历史
```
GET /api/v1/users/me/login-history?page=1&pageSize=10
```

### 3.7 管理员：获取用户列表
```
GET /api/v1/admin/users?role=&status=&search=&page=&pageSize=
```

---

## 4. 门户首页模块

### 4.1 获取 Hero 统计数据
```
GET /api/v1/portal/hero-stats
```
响应: `{ storageDensityPB: 8.4, totalRequests: 3842, avgProcessingDays: 1.8, totalArchives: 1248302, ... }`

### 4.2 获取公告列表
```
GET /api/v1/portal/announcements?page=1&pageSize=3
```
响应: `Announcement[]` 含 `{ id, category, title, date }`

### 4.3 获取地方动态
```
GET /api/v1/portal/regional-updates?limit=3
```
响应: `RegionalUpdate[]` 含 `{ region, name, desc }`

### 4.4 获取最新档案发布
```
GET /api/v1/portal/latest-releases?page=1&pageSize=5
```
响应: 含主推新闻（带图片 URL）+ 次新闻列表

### 4.5 全局搜索
```
GET /api/v1/search?q=&scope=all&page=&pageSize=
```
scope 可选: `all` / `archives` / `reports` / `cases` / `topics`

---

## 5. 专题文献库模块

### 5.1 获取专题列表
```
GET /api/v1/library/topics?category=&search=&sort=latest|popular|updated&page=&pageSize=
```

### 5.2 获取专题详情
```
GET /api/v1/library/topics/:topicId
```

### 5.3 获取专题内文献列表
```
GET /api/v1/library/topics/:topicId/documents?sort=hot|time&search=&page=&pageSize=
```

### 5.4 获取文献详情
```
GET /api/v1/library/documents/:docId
```

### 5.5 关注/取消关注专题
```
POST /api/v1/library/topics/:topicId/follow
DELETE /api/v1/library/topics/:topicId/follow
```

### 5.6 获取专题统计数据
```
GET /api/v1/library/topics/:topicId/stats
```
响应: `{ totalDocs, totalFollowers, docTypeDistribution }`

---

## 6. 案例管理模块

### 6.1 获取案例列表
```
GET /api/v1/cases?status=open|pending|completed|flagged|all&search=&priority=&page=&pageSize=
```

### 6.2 获取案例详情
```
GET /api/v1/cases/:caseId
```

### 6.3 创建案例
```
POST /api/v1/cases
```

### 6.4 更新案例
```
PUT /api/v1/cases/:caseId
```

### 6.5 删除案例
```
DELETE /api/v1/cases/:caseId
```

### 6.6 案卷文件上传
```
POST /api/v1/cases/:caseId/files
Content-Type: multipart/form-data
```

### 6.7 删除案卷文件
```
DELETE /api/v1/cases/:caseId/files/:fileId
```

### 6.8 批量导出
```
GET /api/v1/cases/export?status=&format=csv|xlsx
```

---

## 7. 档案分类模块

### 7.1 获取分类树
```
GET /api/v1/taxonomy/tree?search=
```
响应: 嵌套 `TaxonomyNode[]`，含 `{ id, name, type, children, retention, security, meta }`

### 7.2 获取分类节点详情
```
GET /api/v1/taxonomy/nodes/:nodeId
```

### 7.3 创建分类节点
```
POST /api/v1/taxonomy/nodes
```

### 7.4 更新分类节点
```
PUT /api/v1/taxonomy/nodes/:nodeId
```

### 7.5 删除分类节点
```
DELETE /api/v1/taxonomy/nodes/:nodeId
```

---

## 8. 研究报告模块

### 8.1 获取报告列表
```
GET /api/v1/reports?category=&type=all|collected|weekly&search=&page=&pageSize=
```

### 8.2 获取报告详情（含下载）
```
GET /api/v1/reports/:reportId
```

### 8.3 下载报告
```
GET /api/v1/reports/:reportId/download
```
响应: 文件流

### 8.4 获取数据趋势
```
GET /api/v1/reports/analytics/trend?range=week|month|quarter
```
响应: `{ data: [{ name, value }] }` 用于 AreaChart

---

## 9. 国研数据模块

### 9.1 获取数据集列表
```
GET /api/v1/datasets?view=grid|list&security=&search=&page=&pageSize=
```

### 9.2 获取全局统计
```
GET /api/v1/datasets/stats
```
响应: `{ totalScale, activeCount, crossBorderNodes, monthlyApiCalls }`

### 9.3 导出数据集
```
POST /api/v1/datasets/export?ids=
```

---

## 10. 专家库模块

### 10.1 获取专家列表
```
GET /api/v1/experts?tab=all|active|academic|new&field=&search=&page=&pageSize=
```

### 10.2 获取专家详情
```
GET /api/v1/experts/:expertId
```

### 10.3 发起咨询
```
POST /api/v1/experts/:expertId/consult
```
| 字段 | 说明 |
|------|------|
| topic | 咨询主题 |
| message | 咨询内容 |

### 10.4 申请入驻智库
```
POST /api/v1/experts/apply
```

### 10.5 获取专家库统计
```
GET /api/v1/experts/stats
```

---

## 11. 个性化服务模块

### 11.1 获取推荐列表
```
GET /api/v1/services/recommendations
```
响应: 基于用户偏好和浏览历史的个性化推荐

### 11.2 管理订阅专题
```
GET /api/v1/services/subscriptions
PUT /api/v1/services/subscriptions
```

### 11.3 管理关注区域
```
GET /api/v1/services/regions
PUT /api/v1/services/regions
```

### 11.4 获取平台概览
```
GET /api/v1/services/overview
```
响应: `{ totalResources, connectedInstitutions, dailyActiveUsers }`

---

## 12. 管理员模块

### 12.1 获取运营看板
```
GET /api/v1/admin/dashboard
```
响应: `{ totalCases, pendingAudits, activeUsers, systemStatus, securityLogs, ... }`

### 12.2 获取系统状态
```
GET /api/v1/admin/system-status
```

### 12.3 获取安全日志
```
GET /api/v1/admin/security-logs?page=&pageSize=
```

### 12.4 批量导入数据
```
POST /api/v1/admin/import
Content-Type: multipart/form-data
```

### 12.5 还原快照
```
POST /api/v1/admin/snapshots/:snapshotId/restore
```

### 12.6 合规检查
```
POST /api/v1/admin/compliance-check
```

---

## 13. 审计日志模块

### 13.1 获取审计日志
```
GET /api/v1/audit-logs?user=&action=&dateFrom=&dateTo=&page=&pageSize=
```

---

## 14. 通用说明

### 14.1 分页响应格式
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 20,
    "total": 142,
    "totalPages": 8
  }
}
```

### 14.2 错误响应格式
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "请先登录",
    "details": {}
  }
}
```

### 14.3 错误码枚举
| code | HTTP | 说明 |
|------|------|------|
| UNAUTHORIZED | 401 | 未登录 |
| FORBIDDEN | 403 | 权限不足 |
| NOT_FOUND | 404 | 资源不存在 |
| VALIDATION_ERROR | 422 | 参数校验失败 |
| RATE_LIMITED | 429 | 请求频率限制 |
| INTERNAL_ERROR | 500 | 服务器内部错误 |

### 14.4 访客模式
- 未携带 Token 时可访问公开数据（公告、专题列表、专家列表等）
- 受限内容返回脱敏数据或 `"premium": true` 标记
- 写操作（创建/编辑/删除）和个性化内容需登录
