# POST /api/speech/[id]/practice

スピーチの練習を記録します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]/practice` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/practice/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
```

### パスパラメータ

| パラメータ | 型 | 必須 | 説明 |
|-----------|-----|------|------|
| id | string | Yes | スピーチID |

### ボディ

不要

## レスポンス

### 成功時 (200 OK)

```typescript
interface RecordPracticeResponse {
  message: string;
  speech: {
    id: string;
    practiceCount: number;
    lastPracticedAt: Date | null;
  };
}
```

**例:**

```json
{
  "message": "Practice recorded successfully",
  "speech": {
    "id": "cm1abc123",
    "practiceCount": 6,
    "lastPracticedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 401 | 認証エラー |
| 403 | アクセス権限なし |
| 404 | スピーチが見つからない |
| 500 | 内部サーバーエラー |

## 実装詳細

### 更新内容

```typescript
await prisma.speech.update({
  where: { id },
  data: {
    practiceCount: { increment: 1 },
    lastPracticedAt: new Date(),
  },
});
```

### 更新されるフィールド

| フィールド | 説明 |
|-----------|------|
| practiceCount | 練習回数を1増加 |
| lastPracticedAt | 現在日時に更新 |

### セキュリティ

- スピーチの存在確認
- ユーザーIDの一致確認

## 使用例

```typescript
// フロントエンドでの使用例
// 復習練習完了時に呼び出し
const response = await fetch(`/api/speech/${speechId}/practice`, {
  method: 'POST',
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { speech } = await response.json();
console.log(`${speech.practiceCount}回目の練習を記録しました`);
```

## 関連ファイル

- 型定義: `src/types/speech.ts`
- 復習API: `src/app/api/speech/review/route.ts`
