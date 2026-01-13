# POST /api/phrases/reset-session

セッション内の音読フラグをリセットします。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrases/reset-session` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrases/reset-session/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### ボディ

不要

## レスポンス

### 成功時 (200 OK)

```typescript
interface ResetSessionResponse {
  success: true;
  message: string;
  count: number;  // リセットされたフレーズ数
}
```

**例:**

```json
{
  "success": true,
  "message": "Reset session_spoken for 42 phrases",
  "count": 42
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 500 | リセットに失敗 |

**例:**

```json
{
  "success": false,
  "error": "Failed to reset session_spoken"
}
```

## 実装詳細

### 処理内容

ユーザーに紐づくすべてのフレーズの `sessionSpoken` フラグを `false` にリセット：

```typescript
await prisma.phrase.updateMany({
  where: {
    userId: userId,
    deletedAt: null,
  },
  data: {
    sessionSpoken: false,
  },
});
```

### セッション管理の目的

- 同一セッション内で同じフレーズが繰り返し出題されるのを防ぐ
- ユーザーが意図的に「最初から」練習したい場合にリセット可能

### 使用タイミング

1. 音読練習を最初からやり直したい場合
2. 新しい練習セッションを開始する場合
3. すべてのフレーズを練習し終えた後に再度練習する場合

## 使用例

```typescript
// フロントエンドでの使用例
async function startNewSession() {
  const response = await fetch('/api/phrases/reset-session', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  const data = await response.json();

  if (data.success) {
    console.log(`${data.count}件のフレーズをリセットしました`);
    // 音読練習を開始
    startSpeakingPractice();
  }
}
```

## 関連ファイル

- 音読練習API: `src/app/api/phrase/speak/route.ts`
- 音読カウントAPI: `src/app/api/phrase/speak/count/route.ts`
