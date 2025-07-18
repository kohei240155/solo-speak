# 本番環境の環境変数設定ガイド

## 環境ファイルの設定

### 1. テンプレートファイルをコピー
```bash
# 本番環境用
cp .env.production.template .env.production

# 開発環境用（必要に応じて）
cp .env.local.template .env.local
```

### 2. 実際の値を設定
作成した `.env.production` ファイルに実際のSupabaseの値を設定してください。

## Vercel ダッシュボードでの設定手順

1. Vercel ダッシュボード (https://vercel.com/dashboard) にアクセス
2. プロジェクト `solo-speak` を選択
3. "Settings" タブをクリック
4. "Environment Variables" セクションを確認

## 必要な環境変数

### データベース接続
```
DATABASE_URL=[Vercelダッシュボードで設定]
DIRECT_URL=[Vercelダッシュボードで設定]
```

### Supabase設定（新しいAPI Keys方式）
```
NEXT_PUBLIC_SUPABASE_URL=https://wswukmshauusgvklfwzv.supabase.co
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=[新しいPublishable keyをVercelダッシュボードで設定]
SUPABASE_SECRET_KEY=[新しいSecret keyをVercelダッシュボードで設定]
```

### 後方互換性（古い方式も一時的にサポート）
```
NEXT_PUBLIC_SUPABASE_ANON_KEY=[古い方式 - 将来削除予定]
SUPABASE_SERVICE_ROLE_KEY=[古い方式 - 将来削除予定]
```

### サイトURL
```
NEXT_PUBLIC_SITE_URL=https://your-production-domain.com
```

## 確認事項

- [ ] 全ての環境変数が "Production" 環境に設定されているか
- [ ] DATABASE_URL と DIRECT_URL が本番データベースを指しているか
- [ ] Supabase の URL とキーが本番プロジェクトのものか
- [ ] NEXT_PUBLIC_SITE_URL が本番ドメインを指しているか

## トラブルシューティング

### 症状1: 「データベースに接続できない」
- DATABASE_URL と DIRECT_URL を確認
- Supabase プロジェクトの接続設定を確認
- パスワードの特殊文字がURLエンコードされているか確認

### 症状2: 「認証エラー」
- NEXT_PUBLIC_SUPABASE_URL が正しく設定されているか
- SUPABASE_SERVICE_ROLE_KEY が正しく設定されているか

### 症状3: 「ユーザーデータが表示されない」
- ユーザーテーブルが存在するか確認
- RLS (Row Level Security) の設定を確認
