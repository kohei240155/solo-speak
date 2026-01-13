# GET /api/ranking/quiz

クイズの正解数ランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/quiz` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/quiz/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | No | "en" | 言語コード |
| period | string | No | "daily" | 期間（daily, weekly, total） |

**例:**

```
GET /api/ranking/quiz?language=en&period=weekly
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface QuizRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;  // 正解数
  }>;
  currentUser: {
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;
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
      "username": "TopLearner",
      "iconUrl": "https://example.com/icon.png",
      "count": 150
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "StudyMaster",
      "iconUrl": null,
      "count": 120
    }
  ],
  "currentUser": {
    "rank": 5,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "count": 80
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

### 期間フィルタリング

| period | 対象期間 |
|--------|---------|
| daily | 今日のみ |
| weekly | 過去7日間 |
| total | 全期間 |

### ランキング計算

1. QuizResultから正解データを集計（`isCorrect: true`）
2. ユーザーごとの正解数をカウント
3. 正解数の降順でソート
4. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

## 関連ファイル

- 型定義: `src/types/ranking.ts`
