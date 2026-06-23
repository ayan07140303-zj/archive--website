-- ============================================================
-- 003: cases 表新增 topic_id 外键（案例归属专题）
-- ============================================================

ALTER TABLE cases ADD COLUMN IF NOT EXISTS topic_id UUID REFERENCES topics(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_cases_topic_id ON cases (topic_id);

-- 种子数据：将现有案例关联到对应专题
UPDATE cases SET topic_id = 'b0000000-0000-0000-0000-000000000001' WHERE category = '机构';
UPDATE cases SET topic_id = 'b0000000-0000-0000-0000-000000000002' WHERE category = '法律';
UPDATE cases SET topic_id = 'b0000000-0000-0000-0000-000000000003' WHERE category = '运营';
UPDATE cases SET topic_id = 'b0000000-0000-0000-0000-000000000005' WHERE category = '人员';
