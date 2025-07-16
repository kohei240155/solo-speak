-- 言語データの挿入
INSERT INTO languages (id, name, code, created_at, updated_at) VALUES
  (gen_random_uuid(), '日本語', 'ja', now(), now()),
  (gen_random_uuid(), '英語', 'en', now(), now()),
  (gen_random_uuid(), '中国語', 'zh', now(), now()),
  (gen_random_uuid(), '韓国語', 'ko', now(), now()),
  (gen_random_uuid(), 'スペイン語', 'es', now(), now()),
  (gen_random_uuid(), 'フランス語', 'fr', now(), now()),
  (gen_random_uuid(), 'ドイツ語', 'de', now(), now()),
  (gen_random_uuid(), 'イタリア語', 'it', now(), now()),
  (gen_random_uuid(), 'ポルトガル語', 'pt', now(), now()),
  (gen_random_uuid(), 'ロシア語', 'ru', now(), now()),
  (gen_random_uuid(), 'アラビア語', 'ar', now(), now()),
  (gen_random_uuid(), 'ヒンディー語', 'hi', now(), now()),
  (gen_random_uuid(), 'タイ語', 'th', now(), now()),
  (gen_random_uuid(), 'ベトナム語', 'vi', now(), now()),
  (gen_random_uuid(), 'インドネシア語', 'id', now(), now())
ON CONFLICT (code) DO NOTHING;
