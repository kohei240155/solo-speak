# PUT /api/speech/[id]/status

スピーチのステータスを更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]/status` |
| メソッド | `PUT` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/status/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | スピーチID |

### ボディ

```typescript
interface UpdateSpeechStatusRequest {
  statusId: string;  // ステータスID
}
```

**例:**

```json
{
  "statusId": "status_b"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface UpdateSpeechStatusResponse {
  message: string;
  speech: {
    id: string;
    status: {
      id: string;
      name: string;
    };
  };
}
```

**例:**

```json
{
  "message": "Speech status updated successfully",
  "speech": {
    "id": "cm1abc123",
    "status": {
      "id": "status_b",
      "name": "B"
    }
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | ステータスIDが必要、または無効なステータスID |
| 401 | 認証エラー |
| 403 | アクセス権限なし |
| 404 | スピーチが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### セキュリティチェック

1. スピーチの存在確認
2. ユーザーIDの一致確認（`speech.userId !== userId` で403）
3. ステータスIDの有効性確認

### ステータスID

`GET /api/speech/statuses` で取得可能なIDを使用

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/speech/${speechId}/status`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    statusId: 'status_a',  // マスターに変更
  }),
});

const { speech } = await response.json();
console.log(`ステータスを${speech.status.name}に更新しました`);
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- ステータス一覧: `src/app/api/speech/statuses/route.ts`
