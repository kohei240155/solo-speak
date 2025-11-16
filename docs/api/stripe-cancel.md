# Stripe Cancel API

## 概要
アクティブなStripeサブスクリプションをキャンセルするAPIエンドポイント。即座にキャンセルされ、AI生成機能へのアクセスも直ちに無効化されます。

## エンドポイント
`POST /api/stripe/cancel`

## 認証
必要

## リクエスト
リクエストボディは不要。

## レスポンス

### 成功時 (200 OK)
```json
{
  "success": true,
  "message": "Subscription canceled immediately. AI phrase generation access has been revoked."
}
```

### エラー時

**404 Not Found - Stripe顧客が見つからない**
```json
{
  "error": "No Stripe customer found"
}
```

**404 Not Found - アクティブなサブスクリプションがない**
```json
{
  "error": "No active subscription found"
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to cancel subscription"
}
```

## 機能詳細

### キャンセル処理
1. ユーザーの `stripeCustomerId` を確認
2. Stripeからサブスクリプション情報を取得
3. アクティブなサブスクリプションが存在するか確認
4. Stripeでサブスクリプションを即座にキャンセル
5. ユーザーの `remainingPhraseGenerations` を0にリセット

### 即時キャンセル
- 期間終了時ではなく、**即座にキャンセル**
- キャンセル後は直ちにサブスクリプション機能へのアクセスが無効化
- 返金は行われない（Stripeの設定による）

### AI生成機能の無効化
キャンセル時に以下を実行：
```sql
UPDATE users
SET remaining_phrase_generations = 0
WHERE id = user_id
```

これにより、AI生成機能が即座に使用不可になります。

## 使用例

### 基本的な使用
```typescript
async function cancelSubscription() {
  // ユーザーに確認
  const confirmed = confirm(
    'サブスクリプションをキャンセルしますか？AI生成機能へのアクセスが直ちに無効化されます。'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (response.ok) {
      const data = await response.json();
      alert(data.message);
      // サブスクリプション情報を再取得
      await fetchSubscriptionInfo();
    } else {
      const error = await response.json();
      alert(`エラー: ${error.error}`);
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}
```

### React コンポーネントでの使用
```typescript
function CancelSubscriptionButton() {
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  
  const handleCancel = async () => {
    setLoading(true);
    
    try {
      const response = await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        toast.success('サブスクリプションをキャンセルしました');
        setShowConfirm(false);
        // サブスクリプション情報を更新
        onSubscriptionUpdate();
      } else {
        const error = await response.json();
        toast.error(error.error);
      }
    } catch (error) {
      console.error('Error:', error);
      toast.error('エラーが発生しました');
    } finally {
      setLoading(false);
    }
  };
  
  if (showConfirm) {
    return (
      <div className="confirm-dialog">
        <h3>サブスクリプションのキャンセル</h3>
        <p>⚠️ キャンセルすると以下の制限があります：</p>
        <ul>
          <li>AI生成機能が使用できなくなります</li>
          <li>即座に適用されます</li>
          <li>既存のフレーズはそのまま残ります</li>
        </ul>
        <button onClick={handleCancel} disabled={loading}>
          {loading ? 'キャンセル中...' : 'キャンセルする'}
        </button>
        <button onClick={() => setShowConfirm(false)}>
          戻る
        </button>
      </div>
    );
  }
  
  return (
    <button onClick={() => setShowConfirm(true)}>
      サブスクリプションをキャンセル
    </button>
  );
}
```

### 詳細な確認ダイアログ
```typescript
function CancelSubscriptionDialog({ subscription, onClose, onSuccess }) {
  const [step, setStep] = useState(1);
  const [reason, setReason] = useState('');
  
  const handleSubmit = async () => {
    const response = await fetch('/api/stripe/cancel', {
      method: 'POST',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (response.ok) {
      onSuccess();
      onClose();
    }
  };
  
  if (step === 1) {
    return (
      <div>
        <h2>サブスクリプションのキャンセル</h2>
        <p>キャンセル理由を教えてください（任意）：</p>
        <select value={reason} onChange={(e) => setReason(e.target.value)}>
          <option value="">選択してください</option>
          <option value="expensive">料金が高い</option>
          <option value="not-using">使用していない</option>
          <option value="features">機能が不足</option>
          <option value="other">その他</option>
        </select>
        <button onClick={() => setStep(2)}>次へ</button>
      </div>
    );
  }
  
  if (step === 2) {
    const endDate = new Date(subscription.currentPeriodEnd);
    return (
      <div>
        <h2>最終確認</h2>
        <p>次回更新日: {endDate.toLocaleDateString()}</p>
        <p className="warning">
          ⚠️ キャンセルは即座に適用されます。
          返金は行われません。
        </p>
        <button onClick={handleSubmit}>
          キャンセルを確定
        </button>
        <button onClick={() => setStep(1)}>
          戻る
        </button>
      </div>
    );
  }
}
```

### キャンセル後の処理
```typescript
async function handleSubscriptionCanceled() {
  // サブスクリプション情報を再取得
  const subResponse = await fetch('/api/stripe/subscription', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const subData = await subResponse.json();
  
  // 残り生成回数を確認
  const remainingResponse = await fetch('/api/phrase/remaining', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const { remainingGenerations } = await remainingResponse.json();
  
  console.log('残り生成回数:', remainingGenerations); // 0になっているはず
  
  // UIを更新
  updateUI({
    showSubscribeButton: true,
    disableAIGeneration: true
  });
}
```

## キャンセルの種類

### 即時キャンセル（このAPI）
- 実行と同時にサブスクリプション終了
- AI生成機能が直ちに使用不可
- 返金なし

### 期間終了時キャンセル（未実装）
- 現在の期間終了時にキャンセル
- それまでは引き続き利用可能
- `cancel_at_period_end: true` を設定

## データベース更新
キャンセル時の更新内容：
```typescript
await prisma.user.update({
  where: { id: userId },
  data: {
    remainingPhraseGenerations: 0, // AI生成回数を0に
  },
});
```

## 注意事項
- **返金は行われません**（Stripeの設定による）
- 既存のフレーズやデータは削除されません
- AI生成機能のみが制限されます
- 再登録は `/api/stripe/checkout` から可能

## Webhookとの連携
キャンセル後、Stripe Webhookが以下のイベントを送信：
- `customer.subscription.deleted`
- `customer.subscription.updated`

Webhookハンドラー（`/api/stripe/webhook`）でも `remainingPhraseGenerations` を0に更新。

## セキュリティ
- ユーザーは自分のサブスクリプションのみキャンセル可能
- 認証必須
- Stripe APIで二重確認

## 関連ヘルパー関数
- `getUserSubscriptionStatus` (`@/utils/stripe-helpers`)
- `cancelSubscription` (`@/utils/stripe-helpers`)

## 関連エンドポイント
- `GET /api/stripe/subscription` - サブスクリプション情報取得
- `POST /api/stripe/checkout` - サブスクリプション再登録
- `POST /api/stripe/webhook` - Stripe Webhook
- `GET /api/phrase/remaining` - 残り生成回数確認
