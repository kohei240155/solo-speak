-- 言語データの挿入
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
ON CONFLICT (code) DO NOTHING;
