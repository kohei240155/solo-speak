# Situation by ID API

## 概要
特定のシチュエーションを削除するAPIエンドポイント。

## エンドポイント
`DELETE /api/situations/[id]`

## 認証
必要

## リクエスト

### パスパラメータ
| パラメータ | 型 | 説明 |
|----------|-----|------|
| id | string | シチュエーションID |

## レスポンス

### 成功時 (200 OK)
```json
{
  "message": "Situation deleted successfully"
}
```

### エラー時

#### シチュエーションが見つからない (404 Not Found)
```json
{
  "message": "Situation not found"
}
```

#### サーバーエラー (500 Internal Server Error)
```json
{
  "success": false,
  "error": "Failed to delete situation"
}
```

## 機能詳細
- 認証されたユーザーが所有するシチュエーションのみ削除可能
- 物理削除（データベースから完全に削除）
- 存在しないIDまたは他のユーザーのシチュエーションを削除しようとすると404エラー

## セキュリティ
- ユーザーは自分のシチュエーションのみ削除可能
- シチュエーションIDとユーザーIDの両方で検証

## 使用例
```typescript
const response = await fetch(`/api/situations/${situationId}`, {
  method: 'DELETE',
  headers: {
    'Authorization': 'Bearer YOUR_TOKEN'
  }
});
const result = await response.json();
```

## 関連エンドポイント
- `GET /api/situations` - シチュエーション一覧取得
- `POST /api/situations` - シチュエーション新規作成
