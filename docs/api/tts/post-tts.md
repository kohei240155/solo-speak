# POST /api/tts

テキストを音声に変換します（Google Cloud TTS使用）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/tts` |
| メソッド | `POST` |
| 認証 | 不要 |
| ファイル | `src/app/api/tts/route.ts` |
| 使用サービス | Google Cloud Text-to-Speech |

## リクエスト

### ヘッダー

```
Content-Type: application/json
```

### ボディ

```typescript
interface TTSRequest {
  text: string;          // 読み上げるテキスト
  languageCode?: string; // 言語コード（デフォルト: "en"）
}
```

**例:**

```json
{
  "text": "Hello, how are you?",
  "languageCode": "en"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface TTSResponse {
  success: true;
  audioData: string;   // Base64エンコードされた音声データ
  mimeType: string;    // "audio/mpeg"
}
```

**例:**

```json
{
  "success": true,
  "audioData": "//uQxAAAAAANIAAAAAExBTUUzLjEwMFVVVVVVVVVVVVV...",
  "mimeType": "audio/mpeg"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | テキストが必要 |
| 500 | 音声生成に失敗、または内部サーバーエラー |

**例:**

```json
{
  "error": "Text is required"
}
```

## 実装詳細

### 対応言語

| コード | Google TTS言語コード |
|--------|---------------------|
| en | en-US |
| ja | ja-JP |
| zh | zh-CN |
| ko | ko-KR |
| es | es-ES |
| fr | fr-FR |
| de | de-DE |
| pt | pt-BR |
| it | it-IT |

### 音声設定

```typescript
const synthesisRequest = {
  input: { text },
  voice: {
    languageCode: googleLanguageCode,
    ssmlGender: "NEUTRAL",
  },
  audioConfig: {
    audioEncoding: "MP3",
    speakingRate: 1.0,
    pitch: 0.0,
  },
};
```

### 認証

Google Cloud認証情報は環境変数から読み込み：

- `GOOGLE_SERVICE_ACCOUNT_KEY`: サービスアカウントキー（JSON）
- `GOOGLE_CLOUD_PROJECT_ID`: プロジェクトID

## 使用例

```typescript
// フロントエンドでの使用例
async function playTTS(text: string, languageCode: string) {
  const response = await fetch('/api/tts', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ text, languageCode }),
  });

  const { audioData, mimeType } = await response.json();

  // Base64をBlobに変換して再生
  const audioBlob = await fetch(`data:${mimeType};base64,${audioData}`)
    .then(res => res.blob());

  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}
```

## 関連ファイル

- 言語マッピング: `src/utils/tts-language-mapping.ts`
- 定数: `src/constants/languages.ts`
