# User Reset Daily Speak Count API

## 概要
ユーザーの1日ごとの音読練習回数をリセットするAPIエンドポイント。UTC基準で日付が変わった場合に自動リセットします。

## エンドポイント
`POST /api/user/reset-daily-speak-count`

## 認証
必要

## リクエスト
リクエストボディは不要。

## レスポンス

### 成功時 (200 OK)
```typescript
interface UserDailyResetResponse {
  success: true;
  reset: boolean;               // リセットが実行されたか
  message: string;              // リセット結果メッセージ
  count: number;                // リセットされたフレーズ数
  lastDailySpeakCountResetDate: Date | null; // 最後のリセット日時
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

### リセット条件
以下のいずれかに該当する場合にリセット実行：

1. **初回アクセス**: `lastDailySpeakCountResetDate` が null
2. **日付変更**: 最後のリセット日が今日より前（UTC基準）

### リセット処理
リセット条件に該当する場合、以下を実行：
1. ユーザーの全フレーズの `dailySpeakCount` を0にリセット
2. `lastDailySpeakCountResetDate` を現在時刻に更新

### UTC基準の日付比較
- すべての日付計算はUTC基準
- タイムゾーンに依存しない一貫した動作を保証
- 日付のみで比較（時刻は無視）

### レスポンスパターン

#### リセット実行時
```json
{
  "success": true,
  "reset": true,
  "message": "Reset dailySpeakCount for 50 phrases",
  "count": 50,
  "lastDailySpeakCountResetDate": "2024-01-15T12:34:56.789Z"
}
```

#### リセット不要時
```json
{
  "success": true,
  "reset": false,
  "message": "No reset needed - already practiced today",
  "count": 0,
  "lastDailySpeakCountResetDate": "2024-01-15T08:00:00.000Z"
}
```

## 使用タイミング
- アプリ起動時
- ダッシュボード表示時
- 音読練習開始前
- 日付が変わった可能性がある時

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/user/reset-daily-speak-count', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});

const data = await response.json();

if (data.success && data.reset) {
  console.log(`${data.count}個のフレーズをリセットしました`);
} else {
  console.log('今日は既に練習しています');
}
```

### アプリ起動時のチェック
```typescript
async function initializeApp() {
  // 日次カウントリセットチェック
  const resetResponse = await fetch('/api/user/reset-daily-speak-count', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer YOUR_TOKEN'
    }
  });
  
  const resetData = await resetResponse.json();
  
  if (resetData.reset) {
    console.log('新しい日が始まりました！');
    // 通知やメッセージを表示
  }
  
  // アプリの初期化を続行...
}
```

### React コンポーネントでの使用
```typescript
function useDailyReset() {
  useEffect(() => {
    const checkAndReset = async () => {
      try {
        const response = await fetch('/api/user/reset-daily-speak-count', {
          method: 'POST',
          headers: {
            'Authorization': 'Bearer YOUR_TOKEN'
          }
        });
        
        const data = await response.json();
        
        if (data.success && data.reset) {
          // リセット後の処理
          console.log('Daily count has been reset');
          // UI更新などの処理
        }
      } catch (error) {
        console.error('Failed to check daily reset:', error);
      }
    };
    
    checkAndReset();
  }, []);
}
```

### 定期チェックの実装
```typescript
function useDailyResetChecker() {
  useEffect(() => {
    const checkReset = async () => {
      const response = await fetch('/api/user/reset-daily-speak-count', {
        method: 'POST',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      const data = await response.json();
      return data.reset;
    };
    
    // 初回チェック
    checkReset();
    
    // 1時間ごとにチェック
    const interval = setInterval(async () => {
      const wasReset = await checkReset();
      if (wasReset) {
        // リセット通知
        alert('新しい日が始まりました！今日も頑張りましょう！');
      }
    }, 60 * 60 * 1000); // 1時間
    
    return () => clearInterval(interval);
  }, []);
}
```

## 日次リセットの仕組み

### データベース構造
- `User.lastDailySpeakCountResetDate`: 最後にリセットした日時
- `Phrase.dailySpeakCount`: 今日の音読回数（リセット対象）
- `Phrase.totalSpeakCount`: 総音読回数（リセットされない）

### リセットフロー
```
1. APIコール
   ↓
2. UTC基準で日付を比較
   ↓
3. リセット必要？
   ↓ Yes
4. すべてのフレーズのdailySpeakCountを0に
   ↓
5. lastDailySpeakCountResetDateを更新
   ↓
6. reset: true を返す
```

## 注意事項
- このエンドポイントは冪等性がある（何度呼んでも安全）
- リセット済みの場合は `reset: false` を返すだけ
- データベース更新はリセット必要時のみ
- UTC基準なので、ローカルタイムゾーンの0時とは異なる場合がある

## パフォーマンス
- リセット不要時はデータベース更新なし
- 一括更新（`updateMany`）でパフォーマンス最適化
- 削除されていないフレーズのみ対象

## 関連エンドポイント
- `POST /api/phrase/[id]/count` - 音読回数更新（dailySpeakCount を増やす）
- `GET /api/dashboard` - ダッシュボード（dailySpeakCount を表示）

## 関連型定義
- `UserDailyResetResponse` (`@/types/user`)
- `ApiErrorResponse` (`@/types/api`)
