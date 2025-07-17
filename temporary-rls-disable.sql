-- 一時的な解決策：RLSを無効化（開発用のみ）
-- 注意: 本番環境では絶対に使用しないでください

-- 1. 現在のRLS状態を確認
SELECT schemaname, tablename, rowsecurity 
FROM pg_tables 
WHERE tablename = 'objects' AND schemaname = 'storage';

-- 2. RLSを無効化
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 3. 開発完了後、RLSを再有効化
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- 4. 有効化後は以下のポリシーを適用
-- CREATE POLICY "Authenticated users can manage images"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'images')
-- WITH CHECK (bucket_id = 'images');
