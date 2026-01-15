# POST /api/stripe/checkout

Stripe Checkoutセッションを作成します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/stripe/checkout` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/stripe/checkout/route.ts` |
| 外部サービス | Stripe API |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### ボディ

不要

## レスポンス

### 成功時 (200 OK)

```typescript
interface CheckoutResponse {
  checkoutUrl: string;  // Stripe CheckoutページのURL
}
```

**例:**

```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_xxxxxxxxxxxxxxxx"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | ユーザーが見つからない |
| 500 | Stripe設定未完了、またはセッション作成失敗 |

**例（設定未完了）:**

```json
{
  "error": "Stripe configuration not complete"
}
```

**例（作成失敗）:**

```json
{
  "error": "Failed to create checkout session"
}
```

## 実装詳細

### 処理フロー

1. ユーザー情報を取得
2. Stripe顧客が存在しない場合は新規作成
3. Checkoutセッションを作成
4. CheckoutページのURLを返却

### Stripe顧客の作成

```typescript
if (!stripeCustomerId) {
  stripeCustomerId = await createStripeCustomer(user.email, userId);

  // データベースに保存
  await prisma.user.update({
    where: { id: userId },
    data: { stripeCustomerId },
  });
}
```

### リダイレクトURL

| 結果 | リダイレクト先 |
|------|--------------|
| 成功 | `/settings?tab=subscription&success=true` |
| キャンセル | `/settings?tab=subscription&canceled=true` |

### 環境変数

- `STRIPE_PRICE_ID`: サブスクリプションの価格ID
- `NEXT_PUBLIC_SITE_URL`: サイトURL（リダイレクト用）

## 使用例

```typescript
// フロントエンドでの使用例
const handleSubscribe = async () => {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const { checkoutUrl } = await response.json();

  // Stripe Checkoutページにリダイレクト
  window.location.href = checkoutUrl;
};
```

## 関連ファイル

- Stripeヘルパー: `src/utils/stripe-helpers.ts`
