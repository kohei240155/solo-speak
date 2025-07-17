-- 本番環境用：言語名を日本語から英語に更新
-- 安全のため、既存のデータを確認してから更新

-- 現在の言語データを確認
SELECT id, name, code FROM languages ORDER BY code;

-- 言語名を英語に更新（codeベースで更新）
UPDATE languages SET name = 'Arabic', updated_at = now() WHERE code = 'ar';
UPDATE languages SET name = 'German', updated_at = now() WHERE code = 'de';
UPDATE languages SET name = 'English', updated_at = now() WHERE code = 'en';
UPDATE languages SET name = 'Spanish', updated_at = now() WHERE code = 'es';
UPDATE languages SET name = 'French', updated_at = now() WHERE code = 'fr';
UPDATE languages SET name = 'Hindi', updated_at = now() WHERE code = 'hi';
UPDATE languages SET name = 'Indonesian', updated_at = now() WHERE code = 'id';
UPDATE languages SET name = 'Italian', updated_at = now() WHERE code = 'it';
UPDATE languages SET name = 'Japanese', updated_at = now() WHERE code = 'ja';
UPDATE languages SET name = 'Korean', updated_at = now() WHERE code = 'ko';
UPDATE languages SET name = 'Portuguese', updated_at = now() WHERE code = 'pt';
UPDATE languages SET name = 'Russian', updated_at = now() WHERE code = 'ru';
UPDATE languages SET name = 'Thai', updated_at = now() WHERE code = 'th';
UPDATE languages SET name = 'Vietnamese', updated_at = now() WHERE code = 'vi';
UPDATE languages SET name = 'Chinese', updated_at = now() WHERE code = 'zh';

-- 更新後のデータを確認
SELECT id, name, code FROM languages ORDER BY code;
