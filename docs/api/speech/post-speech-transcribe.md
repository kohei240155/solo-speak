# POST /api/speech/transcribe

音声をテキストに変換します（Whisper API使用）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/transcribe` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/transcribe/route.ts` |
| 使用モデル | Whisper-1 |
| ファイルサイズ制限 | 25MB |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### FormData フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| file | Blob | Yes | 音声ファイル |
| language | string | - | 言語コード（例: "en", "ja"） |

## レスポンス

### 成功時 (200 OK)

```typescript
interface TranscribeResponse {
  text: string;           // 文字起こしテキスト
  language: string | null; // 検出された言語
}
```

**例:**

```json
{
  "text": "Hello, my name is John. I work as a software engineer.",
  "language": "en"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 音声データが必要、またはサイズ超過 |
| 401 | 認証エラー |
| 500 | OpenAI APIエラー |

**例（サイズ超過）:**

```json
{
  "error": "Audio data size exceeds 25MB limit"
}
```

**例（Whisper APIエラー）:**

```json
{
  "error": "Failed to transcribe audio",
  "details": { ... }
}
```

## 実装詳細

### ファイルサイズ制限

```typescript
const maxSize = 25 * 1024 * 1024; // 25MB
if (audioBlob.size > maxSize) {
  return { error: "Audio data size exceeds 25MB limit" };
}
```

### Whisper API呼び出し

```typescript
const whisperFormData = new FormData();
whisperFormData.append("file", audioBlob, "recording.webm");
whisperFormData.append("model", "whisper-1");

if (language) {
  whisperFormData.append("language", language);
}

const response = await fetch(
  "https://api.openai.com/v1/audio/transcriptions",
  {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
    },
    body: whisperFormData,
  }
);
```

### 言語指定

- `language` パラメータを指定すると、その言語として認識
- 未指定の場合、Whisperが自動検出

## 使用例

```typescript
// フロントエンドでの使用例
const formData = new FormData();
formData.append('file', audioBlob);
formData.append('language', 'en');

const response = await fetch('/api/speech/transcribe', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const { text } = await response.json();
console.log('文字起こし結果:', text);
```

## 関連ファイル

- 添削API: `src/app/api/speech/correct/route.ts`
