import pg from 'pg';

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: { rejectUnauthorized: false },
  max: 20,
  idleTimeoutMillis: 30000,
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
});

// 自动迁移：启动时补齐缺失的列
export async function autoMigrate(): Promise<void> {
  try {
    // cases 表补 topic_id 列
    const hasTopicId = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='cases' AND column_name='topic_id'`
    );
    if (hasTopicId.rows.length === 0) {
      await pool.query('ALTER TABLE cases ADD COLUMN topic_id UUID REFERENCES topics(id) ON DELETE SET NULL');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_cases_topic_id ON cases (topic_id)');
      console.log('  ✓ 自动迁移：cases.topic_id');
    }

    // cases 表补 view_count 列
    const hasViewCount = await pool.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name='cases' AND column_name='view_count'`
    );
    if (hasViewCount.rows.length === 0) {
      await pool.query('ALTER TABLE cases ADD COLUMN view_count INTEGER NOT NULL DEFAULT 0');
      await pool.query('CREATE INDEX IF NOT EXISTS idx_cases_view_count ON cases (view_count)');
      console.log('  ✓ 自动迁移：cases.view_count');
    }
    // 案例变动时联动更新专题 updated_at 的触发器
    await pool.query(`
      CREATE OR REPLACE FUNCTION touch_topic_on_case_change()
      RETURNS TRIGGER AS $$
      DECLARE t_id UUID;
      BEGIN
        IF TG_OP IN ('INSERT', 'UPDATE') AND NEW.topic_id IS NOT NULL THEN
          UPDATE topics SET updated_at = NOW() WHERE id = NEW.topic_id;
        END IF;
        IF TG_OP IN ('UPDATE', 'DELETE') AND OLD.topic_id IS NOT NULL AND OLD.topic_id IS DISTINCT FROM NEW.topic_id THEN
          UPDATE topics SET updated_at = NOW() WHERE id = OLD.topic_id;
        END IF;
        RETURN NEW;
      END;
      $$ LANGUAGE plpgsql;
    `).catch(() => {});
    await pool.query(
      `DO $$ BEGIN CREATE TRIGGER trg_case_topic_updated_at AFTER INSERT OR UPDATE OR DELETE ON cases FOR EACH ROW EXECUTE FUNCTION touch_topic_on_case_change(); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`
    ).catch(() => {});
    console.log('  ✓ 自动迁移：case→topic 联动触发器');
  } catch (err) {
    console.error('  ✗ 自动迁移失败：', err);
  }
}

export async function query<T = any>(text: string, params?: any[]): Promise<T[]> {
  const result = await pool.query(text, params);
  return result.rows as T[];
}

export async function queryOne<T = any>(text: string, params?: any[]): Promise<T | null> {
  const result = await pool.query(text, params);
  return (result.rows[0] as T) || null;
}

export async function execute(text: string, params?: any[]): Promise<pg.QueryResult> {
  return pool.query(text, params);
}

export default pool;
