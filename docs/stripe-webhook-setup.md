# Stripe Webhook開発環境セットアップ

## Stripe CLIを使用した開発環境Webhook設定

### 1. Stripe CLIインストール

```bash
# Windows (Chocolatey)
choco install stripe-cli

# macOS (Homebrew)
brew install stripe/stripe-cli/stripe

# または、GitHubから直接ダウンロード
# https://github.com/stripe/stripe-cli/releases
```

### 2. Stripe CLIログイン

```bash
stripe login
```

ブラウザが開き、Stripeアカウントでの認証が求められます。

### 3. Webhookリッスン開始

```bash
stripe listen --forward-to localhost:3000/api/stripe/webhook
```

このコマンドを実行すると、以下のような出力が表示されます：

```
> Ready! Your webhook signing secret is whsec_1234567890abcdef...
```

### 4. 環境変数の更新

表示されたシークレットを `.env.local` に設定：

```bash
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
```

### 5. テストイベント送信

別のターミナルで：

```bash
# チェックアウトセッション完了をテスト
stripe trigger checkout.session.completed

# サブスクリプション作成をテスト
stripe trigger customer.subscription.created
```

## 本番環境での設定

### 1. Webhook エンドポイント作成

Stripe Dashboard → Developers → Webhooks → Add endpoint

- **URL**: `https://yourdomain.com/api/stripe/webhook`
- **Events**:
  - `checkout.session.completed`
  - `customer.subscription.created`
  - `customer.subscription.updated`
  - `customer.subscription.deleted`
  - `invoice.payment_succeeded`
  - `invoice.payment_failed`

### 2. 本番環境変数設定

```bash
STRIPE_WEBHOOK_SECRET=whsec_本番環境のシークレット
```

## トラブルシューティング

### Webhook署名検証エラー

```
Webhook signature verification failed
```

**対処法**:

1. STRIPE_WEBHOOK_SECRETが正しく設定されているか確認
2. Stripe CLIが実行中か確認
3. エンドポイントURLが正しいか確認

### イベント受信確認

ログで以下が表示されることを確認：

```
Received webhook event: checkout.session.completed
Received webhook event: customer.subscription.created
```
