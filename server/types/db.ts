// ============================================================
// 档案资政案例管理与展示平台 — 数据库类型定义
// 对应 server/migrations/001_init.sql
// ============================================================

// ─── 枚举类型 ───────────────────────────────────────────────

export type UserRole = 'admin' | 'contributor' | 'auditor' | 'manager';

export type UserStatus = 'pending' | 'active' | 'disabled';

export type DeviceType = 'desktop' | 'mobile' | 'tablet';

export type PushFrequency = 'daily' | 'weekly' | 'realtime' | 'off';

export type DisplayMode = 'light' | 'dark';

export type ContentType = '政策文件' | '学术期刊' | '统计公报' | '实践案例';

export type SecurityLevel = 'public' | 'restricted' | 'confidential';

export type CaseStatus = 'open' | 'pending' | 'completed' | 'archived' | 'flagged';

export type CasePriority = 'low' | 'medium' | 'high';

export type FileType = 'PDF' | 'DOCX' | 'XLSX' | 'CSV' | 'JSON' | 'XML' | 'JPG' | 'PNG';

export type TaxonomyNodeType = 'category' | 'folder' | 'record';

export type TaxonomySecurity = 'Public' | 'Restricted' | 'Confidential';

export type DatasetSecurity = '公开访问' | '内部预览' | '受限访问';

export type ConsultationStatus = 'pending' | 'replied' | 'closed';

export type SecurityEventType = 'LOGIN' | 'POLICY_VIOLATION' | 'TAXONOMY_UPDATE';

export type SecuritySeverity = 'info' | 'warning' | 'critical';

// ─── 基础字段 ───────────────────────────────────────────────

/** 所有表共有时间戳 */
interface Timestamps {
  created_at: string; // ISO 8601
}

interface TimestampsWithUpdate extends Timestamps {
  updated_at: string;
}

// ─── 实体定义 ───────────────────────────────────────────────

/** 3.1 用户 */
export interface User extends TimestampsWithUpdate {
  id: string;
  email: string;
  password_hash: string;
  real_name: string;
  department: string;
  organization: string | null;
  phone: string | null;
  role: UserRole;
  avatar_url: string | null;
  status: UserStatus;
  verified_at: string | null;
  employee_id: string | null;
  credit_score: number;
}

/** 3.2 登录历史 */
export interface LoginHistory extends Timestamps {
  id: string;
  user_id: string;
  location: string | null;
  ip_address: string | null;
  device_type: DeviceType | null;
  user_agent: string | null;
}

/** 3.3 用户偏好 */
export interface UserPreferences {
  user_id: string;
  push_frequency: PushFrequency;
  display_mode: DisplayMode;
  search_weights: string[];
  updated_at: string;
}

/** 3.4 用户订阅标签 */
export interface UserSubscription extends Timestamps {
  user_id: string;
  tag: string;
}

/** 3.5 用户关注区域 */
export interface UserRegion extends Timestamps {
  user_id: string;
  region_name: string;
}

/** 3.6 专题 */
export interface Topic extends TimestampsWithUpdate {
  id: string;
  title: string;
  description: string | null;
  cover_image: string | null;
  category: string;
  doc_count: number;
  follower_count: number;
  is_hot: boolean;
  is_active: boolean;
}

/** 3.7 用户关注专题 */
export interface UserFollowedTopic extends Timestamps {
  user_id: string;
  topic_id: string;
}

/** 3.8 文献 */
export interface Document extends TimestampsWithUpdate {
  id: string;
  topic_id: string;
  title: string;
  author: string | null;
  organization: string | null;
  description: string | null;
  content_type: ContentType | null;
  file_url: string | null;
  file_size: number | null;
  page_count: number | null;
  security_level: SecurityLevel;
  view_count: number;
  download_count: number;
  published_at: string | null;
}

/** 3.9 文献标签 */
export interface DocumentTag {
  document_id: string;
  tag: string;
}

/** 3.10 文献评论 */
export interface DocumentComment extends Timestamps {
  id: string;
  document_id: string;
  user_id: string;
  content: string;
  likes: number;
  parent_id: string | null;
  // 联表字段（API 响应时填充）
  user_name?: string;
  user_role?: string;
}

/** 3.11 文献阅读历史 */
export interface DocumentReadHistory {
  user_id: string;
  document_id: string;
  last_page: number | null;
  read_at: string;
}

/** 3.12 案例 */
export interface Case extends TimestampsWithUpdate {
  id: string;
  case_number: string;
  title: string;
  category: string;
  topic_id: string | null;
  status: CaseStatus;
  priority: CasePriority;
  description: string | null;
  assignee_id: string | null;
  created_by: string | null;
  view_count: number;
  // 联表字段
  assignee_name?: string;
  assignee_avatar?: string;
}

