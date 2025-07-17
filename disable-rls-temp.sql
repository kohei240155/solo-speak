-- 開発用：RLSを一時的に無効にする（本番環境では推奨されません）
-- Supabase Dashboard > Storage > Settings で実行

-- RLSを無効にする（開発・テスト用）
ALTER TABLE storage.objects DISABLE ROW LEVEL SECURITY;
ALTER TABLE storage.buckets DISABLE ROW LEVEL SECURITY;

-- 再度有効にする場合（本番環境用）
-- ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;

-- または、より安全なアプローチ：認証済みユーザーのみアクセス可能
-- CREATE POLICY "Authenticated users can upload images"
-- ON storage.objects
-- FOR ALL
-- TO authenticated
-- USING (bucket_id = 'images')
-- WITH CHECK (bucket_id = 'images');
