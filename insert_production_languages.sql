-- 本番データベースに言語データを投入/更新
-- まず既存データをチェックして、必要に応じて INSERT または UPDATE を実行

-- 言語データを英語名で挿入/更新（UPSERT）
INSERT INTO languages (id, name, code, created_at, updated_at) VALUES
  (gen_random_uuid(), 'Japanese', 'ja', now(), now()),
  (gen_random_uuid(), 'English', 'en', now(), now()),
  (gen_random_uuid(), 'Chinese', 'zh', now(), now()),
  (gen_random_uuid(), 'Korean', 'ko', now(), now()),
  (gen_random_uuid(), 'Spanish', 'es', now(), now()),
  (gen_random_uuid(), 'French', 'fr', now(), now()),
  (gen_random_uuid(), 'German', 'de', now(), now()),
  (gen_random_uuid(), 'Italian', 'it', now(), now()),
  (gen_random_uuid(), 'Portuguese', 'pt', now(), now()),
  (gen_random_uuid(), 'Russian', 'ru', now(), now()),
  (gen_random_uuid(), 'Arabic', 'ar', now(), now()),
  (gen_random_uuid(), 'Hindi', 'hi', now(), now()),
  (gen_random_uuid(), 'Thai', 'th', now(), now()),
  (gen_random_uuid(), 'Vietnamese', 'vi', now(), now()),
  (gen_random_uuid(), 'Indonesian', 'id', now(), now())
ON CONFLICT (code) DO UPDATE SET 
  name = EXCLUDED.name,
  updated_at = now();

-- 投入/更新後のデータを確認
SELECT id, name, code, created_at, updated_at FROM languages ORDER BY code;
