# TTS (Text-to-Speech) API

## 概要
Google Cloud Text-to-Speech APIを使用してテキストを音声に変換するAPIエンドポイント。

## エンドポイント
`POST /api/tts`

## 認証
不要（パブリックAPI）

## リクエスト

### リクエストボディ
```typescript
interface TTSRequest {
  text: string;              // 音声化するテキスト（必須）
  languageCode?: string;     // 言語コード（任意、デフォルト: デフォルト言語）
}
```

## レスポンス

### 成功時 (200 OK)
```typescript
interface TTSResponse {
  success: true;
  audioData: string;    // Base64エンコードされた音声データ
  mimeType: string;     // "audio/mpeg"
}
```

### エラー時

#### テキストが不足 (400 Bad Request)
```json
{
  "error": "Text is required"
}
```

#### 音声生成失敗 (500 Internal Server Error)
```json
{
  "error": "Failed to generate audio"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

## 機能詳細

### Google Cloud Text-to-Speech
- Google Cloud の高品質な音声合成サービスを使用
- 多言語対応（言語ごとに最適な音声設定）
- MP3形式で音声を生成

### 言語対応
`getGoogleTTSLanguageCode` 関数で言語コードを Google TTS 用に変換：
- アプリの言語コード → Google TTS 言語コード
- 例: "en" → "en-US", "ja" → "ja-JP"

### 音声設定
`getLanguageSpecificVoiceSettings` 関数でデフォルト設定を取得：
- `ssmlGender`: 音声の性別
- `speakingRate`: 話速
- `pitch`: ピッチ

### 出力形式
- **エンコーディング**: MP3
- **MIMEタイプ**: audio/mpeg
- **データ形式**: Base64エンコード文字列

## 環境変数
以下の環境変数が必要：
- `GOOGLE_SERVICE_ACCOUNT_KEY`: Google Cloud サービスアカウントキー（JSON形式）
- `GOOGLE_CLOUD_PROJECT_ID`: Google Cloud プロジェクトID

## 使用例

### 基本的な使用
```typescript
const response = await fetch('/api/tts', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    text: 'Hello, how are you?',
    languageCode: 'en'
  })
});

const data = await response.json();

if (data.success) {
  // Base64データを音声として再生
  const audioBlob = base64ToBlob(data.audioData, data.mimeType);
  const audioUrl = URL.createObjectURL(audioBlob);
  const audio = new Audio(audioUrl);
  audio.play();
}
```

### Base64を音声に変換
```typescript
function base64ToBlob(base64: string, mimeType: string): Blob {
  const byteCharacters = atob(base64);
  const byteNumbers = new Array(byteCharacters.length);
  
  for (let i = 0; i < byteCharacters.length; i++) {
    byteNumbers[i] = byteCharacters.charCodeAt(i);
  }
  
  const byteArray = new Uint8Array(byteNumbers);
  return new Blob([byteArray], { type: mimeType });
}
```

### React コンポーネントでの使用例
```typescript
function SpeakButton({ text, languageCode }: { text: string; languageCode: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  
  const handleSpeak = async () => {
    setIsPlaying(true);
    
    try {
      const response = await fetch('/api/tts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ text, languageCode })
      });
      
      const data = await response.json();
      
      if (data.success) {
        const audioBlob = base64ToBlob(data.audioData, data.mimeType);
        const audioUrl = URL.createObjectURL(audioBlob);
        const audio = new Audio(audioUrl);
        
        audio.onended = () => {
          setIsPlaying(false);
          URL.revokeObjectURL(audioUrl);
        };
        
        audio.play();
      }
    } catch (error) {
      console.error('TTS Error:', error);
      setIsPlaying(false);
    }
  };
  
  return (
    <button onClick={handleSpeak} disabled={isPlaying}>
      {isPlaying ? '🔊 再生中...' : '🔊 音声を聞く'}
    </button>
  );
}
```

### エラーハンドリング
```typescript
async function textToSpeech(text: string, languageCode: string = 'en') {
  if (!text.trim()) {
    console.error('テキストが空です');
    return null;
  }
  
  try {
    const response = await fetch('/api/tts', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ text, languageCode })
    });
    
    if (!response.ok) {
      const error = await response.json();
      console.error('TTS Error:', error.error);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error('Network Error:', error);
    return null;
  }
}
```

## パフォーマンス考慮事項
- 音声生成には数秒かかる場合がある
- 同じテキストの音声はキャッシュを検討
- 長いテキストは分割して処理することを推奨

## 制限事項
- Google Cloud TTS の無料枠に注意
- リクエスト頻度の制限あり（Google Cloud 側）
- テキスト長の上限あり（API仕様に依存）

## セキュリティ
- サービスアカウントキーは環境変数で管理
- 認証不要だが、レート制限の実装を検討

## 関連ユーティリティ
- `getGoogleTTSLanguageCode` (`@/utils/tts-language-mapping`)
- `getLanguageSpecificVoiceSettings` (`@/utils/tts-language-mapping`)

## 関連型定義
- `TTSRequest` (内部型)
- `TTSResponse` (内部型)
