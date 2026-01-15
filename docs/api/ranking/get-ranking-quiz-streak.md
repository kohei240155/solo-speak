# GET /api/ranking/quiz/streak

クイズのStreak（連続日数）ランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/quiz/streak` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/quiz/streak/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | No | "en" | 言語コード |

**例:**

```
GET /api/ranking/quiz/streak?language=en
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface QuizStreakRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    streakDays: number;  // 連続日数
  }>;
  currentUser: {
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    streakDays: number;
  } | null;
}
```

**例:**

```json
{
  "success": true,
  "topUsers": [
    {
      "rank": 1,
      "userId": "user_123",
      "username": "StreakMaster",
      "iconUrl": "https://example.com/icon.png",
      "streakDays": 30
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "DailyLearner",
      "iconUrl": null,
      "streakDays": 25
    }
  ],
  "currentUser": {
    "rank": 8,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "streakDays": 7
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語が見つからない |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### Streak計算

`calculateStreak()` 関数を使用して連続日数を計算：
- 今日または昨日から遡って連続している日数をカウント
- Streakが0のユーザーはランキングから除外

### ランキングソート

1. Streak日数の降順でソート
2. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

## 関連ファイル

- 型定義: `src/types/ranking.ts`
- Streak計算: `src/utils/streak-calculator.ts`
