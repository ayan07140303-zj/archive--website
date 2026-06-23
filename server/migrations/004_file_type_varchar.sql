-- 004: file_type 改为 varchar 支持全文件类型
ALTER TABLE case_files ALTER COLUMN file_type TYPE VARCHAR(50);
UPDATE case_files SET file_type = UPPER(COALESCE(NULLIF(SPLIT_PART(file_name, '.', array_length(string_to_array(file_name, '.'), 1)), ''), 'FILE')) WHERE file_type IS NULL OR file_type = '';
