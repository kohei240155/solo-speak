# DELETE /api/user/withdrawal

ユーザーを退会（物理削除）します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/user/withdrawal` |
| メソッド | `DELETE` |
| 認証 | 必要 |
| ファイル | `src/app/api/user/withdrawal/route.ts` |

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
interface WithdrawalResponse {
  success: true;
}
```

**例:**

```json
{
  "success": true
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 500 | 内部サーバーエラー |

## 実装詳細

### 削除対象データ

トランザクションで以下のデータを物理削除（順序が重要）：

1. **SpeakLog**: ユーザーのフレーズに紐づく音読ログ
2. **QuizResult**: ユーザーのフレーズに紐づくクイズ結果
3. **Phrase**: ユーザーのフレーズ
4. **Situation**: ユーザーのシチュエーション
5. **User**: ユーザー本体

### トランザクション処理

```typescript
await prisma.$transaction(async (tx) => {
  await tx.speakLog.deleteMany({ where: { phrase: { userId } } });
  await tx.quizResult.deleteMany({ where: { phrase: { userId } } });
  await tx.phrase.deleteMany({ where: { userId } });
  await tx.situation.deleteMany({ where: { userId } });
  await tx.user.delete({ where: { id: userId } });
});
```

### ストレージ削除

- ユーザーのアイコンがSupabase Storageに保存されている場合、ファイルも削除
- ストレージ削除エラーは退会処理を止めない（ログ出力のみ）

### Supabase URLの判定

URLに `supabase` が含まれている場合のみストレージ削除を試行。

## 注意事項

- この操作は取り消せません
- 関連するすべてのデータが完全に削除されます
- Stripeのサブスクリプションは別途キャンセル処理が必要な場合があります

## 使用例

```typescript
// フロントエンドでの使用例
const confirmWithdrawal = async () => {
  if (!confirm('本当に退会しますか？この操作は取り消せません。')) {
    return;
  }

  const response = await fetch('/api/user/withdrawal', {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (response.ok) {
    // ログアウト処理
    await signOut();
    router.push('/');
  }
};
```

## 関連ファイル

- Supabaseクライアント: `src/utils/supabase-server.ts`
