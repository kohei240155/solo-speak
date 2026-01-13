# POST /api/stripe/webhook

Stripe Webhookイベントを処理します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/stripe/webhook` |
| メソッド | `POST` |
| 認証 | Stripe署名検証 |
| ファイル | `src/app/api/stripe/webhook/route.ts` |
| 外部サービス | Stripe API |

## リクエスト

### ヘッダー

```
stripe-signature: t=1234567890,v1=xxxxxxxx...
Content-Type: application/json
```

### ボディ

Stripeからのイベントペイロード（JSON形式）

## レスポンス

### 成功時 (200 OK)

```typescript
interface WebhookResponse {
  received: true;
}
```

**例:**

```json
{
  "received": true
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 署名が無効 |
| 500 | Webhookハンドラー失敗 |

**例（署名無効）:**

```json
{
  "error": "Invalid signature"
}
```

## 対応イベント

| イベント | 処理内容 |
|---------|---------|
| `checkout.session.completed` | チェックアウト完了時の処理 |
| `customer.subscription.created` | サブスクリプション作成時 |
| `customer.subscription.updated` | サブスクリプション更新時 |
| `customer.subscription.deleted` | サブスクリプション削除時 |
| `invoice.payment_succeeded` | 支払い成功時 |
| `invoice.payment_failed` | 支払い失敗時 |

## イベント処理詳細

### checkout.session.completed

チェックアウト完了時に `remainingPhraseGenerations` を初期値（5）に設定。

### customer.subscription.created

サブスクリプション作成時に `remainingPhraseGenerations` を初期値（5）に設定。

### customer.subscription.updated

サブスクリプションがキャンセルされた場合、`remainingPhraseGenerations` を0にリセット。

```typescript
if (subscription.status === "canceled" || subscription.cancel_at_period_end) {
  await prisma.user.update({
    where: { id: user.id },
    data: { remainingPhraseGenerations: 0 },
  });
}
```

### customer.subscription.deleted

サブスクリプション削除時に `remainingPhraseGenerations` を0にリセット。

### invoice.payment_succeeded

月次支払い成功時に `remainingPhraseGenerations` を月次リセット値（100）に更新。

```typescript
await prisma.user.update({
  where: { id: user.id },
  data: { remainingPhraseGenerations: 100 },
});
```

### invoice.payment_failed

支払い失敗時の処理（現在は何もしない）。

## 署名検証

```typescript
const event = stripe.webhooks.constructEvent(body, sig, endpointSecret);
```

Stripeの署名を検証し、リクエストが正当なものであることを確認。

## 環境変数

- `STRIPE_SECRET_KEY`: Stripe秘密キー
- `STRIPE_WEBHOOK_SECRET`: Webhook署名シークレット

## Stripe Dashboard設定

1. Stripe Dashboard → Developers → Webhooks
2. エンドポイントURLを追加: `https://your-domain.com/api/stripe/webhook`
3. 対象イベントを選択
4. Webhook Signing Secretを環境変数に設定

## 関連ファイル

- 型定義: Stripe SDKの型を使用
