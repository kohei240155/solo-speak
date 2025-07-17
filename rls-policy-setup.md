## Supabase Storage RLS ポリシー設定（詳細手順）

### 手順1: Supabase Dashboard でポリシーを作成

1. **Supabase Dashboard** > **Storage** > **Policies**
2. **New Policy** をクリック
3. 以下の4つのポリシーを順番に作成：

#### ポリシー1: アップロード許可
```
Policy Name: Allow authenticated users to upload images
Operation: INSERT
Target Role: authenticated
Policy Definition:
  USING expression: bucket_id = 'images'
  WITH CHECK expression: bucket_id = 'images'
```

#### ポリシー2: 更新許可
```
Policy Name: Allow authenticated users to update images
Operation: UPDATE
Target Role: authenticated
Policy Definition:
  USING expression: bucket_id = 'images'
  WITH CHECK expression: bucket_id = 'images'
```

#### ポリシー3: 削除許可
```
Policy Name: Allow authenticated users to delete images
Operation: DELETE
Target Role: authenticated
Policy Definition:
  USING expression: bucket_id = 'images'
```

#### ポリシー4: 公開読み取り許可
```
Policy Name: Allow public to view images
Operation: SELECT
Target Role: public
Policy Definition:
  USING expression: bucket_id = 'images'
```

### 手順2: SQL Editor でポリシーを作成（代替方法）

```sql
-- INSERT ポリシー
CREATE POLICY "Allow authenticated users to upload images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'images');

-- UPDATE ポリシー
CREATE POLICY "Allow authenticated users to update images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'images')
WITH CHECK (bucket_id = 'images');

-- DELETE ポリシー
CREATE POLICY "Allow authenticated users to delete images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'images');

-- SELECT ポリシー
CREATE POLICY "Allow public to view images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'images');
```

### 手順3: 確認とテスト

1. ポリシーが正しく作成されているか確認
2. アプリケーションを再起動
3. 画像アップロードをテスト

### 推奨：開発中はRLS無効化

開発中は **RLS を無効化** することを強く推奨します：
- 設定が簡単
- エラーが発生しない
- 本番環境でポリシーを設定すれば十分

### 注意事項

- 本番環境では必ずRLSを有効化してください
- ポリシーの設定は慎重に行ってください
- 認証済みユーザーのみアクセス可能にする設定を推奨
