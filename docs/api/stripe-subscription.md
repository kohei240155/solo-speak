# Stripe Subscription API

## 概要
ユーザーのStripeサブスクリプション情報を取得するAPIエンドポイント。

## エンドポイント
`GET /api/stripe/subscription`

## 認証
必要

## リクエスト
クエリパラメータやリクエストボディは不要。

## レスポンス

### Stripe顧客が存在する場合 (200 OK)
```typescript
interface SubscriptionResponse {
  hasStripeCustomer: true;
  subscription: {
    isActive: boolean;           // サブスクリプションが有効か
    subscriptionId?: string;     // サブスクリプションID（有効な場合）
    status?: string;             // Stripeステータス（active, canceled等）
    currentPeriodEnd?: string;   // 現在の期間終了日（ISO 8601形式）
  };
  serverTime: Date;              // サーバー時刻
  serverTimezone: string;        // サーバータイムゾーン
}
```

### Stripe顧客が存在しない場合 (200 OK)
```typescript
interface SubscriptionResponse {
  hasStripeCustomer: false;
  subscription: {
    isActive: false;
  };
  serverTime: Date;
  serverTimezone: string;
}
```

### エラー時

**404 Not Found**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Internal server error"
}
```

## 機能詳細

### サブスクリプション状態
- ユーザーの `stripeCustomerId` からサブスクリプション情報を取得
- Stripe APIを呼び出して最新の状態を確認

### Stripeステータス
- `active`: アクティブなサブスクリプション
- `canceled`: キャンセル済み
- `past_due`: 支払い遅延
- `unpaid`: 未払い
- `incomplete`: 未完了

### サーバー時刻情報
データベースの現在時刻とタイムゾーンを返す：
- デバッグ用
- クライアントとのタイムゾーン差異を確認

## 使用例

### 基本的な使用
```typescript
async function getSubscriptionStatus() {
  try {
    const response = await fetch('/api/stripe/subscription', {
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      
      if (data.hasStripeCustomer) {
        if (data.subscription.isActive) {
          console.log('サブスクリプション有効');
          console.log('終了日:', data.subscription.currentPeriodEnd);
        } else {
          console.log('サブスクリプション無効');
        }
      } else {
        console.log('Stripe顧客未登録');
      }
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}
```

### React コンポーネントでの使用
```typescript
function SubscriptionStatus() {
  const [subscription, setSubscription] = useState(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSubscription();
  }, []);
  
  const fetchSubscription = async () => {
    try {
      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      
      const data = await response.json();
      setSubscription(data);
    } catch (error) {
      console.error('Failed to fetch subscription:', error);
    } finally {
      setLoading(false);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  if (!subscription?.hasStripeCustomer) {
    return (
      <div>
        <p>サブスクリプション未登録</p>
        <button onClick={handleSubscribe}>登録する</button>
      </div>
    );
  }
  
  if (subscription.subscription.isActive) {
    return (
      <div>
        <p>✓ サブスクリプション有効</p>
        <p>次回更新日: {new Date(subscription.subscription.currentPeriodEnd).toLocaleDateString()}</p>
        <button onClick={handleCancel}>キャンセル</button>
      </div>
    );
  }
  
  return (
    <div>
      <p>サブスクリプション無効</p>
      <button onClick={handleSubscribe}>再登録する</button>
    </div>
  );
}
```

### 期間終了日の表示
```typescript
function SubscriptionInfo({ subscription }) {
  if (!subscription.isActive) return null;
  
  const endDate = new Date(subscription.currentPeriodEnd);
  const now = new Date();
  const daysLeft = Math.ceil((endDate - now) / (1000 * 60 * 60 * 24));
  
  return (
    <div>
      <p>サブスクリプション状態: {subscription.status}</p>
      <p>次回更新日: {endDate.toLocaleDateString('ja-JP')}</p>
      <p>残り日数: {daysLeft}日</p>
    </div>
  );
}
```

### 機能制限の実装
```typescript
async function checkFeatureAccess(feature: string) {
  const response = await fetch('/api/stripe/subscription', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const data = await response.json();
  
  // サブスクリプションが有効でない場合は制限
  if (!data.subscription?.isActive) {
    if (feature === 'ai-generation') {
      alert('AI生成機能はサブスクリプション登録が必要です');
      return false;
    }
  }
  
  return true;
}
```

### 自動更新チェック
```typescript
function useSubscriptionStatus() {
  const [status, setStatus] = useState(null);
  
  useEffect(() => {
    const fetchStatus = async () => {
      const response = await fetch('/api/stripe/subscription', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      const data = await response.json();
      setStatus(data);
    };
    
    // 初回取得
    fetchStatus();
    
    // 5分ごとに更新
    const interval = setInterval(fetchStatus, 5 * 60 * 1000);
    
    return () => clearInterval(interval);
  }, []);
  
  return status;
}
```

## サブスクリプション状態の判定

### アクティブ判定
以下の条件をすべて満たす場合に `isActive: true`:
- `stripeCustomerId` が存在
- Stripeにサブスクリプションが存在
- ステータスが `active`
- キャンセル予定ではない（`cancel_at_period_end: false`）

### 期限切れの扱い
- `currentPeriodEnd` を過ぎると自動的に `isActive: false`
- Webhook で状態更新

## デバッグ情報
レスポンスに含まれるサーバー情報：
```json
{
  "serverTime": "2024-01-15T12:34:56.789Z",
  "serverTimezone": "UTC"
}
```

この情報は以下の目的で使用：
- クライアント・サーバー間の時刻のずれ確認
- タイムゾーン問題のデバッグ
- 期間終了日の正確な計算

## パフォーマンス
- Stripe APIの呼び出しはキャッシュされない（常に最新情報）
- 頻繁な呼び出しを避けるため、クライアント側でキャッシュ推奨

## 関連ヘルパー関数
- `getUserSubscriptionStatus` (`@/utils/stripe-helpers`)

## 関連エンドポイント
- `POST /api/stripe/checkout` - サブスクリプション登録
- `POST /api/stripe/cancel` - サブスクリプションキャンセル
- `POST /api/stripe/webhook` - Stripe Webhook（状態更新）

## 関連型定義
- `SubscriptionResponse` (内部型)
