# Stripe Webhook API

## 概要
Stripeからのイベント通知を受信し、サブスクリプション状態を自動更新するWebhookエンドポイント。

## エンドポイント
`POST /api/stripe/webhook`

## 認証
Stripe署名検証（`stripe-signature` ヘッダー）

## リクエスト
Stripeが自動的に送信するWebhookイベント。

### ヘッダー
- `stripe-signature`: Stripeの署名（必須）

### ボディ
Stripeイベントデータ（JSON）

## レスポンス

### 成功時 (200 OK)
```json
{
  "received": true
}
```

### エラー時

**400 Bad Request - 署名検証失敗**
```json
{
  "error": "Invalid signature"
}
```

**500 Internal Server Error**
```json
{
  "error": "Webhook handler failed"
}
```

## 処理されるイベント

### 1. checkout.session.completed
チェックアウトセッションが完了した時。

**処理内容:**
- サブスクリプションモードの場合のみ処理
- フレーズ生成回数を5回にリセット

```typescript
{
  remainingPhraseGenerations: 5 // ベーシックプランの初期値
}
```

### 2. customer.subscription.created
サブスクリプションが作成された時。

**処理内容:**
- フレーズ生成回数を5回にリセット

### 3. customer.subscription.updated
サブスクリプションが更新された時。

**処理内容:**
- ステータスが `canceled` の場合、生成回数を0にリセット
- `cancel_at_period_end: true` の場合も生成回数を0にリセット

```typescript
if (subscription.status === 'canceled' || subscription.cancel_at_period_end) {
  remainingPhraseGenerations: 0
}
```

### 4. customer.subscription.deleted
サブスクリプションが削除された時。

**処理内容:**
- フレーズ生成回数を0にリセット

### 5. invoice.payment_succeeded
請求の支払いが成功した時（月次更新）。

**処理内容:**
- フレーズ生成回数を100回にリセット

```typescript
{
  remainingPhraseGenerations: 100 // ベーシックプランの月次リセット
}
```

### 6. invoice.payment_failed
請求の支払いが失敗した時。

**処理内容:**
- 現在は特別な処理なし
- 将来的に通知などの実装可能

## 環境変数
- `STRIPE_SECRET_KEY`: Stripe シークレットキー（必須）
- `STRIPE_WEBHOOK_SECRET`: Webhook署名シークレット（必須）

## セットアップ

### Stripeダッシュボードでの設定
1. **開発者** → **Webhook** に移動
2. **エンドポイントを追加** をクリック
3. **エンドポイントURL**: `https://yourdomain.com/api/stripe/webhook`
4. **リッスンするイベント** を選択：
   - `checkout.session.completed`
   - `customer.subscription.created`
   - `customer.subscription.updated`
   - `customer.subscription.deleted`
   - `invoice.payment_succeeded`
   - `invoice.payment_failed`
5. 署名シークレットをコピーして環境変数に設定

### ローカル開発
Stripe CLIを使用してWebhookをテスト：

```bash
# Stripe CLIをインストール
brew install stripe/stripe-cli/stripe

# ログイン
stripe login

# Webhookを転送
stripe listen --forward-to localhost:3000/api/stripe/webhook

# テストイベントを送信
stripe trigger checkout.session.completed
```

## Webhook フロー

```
1. Stripeでイベント発生
   ↓
2. Stripeが /api/stripe/webhook にPOST
   ↓
3. 署名を検証
   ↓
4. イベントタイプを判定
   ↓
5. 対応するハンドラー関数を実行
   ↓
6. データベースを更新
   ↓
7. { received: true } を返す
```

## デバッグ

### ログの確認
```typescript
console.log('Webhook event:', event.type);
console.log('Customer:', event.data.object.customer);
```

### Stripeダッシュボード
- **開発者** → **Webhook** でイベント履歴を確認
- 各イベントのペイロードとレスポンスを確認可能

### エラーハンドリング
```typescript
try {
  event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
} catch (err) {
  console.error('Webhook signature verification failed:', err.message);
  return NextResponse.json({ error: 'Invalid signature' }, { status: 400 });
}
```

## セキュリティ

### 署名検証
すべてのWebhookリクエストで署名を検証：
```typescript
const sig = headersList.get('stripe-signature');
const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

### HTTPS必須
本番環境ではHTTPSが必須（Stripeの要件）

### IPホワイトリスト
StripeのWebhook IPアドレスのみ許可することを推奨

## トラブルシューティング

### Webhookが届かない
1. エンドポイントURLが正しいか確認
2. HTTPSが有効か確認
3. Stripeダッシュボードでイベント履歴を確認

### 署名検証失敗
1. `STRIPE_WEBHOOK_SECRET` が正しいか確認
2. リクエストボディを改変していないか確認
3. ヘッダーが正しく渡されているか確認

### データベース更新されない
1. `stripeCustomerId` が正しく保存されているか確認
2. ユーザーが存在するか確認
3. ログでエラーを確認

## イベント処理の優先順位

1. **checkout.session.completed**: 初回登録
2. **customer.subscription.created**: サブスクリプション開始
3. **invoice.payment_succeeded**: 月次更新（100回にリセット）
4. **customer.subscription.updated**: ステータス変更
5. **customer.subscription.deleted**: サブスクリプション終了

## 残り生成回数の管理

| イベント | 生成回数 | 説明 |
|---------|---------|------|
| checkout.session.completed | 5 | 初回登録時 |
| customer.subscription.created | 5 | サブスクリプション開始 |
| invoice.payment_succeeded | 100 | 月次更新時 |
| customer.subscription.updated (cancel) | 0 | キャンセル時 |
| customer.subscription.deleted | 0 | 削除時 |

## 関連型定義
- Stripe SDK の型定義を使用

## 関連エンドポイント
- `POST /api/stripe/checkout` - サブスクリプション登録
- `GET /api/stripe/subscription` - サブスクリプション情報取得
- `POST /api/stripe/cancel` - サブスクリプションキャンセル
- `GET /api/phrase/remaining` - 残り生成回数取得
