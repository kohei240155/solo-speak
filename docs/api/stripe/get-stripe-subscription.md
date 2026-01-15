# GET /api/stripe/subscription

ユーザーのサブスクリプション情報を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/stripe/subscription` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/stripe/subscription/route.ts` |
| 外部サービス | Stripe API |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SubscriptionResponse {
  hasStripeCustomer: boolean;
  subscription: {
    isActive: boolean;
    subscriptionId?: string;
    status?: string;
    currentPeriodEnd?: string;  // ISO 8601形式
  };
  serverTime: string;      // サーバー時刻
  serverTimezone: string;  // サーバーのタイムゾーン
}
```

**例（Stripe顧客あり・アクティブ）:**

```json
{
  "hasStripeCustomer": true,
  "subscription": {
    "isActive": true,
    "subscriptionId": "sub_1234567890",
    "status": "active",
    "currentPeriodEnd": "2024-02-15T00:00:00.000Z"
  },
  "serverTime": "2024-01-15T10:30:00.000Z",
  "serverTimezone": "UTC"
}
```

**例（Stripe顧客なし）:**

```json
{
  "hasStripeCustomer": false,
  "subscription": {
    "isActive": false
  },
  "serverTime": "2024-01-15T10:30:00.000Z",
  "serverTimezone": "UTC"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | ユーザーが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### サブスクリプションステータス

`getUserSubscriptionStatus()` 関数で以下を取得：
- `isActive`: サブスクリプションが有効かどうか
- `subscriptionId`: StripeサブスクリプションID
- `status`: サブスクリプションの状態
- `currentPeriodEnd`: 現在の請求期間の終了日

### サーバー時刻の取得

データベースから現在時刻とタイムゾーンを取得：

```typescript
const dbTimeResult = await prisma.$queryRaw<{ now: Date; timezone: string }[]>`
  SELECT NOW() as now, current_setting('TIMEZONE') as timezone
`;
```

## 使用例

```typescript
// フロントエンドでの使用例
const fetchSubscription = async () => {
  const response = await fetch('/api/stripe/subscription', {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.subscription.isActive) {
    console.log(`サブスクリプション有効 (${data.subscription.currentPeriodEnd}まで)`);
  } else {
    console.log('サブスクリプションなし');
  }
};
```

## 関連ファイル

- Stripeヘルパー: `src/utils/stripe-helpers.ts`
