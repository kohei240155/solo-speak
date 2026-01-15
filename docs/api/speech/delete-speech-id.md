# DELETE /api/speech/[id]

スピーチを削除します（ソフトデリート）。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]` |
| メソッド | `DELETE` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | スピーチID |

## レスポンス

### 成功時 (200 OK)

```json
{
  "message": "Speech deleted successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 404 | スピーチが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

## 実装詳細

### ソフトデリート

物理削除ではなく、`deletedAt` フィールドに現在日時を設定：

```typescript
await prisma.speech.update({
  where: { id },
  data: {
    deletedAt: new Date(),
  },
});
```

### 削除後の影響

- スピーチ一覧には表示されなくなる
- 復習練習の対象から除外される
- 関連するフレーズとフィードバックは保持される

## 関連ファイル

- 型定義: `src/types/speech.ts`
