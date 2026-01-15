# PUT /api/user/settings

ユーザー設定を更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/settings` |
| メソッド | `PUT` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/settings/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

すべてのフィールドは任意。更新したいフィールドのみ送信可能。

```typescript
interface UpdateUserSettingsRequest {
  username?: string;              // ユーザー名
  iconUrl?: string;               // アイコンURL
  nativeLanguageId?: string;      // 母国語ID
  defaultLearningLanguageId?: string;  // 学習言語ID
  email?: string;                 // メールアドレス
}
```

**例:**

```json
{
  "username": "NewUsername",
  "defaultLearningLanguageId": "lang_es"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface UserSettingsResponse {
  id: string;
  username: string;
  email: string | null;
  iconUrl: string | null;
  nativeLanguageId: string;
  defaultLearningLanguageId: string;
  isPremium: boolean;
  createdAt: string;
  updatedAt: string;
}
```

**例:**

```json
{
  "id": "user_123",
  "username": "NewUsername",
  "email": "taro@example.com",
  "iconUrl": "https://example.com/icon.png",
  "nativeLanguageId": "lang_ja",
  "defaultLearningLanguageId": "lang_es",
  "isPremium": false,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T11:00:00.000Z"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | ユーザー名またはメールアドレスの形式が無効 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例（ユーザー名無効）:**

```json
{
  "error": "Username validation failed"
}
```

**例（メールアドレス無効）:**

```json
{
  "error": "Email validation failed"
}
```

## 実装詳細

### バリデーション

- `username`: `validateUsername()` で形式チェック
- `email`: `validateEmail()` で形式チェック

### 部分更新

指定されたフィールドのみ更新。未指定のフィールドは変更されません。

## 関連ファイル

- ヘルパー関数: `src/utils/database-helpers.ts`
- バリデーション: `src/utils/api-helpers.ts`
- 型定義: `src/types/user.ts`
