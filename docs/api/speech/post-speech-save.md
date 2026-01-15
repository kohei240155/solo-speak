# POST /api/speech/save

スピーチ結果を保存します（音声付き）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/save` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/save/route.ts` |
| Content-Type | multipart/form-data |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### FormData フィールド

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| data | string (JSON) | Yes | スピーチデータ（下記参照） |
| audio | File | - | 音声ファイル（WebM/WAV） |

### data フィールドの構造

```typescript
interface SaveSpeechRequestBody {
  title: string;                    // 1-200文字
  learningLanguageId: string;       // 学習言語ID
  nativeLanguageId: string;         // 母国語ID
  firstSpeechText: string;          // 初回スピーチテキスト
  notes?: string;                   // メモ（任意）
  speechPlans: string[];            // スピーチプラン（1件以上）
  sentences: SentenceData[];        // 添削後の文章（1件以上）
  feedback?: FeedbackData[];        // AIフィードバック（任意）
}

interface SentenceData {
  learningLanguage: string;  // 学習言語の文（1-500文字）
  nativeLanguage: string;    // 母国語の翻訳（1-500文字）
}

interface FeedbackData {
  category: string;  // カテゴリ（1-100文字）
  content: string;   // 内容（1-2000文字）
}
```

**例:**

```json
{
  "title": "自己紹介",
  "learningLanguageId": "lang_en",
  "nativeLanguageId": "lang_ja",
  "firstSpeechText": "Hello my name is...",
  "notes": "発音に注意",
  "speechPlans": [
    "名前を言う",
    "職業を紹介する",
    "趣味を話す"
  ],
  "sentences": [
    {
      "learningLanguage": "Hello, my name is John.",
      "nativeLanguage": "こんにちは、私の名前はジョンです。"
    }
  ],
  "feedback": [
    {
      "category": "Grammar",
      "content": "冠詞の使い方が正確です。"
    }
  ]
}
```

## レスポンス

### 成功時 (201 Created)

```typescript
interface SaveSpeechResponseData {
  success: true;
  speech: {
    id: string;
    title: string;
    learningLanguage: { id: string; name: string; code: string; };
    nativeLanguage: { id: string; name: string; code: string; };
    firstSpeechText: string;
    audioFilePath?: string;
    notes?: string;
    status: { id: string; name: string; };
    practiceCount: number;
    createdAt: string;
    updatedAt: string;
  };
  phrases: Array<{
    id: string;
    original: string;
    translation: string;
    speechOrder: number;
    createdAt: string;
  }>;
  speechPlans: Array<{
    id: string;
    planningContent: string;
    createdAt: string;
  }>;
  feedbacks: Array<{
    id: string;
    category: string;
    content: string;
    createdAt: string;
  }>;
  totalSpeechCount: number;
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー、またはデータフィールドが必要 |
| 401 | 認証エラー |
| 404 | ユーザー、言語が見つからない |
| 500 | デフォルトステータス/レベルが見つからない、保存失敗 |

## 実装詳細

### トランザクション処理

以下のレコードを単一トランザクションで作成（タイムアウト10秒）：

1. **Speech** - メインのスピーチレコード
2. **SpeechPlan** - スピーチプラン（複数）
3. **Phrase** - 添削後の文章（複数、speechOrder付き）
4. **SpeechFeedback** - AIフィードバック（複数）

### 音声ファイル処理

トランザクション外で実行（失敗しても保存は完了）：

1. FormDataから音声ファイルを取得
2. WebMの場合、WAVに変換（Safari互換性対応）
3. Supabase Storageにアップロード
4. Speechレコードを更新してパスを保存

### 初期値

- `statusId`: デフォルトステータス "D"（まだ復習していない）
- `phraseLevelId`: score=0 のレベル
- `practiceCount`: 0

### 音声変換

```typescript
// WebMからWAVへの変換
if (audioFile.type === "audio/webm") {
  const wavBuffer = await convertWebMToWav(Buffer.from(audioBuffer));
  audioBlob = new Blob([new Uint8Array(wavBuffer)], { type: "audio/wav" });
}
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- 音声変換: `src/utils/audio-converter.ts`
- ストレージ: `src/utils/storage-helpers.ts`
