# DELETE /api/user/icon

ユーザーアイコンを削除します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/icon` |
| メソッド | `DELETE` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/icon/route.ts` |
| ストレージ | Supabase Storage |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface DeleteIconRequest {
  iconUrl: string;  // 削除するアイコンのURL
}
```

**例:**

```json
{
  "iconUrl": "https://example.supabase.co/storage/v1/object/public/images/user-icons/user_123.png"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface DeleteIconResponse {
  message: string;  // 成功メッセージ
}
```

**例:**

```json
{
  "message": "Icon deleted successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | アイコンURLが必要 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例:**

```json
{
  "error": "Icon URL is required"
}
```

## 実装詳細

### 削除処理

`deleteUserIcon()` 関数を使用してSupabase Storageからファイルを削除。

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/user/icon', {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    iconUrl: 'https://example.supabase.co/storage/v1/object/public/images/user-icons/user_123.png',
  }),
});

if (response.ok) {
  console.log('アイコンを削除しました');
}
```

## 関連ファイル

- ストレージ操作: `src/utils/storage.ts`
