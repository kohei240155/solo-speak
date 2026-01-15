# GET /api/phrase/quiz

クイズ出題用のフレーズリストを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/quiz` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/quiz/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | Yes | - | 言語コード（例: "en"） |
| mode | string | Yes | - | "normal" または "random" |
| count | number | - | 10 | 出題数 |
| speakCountFilter | number | - | - | 指定回数以上の音読済みフレーズのみ |
| excludeTodayQuizzed | boolean | - | false | 今日出題済みのフレーズを除外 |

**例:**

```
GET /api/phrase/quiz?language=en&mode=normal&count=5
GET /api/phrase/quiz?language=en&mode=random&count=10&excludeTodayQuizzed=true
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface QuizPhrasesResponse {
  success: true;
  phrases: QuizPhrase[];
  totalCount: number;           // 返されたフレーズ数
  availablePhraseCount: number; // 登録されている全フレーズ数
}

interface QuizPhrase {
  id: string;
  original: string;
  translation: string;
  languageCode: string;
  correctQuizCount: number;
  totalSpeakCount: number;
}
```

**例:**

```json
{
  "success": true,
  "phrases": [
    {
      "id": "cm1abc123",
      "original": "How are you doing?",
      "translation": "調子はどう？",
      "languageCode": "en",
      "correctQuizCount": 2,
      "totalSpeakCount": 10
    },
    {
      "id": "cm1abc124",
      "original": "Nice to meet you",
      "translation": "初めまして",
      "languageCode": "en",
      "correctQuizCount": 0,
      "totalSpeakCount": 5
    }
  ],
  "totalCount": 2,
  "availablePhraseCount": 50
}
```

### フレーズがない場合 (200 OK)

```json
{
  "success": false,
  "message": "No phrases found for the specified language: en"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語またはモードパラメータが不正 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### モード

#### normal モード

優先度に基づいてフレーズを選択：
1. **正解数が少ない順**（苦手なフレーズを優先）
2. **登録日時が古い順**（同じ正解数の場合）

```typescript
sortedPhrases.sort((a, b) => {
  if (correctA !== correctB) {
    return correctA - correctB; // 正解数が少ない順
  }
  return dateA - dateB; // 古い順
});
```

#### random モード

Fisher-Yatesシャッフルアルゴリズムでランダムに選択

### フィルタリング条件

| 条件 | 説明 |
|------|------|
| userId | 認証されたユーザーのフレーズのみ |
| language.code | 指定された言語のフレーズのみ |
| deletedAt: null | 削除されていないフレーズのみ |
| speechId: null | スピーチに紐づいていないフレーズのみ |
| totalSpeakCount >= N | `speakCountFilter=N` の場合 |
| lastQuizDate < today | `excludeTodayQuizzed=true` の場合 |

### 今日出題済み除外ロジック

```typescript
// UTC基準で今日の開始時刻
const todayStartUTC = new Date();
todayStartUTC.setUTCHours(0, 0, 0, 0);

// 今日出題済みを除外
...(excludeTodayQuizzed && {
  OR: [
    { lastQuizDate: null },           // 一度も出題されていない
    { lastQuizDate: { lt: todayStartUTC } }, // 前日以前
  ],
}),
```

### 出題数

- リクエストされた `count` と利用可能なフレーズ数の小さい方を返す
- 最大でも全フレーズ数を超えない

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(
  '/api/phrase/quiz?language=en&mode=normal&count=10',
  {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }
);

const data = await response.json();

if (data.success) {
  startQuiz(data.phrases);
} else {
  alert(data.message);
}
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- 回答API: `src/app/api/phrase/quiz/answer/route.ts`
