# DELETE /api/situations/[id]

シチュエーションを削除します（物理削除）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/situations/[id]` |
| メソッド | `DELETE` |
| 認証 | 必要 |
| ファイル | `src/app/api/situations/[id]/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | シチュエーションID |

## レスポンス

### 成功時 (200 OK)

```json
{
  "message": "Situation deleted successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | シチュエーションが見つからない |
| 500 | 削除に失敗 |

## 実装詳細

### 物理削除

ソフトデリートではなく、レコードを完全に削除します：

```typescript
await prisma.situation.delete({
  where: { id },
});
```

### セキュリティ

- シチュエーションの存在確認
- ユーザーIDの一致確認

## 使用例

```typescript
// フロントエンドでの使用例
const response = await fetch(`/api/situations/${situationId}`, {
  method: 'DELETE',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

if (response.ok) {
  console.log('シチュエーションを削除しました');
}
```

## 関連ファイル

- 型定義: `src/types/situation.ts`