/** 3.13 案卷文件 */
export interface CaseFile extends Timestamps {
  id: string;
  case_id: string;
  file_name: string;
  file_size: number | null;
  file_type: FileType | null;
  storage_url: string | null;
  uploaded_by: string | null;
}

/** 3.14 分类节点 */
export interface TaxonomyNode extends TimestampsWithUpdate {
  id: string;
  parent_id: string | null;
  name: string;
  type: TaxonomyNodeType;
  sort_order: number;
  retention: string | null;
  security: TaxonomySecurity;
  record_count: number;
  allocated_storage: string | null;
  metadata: Record<string, unknown> | null;
  // 业务层字段
  children?: TaxonomyNode[];
}

/** 3.15 分类节点权限 */
export interface TaxonomyNodeAccess {
  node_id: string;
  role: UserRole;
  can_read: boolean;
  can_write: boolean;
}

/** 3.16 公告 */
export interface Announcement extends Timestamps {
  id: string;
  category: string;
  title: string;
  content: string | null;
  published_at: string;
  is_active: boolean;
}

/** 3.17 地方动态 */
export interface RegionalUpdate extends Timestamps {
  id: string;
  region_code: string;
  region_name: string;
  description: string | null;
  published_at: string;
}

/** 3.18 研究报告 */
export interface Report extends Timestamps {
  id: string;
  title: string;
  category: string;
  author: string | null;
  description: string | null;
  file_url: string | null;
  is_premium: boolean;
  download_count: number;
  published_at: string | null;
}

/** 3.19 数据集 */
export interface Dataset extends TimestampsWithUpdate {
  id: string;
  dataset_code: string;
  name: string;
  description: string | null;
  data_type: string | null;
  file_size_bytes: number | null;
  file_size_display: string | null;
  security_level: DatasetSecurity;
  status: string;
}

/** 3.20 专家 */
export interface Expert extends Timestamps {
  id: string;
  name: string;
  role_title: string | null;
  institution: string | null;
  field: string | null;
  location: string | null;
  rating: number;
  review_count: number;
  avatar_url: string | null;
  is_verified: boolean;
  bio: string | null;
  status: string;
  joined_at: string | null;
}

/** 3.21 专家咨询记录 */
export interface ExpertConsultation extends Timestamps {
  id: string;
  expert_id: string;
  user_id: string;
  topic: string | null;
  message: string | null;
  reply: string | null;
  status: ConsultationStatus;
}

/** 3.22 专题-专家关联 */
export interface TopicExpert {
  topic_id: string;
  expert_id: string;
}

/** 3.23 审计日志 */
export interface AuditLog extends Timestamps {
  id: string;
  user_id: string | null;
  action: string;
  resource_type: string | null;
  resource_id: string | null;
  ip_address: string | null;
  user_agent: string | null;
  details: Record<string, unknown> | null;
}

/** 3.24 安全日志 */
export interface SecurityLog extends Timestamps {
  id: string;
  event_type: SecurityEventType;
  severity: SecuritySeverity;
  user_id: string | null;
  message: string | null;
  metadata: Record<string, unknown> | null;
}

/** 3.25 系统快照 */
export interface SystemSnapshot extends Timestamps {
  id: string;
  label: string;
  snapshot_data: Record<string, unknown>;
  created_by: string | null;
}

// ─── 聚合 / 响应类型 ────────────────────────────────────────

/** 分页容器 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

/** 带有评论的文献 */
export interface DocumentWithComments extends Document {
  tags: string[];
  comments: DocumentComment[];
}

/** 带有文件的案例 */
export interface CaseWithFiles extends Case {
  files: CaseFile[];
}

/** 带有文献统计的专题 */
export interface TopicWithStats extends Topic {
  doc_type_distribution: { label: string; value: number }[];
  experts: Expert[];
}

/** 首页统计聚合 */
export interface PortalStats {
  storage_density_pb: number;
  density_growth_percent: number;
  request_queue_count: number;
  avg_processing_days: number;
  total_archives: number;
  global_partners: number;
  smart_classification_accuracy: number;
  digitization_progress: number;
}

/** 管理员看板 */
export interface AdminDashboardData {
  total_cases: number;
  pending_audits: number;
  active_users: number;
  online_users: number;
  total_cases_change: string;
  system_status: { service: string; status: string; latency?: string }[];
  security_logs: SecurityLog[];
}

/** 研究院看板 */
export interface ResearcherDashboardData {
  global_density_data: number;
  topic_distribution: { label: string; value: number }[];
  growth_trend: { month: string; value: number }[];
  hot_reads: { id: string; title: string; readers: number }[];
}
