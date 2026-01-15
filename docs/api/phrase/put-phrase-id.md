# PUT /api/phrase/[id]

指定されたフレーズを更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/[id]` |
| メソッド | `PUT` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/[id]/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | フレーズID |

### ボディ

```typescript
interface UpdatePhraseRequestBody {
  original: string;     // 学習言語のフレーズ（1-200文字）
  translation: string;  // 母国語の翻訳（1-200文字）
}
```

**例:**

```json
{
  "original": "How's it going?",
  "translation": "最近どう？"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface UpdatePhraseResponseData {
  id: string;
  original: string;
  translation: string;
  createdAt: string;
  practiceCount: number;
  correctAnswers: number;
  language: {
    name: string;
    code: string;
  };
}
```

**例:**

```json
{
  "id": "cm1abc123",
  "original": "How's it going?",
  "translation": "最近どう？",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "practiceCount": 5,
  "correctAnswers": 3,
  "language": {
    "name": "English",
    "code": "en"
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー（必須項目の欠如、文字数超過） |
| 401 | 認証エラー |
| 404 | フレーズが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

**例（バリデーションエラー）:**

```json
{
  "error": "original text and translation are required"
}
```

```json
{
  "error": "original text and translation must be 200 characters or less"
}
```

**例（フレーズ未発見）:**

```json
{
  "error": "Phrase not found or access denied"
}
```

## 実装詳細

### バリデーション

1. `original` と `translation` が必須
2. 各フィールドは200文字以下
3. 値は `trim()` されて保存

### セキュリティ

- 認証されたユーザーのフレーズのみ更新可能
- 他のユーザーのフレーズにはアクセス不可

### 更新されるフィールド

- `original`: 学習言語のテキスト
- `translation`: 翻訳テキスト
- `updatedAt`: 更新日時（自動設定）

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/phrase/${phraseId}`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    original: "How's it going?",
    translation: "最近どう？",
  }),
});

const updatedPhrase = await response.json();
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
