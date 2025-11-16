# User Withdrawal API

## 概要
ユーザーアカウントとすべての関連データを完全に削除（物理削除）するAPIエンドポイント。

## エンドポイント
`DELETE /api/user/withdrawal`

## 認証
必要

## リクエスト
リクエストボディは不要。

## レスポンス

### 成功時 (200 OK)
```json
{
  "success": true
}
```

### エラー時
```json
{
  "error": "エラーメッセージ"
}
```

**エラーコード:**
- `401` - 認証失敗
- `500` - サーバーエラー

## 機能詳細

### 削除されるデータ
以下のデータがすべて **物理削除** されます（ソフトデリートではない）：

1. **SpeakLog**: ユーザーのフレーズに関連する音読ログ
2. **QuizResult**: ユーザーのフレーズに関連するクイズ結果
3. **Phrase**: ユーザーが作成したすべてのフレーズ
4. **Situation**: ユーザーが作成したすべてのシチュエーション
5. **User**: ユーザーアカウント本体
6. **アイコン画像**: Supabase Storage のアイコンファイル

### トランザクション処理
すべての削除操作は単一トランザクションで実行され、データの整合性を保証します。

### 削除順序
リレーションシップを考慮した順序で削除：
```
SpeakLog → QuizResult → Phrase → Situation → User
```

### アイコン画像の削除
- Supabase Storage に保存されたアイコンのみ削除対象
- Google URLのアイコンは削除しない
- ストレージ削除エラーは退会処理を中断しない

## 警告
⚠️ **この操作は取り消せません**
- すべてのデータが完全に削除されます
- フレーズ、学習履歴、設定などは復元できません
- 実行前にユーザーに十分な警告を表示してください

## 使用例

### 基本的な使用
```typescript
async function withdrawAccount() {
  // ユーザーに確認
  const confirmed = confirm(
    'アカウントを削除すると、すべてのデータが完全に削除され、復元できません。本当に削除しますか？'
  );
  
  if (!confirmed) return;
  
  try {
    const response = await fetch('/api/user/withdrawal', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    if (response.ok) {
      // ログアウト処理
      // ログインページにリダイレクト
      window.location.href = '/';
    } else {
      const error = await response.json();
      console.error('退会処理に失敗しました:', error.error);
    }
  } catch (error) {
    console.error('エラー:', error);
  }
}
```

### 確認ダイアログ付き実装
```typescript
function WithdrawalConfirmation() {
  const [step, setStep] = useState(1);
  const [confirmText, setConfirmText] = useState('');
  
  const handleWithdraw = async () => {
    try {
      const response = await fetch('/api/user/withdrawal', {
        method: 'DELETE',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      
      if (response.ok) {
        // ログアウト
        await logout();
        // トップページへリダイレクト
        window.location.href = '/';
      } else {
        alert('退会処理に失敗しました');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('エラーが発生しました');
    }
  };
  
  if (step === 1) {
    return (
      <div>
        <h2>アカウント削除の確認</h2>
        <div className="warning">
          <p>⚠️ 以下のデータがすべて削除されます：</p>
          <ul>
            <li>作成したすべてのフレーズ</li>
            <li>学習履歴（音読記録、クイズ結果）</li>
            <li>シチュエーション</li>
            <li>ユーザー設定</li>
            <li>アイコン画像</li>
          </ul>
          <p><strong>この操作は取り消せません。</strong></p>
        </div>
        <button onClick={() => setStep(2)}>次へ</button>
      </div>
    );
  }
  
  if (step === 2) {
    return (
      <div>
        <h2>最終確認</h2>
        <p>アカウントを削除するには、「削除する」と入力してください。</p>
        <input
          type="text"
          value={confirmText}
          onChange={(e) => setConfirmText(e.target.value)}
          placeholder="削除する"
        />
        <button
          onClick={handleWithdraw}
          disabled={confirmText !== '削除する'}
        >
          アカウントを削除
        </button>
        <button onClick={() => setStep(1)}>戻る</button>
      </div>
    );
  }
  
  return null;
}
```

### サブスクリプション確認付き実装
```typescript
async function withdrawAccountWithSubscriptionCheck() {
  // サブスクリプション状態を確認
  const subResponse = await fetch('/api/stripe/subscription', {
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  const subData = await subResponse.json();
  
  if (subData.subscription?.isActive) {
    const confirmCancel = confirm(
      'アクティブなサブスクリプションがあります。退会前にキャンセルしますか？'
    );
    
    if (confirmCancel) {
      // サブスクリプションキャンセル
      await fetch('/api/stripe/cancel', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
    }
  }
  
  // 退会処理続行
  const finalConfirm = confirm(
    'アカウントを削除すると、すべてのデータが完全に削除されます。本当によろしいですか？'
  );
  
  if (finalConfirm) {
    await fetch('/api/user/withdrawal', {
      method: 'DELETE',
      headers: {
        'Authorization': 'Bearer YOUR_TOKEN'
      }
    });
    
    // ログアウト処理
    window.location.href = '/';
  }
}
```

## セキュリティ
- ユーザーは自分のアカウントのみ削除可能
- 認証必須
- トランザクション処理でデータの整合性を保証

## データ保護
- ストレージからもアイコンを削除
- データベースからすべての関連データを削除
- 第三者がデータにアクセスできないよう完全削除

## 実装推奨事項

### ユーザー確認
1. 警告メッセージを明確に表示
2. 複数ステップの確認プロセス
3. テキスト入力による最終確認
4. サブスクリプション状態の確認

### エラーハンドリング
- トランザクション失敗時のロールバック
- ストレージ削除失敗は退会処理を中断しない
- エラーログの記録

### 退会後の処理
- セッションのクリア
- ローカルストレージのクリア
- ログインページへリダイレクト

## 関連エンドポイント
- `GET /api/stripe/subscription` - サブスクリプション状態確認
- `POST /api/stripe/cancel` - サブスクリプションキャンセル

## 関連ユーティリティ
- `authenticateRequest` (`@/utils/api-helpers`)
- `createServerSupabaseClient` (`@/utils/supabase-server`)
