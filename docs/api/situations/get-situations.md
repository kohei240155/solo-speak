# GET /api/situations

ユーザーのシチュエーション一覧を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/situations` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/situations/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パラメータ

なし

## レスポンス

### 成功時 (200 OK)

```typescript
interface SituationsListResponse {
  situations: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

**例:**

```json
{
  "situations": [
    {
      "id": "sit_123",
      "name": "ビジネス会議",
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "id": "sit_124",
      "name": "カジュアルな会話",
      "createdAt": "2024-01-10T09:00:00.000Z",
      "updatedAt": "2024-01-10T09:00:00.000Z"
    }
  ]
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### フィルタリング条件

- `userId`: 認証されたユーザーのシチュエーションのみ
- `deletedAt: null`: 削除されていないシチュエーションのみ

### ソート順

作成日時の降順（新しい順）

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/situations', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { situations } = await response.json();

// フレーズ生成時のコンテキスト選択に使用
situations.forEach(situation => {
  console.log(`${situation.name}`);
});
```

## 関連ファイル

- 型定義: `src/types/situation.ts`
