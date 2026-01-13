# GET /api/phrase/[id]/speak

音読練習用のフレーズ詳細を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/[id]/speak` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/[id]/speak/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | フレーズID |

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeakPhraseResponse {
  success: true;
  phrase: {
    id: string;
    original: string;
    translation: string;
    explanation?: string;
    totalSpeakCount: number;   // 累計音読回数
    dailySpeakCount: number;   // 今日の音読回数
    languageCode: string;
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
    "totalSpeakCount": 15,
    "dailySpeakCount": 3,
    "languageCode": "en"
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | フレーズが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

**例:**

```json
{
  "error": "Phrase not found or access denied"
}
```

## 実装詳細

### フィルタリング条件

- `id`: 指定されたフレーズID
- `userId`: 認証されたユーザーのフレーズのみ
- `deletedAt: null`: 削除されていないフレーズのみ

### 含まれるデータ

- 言語情報（language関連）
- 音読統計（totalSpeakCount, dailySpeakCount）

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/phrase/${phraseId}/speak`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { phrase } = await response.json();

// TTS APIを呼び出して音声を再生
await playTTS(phrase.original, phrase.languageCode);
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
- TTS API: `src/app/api/tts/route.ts`
