-- 削除対象言語の安全な確認・削除スクリプト
-- このスクリプトは段階的に実行してください

-- ========================================
-- STEP 1: 削除対象の確認
-- ========================================

-- 削除対象言語の一覧表示
SELECT 
  'DELETE TARGET' as status,
  id,
  code,
  name,
  created_at
FROM languages 
WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
ORDER BY code;

-- 削除対象言語に関連するフレーズ数の確認
SELECT 
  l.code,
  l.name,
  COUNT(p.id) as phrase_count
FROM languages l
LEFT JOIN phrases p ON l.id = p.language_id
WHERE l.code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
GROUP BY l.id, l.code, l.name
ORDER BY l.code;

-- 削除対象言語を母国語として使用しているユーザー数
SELECT 
  l.code,
  l.name,
  COUNT(u.id) as user_count_as_native
FROM languages l
LEFT JOIN users u ON l.id = u.native_language_id
WHERE l.code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
GROUP BY l.id, l.code, l.name
ORDER BY l.code;

-- 削除対象言語をデフォルト学習言語として使用しているユーザー数
SELECT 
  l.code,
  l.name,
  COUNT(u.id) as user_count_as_learning
FROM languages l
LEFT JOIN users u ON l.id = u.default_learning_language_id
WHERE l.code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
GROUP BY l.id, l.code, l.name
ORDER BY l.code;

-- ========================================
-- STEP 2: 実際の削除実行（慎重に実行）
-- ========================================

/*
-- 以下のコメントアウトを外して実行してください

BEGIN;

-- 関連フレーズの削除
DELETE FROM phrases 
WHERE language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- ユーザー設定の更新（母国語）
UPDATE users 
SET native_language_id = (
  SELECT id FROM languages WHERE code = 'ja' LIMIT 1
)
WHERE native_language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- ユーザー設定の更新（学習言語）
UPDATE users 
SET default_learning_language_id = (
  SELECT id FROM languages WHERE code = 'en' LIMIT 1
)
WHERE default_learning_language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- 言語テーブルからの削除
DELETE FROM languages 
WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi');

COMMIT;
*/

-- ========================================
-- STEP 3: 削除後の確認
-- ========================================

-- 残存言語の確認
SELECT 
  'REMAINING' as status,
  id,
  code,
  name,
  created_at
FROM languages 
ORDER BY code;

-- 言語数の確認
SELECT COUNT(*) as total_remaining_languages FROM languages;
