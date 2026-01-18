# POST /api/phrase/practice/answer

練習回答を送信し、判定結果を取得

## 認証

必須

## Request Body

```json
{
  "phraseId": "phrase-123",
  "transcript": "Hello how are you",
  "mode": "normal"
}
```

| フィールド | 型 | 必須 | 説明 |
|----------|-----|------|------|
| phraseId | string | Yes | フレーズID |
| transcript | string | Yes | 音声認識テキスト |
| mode | "normal" \| "review" | Yes | 練習モード |

## Response

### 成功時 (200 OK)

```json
{
  "success": true,
  "correct": true,
  "similarity": 0.95,
  "expectedText": "Hello, how are you?",
  "diffResult": [
    { "type": "equal", "value": "Hello" },
    { "type": "delete", "value": ", " },
    { "type": "equal", "value": "how are you" },
    { "type": "delete", "value": "?" }
  ],
  "newCorrectCount": 3,
  "isMastered": false
}
```

| フィールド | 型 | 説明 |
|----------|-----|------|
| success | boolean | 処理成功フラグ |
| correct | boolean | 正解判定（similarity >= 0.9） |
| similarity | number | 一致率（0.0-1.0） |
| expectedText | string | 正解テキスト |
| diffResult | array | 差分情報（UI表示用） |
| diffResult[].type | "equal" \| "insert" \| "delete" | 差分タイプ |
| diffResult[].value | string | テキスト |
| newCorrectCount | number | 更新後の正解回数 |
| isMastered | boolean | マスター達成フラグ（correctCount >= 5） |

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | パラメータ不正 |
| 401 | 認証エラー |
| 403 | アクセス権限なし（他ユーザーのフレーズ） |
| 404 | フレーズが存在しない |
| 500 | サーバーエラー |

## ビジネスロジック

### 判定ルール

- 一致率（Levenshtein距離ベース）が **90%以上** で正解
- 大文字小文字、句読点、空白は正規化して比較

### カウント更新ルール

- **正解の場合**: 今日まだ正解していなければ `practiceCorrectCount` を+1（最大5）
- **不正解の場合**: `practiceIncorrectCount` を+1

### 差分計算

言語に応じて単語単位/文字単位を自動切り替え：
- **単語単位**: 英語、韓国語、欧州言語など
- **文字単位**: 日本語、中国語、タイ語

### ログ記録

`PracticeLog` テーブルに以下を記録：
- `phraseId`, `userId`, `correct`, `similarity`, `transcript`, `practiceDate`

## 参照

- 実装: `src/app/api/phrase/practice/answer/route.ts`
- 型定義: `src/types/practice.ts`
- 一致度計算: `src/utils/similarity.ts`
- 差分計算: `src/utils/diff.ts`
- 定数: `PRACTICE_SIMILARITY_THRESHOLD=0.9`, `PRACTICE_MASTERY_COUNT=5`
