# DELETE /api/phrase/[id]

指定されたフレーズを削除します（ソフトデリート）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/[id]` |
| メソッド | `DELETE` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/[id]/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | フレーズID |

## レスポンス

### 成功時 (200 OK)

```typescript
interface DeletePhraseResponseData {
  message: string;
}
```

**例:**

```json
{
  "message": "Phrase deleted successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | フレーズが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

**例:**

```json
{
  "error": "Phrase not found or access denied"
}
```

## 実装詳細

### ソフトデリート

物理削除ではなく、`deletedAt` フィールドに現在日時を設定することでソフトデリートを実装しています。

```typescript
await prisma.phrase.update({
  where: { id },
  data: {
    deletedAt: new Date(),
  },
});
```

### 削除後の影響

- フレーズ一覧には表示されなくなる
- クイズの出題対象から除外される
- 音読練習の対象から除外される
- ランキング計算には影響なし（削除前のデータは保持）

### セキュリティ

- 認証されたユーザーのフレーズのみ削除可能
- 他のユーザーのフレーズにはアクセス不可

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/phrase/${phraseId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (response.ok) {
  console.log('フレーズを削除しました');
}
```

## 関連ファイル

- 型定義: `src/types/phrase.ts`
