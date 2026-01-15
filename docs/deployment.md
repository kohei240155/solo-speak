# デプロイメントガイド

## 概要

Solo SpeakはVercelにデプロイされています。

- **本番環境**: https://solo-speak.vercel.app
- **GitHub**: https://github.com/kohei240155/solo-speak

## Vercelデプロイ

### 初回セットアップ

1. [Vercel](https://vercel.com/) にログイン
2. **New Project** をクリック
3. GitHubリポジトリをインポート
4. 環境変数を設定
5. デプロイ

### 環境変数の設定

Vercel Dashboard > Project > Settings > Environment Variables

| 変数名 | 説明 | 取得場所 |
|--------|------|----------|
| `DATABASE_URL` | PostgreSQL接続URL（プーリング経由） | Supabase Dashboard > Settings > Database > Connection string (Transaction) |
| `DIRECT_URL` | PostgreSQL直接接続URL（マイグレーション用） | Supabase Dashboard > Settings > Database > Connection string (Session) |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase URL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase Dashboard > Settings > API |
| `OPENAI_API_KEY` | OpenAI APIキー | OpenAI Platform > API Keys |
| `GOOGLE_CLOUD_PROJECT_ID` | GCPプロジェクトID | Google Cloud Console > プロジェクト設定 |
| `GOOGLE_CLOUD_PRIVATE_KEY` | GCPサービスアカウント秘密鍵 | サービスアカウントJSONの `private_key` |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | GCPサービスアカウントメール | サービスアカウントJSONの `client_email` |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー | Stripe Dashboard > Developers > API keys |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー | Stripe Dashboard > Developers > API keys |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook署名シークレット | Stripe Dashboard > Developers > Webhooks > エンドポイント詳細 |
| `NEXT_PUBLIC_APP_URL` | 本番環境URL | `https://solo-speak.vercel.app` |

> **Note**: `DATABASE_URL` と `DIRECT_URL` の違いについて詳しくは [docs/setup.md](setup.md#環境変数) を参照。

### 自動デプロイ

`main` ブランチへのプッシュで自動デプロイが実行されます。

```
main ブランチ → 本番環境
```

### プレビューデプロイ

PRを作成すると、プレビュー環境が自動生成されます。

## データベース（本番）

### Supabase PostgreSQL

1. [Supabase Dashboard](https://supabase.com/dashboard) でプロジェクトを選択
2. **Settings > Database** から接続情報を取得
3. Vercelの環境変数に設定

### マイグレーション・シード

本番環境へのマイグレーション・シード投入コマンドは [docs/setup.md](setup.md#本番環境コマンド要注意) を参照してください。

> **Warning**: 本番環境への操作は慎重に行ってください。実行前に必ずユーザーに確認を取ること。

## Supabase設定

### Authentication

1. **Authentication > Providers** で Google OAuth を有効化
2. **Site URL** を本番URLに設定
3. **Redirect URLs** に本番URLを追加

### Storage

1. **Storage** で `audio-files` バケットを作成
2. ポリシーを設定（認証ユーザーのみアクセス可能）

```sql
-- Storage ポリシー例
CREATE POLICY "Users can upload audio files"
ON storage.objects
FOR INSERT
WITH CHECK (bucket_id = 'audio-files' AND auth.role() = 'authenticated');
```

## Stripe設定

### Webhook

1. [Stripe Dashboard](https://dashboard.stripe.com/) > **Developers > Webhooks**
2. **Add endpoint** をクリック
3. エンドポイントURL: `https://solo-speak.vercel.app/api/stripe/webhook`
4. イベントを選択:
   - `checkout.session.completed`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
5. 署名シークレットをVercel環境変数に設定

## Google Cloud設定

### Text-to-Speech API

1. [Google Cloud Console](https://console.cloud.google.com/)
2. **APIs & Services > Enable APIs** で Text-to-Speech API を有効化
3. **IAM & Admin > Service Accounts** でサービスアカウントを作成
4. JSONキーを生成してダウンロード
5. 環境変数に設定:
   - `GOOGLE_CLOUD_PROJECT_ID`
   - `GOOGLE_CLOUD_PRIVATE_KEY`
   - `GOOGLE_CLOUD_CLIENT_EMAIL`

## ビルドコマンド

Vercelのビルド設定:

| 設定 | 値 |
|------|-----|
| Build Command | `npm run build` |
| Output Directory | `.next` |
| Install Command | `npm install --legacy-peer-deps` |

## 監視・ログ

### Vercel Analytics

Vercel Dashboard > Project > Analytics

### ログ確認

Vercel Dashboard > Project > Deployments > ログアイコン

### エラー追跡

Vercel Dashboard > Project > Functions > エラーログ

### Vercel CLI（オプション）

CLIでの操作も可能です（要インストール: `npm i -g vercel`）：

| コマンド | 説明 |
|----------|------|
| `vercel logs solo-speak` | 最新のログを表示 |
| `vercel env pull .env.local` | 環境変数をローカルにダウンロード |
| `vercel --prod` | 本番環境にデプロイ |

詳細: [Vercel CLI Documentation](https://vercel.com/docs/cli)

## トラブルシューティング

### ビルドエラー

1. ローカルで `npm run build:production` を実行してエラーを確認
2. 環境変数が正しく設定されているか確認
3. 依存関係が正しくインストールされているか確認

### データベース接続エラー

1. `DATABASE_URL` が正しいか確認
2. Supabaseのプロジェクトがアクティブか確認
3. IP制限がないか確認

### API エラー

1. Vercelのファンクションログを確認
2. 環境変数が設定されているか確認
3. 外部サービス（OpenAI、Google Cloud等）のクォータを確認

## ロールバック

### Vercelでのロールバック

1. Vercel Dashboard > Project > Deployments
2. ロールバック先のデプロイを選択
3. **...** メニュー > **Promote to Production**

### データベースのロールバック

Prismaのマイグレーションをリセットする場合は `prisma migrate reset` を使用します。

> **Danger**: このコマンドは**すべてのデータが削除**されます。本番環境での実行は原則禁止です。詳細は [Prisma公式ドキュメント](https://www.prisma.io/docs/orm/prisma-migrate/workflows/development-and-production) を参照。

## 本番デプロイチェックリスト

- [ ] ローカルでビルドが成功する
- [ ] lint エラーがない
- [ ] 環境変数が正しく設定されている
- [ ] データベースマイグレーションが完了している
- [ ] 外部サービスのAPIキーが有効
- [ ] Stripe Webhookが設定されている
- [ ] Supabase認証が設定されている
