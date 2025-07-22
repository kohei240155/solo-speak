-- Phrase Levels Seed Data
-- フレーズレベルの初期データを挿入

-- 既存データがある場合は削除（開発環境用）
-- DELETE FROM phrase_levels;

-- フレーズレベルデータの挿入
INSERT INTO phrase_levels (id, name, score, color, created_at, updated_at)
VALUES 
  ('cm2d9i0000001abc123def000', 'Lv1', 0, '#D9D9D9', NOW(), NOW()),
  ('cm2d9i0000002abc123def000', 'Lv2', 1, '#BFBFBF', NOW(), NOW()),
  ('cm2d9i0000003abc123def000', 'Lv3', 3, '#A6A6A6', NOW(), NOW()),
  ('cm2d9i0000004abc123def000', 'Lv4', 5, '#8C8C8C', NOW(), NOW()),
  ('cm2d9i0000005abc123def000', 'Lv5', 10, '#737373', NOW(), NOW()),
  ('cm2d9i0000006abc123def000', 'Lv6', 20, '#595959', NOW(), NOW()),
  ('cm2d9i0000007abc123def000', 'Lv7', 30, '#404040', NOW(), NOW())
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  score = EXCLUDED.score,
  color = EXCLUDED.color,
  updated_at = NOW();
