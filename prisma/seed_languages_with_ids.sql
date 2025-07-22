-- Languages Seed Data with specific IDs from database
-- 言語の初期データを特定のIDで挿入

INSERT INTO languages (id, name, code, created_at, updated_at)
VALUES 
  ('6ef505ed-32c8-41b7-8102-8063e8421e6d', 'Japanese', 'ja', NOW(), NOW()),
  ('e1cabd69-923a-4d28-a9d1-c0f11f351818', 'English', 'en', NOW(), NOW()),
  ('5257b049-6290-4fb2-a4ac-673495fe3921', 'Chinese', 'zh', NOW(), NOW()),
  ('0626b7fc-ffaa-4e3f-baf7-8f44c64813e9', 'Korean', 'ko', NOW(), NOW()),
  ('f14f6e55-cbcb-4cc8-88bd-7bf7d078b297', 'Spanish', 'es', NOW(), NOW()),
  ('7e054085-8d8e-4ac5-ae0a-a480073e6667', 'French', 'fr', NOW(), NOW()),
  ('d6bfefc5-35b0-45c3-8c45-7f48a630cb56', 'German', 'de', NOW(), NOW()),
  ('7c6f2306-54e5-4a20-acac-e9823588c55f', 'Italian', 'it', NOW(), NOW()),
  ('e90de3ba-56ac-4544-8284-bcdfe0d274e', 'Portuguese', 'pt', NOW(), NOW()),
  ('3bc88f52-3486-4b9a-b339-cede7deb8a2', 'Russian', 'ru', NOW(), NOW()),
  ('b96b0e1c-5fac-4633-b3b5-153cebcfaa22', 'Arabic', 'ar', NOW(), NOW()),
  ('678f6a55-921f-497a-a607-61f47802c254', 'Hindi', 'hi', NOW(), NOW()),
  ('d1766efd-fc6b-423b-94c0-11f3adba9e76', 'Thai', 'th', NOW(), NOW()),
  ('2fb6ea5c-6f13-4bf6-8218-7a99ad93eb1e', 'Vietnamese', 'vi', NOW(), NOW()),
  ('7d065fbb-2fce-432a-acb2-174e6dca1a31', 'Indonesian', 'id', NOW(), NOW())
ON CONFLICT (code) DO UPDATE SET
  name = EXCLUDED.name,
  updated_at = NOW();
