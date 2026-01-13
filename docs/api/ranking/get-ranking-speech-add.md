# GET /api/ranking/speech/add

スピーチ登録数のランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/speech/add` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/speech/add/route.ts` |

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
GET /api/ranking/speech/add?language=en
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeechAddRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;  // 登録数
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
      "username": "SpeechCreator",
      "iconUrl": "https://example.com/icon.png",
      "count": 50
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "ActiveUser",
      "iconUrl": null,
      "count": 35
    }
  ],
  "currentUser": {
    "rank": 8,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "count": 10
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

### データソース

Speechテーブルから登録数をカウント：
- 指定された言語のスピーチのみ
- 削除されていないスピーチのみ
- 登録数が0のユーザーは除外

### パフォーマンス最適化

`prisma.speech.groupBy()` を使用してデータベースレベルで集計：

```typescript
const speeches = await prisma.speech.groupBy({
  by: ["userId"],
  where: {
    learningLanguageId: languageId,
    deletedAt: null,
  },
  _count: {
    id: true,
  },
});
```

### ランキングソート

1. 登録数の降順でソート
2. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

## 関連ファイル

- 型定義: `src/types/ranking.ts`
