-- ============================================================
-- 档案资政案例管理与展示平台 — 数据库初始化 DDL
-- 数据库: PostgreSQL 15+
-- 编码: UTF-8
-- ============================================================

-- 扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 1. 用户与认证
-- ============================================================

CREATE TYPE user_role AS ENUM ('admin', 'contributor', 'auditor', 'manager');
CREATE TYPE user_status AS ENUM ('pending', 'active', 'disabled');

CREATE TABLE users (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    real_name       VARCHAR(100) NOT NULL,
    department      VARCHAR(200) NOT NULL,
    organization    VARCHAR(200),
    phone           VARCHAR(20),
    role            user_role NOT NULL DEFAULT 'contributor',
    avatar_url      VARCHAR(500),
    status          user_status NOT NULL DEFAULT 'pending',
    verified_at     TIMESTAMPTZ,
    employee_id     VARCHAR(50),
    credit_score    INTEGER NOT NULL DEFAULT 0,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_users_email   ON users (email);
CREATE INDEX idx_users_role    ON users (role);
CREATE INDEX idx_users_status  ON users (status);

-- ============================================================
-- 2. 登录历史
-- ============================================================

CREATE TYPE device_type AS ENUM ('desktop', 'mobile', 'tablet');

CREATE TABLE login_history (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    location    VARCHAR(200),
    ip_address  VARCHAR(45),
    device_type device_type,
    user_agent  TEXT,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_login_user ON login_history (user_id, created_at DESC);

-- ============================================================
-- 3. 用户偏好（一对一）
-- ============================================================

CREATE TYPE push_frequency AS ENUM ('daily', 'weekly', 'realtime', 'off');
CREATE TYPE display_mode AS ENUM ('light', 'dark');

CREATE TABLE user_preferences (
    user_id         UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    push_frequency  push_frequency NOT NULL DEFAULT 'daily',
    display_mode    display_mode NOT NULL DEFAULT 'light',
    search_weights  JSONB NOT NULL DEFAULT '["latest","core"]'::jsonb,
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 4. 用户订阅标签
-- ============================================================

CREATE TABLE user_subscriptions (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    tag        VARCHAR(100) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, tag)
);

-- ============================================================
-- 5. 用户关注区域
-- ============================================================

CREATE TABLE user_regions (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_name VARCHAR(100) NOT NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, region_name)
);

-- ============================================================
-- 6. 专题
-- ============================================================

CREATE TABLE topics (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title           VARCHAR(300) NOT NULL,
    description     TEXT,
    cover_image     VARCHAR(500),
    category        VARCHAR(100) NOT NULL DEFAULT '全部领域',
    doc_count       INTEGER NOT NULL DEFAULT 0,
    follower_count  INTEGER NOT NULL DEFAULT 0,
    is_hot          BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    updated_at      TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_topics_category ON topics (category);

-- ============================================================
-- 7. 用户关注专题
-- ============================================================

CREATE TABLE user_followed_topics (
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic_id   UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, topic_id)
);

-- ============================================================
-- 8. 文献
-- ============================================================

CREATE TYPE content_type AS ENUM ('政策文件', '学术期刊', '统计公报', '实践案例');
CREATE TYPE security_level AS ENUM ('public', 'restricted', 'confidential');

CREATE TABLE documents (
    id              UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    topic_id        UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    title           VARCHAR(500) NOT NULL,
    author          VARCHAR(200),
    organization    VARCHAR(300),
    description     TEXT,
    content_type    content_type,
    file_url        VARCHAR(500),
    file_size       BIGINT,
    page_count      INTEGER,
    security_level  security_level NOT NULL DEFAULT 'public',
    view_count      INTEGER NOT NULL DEFAULT 0,
    download_count  INTEGER NOT NULL DEFAULT 0,
    published_at    DATE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ
);

CREATE INDEX idx_documents_topic        ON documents (topic_id);
CREATE INDEX idx_documents_published    ON documents (published_at DESC);
CREATE INDEX idx_documents_content_type ON documents (content_type);

-- ============================================================
-- 9. 文献标签
-- ============================================================

CREATE TABLE document_tags (
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    tag         VARCHAR(100) NOT NULL,
    PRIMARY KEY (document_id, tag)
);

-- ============================================================
-- 10. 文献评论
-- ============================================================

CREATE TABLE document_comments (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    content     TEXT NOT NULL,
    likes       INTEGER NOT NULL DEFAULT 0,
    parent_id   UUID REFERENCES document_comments(id) ON DELETE CASCADE,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_comments_document ON document_comments (document_id, created_at DESC);

-- ============================================================
-- 11. 文献阅读历史
-- ============================================================

CREATE TABLE document_read_history (
    user_id     UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    last_page   INTEGER,
    read_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, document_id)
);

-- ============================================================
-- 12. 案例
-- ============================================================

CREATE TYPE case_status AS ENUM ('open', 'pending', 'completed', 'archived', 'flagged');
CREATE TYPE case_priority AS ENUM ('low', 'medium', 'high');

CREATE TABLE cases (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_number VARCHAR(50) NOT NULL UNIQUE,
    title       VARCHAR(500) NOT NULL,
    category    VARCHAR(100) NOT NULL,
    topic_id    UUID REFERENCES topics(id) ON DELETE SET NULL,
    status      case_status NOT NULL DEFAULT 'open',
    priority    case_priority NOT NULL DEFAULT 'medium',
    description TEXT,
    assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
    created_by  UUID REFERENCES users(id) ON DELETE SET NULL,
    view_count  INTEGER NOT NULL DEFAULT 0,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at  TIMESTAMPTZ
);

CREATE INDEX idx_cases_status     ON cases (status);
CREATE INDEX idx_cases_priority   ON cases (priority);
CREATE INDEX idx_cases_assignee   ON cases (assignee_id);
CREATE INDEX idx_cases_view_count ON cases (view_count);
CREATE INDEX idx_cases_topic_id   ON cases (topic_id);

-- ============================================================
-- 13. 案卷文件
-- ============================================================

CREATE TYPE file_type AS ENUM ('PDF', 'DOCX', 'XLSX', 'CSV', 'JSON', 'XML', 'JPG', 'PNG');

CREATE TABLE case_files (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    case_id     UUID NOT NULL REFERENCES cases(id) ON DELETE CASCADE,
    file_name   VARCHAR(255) NOT NULL,
    file_size   BIGINT,
    file_type   file_type,
    storage_url VARCHAR(500),
    uploaded_by UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_case_files_case ON case_files (case_id);

-- ============================================================
-- 14. 档案分类节点（邻接表）
-- ============================================================

CREATE TYPE taxonomy_node_type AS ENUM ('category', 'folder', 'record');
CREATE TYPE taxonomy_security AS ENUM ('Public', 'Restricted', 'Confidential');

CREATE TABLE taxonomy_nodes (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    parent_id         UUID REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
    name              VARCHAR(200) NOT NULL,
    type              taxonomy_node_type NOT NULL,
    sort_order        INTEGER NOT NULL DEFAULT 0,
    retention         VARCHAR(50),
    security          taxonomy_security NOT NULL DEFAULT 'Public',
    record_count      INTEGER NOT NULL DEFAULT 0,  -- folder/category 使用；record 层面不适用时设为 0
    allocated_storage VARCHAR(50),
    metadata          JSONB,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at        TIMESTAMPTZ
);

CREATE INDEX idx_taxonomy_parent ON taxonomy_nodes (parent_id);
CREATE INDEX idx_taxonomy_type   ON taxonomy_nodes (type);

-- ============================================================
-- 15. 分类节点权限
-- ============================================================

CREATE TABLE taxonomy_node_access (
    node_id   UUID NOT NULL REFERENCES taxonomy_nodes(id) ON DELETE CASCADE,
    role      user_role NOT NULL,
    can_read  BOOLEAN NOT NULL DEFAULT true,
    can_write BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (node_id, role)
);

-- ============================================================
-- 16. 公告
-- ============================================================

CREATE TABLE announcements (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    category    VARCHAR(50) NOT NULL,
    title       VARCHAR(500) NOT NULL,
    content     TEXT,
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    is_active   BOOLEAN NOT NULL DEFAULT true,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_announcements_published ON announcements (published_at DESC);

-- ============================================================
-- 17. 地方动态
-- ============================================================

CREATE TABLE regional_updates (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    region_code  VARCHAR(10) NOT NULL,
    region_name  VARCHAR(100) NOT NULL,
    description  TEXT,
    published_at DATE NOT NULL DEFAULT CURRENT_DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_regional_code ON regional_updates (region_code);

-- ============================================================
-- 18. 研究报告
-- ============================================================

CREATE TABLE reports (
    id             UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title          VARCHAR(500) NOT NULL,
    category       VARCHAR(100) NOT NULL,
    author         VARCHAR(200),
    description    TEXT,
    file_url       VARCHAR(500),
    is_premium     BOOLEAN NOT NULL DEFAULT false,
    download_count INTEGER NOT NULL DEFAULT 0,
    published_at   DATE,
    created_at     TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_reports_category  ON reports (category);
CREATE INDEX idx_reports_published ON reports (published_at DESC);

-- ============================================================
-- 19. 数据集
-- ============================================================

CREATE TYPE dataset_security AS ENUM ('公开访问', '内部预览', '受限访问');

CREATE TABLE datasets (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    dataset_code      VARCHAR(50) NOT NULL UNIQUE,
    name              VARCHAR(500) NOT NULL,
    description       TEXT,
    data_type         VARCHAR(50),
    file_size_bytes   BIGINT,
    file_size_display VARCHAR(50),
    security_level    dataset_security NOT NULL DEFAULT '公开访问',
    status            VARCHAR(20) NOT NULL DEFAULT 'active',
    updated_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 20. 专家
-- ============================================================

CREATE TABLE experts (
    id           UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name         VARCHAR(100) NOT NULL,
    role_title   VARCHAR(200),
    institution  VARCHAR(300),
    field        VARCHAR(200),
    location     VARCHAR(100),
    rating       DECIMAL(2,1) CHECK (rating >= 0 AND rating <= 5),
    review_count INTEGER NOT NULL DEFAULT 0,
    avatar_url   VARCHAR(500),
    is_verified  BOOLEAN NOT NULL DEFAULT false,
    bio          TEXT,
    status       VARCHAR(20) NOT NULL DEFAULT 'active',
    joined_at    DATE,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_experts_field ON experts (field);
CREATE INDEX idx_experts_location ON experts (location);

-- ============================================================
-- 21. 专家咨询记录
-- ============================================================

CREATE TYPE consultation_status AS ENUM ('pending', 'replied', 'closed');

CREATE TABLE expert_consultations (
    id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    expert_id  UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
    user_id    UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    topic      VARCHAR(300),
    message    TEXT,
    reply      TEXT,
    status     consultation_status NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_consultations_expert ON expert_consultations (expert_id);
CREATE INDEX idx_consultations_user   ON expert_consultations (user_id);

-- ============================================================
-- 22. 专题-专家关联
-- ============================================================

CREATE TABLE topic_experts (
    topic_id  UUID NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    expert_id UUID NOT NULL REFERENCES experts(id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, expert_id)
);

-- ============================================================
-- 22b. 投稿表（用户投稿 → 管理员审核）
-- ============================================================

CREATE TABLE submissions (
    id                UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    title             VARCHAR(500) NOT NULL,
    category          VARCHAR(100) NOT NULL DEFAULT '政治建设',
    achievement_type  VARCHAR(100),
    target_audience   VARCHAR(100),
    consulting_form   VARCHAR(100),
    description       TEXT,
    author            VARCHAR(200),
    organization      VARCHAR(300),
    submitted_by      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    status            VARCHAR(20) NOT NULL DEFAULT 'pending',
    attachments       JSONB DEFAULT '[]'::jsonb,
    reviewer_notes    TEXT,
    reviewed_by       UUID REFERENCES users(id) ON DELETE SET NULL,
    reviewed_at       TIMESTAMPTZ,
    created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_status      ON submissions (status);
CREATE INDEX idx_submissions_submitted_by ON submissions (submitted_by);
CREATE INDEX idx_submissions_created_at  ON submissions (created_at);

-- ============================================================
-- 23. 审计日志
-- ============================================================

CREATE TABLE audit_logs (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id       UUID REFERENCES users(id) ON DELETE SET NULL,
    action        VARCHAR(100) NOT NULL,
    resource_type VARCHAR(50),
    resource_id   UUID,
    ip_address    VARCHAR(45),
    user_agent    TEXT,
    details       JSONB,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_audit_user    ON audit_logs (user_id);
CREATE INDEX idx_audit_action  ON audit_logs (action);
CREATE INDEX idx_audit_created ON audit_logs (created_at DESC);

-- ============================================================
-- 24. 安全日志
-- ============================================================

CREATE TYPE security_event_type AS ENUM ('LOGIN', 'POLICY_VIOLATION', 'TAXONOMY_UPDATE');
CREATE TYPE security_severity AS ENUM ('info', 'warning', 'critical');

CREATE TABLE security_logs (
    id          UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    event_type  security_event_type NOT NULL,
    severity    security_severity NOT NULL DEFAULT 'info',
    user_id     UUID REFERENCES users(id) ON DELETE SET NULL,
    message     TEXT,
    metadata    JSONB,
    created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_security_type ON security_logs (event_type);
CREATE INDEX idx_security_time ON security_logs (created_at DESC);

-- ============================================================
-- 25. 系统快照
-- ============================================================

CREATE TABLE system_snapshots (
    id            UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    label         VARCHAR(200) NOT NULL,
    snapshot_data JSONB NOT NULL,
    created_by    UUID REFERENCES users(id) ON DELETE SET NULL,
    created_at    TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- ============================================================
-- 自动更新 updated_at 触发器
-- ============================================================

CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_preferences_updated_at
    BEFORE UPDATE ON user_preferences
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_topics_updated_at
    BEFORE UPDATE ON topics
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_documents_updated_at
    BEFORE UPDATE ON documents
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_cases_updated_at
    BEFORE UPDATE ON cases
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 当案例新增/修改/删除时，联动更新其所属专题的 updated_at
CREATE OR REPLACE FUNCTION touch_topic_on_case_change()
RETURNS TRIGGER AS $$
DECLARE
    t_id UUID;
BEGIN
    -- INSERT 或 UPDATE：更新新关联的专题
    IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.topic_id IS NOT NULL THEN
        UPDATE topics SET updated_at = NOW() WHERE id = NEW.topic_id;
    END IF;
    -- UPDATE 或 DELETE：更新旧关联的专题（如果换绑或删除）
    IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.topic_id IS NOT NULL AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
        UPDATE topics SET updated_at = NOW() WHERE id = OLD.topic_id;
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_case_topic_updated_at ON cases;
CREATE TRIGGER trg_case_topic_updated_at
    AFTER INSERT OR UPDATE OR DELETE ON cases
    FOR EACH ROW EXECUTE FUNCTION touch_topic_on_case_change();

CREATE TRIGGER update_taxonomy_nodes_updated_at
    BEFORE UPDATE ON taxonomy_nodes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
