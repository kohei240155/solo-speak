# GET /api/speech/review

復習用スピーチを1件取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/review` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/review/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| languageCode | string | Yes | - | 言語コード（例: "en"） |
| speakCountFilter | string | - | - | "lessPractice" or "lowStatus" |
| excludeTodayPracticed | boolean | - | true | 今日練習済みを除外 |

**例:**

```
GET /api/speech/review?languageCode=en&speakCountFilter=lessPractice
GET /api/speech/review?languageCode=en&excludeTodayPracticed=false
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechReviewResponseData {
  success: true;
  speech: {
    id: string;
    title: string;
    practiceCount: number;
    status: { id: string; name: string; };
    nativeLanguage: { id: string; code: string; name: string; };
    learningLanguage: { id: string; code: string; name: string; };
    firstSpeechText: string;
    audioFilePath: string | null;  // 署名付きURL
    notes: string | null;
    lastPracticedAt: string | null;
    createdAt: string;
    phrases: Array<{
      id: string;
      original: string;
      translation: string;
      speechOrder: number;
    }>;
    feedbacks: Array<{
      id: string;
      category: string;
      content: string;
      createdAt: string;
    }>;
  } | null;  // スピーチがない場合はnull
}
```

**例（スピーチあり）:**

```json
{
  "success": true,
  "speech": {
    "id": "cm1abc123",
    "title": "自己紹介",
    "practiceCount": 2,
    "status": { "id": "status_1", "name": "B" },
    "nativeLanguage": { "id": "lang_ja", "code": "ja", "name": "Japanese" },
    "learningLanguage": { "id": "lang_en", "code": "en", "name": "English" },
    "firstSpeechText": "Hello...",
    "audioFilePath": "https://...",
    "notes": null,
    "lastPracticedAt": "2024-01-14T10:30:00.000Z",
    "createdAt": "2024-01-10T09:00:00.000Z",
    "phrases": [...],
    "feedbacks": [...]
  }
}
```

**例（スピーチなし）:**

```json
{
  "success": true,
  "speech": null
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語コードが必要、またはフィルター値が不正 |
| 401 | 認証エラー |
| 404 | 言語が見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### ソートモード

#### デフォルト

作成日時の昇順（古い順）

#### lessPractice モード

1. 練習回数の昇順（少ない順）
2. 作成日時の昇順（古い順）

#### lowStatus モード

1. ステータス名の昇順（A → B → C → D）
2. 作成日時の昇順（古い順）

### フィルタリング条件

| 条件 | 説明 |
|------|------|
| userId | 認証されたユーザーのスピーチのみ |
| learningLanguageId | 指定された言語のスピーチのみ |
| deletedAt: null | 削除されていないスピーチのみ |
| lastPracticedAt | 今日練習済みを除外（デフォルト） |

### 今日練習済み除外ロジック

```typescript
if (excludeTodayPracticed) {
  whereConditions.OR = [
    { lastPracticedAt: null },            // 一度も練習していない
    { lastPracticedAt: { lt: todayStart } },  // 今日より前
    { lastPracticedAt: { gte: todayEnd } },   // 明日以降（念のため）
  ];
}
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- カウント取得: `src/app/api/speech/review/count/route.ts`
