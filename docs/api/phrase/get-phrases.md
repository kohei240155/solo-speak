# GET /api/phrase

ユーザーのフレーズ一覧を取得します。ページネーション対応。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| languageId | string | - | - | 言語ID（UUIDで絞り込み） |
| languageCode | string | - | - | 言語コード（例: "en"）で絞り込み |
| page | number | - | 1 | ページ番号 |
| limit | number | - | 10 | 1ページあたりの件数 |
| minimal | boolean | - | false | true の場合、最小限のデータのみ取得 |

**例:**

```
GET /api/phrase?languageCode=en&page=1&limit=20
GET /api/phrase?minimal=true
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface PhrasesListResponseData {
  success: true;
  phrases: PhraseData[];
  pagination: PaginationData;
}

interface PhraseData {
  id: string;
  original: string;
  translation: string;
  explanation?: string;
  createdAt: string;
  practiceCount: number;
  correctAnswers: number;
  language: {
    name: string;
    code: string;
  };
}

interface PaginationData {
  total: number;    // 全件数
  limit: number;    // 1ページあたりの件数
  page: number;     // 現在のページ
  hasMore: boolean; // 次ページが存在するか
}
```

**例:**

```json
{
  "success": true,
  "phrases": [
    {
      "id": "cm1abc123",
      "original": "How are you doing?",
      "translation": "調子はどう？",
      "explanation": "カジュアルな挨拶表現",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "practiceCount": 5,
      "correctAnswers": 3,
      "language": {
        "name": "English",
        "code": "en"
      }
    }
  ],
  "pagination": {
    "total": 42,
    "limit": 10,
    "page": 1,
    "hasMore": true
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### フィルタリング条件

- `userId`: 認証されたユーザーのフレーズのみ
- `deletedAt: null`: 削除されていないフレーズのみ
- `speechId: null`: スピーチに紐づいていないフレーズのみ

### ソート順

作成日時の降順（新しい順）

### minimal モード

`minimal=true` の場合：
- 言語情報のみ（id, name, code）を含む

`minimal=false`（デフォルト）の場合：
- 言語情報
- フレーズレベル情報
- ユーザー情報（id, username）

### パフォーマンス最適化

`Promise.all` を使用してフレーズ取得とカウントを並列実行

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/phrase?languageCode=en&page=1&limit=20', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const data = await response.json();
console.log(`${data.pagination.total}件中 ${data.phrases.length}件を表示`);
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
