# User Settings API

## 概要
ユーザー設定の取得、登録、更新を行うAPIエンドポイント。

## エンドポイント
- `GET /api/user/settings` - 設定取得
- `POST /api/user/settings` - 設定登録（初回）
- `PUT /api/user/settings` - 設定更新

## 認証
必要

---

## GET /api/user/settings

### リクエスト
認証ヘッダーのみ必要。

### レスポンス

#### 成功時 (200 OK)
```typescript
interface UserSettings {
  id: string;
  email: string;
  username: string | null;
  iconUrl: string | null;
  nativeLanguageId: string | null;
  defaultLearningLanguageId: string | null;
  createdAt: string;
  updatedAt: string;
}
```

#### エラー時

**404 Not Found**
```json
{
  "error": "User not found"
}
```

**500 Internal Server Error**
```json
{
  "error": "エラーメッセージ"
}
```

### 機能詳細
- キャッシュを無効化（ユーザー切り替え対応）
- `Cache-Control`, `Pragma`, `Expires` ヘッダーを設定

---

## POST /api/user/settings

### リクエスト

#### リクエストボディ
```typescript
interface CreateUserSettingsRequest {
  username: string;                    // ユーザー名（必須）
  iconUrl?: string;                    // アイコンURL（任意）
  nativeLanguageId: string;            // 母国語ID（必須）
  defaultLearningLanguageId: string;   // 学習言語ID（必須）
  email?: string;                      // メールアドレス（任意）
}
```

### レスポンス

#### 成功時 (201 Created / 200 OK)
- 新規作成: `201 Created`
- 既存更新: `200 OK`

```typescript
interface UserSettings {
  id: string;
  email: string;
  username: string;
  iconUrl: string | null;
  nativeLanguageId: string;
  defaultLearningLanguageId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### エラー時

**400 Bad Request**
```json
{
  "error": "Required fields validation failed"
}
// または
{
  "error": "Native language with ID 'xxx' not found. Please select a valid language."
}
// または
{
  "error": "Learning language with ID 'xxx' not found. Please select a valid language."
}
```

**500 Internal Server Error**
```json
{
  "error": "Failed to validate language selection. Please try again."
}
```

### バリデーション
- `username`: 必須
- `nativeLanguageId`: 必須、有効な言語ID
- `defaultLearningLanguageId`: 必須、有効な言語ID
- 言語IDは削除されていない言語のみ（`deletedAt: null`）

### 機能詳細
- ユーザーが既に存在する場合は更新（PUT と同じ動作）
- 言語IDの存在確認を並列実行（`Promise.all`）
- 不正な言語IDの場合、詳細なエラーメッセージを返す

---

## PUT /api/user/settings

### リクエスト

#### リクエストボディ
```typescript
interface UpdateUserSettingsRequest {
  username?: string;                    // ユーザー名（任意）
  iconUrl?: string;                     // アイコンURL（任意）
  nativeLanguageId?: string;            // 母国語ID（任意）
  defaultLearningLanguageId?: string;   // 学習言語ID（任意）
  email?: string;                       // メールアドレス（任意）
}
```

### レスポンス

#### 成功時 (200 OK)
```typescript
interface UserSettings {
  id: string;
  email: string;
  username: string;
  iconUrl: string | null;
  nativeLanguageId: string;
  defaultLearningLanguageId: string;
  createdAt: string;
  updatedAt: string;
}
```

#### エラー時

**400 Bad Request**
```json
{
  "error": "Username validation failed"
}
// または
{
  "error": "Email validation failed"
}
```

**500 Internal Server Error**
```json
{
  "error": "エラーメッセージ"
}
```

### バリデーション
- `username`: バリデーション関数でチェック（指定時のみ）
- `email`: バリデーション関数でチェック（指定時のみ）
- すべてのフィールドは任意

## 使用例

### 設定取得
```typescript
const response = await fetch('/api/user/settings', {
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const settings = await response.json();
console.log('ユーザー名:', settings.username);
```

### 初回登録
```typescript
const response = await fetch('/api/user/settings', {
  method: 'POST',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'john_doe',
    nativeLanguageId: 'lang-ja-id',
    defaultLearningLanguageId: 'lang-en-id',
    iconUrl: 'https://example.com/avatar.jpg'
  })
});
const settings = await response.json();
```

### 設定更新
```typescript
const response = await fetch('/api/user/settings', {
  method: 'PUT',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN',
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    username: 'new_username'
  })
});
const updatedSettings = await response.json();
```

### React コンポーネントでの使用
```typescript
function UserSettingsForm() {
  const [settings, setSettings] = useState<UserSettings | null>(null);
  const [loading, setLoading] = useState(true);
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    try {
      const response = await fetch('/api/user/settings', {
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN'
        }
      });
      const data = await response.json();
      setSettings(data);
    } catch (error) {
      console.error('Failed to fetch settings:', error);
    } finally {
      setLoading(false);
    }
  };
  
  const updateSettings = async (updates: Partial<UserSettings>) => {
    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: {
          'Authorization': 'Bearer YOUR_TOKEN',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updates)
      });
      const updatedSettings = await response.json();
      setSettings(updatedSettings);
    } catch (error) {
      console.error('Failed to update settings:', error);
    }
  };
  
  if (loading) return <div>Loading...</div>;
  
  return (
    <div>
      <h2>ユーザー設定</h2>
      <p>ユーザー名: {settings?.username}</p>
      {/* 設定フォーム */}
    </div>
  );
}
```

## バリデーション詳細

### ユーザー名
- `validateUsername` 関数を使用
- 詳細は実装を参照（`@/utils/api-helpers`）

### メールアドレス
- `validateEmail` 関数を使用
- 詳細は実装を参照（`@/utils/api-helpers`）

### 必須フィールド（POST時）
- `validateRequiredFields` 関数を使用
- `username`, `nativeLanguageId`, `defaultLearningLanguageId` が必須

## セキュリティ
- ユーザーは自分の設定のみアクセス可能
- 言語IDは実在する削除されていない言語のみ受付

## 関連ヘルパー関数
- `authenticateRequest` (`@/utils/api-helpers`)
- `validateUsername` (`@/utils/api-helpers`)
- `validateEmail` (`@/utils/api-helpers`)
- `validateRequiredFields` (`@/utils/api-helpers`)
- `getUserSettings` (`@/utils/database-helpers`)
- `createUserSettings` (`@/utils/database-helpers`)
- `updateUserSettings` (`@/utils/database-helpers`)
- `checkUserExists` (`@/utils/database-helpers`)

## 関連型定義
- `UserSettings` (内部型)
- `ApiErrorResponse` (`@/types/api`)
