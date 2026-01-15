# POST /api/phrase/generate

AIを使用してフレーズのバリエーションを生成します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/generate` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/generate/route.ts` |
| 使用モデル | GPT-4.1-mini |
| 1日の制限 | 5回 |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
Accept-Language: ja  # エラーメッセージのローカライズ
```

### ボディ

```typescript
interface GeneratePhraseRequestBody {
  nativeLanguage: string;     // 母国語コード（例: "ja"）
  learningLanguage: string;   // 学習言語コード（例: "en"）
  desiredPhrase: string;      // 生成したいフレーズ（1-100文字）
  selectedContext?: string;   // コンテキスト（任意）
}
```

**例:**

```json
{
  "nativeLanguage": "ja",
  "learningLanguage": "en",
  "desiredPhrase": "調子はどう？と聞きたい",
  "selectedContext": "友人との会話"
}
```

### バリデーション（Zod）

```typescript
const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(100),
  selectedContext: z.string().nullable().optional(),
});
```

## レスポンス

### 成功時 (200 OK)

3つの異なるスタイル（一般、丁寧、カジュアル）のバリエーションを返します。

```typescript
interface GeneratePhraseResponse {
  variations: PhraseVariation[];
}

interface PhraseVariation {
  original: string;      // 生成されたフレーズ（200文字以内）
  explanation?: string;  // ニュアンスの説明（30-50文字程度）
}
```

**例:**

```json
{
  "variations": [
    {
      "original": "How are you doing?",
      "explanation": "一般的な挨拶。友人や知人に幅広く使える表現"
    },
    {
      "original": "How have you been?",
      "explanation": "少し丁寧な表現。久しぶりに会った人に適している"
    },
    {
      "original": "What's up?",
      "explanation": "カジュアルな表現。親しい友人同士で使う"
    }
  ]
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 403 | 1日の生成回数制限超過 |
| 404 | ユーザーが見つからない |
| 500 | OpenAI APIエラー、または内部サーバーエラー |

**例（生成回数制限）:**

```json
{
  "error": "本日のフレーズ生成回数の上限に達しました"
}
```

## 実装詳細

### 生成回数制限

- 1日あたり5回まで生成可能
- UTC基準で日付がリセット
- `remainingPhraseGenerations` フィールドで残り回数を管理
- 生成成功時に回数を1減らす

### OpenAI API連携

- **モデル**: `gpt-4.1-mini`
- **Temperature**: 0.7
- **Max tokens**: 1000
- **Structured Outputs**: Zodスキーマを使用してレスポンス形式を強制

### レスポンス形式（Structured Outputs）

```typescript
const phraseVariationsSchema = z.object({
  variations: z
    .array(
      z.object({
        original: z.string().max(200),
        explanation: z.string(),
      }),
    )
    .length(3),
});
```

### プロンプト

`src/prompts/phraseGeneration.ts` で定義されたプロンプトを使用：
- 母国語名
- 希望するフレーズ
- コンテキスト（任意）
- 学習言語名

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/phrase/generate', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
    'Accept-Language': 'ja',
  },
  body: JSON.stringify({
    nativeLanguage: 'ja',
    learningLanguage: 'en',
    desiredPhrase: '調子はどう？と聞きたい',
    selectedContext: '友人との会話',
  }),
});

const { variations } = await response.json();
// ユーザーに3つのバリエーションを表示
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- プロンプト: `src/prompts/phraseGeneration.ts`
- 言語定数: `src/constants/languages.ts`
- i18n: `src/utils/api-i18n.ts`
