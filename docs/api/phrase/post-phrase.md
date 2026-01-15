# POST /api/phrase

新しいフレーズを作成します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface CreatePhraseRequestBody {
  languageCode: string;  // 言語コード（例: "en", "ja"）
  original: string;      // 学習言語のフレーズ（1-200文字）
  translation: string;   // 母国語の翻訳（1-200文字）
  explanation?: string;  // 説明（任意）
  context?: string;      // コンテキスト（任意、将来の拡張用）
}
```

**例:**

```json
{
  "languageCode": "en",
  "original": "How are you doing?",
  "translation": "調子はどう？",
  "explanation": "カジュアルな挨拶表現"
}
```

### バリデーション（Zod）

```typescript
const createPhraseSchema = z.object({
  languageCode: z.string().min(1),
  original: z.string().min(1).max(200),
  translation: z.string().min(1).max(200),
  explanation: z.string().optional(),
  context: z.string().nullable().optional(),
});
```

## レスポンス

### 成功時 (201 Created)

```typescript
interface CreatePhraseResponseData {
  success: true;
  phrase: PhraseData;
  totalPhraseCount: number;  // ユーザーの総フレーズ数
}

interface PhraseData {
  id: string;
  original: string;
  translation: string;
  explanation?: string;
  createdAt: string;
  practiceCount: number;    // 音読回数
  correctAnswers: number;   // クイズ正解数
  language: {
    name: string;
    code: string;
  };
}
```

**例:**

```json
{
  "success": true,
  "phrase": {
    "id": "cm1abc123",
    "original": "How are you doing?",
    "translation": "調子はどう？",
    "explanation": "カジュアルな挨拶表現",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "practiceCount": 0,
    "correctAnswers": 0,
    "language": {
      "name": "English",
      "code": "en"
    }
  },
  "totalPhraseCount": 42
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー（Zod） |
| 401 | 認証エラー |
| 404 | ユーザーまたは言語が見つからない |
| 500 | 内部サーバーエラー |

**例（バリデーションエラー）:**

```json
{
  "error": "Invalid request data",
  "details": [
    {
      "code": "too_small",
      "minimum": 1,
      "type": "string",
      "inclusive": true,
      "exact": false,
      "message": "String must contain at least 1 character(s)",
      "path": ["original"]
    }
  ]
}
```

## 実装詳細

1. JWT認証を実行
2. リクエストボディをZodスキーマでバリデーション
3. ユーザーと言語の存在確認を並列処理（`Promise.all`）
4. 初期フレーズレベル（Lv1、score=0）を設定
5. フレーズを作成
6. ユーザーの総フレーズ数を取得して返却

### フレーズレベルシステム

新規フレーズは以下の初期値で作成されます：

- `correctQuizCount`: 0
- `totalSpeakCount`: 0
- `dailySpeakCount`: 0
- `phraseLevelId`: 最低レベル（score=0）

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- レベル計算: `src/utils/phrase-level-utils.ts`
- 認証: `src/utils/api-helpers.ts`
