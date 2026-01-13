# GET /api/speech

スピーチ一覧を取得します。ページネーション対応。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| languageCode | string | Yes | - | 言語コード（例: "en"） |
| page | number | - | 1 | ページ番号 |
| limit | number | - | 10 | 1ページあたりの件数 |

**例:**

```
GET /api/speech?languageCode=en&page=1&limit=20
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechListResponseData {
  success: true;
  speeches: SpeechListItem[];
  pagination: PaginationData;
}

interface SpeechListItem {
  id: string;
  title: string;
  firstPhrase: {
    original: string;  // 最初のフレーズ
  };
  practiceCount: number;
  status: {
    id: string;
    name: string;  // A, B, C, D
  };
  lastPracticedAt: string | null;
  createdAt: string;
}

interface PaginationData {
  total: number;
  limit: number;
  page: number;
  hasMore: boolean;
}
```

**例:**

```json
{
  "success": true,
  "speeches": [
    {
      "id": "cm1abc123",
      "title": "自己紹介",
      "firstPhrase": {
        "original": "Hello, my name is..."
      },
      "practiceCount": 5,
      "status": {
        "id": "status_1",
        "name": "B"
      },
      "lastPracticedAt": "2024-01-15T10:30:00.000Z",
      "createdAt": "2024-01-10T09:00:00.000Z"
    }
  ],
  "pagination": {
    "total": 15,
    "limit": 10,
    "page": 1,
    "hasMore": true
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語コードが必要 |
| 401 | 認証エラー |
| 404 | 言語が見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### フィルタリング条件

- `userId`: 認証されたユーザーのスピーチのみ
- `learningLanguageId`: 指定された言語のスピーチのみ
- `deletedAt: null`: 削除されていないスピーチのみ

### ソート順

作成日時の降順（新しい順）

### 含まれるデータ

- ステータス情報（id, name）
- 最初のフレーズ（speechOrder = 1）

## 関連ファイル

- 型定義: `src/types/speech.ts`
