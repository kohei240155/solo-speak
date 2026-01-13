# POST /api/situations

新しいシチュエーションを作成します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/situations` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/situations/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface CreateSituationRequest {
  name: string;  // シチュエーション名（1-20文字）
}
```

**例:**

```json
{
  "name": "ビジネス会議"
}
```

## レスポンス

### 成功時 (201 Created)

```typescript
interface CreateSituationResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}
```

**例:**

```json
{
  "id": "sit_123",
  "name": "ビジネス会議",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | 名前が必要、または20文字超過 |
| 401 | 認証エラー |
| 409 | 同じ名前のシチュエーションが既に存在 |
| 500 | 内部サーバーエラー |

**例（バリデーションエラー）:**

```json
{
  "error": "Situation name must be 20 characters or less"
}
```

**例（重複エラー）:**

```json
{
  "error": "Situation with this name already exists"
}
```

## 実装詳細

### バリデーション

1. 名前が必須（空文字不可）
2. 名前は20文字以下
3. 同じ名前のシチュエーションが存在しないこと

### 重複チェック

```typescript
const existingSituation = await prisma.situation.findFirst({
  where: {
    userId: user.id,
    name: body.name.trim(),
    deletedAt: null,
  },
});
```

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch('/api/situations', {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    name: 'ビジネス会議',
  }),
});

if (response.status === 201) {
  const situation = await response.json();
  console.log(`シチュエーション「${situation.name}」を作成しました`);
}
```

## 関連ファイル

- 型定義: `src/types/situation.ts`
