-- ============================================================
-- 002: cases 表新增 view_count 字段（首页热门案例排序）
-- ============================================================

ALTER TABLE cases ADD COLUMN IF NOT EXISTS view_count INTEGER NOT NULL DEFAULT 0;
CREATE INDEX IF NOT EXISTS idx_cases_view_count ON cases (view_count);

-- 种子数据视图模拟
UPDATE cases SET view_count = 1280 WHERE case_number = 'CASE-2024-001';
UPDATE cases SET view_count = 960  WHERE case_number = 'CASE-2024-002';
UPDATE cases SET view_count = 2150 WHERE case_number = 'CASE-2024-003';
UPDATE cases SET view_count = 740  WHERE case_number = 'CASE-2024-004';
