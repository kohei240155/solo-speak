-- Supabase Storage用のRLSポリシー設定
-- これらのSQLコマンドをSupabaseのSQL Editorで実行してください

-- 重要: Supabase DashboardのStorageセクションからポリシーを設定するか、
-- 以下のような適切な権限で実行する必要があります

-- 方法1: Supabase Dashboard経由での設定（推奨）
-- 1. Supabase Dashboard > Storage > Settings > Policies
-- 2. "New Policy"をクリック
-- 3. 以下の設定を適用：
--    - Policy Name: "Allow authenticated users to manage images"
--    - Allowed operations: INSERT, UPDATE, DELETE, SELECT
--    - Target roles: authenticated
--    - USING expression: bucket_id = 'images'
--    - WITH CHECK expression: bucket_id = 'images'

-- 方法2: 適切な権限でのSQL実行
-- 以下のコマンドはSupabaseサービスロールキーが必要です
-- 方法2: 適切な権限でのSQL実行
-- 以下のコマンドはSupabaseサービスロールキーが必要です

-- バケットの設定確認
SELECT * FROM storage.buckets WHERE name = 'images';

-- 既存のポリシーを確認
SELECT * FROM storage.policies WHERE bucket_id = 'images';

-- 1. 開発用：最もシンプルなアプローチ
-- Supabase Dashboard > Storage > Settings で RLS を一時的に無効化

-- 2. ポリシーベースのアプローチ（Dashboard経由で設定）
-- 以下の設定をDashboardのStorage > Policiesで作成：

/*
Policy Name: "Allow authenticated users to upload images"
Operation: INSERT
Target Role: authenticated
USING: bucket_id = 'images'
WITH CHECK: bucket_id = 'images'
*/

/*
Policy Name: "Allow authenticated users to update images"
Operation: UPDATE
Target Role: authenticated
USING: bucket_id = 'images'
WITH CHECK: bucket_id = 'images'
*/

/*
Policy Name: "Allow authenticated users to delete images"
Operation: DELETE
Target Role: authenticated
USING: bucket_id = 'images'
*/

/*
Policy Name: "Allow public to view images"
Operation: SELECT
Target Role: public
USING: bucket_id = 'images'
*/
