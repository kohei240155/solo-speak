# GET /api/phrase/practice/stats

現在のユーザーの練習統計を取得

## 認証

必須

## Query Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| languageId | string | Yes | 学習言語ID |

## Response

### 成功時 (200 OK)

```json
{
  "success": true,
  "dailyCorrectCount": 5,
  "totalCorrectCount": 42,
  "weeklyRank": 3,
  "totalRank": 7
}
```

| フィールド | 型 | 説明 |
|----------|-----|------|
| success | boolean | 処理成功フラグ |
| dailyCorrectCount | number | 今日の正解数（ユーザーのタイムゾーン基準） |
| totalCorrectCount | number | 累計正解数 |
| weeklyRank | number | 今週の順位（UTC月曜日開始） |
| totalRank | number | 累計順位 |

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | パラメータ不正（languageId未指定） |
| 401 | 認証エラー |
| 500 | サーバーエラー |

## ビジネスロジック

### 日付計算

- `dailyCorrectCount`: ユーザーの `timezone` 設定に基づいて「今日」を判定
- `weeklyRank`: UTC基準で月曜日00:00から日曜日23:59までを「今週」として計算

### ランキング計算

- 言語別に `PracticeLog` の `correct=true` の件数で順位を計算
- 同点の場合は登録日が早いユーザーが上位

## 参照

- 実装: `src/app/api/phrase/practice/stats/route.ts`
- タイムゾーンユーティリティ: `src/utils/timezone.ts`
