-- 削除対象言語のデータベースからの物理削除スクリプト
-- 実行前に必ずバックアップを取得してください

-- 削除対象の言語コード一覧
-- Bengali (bn), Kurdish (ku), Nepali (ne), Tagalog (tl), Urdu (ur),
-- Swedish (sv), Finnish (fi), Norwegian (no), Polish (pl), Czech (cs),
-- Hungarian (hu), Romanian (ro), Serbian (sr), Bulgarian (bg), Greek (el),
-- Ukrainian (uk), Swahili (sw), Turkish (tr), Arabic (ar), Russian (ru), Vietnamese (vi)

BEGIN;

-- 1. まず、削除対象言語に関連するフレーズデータを削除
-- (外部キー制約がある場合に備えて)
DELETE FROM phrases 
WHERE language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- 2. ユーザー設定テーブルから削除対象言語の参照を削除
-- 母国語として設定されている場合
UPDATE users 
SET native_language_id = (
  SELECT id FROM languages WHERE code = 'ja' LIMIT 1
)
WHERE native_language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- デフォルト学習言語として設定されている場合
UPDATE users 
SET default_learning_language_id = (
  SELECT id FROM languages WHERE code = 'en' LIMIT 1
)
WHERE default_learning_language_id IN (
  SELECT id FROM languages 
  WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi')
);

-- 3. 削除対象言語のレコードを物理削除
DELETE FROM languages 
WHERE code IN ('bn', 'ku', 'ne', 'tl', 'ur', 'sv', 'fi', 'no', 'pl', 'cs', 'hu', 'ro', 'sr', 'bg', 'el', 'uk', 'sw', 'tr', 'ar', 'ru', 'vi');

-- 4. 削除結果の確認
SELECT 
  '削除後の言語数' as description,
  COUNT(*) as count 
FROM languages;

SELECT 
  '残存言語一覧' as description,
  code,
  name 
FROM languages 
ORDER BY code;

COMMIT;

-- 実行後の確認用クエリ
-- SELECT code, name FROM languages ORDER BY code;
-- SELECT COUNT(*) as total_languages FROM languages;
