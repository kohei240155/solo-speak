# GET /api/ranking/phrase

フレーズ登録数のランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/phrase` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/phrase/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | No | "en" | 言語コード |

**例:**

```
GET /api/ranking/phrase?language=en
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface PhraseRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;  // フレーズ数
  }>;
  currentUser: {
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;
  } | null;
}
```

**例:**

```json
{
  "success": true,
  "topUsers": [
    {
      "rank": 1,
      "userId": "user_123",
      "username": "PhraseCollector",
      "iconUrl": "https://example.com/icon.png",
      "count": 500
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "WordMaster",
      "iconUrl": null,
      "count": 350
    }
  ],
  "currentUser": {
    "rank": 7,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "count": 120
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 言語が見つからない |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### フレーズカウント条件

- 指定された言語のフレーズのみ
- 削除されていないフレーズのみ
- `speechId: null`（スピーチに紐づかないフレーズのみ）

### ランキングソート

1. フレーズ数の降順でソート
2. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

### パフォーマンス最適化

`prisma.phrase.groupBy()` を使用してデータベースレベルで集計：

```typescript
const phraseCounts = await prisma.phrase.groupBy({
  by: ["userId"],
  where: {
    deletedAt: null,
    languageId: languageRecord.id,
    speechId: null,
  },
  _count: { id: true },
});
```

## 関連ファイル

- 型定義: `src/types/ranking.ts`
