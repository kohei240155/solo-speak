# GET /api/ranking/practice

Practiceランキングを取得（正解数ベース）

## 認証

必須

## Query Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| language | string | Yes | 言語コード（例: "en", "ja"） |
| period | "daily" \| "weekly" \| "total" | Yes | 期間 |

## Response

### 成功時 (200 OK)

```json
{
  "success": true,
  "rankings": [
    {
      "rank": 1,
      "userId": "user-123",
      "username": "Alice",
      "iconUrl": "https://example.com/icon.png",
      "count": 50,
      "createdAt": "2025-01-01T00:00:00.000Z"
    },
    {
      "rank": 2,
      "userId": "user-456",
      "username": "Bob",
      "iconUrl": null,
      "count": 45,
      "createdAt": "2025-02-01T00:00:00.000Z"
    }
  ],
  "userRanking": {
    "rank": 3,
    "count": 42
  }
}
```

| フィールド | 型 | 説明 |
|----------|-----|------|
| success | boolean | 処理成功フラグ |
| rankings | array | Top 10のランキングデータ |
| rankings[].rank | number | 順位（1-10） |
| rankings[].userId | string | ユーザーID |
| rankings[].username | string | ユーザー名 |
| rankings[].iconUrl | string \| null | アイコンURL |
| rankings[].count | number | 正解数 |
| rankings[].createdAt | string | ユーザー登録日時 |
| userRanking | object \| null | 現在ユーザーの順位（10位圏外の場合も含む） |
| userRanking.rank | number | 順位 |
| userRanking.count | number | 正解数 |

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | パラメータ不正（language/period未指定） |
| 401 | 認証エラー |
| 404 | 言語が存在しない |
| 500 | サーバーエラー |

## ビジネスロジック

### 期間の定義

- **daily**: 今日のUTC 00:00以降
- **weekly**: 今週のUTC月曜日 00:00以降
- **total**: 全期間

### ランキングルール

- `PracticeLog` の `correct=true` の件数でランキング
- 指定された言語のフレーズに対する正解のみカウント
- 同点の場合は登録日が早いユーザーが上位
- Top 10のみ返却

### 現在ユーザーの順位

- 10位圏内の場合: `rankings` 配列に含まれる
- 10位圏外の場合: `userRanking` で順位と正解数を返却
- 正解がない場合: `userRanking` は `null`

## 参照

- 実装: `src/app/api/ranking/practice/route.ts`
- 型定義: `src/types/practice.ts`
