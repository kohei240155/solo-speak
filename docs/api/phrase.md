# Phrase API

## 概要
フレーズの作成と一覧取得を行うAPIエンドポイント。

## エンドポイント
- `POST /api/phrase` - フレーズ作成
- `GET /api/phrase` - フレーズ一覧取得

## 認証
必要

---

## POST /api/phrase

### リクエスト

#### リクエストボディ
```typescript
interface CreatePhraseRequestBody {
  languageId: string;        // 言語ID（必須）
  original: string;          // 原文（1-200文字）
  translation: string;       // 翻訳（1-200文字）
  explanation?: string;      // 説明（任意）
  level?: 'common' | 'polite' | 'casual'; // レベル（任意）
  phraseLevelId?: string;    // フレーズレベルID（任意）
  context?: string | null;   // コンテキスト（任意、現在未使用）
}
```

### レスポンス

#### 成功時 (201 Created)
```typescript
interface CreatePhraseResponseData {
  success: true;
  phrase: {
    id: string;
    original: string;
    translation: string;
    explanation?: string;
    createdAt: string;        // ISO 8601形式
    practiceCount: number;    // 音読練習回数
    correctAnswers: number;   // クイズ正解数
    language: {
      name: string;
      code: string;
    };
  };
  remainingGenerations: number; // 残りAI生成回数
  dailyLimit: number;           // 1日の生成上限
  nextResetTime: string;        // 次回リセット時刻（ISO 8601形式）
  totalPhraseCount: number;     // ユーザーの総フレーズ数
}
```

#### エラー時
```json
{
  "error": "エラーメッセージ",
  "details": [] // バリデーションエラー時のみ
}
```

**エラーコード:**
- `400` - バリデーションエラー
- `404` - ユーザーまたは言語が見つからない
- `500` - サーバーエラー

### 機能詳細
- フレーズレベルは自動決定（指定がない場合）
- 新規フレーズの初期正解数は0
- 削除されていない言語のみ選択可能
- AI生成経由の場合、残り回数は `/api/phrase/generate` で既に減算済み

---

## GET /api/phrase

### リクエスト

#### クエリパラメータ
| パラメータ | 型 | 必須 | デフォルト | 説明 |
|----------|-----|------|-----------|------|
| languageId | string | - | - | 言語ID |
| languageCode | string | - | - | 言語コード（languageIdより優先度低） |
| page | number | - | 1 | ページ番号 |
| limit | number | - | 10 | 1ページあたりの件数 |
| minimal | boolean | - | false | 最小限のデータのみ取得 |

### レスポンス

#### 成功時 (200 OK)
```typescript
interface PhrasesListResponseData {
  success: true;
  phrases: {
    id: string;
    original: string;
    translation: string;
    explanation?: string;
    createdAt: string;        // ISO 8601形式
    practiceCount: number;    // 音読練習回数
    correctAnswers: number;   // クイズ正解数
    language: {
      name: string;
      code: string;
    };
  }[];
  pagination: {
    total: number;      // 総件数
    limit: number;      // 1ページあたりの件数
    page: number;       // 現在のページ番号
    hasMore: boolean;   // 次ページがあるか
  };
}
```

#### エラー時 (500 Internal Server Error)
```json
{
  "error": "Internal server error"
}
```

### 機能詳細
- 認証されたユーザーのフレーズのみを取得
- 削除されていないフレーズのみ
- 作成日時の降順でソート（新しいものが先頭）
- ページネーション対応
- `minimal=true` で言語情報のみ含む軽量レスポンス
- `languageId` または `languageCode` でフィルタリング可能

## バリデーション

### POST
- `languageId`: 必須、有効な言語ID
- `original`: 必須、1-200文字
- `translation`: 必須、1-200文字
- `level`: 'common', 'polite', 'casual' のいずれか（任意）

## 使用例

### フレーズ作成
```typescript
const response = await fetch('/api/phrase', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    languageId: 'lang-id-123',
    original: 'Hello, how are you?',
    translation: 'こんにちは、お元気ですか？',
    explanation: 'カジュアルな挨拶'
  })
});
const data = await response.json();
```

### フレーズ一覧取得
```typescript
const response = await fetch('/api/phrase?languageCode=en&page=1&limit=20', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const data = await response.json();
```

## 関連型定義
- `CreatePhraseRequestBody` (`@/types/phrase`)
- `CreatePhraseResponseData` (`@/types/phrase`)
- `PhrasesListResponseData` (`@/types/phrase`)
- `ApiErrorResponse` (`@/types/api`)
