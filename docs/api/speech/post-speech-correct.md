# POST /api/speech/correct

AIを使用してスピーチを添削します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/correct` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/correct/route.ts` |
| 使用モデル | GPT-5-mini |
| 1日の制限 | 1回 |
| 最大実行時間 | 90秒（Vercel） |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface CorrectSpeechRequest {
  title: string;               // 1-50文字
  speechPlanItems: string[];   // 1-5項目、各100文字以内
  transcribedText: string;     // 文字起こしテキスト
  learningLanguage: string;    // 学習言語名
  nativeLanguage: string;      // 母国語名
}
```

**例:**

```json
{
  "title": "自己紹介",
  "speechPlanItems": [
    "名前を言う",
    "職業を紹介する",
    "趣味を話す"
  ],
  "transcribedText": "Hello my name is John I work as engineer I like playing tennis",
  "learningLanguage": "English",
  "nativeLanguage": "Japanese"
}
```

### バリデーション（Zod）

```typescript
const correctSpeechSchema = z.object({
  title: z.string().min(1).max(50),
  speechPlanItems: z.array(z.string().max(100)).min(1).max(5),
  transcribedText: z.string().min(1),
  learningLanguage: z.string().min(1),
  nativeLanguage: z.string().min(1),
});
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechCorrectionResponse {
  sentences: Array<{
    learningLanguage: string;  // 添削後の学習言語文
    nativeLanguage: string;    // 母国語翻訳
  }>;
  feedback: Array<{
    category: string;  // Grammar, Vocabulary, Expression 等
    content: string;   // 改善点（母国語で記述）
  }>;
}
```

**例:**

```json
{
  "sentences": [
    {
      "learningLanguage": "Hello, my name is John.",
      "nativeLanguage": "こんにちは、私の名前はジョンです。"
    },
    {
      "learningLanguage": "I work as an engineer.",
      "nativeLanguage": "私はエンジニアとして働いています。"
    },
    {
      "learningLanguage": "I enjoy playing tennis.",
      "nativeLanguage": "私はテニスをするのが好きです。"
    }
  ],
  "feedback": [
    {
      "category": "文法",
      "content": "「work as engineer」は「work as an engineer」が正しいです。職業名の前に不定冠詞が必要です。"
    },
    {
      "category": "表現",
      "content": "「like playing」よりも「enjoy playing」の方が自然な表現です。"
    }
  ]
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 残り回数が0 |
| 404 | ユーザーが見つからない |
| 500 | OpenAI APIエラー |
| 504 | タイムアウト（80秒） |

## 実装詳細

### 回数制限

- 1日あたり1回まで添削可能
- `remainingSpeechCount` フィールドで管理
- 添削成功時に回数を1減らす（非同期で実行）

### OpenAI API連携

- **モデル**: `gpt-5-mini`
- **Max completion tokens**: 5000
- **タイムアウト**: 80秒
- **Structured Outputs**: Zodスキーマで形式を強制

### レスポンス形式（Structured Outputs）

```typescript
const speechCorrectionResponseSchema = z.object({
  sentences: z.array(
    z.object({
      learningLanguage: z.string(),
      nativeLanguage: z.string(),
    }),
  ),
  feedback: z.array(
    z.object({
      category: z.string(),
      content: z.string(),
    }),
  ).max(3),
});
```

### タイムアウト対策

```typescript
const controller = new AbortController();
const timeoutId = setTimeout(() => controller.abort(), 80000);

try {
  response = await fetch(url, { signal: controller.signal });
} catch (error) {
  if (error.name === "AbortError") {
    return { error: "Speech correction timed out" };
  }
}
```

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/speech/correct', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    title: '自己紹介',
    speechPlanItems: ['名前を言う', '職業を紹介する'],
    transcribedText: 'Hello my name is...',
    learningLanguage: 'English',
    nativeLanguage: 'Japanese',
  }),
});

const { sentences, feedback } = await response.json();
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- プロンプト: `src/prompts/speechCorrection.ts`
