## Supabase Storage バケット作成手順

### 方法1: Supabase Dashboard（手動）

1. **Supabase Dashboard** にログイン
2. **Storage** セクションに移動
3. **"New bucket"** をクリック
4. 以下の設定を入力：
   - **Name**: `images`
   - **Public**: ✅ チェック
   - **File size limit**: `5242880` (5MB)
   - **Allowed MIME types**: `image/jpeg,image/png,image/gif,image/webp`
5. **"Create bucket"** をクリック

### 方法2: SQL経由（上級者向け）

Supabase SQL Editorで以下を実行：

```sql
-- バケットを作成
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'images',
  'images',
  true,
  5242880,
  ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']
);
```

### 方法3: コード（現在の実装）

アプリケーション起動時に `createStorageBucket()` が自動実行されます。

### 確認方法

1. **Supabase Dashboard** > **Storage**
2. `images` バケットが表示されているか確認
3. コンソールログで「Images bucket created successfully」または「Images bucket already exists」を確認

### トラブルシューティング

- **権限エラー**: RLSポリシーを確認
- **認証エラー**: ユーザーがログイン済みか確認
- **重複エラー**: 既に存在する場合は正常（エラーではない）

### 注意事項

- バケット名は一意である必要があります
- 公開設定により、URLでの直接アクセスが可能になります
- ファイルサイズとMIMEタイプの制限が適用されます
