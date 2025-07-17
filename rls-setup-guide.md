## Supabase Storage RLS 設定手順

### 1. 最も簡単な方法（推奨）

1. **Supabase Dashboard** にログイン
2. **Storage** セクションに移動
3. **Settings** タブをクリック
4. **Row Level Security (RLS)** セクションを見つける
5. **"Enable RLS"** を **オフ** にする（開発中のみ）

### 2. ポリシー設定方法（本番環境用）

**Storage** > **Policies** で以下のポリシーを作成：

#### INSERT ポリシー
```
Policy Name: Allow authenticated users to upload images
Operation: INSERT
Target Role: authenticated
USING: bucket_id = 'images'
WITH CHECK: bucket_id = 'images'
```

#### UPDATE ポリシー
```
Policy Name: Allow authenticated users to update images
Operation: UPDATE
Target Role: authenticated
USING: bucket_id = 'images'
WITH CHECK: bucket_id = 'images'
```

#### DELETE ポリシー
```
Policy Name: Allow authenticated users to delete images
Operation: DELETE
Target Role: authenticated
USING: bucket_id = 'images'
```

#### SELECT ポリシー
```
Policy Name: Allow public to view images
Operation: SELECT
Target Role: public
USING: bucket_id = 'images'
```

### 3. 確認手順

1. 上記のポリシーを設定
2. アプリケーションを再起動
3. 画像アップロードをテスト
4. コンソールログでエラーを確認

### 4. 注意事項

- **開発中**: RLSを無効にするのが最も簡単
- **本番環境**: 必ずRLSを有効にしてポリシーを設定
- **テスト**: 認証済みユーザーでテストを実行
