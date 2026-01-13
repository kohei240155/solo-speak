# PUT /api/speech/[id]/notes

スピーチのメモを更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]/notes` |
| メソッド | `PUT` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/notes/route.ts` |

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
interface UpdateSpeechNotesRequest {
  notes: string;  // メモ内容
}
```

**例:**

```json
{
  "notes": "発音に注意。特に「th」の発音を練習する。"
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface UpdateSpeechNotesResponse {
  message: string;
  speech: {
    id: string;
    notes: string;
  };
}
```

**例:**

```json
{
  "message": "Notes updated successfully",
  "speech": {
    "id": "cm1abc123",
    "notes": "発音に注意。特に「th」の発音を練習する。"
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | notesが文字列でない |
| 401 | 認証エラー |
| 403 | アクセス権限なし |
| 404 | スピーチが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### バリデーション

```typescript
if (typeof notes !== "string") {
  return { error: "Notes must be a string" };
}
```

### セキュリティ

- スピーチの存在確認
- ユーザーIDの一致確認

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/speech/${speechId}/notes`, {
  method: 'PUT',
  headers: {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  },
  body: JSON.stringify({
    notes: '発音に注意',
  }),
});
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
