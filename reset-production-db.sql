-- 本番環境データベースのリセットスクリプト
-- 警告: このスクリプトは全てのデータを削除します
-- 実行前に必ずバックアップを取得してください

-- 1. 全てのテーブルのデータを削除（外部キー制約の順序を考慮）
DELETE FROM speak_logs;
DELETE FROM phrases;
DELETE FROM users;
DELETE FROM phrase_levels;
DELETE FROM languages;

-- 2. シーケンスをリセット（必要に応じて）
-- ALTER SEQUENCE IF EXISTS languages_id_seq RESTART WITH 1;
-- ALTER SEQUENCE IF EXISTS phrase_levels_id_seq RESTART WITH 1;

-- 確認メッセージ
SELECT 'All tables have been cleared' as status;
