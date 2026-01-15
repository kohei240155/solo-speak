# GET /api/user/settings

ユーザー設定を取得します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/settings` |
| メソッド | `GET` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/settings/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
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
  stripeSubscriptionId: string | null;
  stripeCustomerId: string | null;
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
  "iconUrl": "https://example.supabase.co/storage/v1/object/public/images/icon.png",
  "nativeLanguageId": "lang_ja",
  "defaultLearningLanguageId": "lang_en",
  "isPremium": false,
  "stripeSubscriptionId": null,
  "stripeCustomerId": null,
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | ユーザーが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### キャッシュ無効化

ユーザー切り替え対応のため、レスポンスヘッダーでキャッシュを無効化：

```
Cache-Control: no-cache, no-store, must-revalidate
Pragma: no-cache
Expires: 0
```

### データ取得

`getUserSettings()` ヘルパー関数を使用してユーザー情報を取得。

## 関連ファイル

- ヘルパー関数: `src/utils/database-helpers.ts`
- 型定義: `src/types/user.ts`
