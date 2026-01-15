# GET /api/ranking/speech

スピーチ練習（Review）回数のランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/speech` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/speech/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | No | "en" | 言語コード |
| period | string | No | "total" | 期間（daily, weekly, total） |

**例:**

```
GET /api/ranking/speech?language=en&period=weekly
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;  // 練習回数
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
      "username": "SpeechPro",
      "iconUrl": "https://example.com/icon.png",
      "count": 200
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "Reviewer",
      "iconUrl": null,
      "count": 150
    }
  ],
  "currentUser": {
    "rank": 6,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "count": 50
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

| period | 対象期間 | フィルタ条件 |
|--------|---------|-------------|
| daily | 今日のみ | `lastPracticedAt >= 今日の0:00` |
| weekly | 過去7日間 | `lastPracticedAt >= 7日前` |
| total | 全期間 | フィルタなし |

### データソース

Speechテーブルの`practiceCount`フィールドを集計：
- 各スピーチの練習回数を合計
- 削除されていないスピーチのみ対象
- 練習回数が0のユーザーは除外

### ランキングソート

1. 練習回数の降順でソート
2. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

## 関連ファイル

- 型定義: `src/types/ranking.ts`
