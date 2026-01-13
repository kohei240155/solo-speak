# POST /api/user/reset-daily-speak-count

ユーザーの1日ごとの音読練習回数をリセットします。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/reset-daily-speak-count` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/reset-daily-speak-count/route.ts` |

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
interface UserDailyResetResponse {
  success: true;
  reset: boolean;              // リセットが実行されたかどうか
  message: string;             // 結果メッセージ
  count: number;               // リセットされたフレーズ数
  lastDailySpeakCountResetDate: Date | null;  // 前回のリセット日時
}
```

**例（リセット実行時）:**

```json
{
  "success": true,
  "reset": true,
  "message": "Reset dailySpeakCount for 50 phrases",
  "count": 50,
  "lastDailySpeakCountResetDate": "2024-01-14T00:00:00.000Z"
}
```

**例（リセット不要時）:**

```json
{
  "success": true,
  "reset": false,
  "message": "No reset needed - already practiced today",
  "count": 0,
  "lastDailySpeakCountResetDate": "2024-01-15T08:00:00.000Z"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | ユーザーが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### リセット判定（UTC基準）

1. 現在の日付をUTC基準で取得
2. `lastDailySpeakCountResetDate` が存在しない場合: リセット実行
3. `lastDailySpeakCountResetDate` が今日より前の場合: リセット実行
4. それ以外: リセット不要

### リセット処理

1. ユーザーに紐づく全フレーズの `dailySpeakCount` を0に更新
2. ユーザーの `lastDailySpeakCountResetDate` を現在時刻に更新

```typescript
await prisma.phrase.updateMany({
  where: {
    userId: userId,
    deletedAt: null,
  },
  data: {
    dailySpeakCount: 0,
  },
});
```

### 使用タイミング

アプリ起動時やダッシュボード表示時に呼び出し、日付が変わった場合に自動的に音読カウントをリセット。

## 使用例

```typescript
// フロントエンドでの使用例（アプリ起動時）
const response = await fetch('/api/user/reset-daily-speak-count', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const result = await response.json();
if (result.reset) {
  console.log(`${result.count}件のフレーズをリセットしました`);
}
```

## 関連ファイル

- 型定義: `src/types/user.ts`
