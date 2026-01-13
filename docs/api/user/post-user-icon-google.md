# POST /api/user/icon/google

Googleアバター画像をSupabase Storageにアップロードします。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/icon/google` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/icon/google/route.ts` |
| ストレージ | Supabase Storage |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface UploadGoogleAvatarRequest {
  googleAvatarUrl: string;  // GoogleアバターのURL
}
```

**例:**

```json
{
  "googleAvatarUrl": "https://lh3.googleusercontent.com/a/ACg8ocKxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface UploadGoogleAvatarResponse {
  iconUrl: string;   // Supabase StorageにアップロードされたURL
  message: string;   // 成功メッセージ
}
```

**例:**

```json
{
  "iconUrl": "https://example.supabase.co/storage/v1/object/public/images/user-icons/user_123_1705312200000.png",
  "message": "Google avatar uploaded successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | GoogleアバターURLが必要、またはURLが無効 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例（URLなし）:**

```json
{
  "error": "Google avatar URL is required"
}
```

**例（無効なURL）:**

```json
{
  "error": "Invalid Google avatar URL"
}
```

## 実装詳細

### Google URL バリデーション

以下のドメインを含むURLのみ許可：
- `googleusercontent.com`
- `googleapis.com`
- `google.com`

### 処理フロー

1. GoogleアバターURLのバリデーション
2. Google画像をダウンロード
3. Supabase Storageにアップロード
4. 公開URLを返却

### 使用目的

Google認証でログインしたユーザーが、Googleのアバター画像を自身のアイコンとして使用する場合に利用。
Googleの画像URLはいつまでも有効とは限らないため、Supabase Storageにコピーして永続化します。

## 使用例

```typescript
// フロントエンドでの使用例（Google認証後）
const response = await fetch('/api/user/icon/google', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    googleAvatarUrl: googleUser.picture,
  }),
});

const { iconUrl } = await response.json();
// iconUrlをユーザー設定に保存
```

## 関連ファイル

- ストレージ操作: `src/utils/storage.ts`
