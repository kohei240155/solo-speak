# POST /api/user/icon

ユーザーアイコンをアップロードします。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/icon` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/icon/route.ts` |
| ストレージ | Supabase Storage |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: multipart/form-data
```

### ボディ (FormData)

| フィールド | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| icon | File | Yes | アイコン画像ファイル |

## レスポンス

### 成功時 (200 OK)

```typescript
interface UploadIconResponse {
  iconUrl: string;   // アップロードされた画像のURL
  message: string;   // 成功メッセージ
}
```

**例:**

```json
{
  "iconUrl": "https://example.supabase.co/storage/v1/object/public/images/user-icons/user_123_1705312200000.png",
  "message": "Icon uploaded successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | ファイルが必要、ファイル形式が無効、またはサイズ超過 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例（ファイルなし）:**

```json
{
  "error": "Icon file is required"
}
```

**例（ファイル形式無効）:**

```json
{
  "error": "Invalid file type. Only JPEG, PNG, and WebP are allowed."
}
```

**例（サイズ超過）:**

```json
{
  "error": "File size too large. Maximum size is 5MB."
}
```

## 実装詳細

### 対応ファイル形式

- `image/jpeg`
- `image/jpg`
- `image/png`
- `image/webp`

### ファイルサイズ制限

最大5MB

### 既存アイコンの処理

1. 既存のアイコンURLを確認
2. Google URLではなくSupabase StorageのURLの場合、既存ファイルを削除
3. 新しいファイルをアップロード

### Google URLの判定

以下のドメインを含むURLはGoogle URLとして判定：
- `googleusercontent.com`
- `googleapis.com`
- `lh3.googleusercontent.com`
- `accounts.google.com`

## 使用例

```typescript
// フロントエンドでの使用例
const formData = new FormData();
formData.append('icon', file);

const response = await fetch('/api/user/icon', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
  body: formData,
});

const { iconUrl } = await response.json();
console.log('アイコンURL:', iconUrl);
```

## 関連ファイル

- ストレージ操作: `src/utils/storage.ts`
