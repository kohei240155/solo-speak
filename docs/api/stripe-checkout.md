# Stripe Checkout API

## 概要
Stripe Checkoutセッションを作成し、サブスクリプション購入ページのURLを返すAPIエンドポイント。

## エンドポイント
`POST /api/stripe/checkout`

## 認証
必要

## リクエスト
リクエストボディは不要。

## レスポンス

### 成功時 (200 OK)
```json
{
  "checkoutUrl": "https://checkout.stripe.com/c/pay/cs_test_..."
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
  "error": "Stripe configuration not complete"
}
// または
{
  "error": "Failed to create checkout session"
}
```

## 機能詳細

### Stripe顧客管理
1. ユーザーの `stripeCustomerId` を確認
2. 存在しない場合、Stripe顧客を新規作成
3. 作成した顧客IDをデータベースに保存

### チェックアウトセッション
- Stripe Checkout を使用したホスティング型決済ページ
- サブスクリプション用の設定
- 成功・キャンセル時のリダイレクトURL設定

### リダイレクトURL
- **成功時**: `/settings?tab=subscription&success=true`
- **キャンセル時**: `/settings?tab=subscription&canceled=true`

## 環境変数
以下の環境変数が必要：
- `STRIPE_PRICE_ID`: Stripe価格ID（サブスクリプションプラン）
- `NEXT_PUBLIC_SITE_URL`: サイトのベースURL
- `STRIPE_SECRET_KEY`: Stripe シークレットキー

## 使用例

### 基本的な使用
```typescript
async function startSubscription() {
  try {
    const response = await fetch('/api/stripe/checkout', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (response.ok) {
      const { checkoutUrl } = await response.json();
      // Stripeの決済ページにリダイレクト
      window.location.href = checkoutUrl;
    } else {
      const error = await response.json();
      console.error('チェックアウトセッション作成失敗:', error.error);
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}
```

### React コンポーネントでの使用
```typescript
function SubscribeButton() {
  const [loading, setLoading] = useState(false);
  
  const handleSubscribe = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/checkout', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      
      if (response.ok) {
        const { checkoutUrl } = await response.json();
        // Stripeの決済ページにリダイレクト
        window.location.href = checkoutUrl;
      } else {
        const error = await response.json();
        alert(`エラー: ${error.error}`);
        setLoading(false);
      }
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
      setLoading(false);
    }
  };
  
  return (
    <button onClick={handleSubscribe} disabled={loading}>
      {loading ? '処理中...' : 'サブスクリプションを開始'}
    </button>
  );
}
```

### プラン情報表示付き
```typescript
function SubscriptionPlan() {
  return (
    <div className="plan-card">
      <h3>ベーシックプラン</h3>
      <p className="price">¥500/月</p>
      <ul>
        <li>✓ 毎日100フレーズ生成</li>
        <li>✓ すべての機能利用可能</li>
        <li>✓ 広告なし</li>
      </ul>
      <button onClick={handleSubscribe}>
        今すぐ登録
      </button>
    </div>
  );
}

async function handleSubscribe() {
  const response = await fetch('/api/stripe/checkout', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  if (response.ok) {
    const { checkoutUrl } = await response.json();
    window.location.href = checkoutUrl;
  }
}
```

### 決済完了後の処理
```typescript
// /settings ページ
function SubscriptionSettings() {
  const [searchParams] = useSearchParams();
  
  useEffect(() => {
    const success = searchParams.get('success');
    const canceled = searchParams.get('canceled');
    
    if (success === 'true') {
      // 成功メッセージを表示
      toast.success('サブスクリプションの登録が完了しました！');
      // サブスクリプション情報を再取得
      fetchSubscriptionInfo();
    } else if (canceled === 'true') {
      // キャンセルメッセージを表示
      toast.info('サブスクリプションの登録がキャンセルされました');
    }
  }, [searchParams]);
  
  // ...
}
```

## Stripe Checkout フロー

```
1. ユーザーが「登録」ボタンをクリック
   ↓
2. /api/stripe/checkout を呼び出し
   ↓
3. Stripe顧客を作成（未作成の場合）
   ↓
4. Checkoutセッションを作成
   ↓
5. Stripe決済ページにリダイレクト
   ↓
6. ユーザーが決済情報を入力
   ↓
7. 決済完了
   ↓
8. /settings?tab=subscription&success=true にリダイレクト
   ↓
9. Webhookでサブスクリプション状態を更新
```

## セキュリティ
- 認証必須
- Stripe APIキーは環境変数で管理
- 顧客IDはユーザーIDと紐付けて管理

## Stripe設定
1. Stripeダッシュボードで価格を作成
2. 価格IDを `STRIPE_PRICE_ID` に設定
3. Webhookエンドポイントを設定（`/api/stripe/webhook`）

## テストモード
- テストモードの価格IDを使用
- テストカード番号: `4242 4242 4242 4242`
- 有効期限: 未来の任意の日付
- CVC: 任意の3桁

## 関連ヘルパー関数
- `createStripeCustomer` (`@/utils/stripe-helpers`)
- `createCheckoutSession` (`@/utils/stripe-helpers`)

## 関連エンドポイント
- `GET /api/stripe/subscription` - サブスクリプション情報取得
- `POST /api/stripe/cancel` - サブスクリプションキャンセル
- `POST /api/stripe/webhook` - Stripe Webhook
