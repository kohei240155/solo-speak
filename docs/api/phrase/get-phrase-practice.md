# GET /api/phrase/practice

練習対象フレーズを取得

## 認証

必須

## Query Parameters

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| languageId | string | Yes | 学習言語ID |
| mode | "normal" \| "review" | Yes | 練習モード（normal: 未マスター、review: マスター済み） |
| questionCount | number | No | 出題数（0=全て、未指定=5） |

## Response

### 成功時 (200 OK)

```json
{
  "success": true,
  "phrases": [
    {
      "id": "phrase-123",
      "original": "Hello, how are you?",
      "translation": "こんにちは、お元気ですか？",
      "practiceCorrectCount": 2,
      "createdAt": "2026-01-17T00:00:00.000Z"
    }
  ],
  "totalCount": 10
}
```

| フィールド | 型 | 説明 |
|----------|-----|------|
| success | boolean | 処理成功フラグ |
| phrases | array | 練習対象フレーズの配列 |
| phrases[].id | string | フレーズID |
| phrases[].original | string | 学習言語のテキスト |
| phrases[].translation | string | 母国語の翻訳 |
| phrases[].practiceCorrectCount | number | 正解回数（0-5） |
| phrases[].createdAt | string | 作成日時（ISO 8601） |
| totalCount | number | 全体の対象フレーズ数 |

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | パラメータ不正（languageId/mode未指定） |
| 401 | 認証エラー |
| 404 | 言語が存在しない / ユーザーが存在しない |
| 500 | サーバーエラー |

## ビジネスロジック

### モード別のフィルタリング

- **normal**: `practiceCorrectCount < 5`（未マスター）
- **review**: `practiceCorrectCount >= 5`（マスター済み）

### 除外条件

- 今日すでに正解したフレーズは除外
- `practiceIncludeExisting=false` の場合、`practiceStartDate` より前に作成されたフレーズは除外
- Speech機能で追加されたフレーズ（`speechId`がnullでないもの）は除外

### ソート順

登録日時が古い順（`createdAt ASC`）

## 参照

- 実装: `src/app/api/phrase/practice/route.ts`
- 型定義: `src/types/practice.ts`
- 定数: `PRACTICE_MASTERY_COUNT=5`, `PRACTICE_DEFAULT_SESSION_SIZE=5`
