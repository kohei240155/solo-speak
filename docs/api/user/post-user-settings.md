# POST /api/user/settings

ユーザー設定を登録します（新規作成または更新）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/settings` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/settings/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface CreateUserSettingsRequest {
  username: string;              // ユーザー名（必須）
  iconUrl?: string;              // アイコンURL（任意）
  nativeLanguageId: string;      // 母国語ID（必須）
  defaultLearningLanguageId: string;  // 学習言語ID（必須）
  email?: string;                // メールアドレス（任意、新規作成時のみ）
}
```

**例:**

```json
{
  "username": "TaroYamada",
  "iconUrl": "https://example.com/icon.png",
  "nativeLanguageId": "lang_ja",
  "defaultLearningLanguageId": "lang_en",
  "email": "taro@example.com"
}
```

## レスポンス

### 成功時 (201 Created / 200 OK)

新規作成時は201、更新時は200を返却。

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
  "username": "TaroYamada",
  "email": "taro@example.com",
  "iconUrl": "https://example.com/icon.png",
  "nativeLanguageId": "lang_ja",
  "defaultLearningLanguageId": "lang_en",
  "isPremium": false,
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 必須フィールドが不足、または言語IDが無効 |
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

**例（必須フィールド不足）:**

```json
{
  "error": "Required fields validation failed"
}
```

**例（言語ID無効）:**

```json
{
  "error": "Native language with ID 'invalid_id' not found. Please select a valid language."
}
```

## 実装詳細

### バリデーション

1. 必須フィールド: `username`, `nativeLanguageId`, `defaultLearningLanguageId`
2. 言語IDの存在確認（削除されていない言語のみ有効）

### 新規作成 vs 更新

- `checkUserExists()` でユーザーの存在確認
- 存在する場合: `updateUserSettings()` で更新
- 存在しない場合: `createUserSettings()` で新規作成

## 関連ファイル

- ヘルパー関数: `src/utils/database-helpers.ts`
- バリデーション: `src/utils/api-helpers.ts`
- 型定義: `src/types/user.ts`
