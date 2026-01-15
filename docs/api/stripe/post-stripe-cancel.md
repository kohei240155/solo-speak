# POST /api/stripe/cancel

サブスクリプションをキャンセルします。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/stripe/cancel` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/stripe/cancel/route.ts` |
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
interface CancelResponse {
  success: true;
  message: string;
}
```

**例:**

```json
{
  "success": true,
  "message": "Subscription canceled immediately. AI phrase generation access has been revoked."
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | Stripe顧客なし、またはアクティブなサブスクリプションなし |
| 500 | キャンセル処理失敗 |

**例（Stripe顧客なし）:**

```json
{
  "error": "No Stripe customer found"
}
```

**例（サブスクリプションなし）:**

```json
{
  "error": "No active subscription found"
}
```

## 実装詳細

### 処理フロー

1. ユーザーのStripe顧客IDを取得
2. サブスクリプション情報を確認
3. `cancelSubscription()` でStripeサブスクリプションをキャンセル
4. ユーザーの `remainingPhraseGenerations` を0にリセット

### キャンセル後の処理

```typescript
// サブスクリプションキャンセル時に残り生成回数を0にリセット
await prisma.user.update({
  where: { id: userId },
  data: {
    remainingPhraseGenerations: 0,
  },
});
```

### 注意事項

- キャンセルは即時有効
- AIフレーズ生成機能は即座に使用不可に

## 使用例

```typescript
// フロントエンドでの使用例
const handleCancel = async () => {
  if (!confirm('サブスクリプションをキャンセルしますか？')) {
    return;
  }

  const response = await fetch('/api/stripe/cancel', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    const { message } = await response.json();
    alert(message);
  }
};
```

## 関連ファイル

- Stripeヘルパー: `src/utils/stripe-helpers.ts`
