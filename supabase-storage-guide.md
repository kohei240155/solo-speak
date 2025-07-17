// Supabase Storage RLS 設定ガイド

# 解決方法1: Supabase Dashboard経由（推奨）

## 手順：
1. Supabase Dashboard にログイン
2. プロジェクトを選択
3. Storage > Settings に移動
4. "Row Level Security" セクションを確認

## 設定A: RLSを一時的に無効化（開発用）
- "Enable RLS" をオフに切り替え
- 警告が表示されるが、開発中は問題なし

## 設定B: ポリシーを作成（本番用）
1. Storage > Policies に移動
2. "New Policy" をクリック
3. 以下の設定を作成：

### ポリシー1: 認証ユーザーのアップロード許可
- Policy Name: "Allow authenticated users to upload images"
- Operation: INSERT
- Target Role: authenticated
- USING: bucket_id = 'images'
- WITH CHECK: bucket_id = 'images'

### ポリシー2: 認証ユーザーの更新許可
- Policy Name: "Allow authenticated users to update images"
- Operation: UPDATE
- Target Role: authenticated
- USING: bucket_id = 'images'
- WITH CHECK: bucket_id = 'images'

### ポリシー3: 認証ユーザーの削除許可
- Policy Name: "Allow authenticated users to delete images"
- Operation: DELETE
- Target Role: authenticated
- USING: bucket_id = 'images'

### ポリシー4: 公開読み取り許可
- Policy Name: "Allow public to view images"
- Operation: SELECT
- Target Role: public
- USING: bucket_id = 'images'

# 解決方法2: 一時的な回避策

## アプリケーション側での対応
1. 画像アップロードをサーバーサイドで処理
2. サービスロールキーを使用したアップロード
3. 一時的にRLSを無効化

## 推奨される緊急対応
1. Supabase Dashboard > Storage > Settings
2. "Row Level Security" を一時的に無効化
3. 開発完了後、適切なポリシーを設定して再有効化

# 注意事項
- 本番環境では必ずRLSを有効化
- 開発中の一時的な無効化は問題なし
- ポリシーの設定はDashboard経由が最も確実
