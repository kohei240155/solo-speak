# GET /api/ranking/speak

音読練習回数のランキングを取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/ranking/speak` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/ranking/speak/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### クエリパラメータ

| パラメータ | 型 | 必須 | デフォルト | 説明 |
|-----------|-----|------|-----------|------|
| language | string | No | "en" | 言語コード |
| period | string | No | "daily" | 期間（daily, weekly, monthly） |

**例:**

```
GET /api/ranking/speak?language=en&period=weekly
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface SpeakRankingResponse {
  success: true;
  topUsers: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;  // 音読回数
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
      "username": "SpeakChamp",
      "iconUrl": "https://example.com/icon.png",
      "count": 500
    },
    {
      "rank": 2,
      "userId": "user_456",
      "username": "VoiceMaster",
      "iconUrl": null,
      "count": 420
    }
  ],
  "currentUser": {
    "rank": 12,
    "userId": "user_789",
    "username": "CurrentUser",
    "iconUrl": null,
    "count": 150
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

### 期間フィルタリング

| period | 対象期間 |
|--------|---------|
| daily | 今日のみ |
| weekly | 過去7日間 |
| monthly | 全期間（totalと同義） |

### データソース

SpeakLogテーブルから音読回数を集計：
- 各ログの`count`フィールドを合計
- 削除されていないログのみ対象

### ランキングソート

1. 音読回数の降順でソート
2. 同数の場合は登録日時が古いユーザーが上位

### 表示件数

- 上位10位まで表示
- 現在のユーザーは10位圏外でも順位を取得

## 関連ファイル

- 型定義: `src/types/ranking.ts`
