# GET /api/speech/[id]

スピーチの詳細を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | スピーチID |

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechReviewResponseData {
  success: true;
  speech: {
    id: string;
    title: string;
    practiceCount: number;
    status: {
      id: string;
      name: string;
    };
    nativeLanguage: {
      id: string;
      code: string;
      name: string;
    };
    learningLanguage: {
      id: string;
      code: string;
      name: string;
    };
    firstSpeechText: string;
    audioFilePath: string | null;  // 署名付きURL
    notes: string | null;
    lastPracticedAt: string | null;
    createdAt: string;
    phrases: Array<{
      id: string;
      original: string;
      translation: string;
      speechOrder: number;
    }>;
    feedbacks: Array<{
      id: string;
      category: string;
      content: string;
      createdAt: string;
    }>;
  };
}
```

**例:**

```json
{
  "success": true,
  "speech": {
    "id": "cm1abc123",
    "title": "自己紹介",
    "practiceCount": 5,
    "status": {
      "id": "status_1",
      "name": "B"
    },
    "nativeLanguage": {
      "id": "lang_ja",
      "code": "ja",
      "name": "Japanese"
    },
    "learningLanguage": {
      "id": "lang_en",
      "code": "en",
      "name": "English"
    },
    "firstSpeechText": "Hello, my name is...",
    "audioFilePath": "https://storage.example.com/audio/xxx?token=...",
    "notes": "発音に注意",
    "lastPracticedAt": "2024-01-15T10:30:00.000Z",
    "createdAt": "2024-01-10T09:00:00.000Z",
    "phrases": [
      {
        "id": "phrase_1",
        "original": "Hello, my name is John.",
        "translation": "こんにちは、私の名前はジョンです。",
        "speechOrder": 1
      }
    ],
    "feedbacks": [
      {
        "id": "feedback_1",
        "category": "Grammar",
        "content": "冠詞の使い方に注意してください。",
        "createdAt": "2024-01-10T09:00:00.000Z"
      }
    ]
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | スピーチが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

## 実装詳細

### 音声ファイルURL

- Supabase Storageから署名付きURLを取得
- `getSpeechAudioSignedUrl()` 関数を使用
- 取得に失敗した場合は `null` を返す

### 含まれるデータ

- ステータス情報
- 母国語・学習言語情報
- フレーズ一覧（speechOrder順）
- フィードバック一覧（作成日時降順）

## 関連ファイル

- 型定義: `src/types/speech.ts`
- ストレージヘルパー: `src/utils/storage-helpers.ts`
