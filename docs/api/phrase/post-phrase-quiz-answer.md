# POST /api/phrase/quiz/answer

クイズの回答を記録します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/phrase/quiz/answer` |
| メソッド | `POST` |
| 認証 | 必要 |
| ファイル | `src/app/api/phrase/quiz/answer/route.ts` |

## リクエスト

### ヘッダー

```
Authorization: Bearer <jwt_token>
Content-Type: application/json
```

### ボディ

```typescript
interface QuizAnswerRequestBody {
  phraseId: string;    // フレーズID
  isCorrect: boolean;  // 正解かどうか
}
```

**例:**

```json
{
  "phraseId": "cm1abc123",
  "isCorrect": true
}
```

## レスポンス

### 成功時 (200 OK)

```typescript
interface QuizAnswerResponse {
  success: true;
  phrase: {
    id: string;
    correctQuizCount: number;
    incorrectQuizCount: number;
  };
}
```

**例:**

```json
{
  "success": true,
  "phrase": {
    "id": "cm1abc123",
    "correctQuizCount": 5,
    "incorrectQuizCount": 2
  }
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | phraseId と isCorrect が必要 |
| 401 | 認証エラー |
| 500 | 更新に失敗 |

**例:**

```json
{
  "error": "phraseId and isCorrect are required"
}
```

```json
{
  "success": false,
  "error": "Failed to update quiz result"
}
```

## 実装詳細

### トランザクション処理

フレーズの更新とクイズ結果の記録は単一トランザクションで実行：

```typescript
await prisma.$transaction(async (tx) => {
  // 1. フレーズの正解/不正解カウントを更新
  const updatedPhrase = await tx.phrase.update({
    where: {
      id: phraseId,
      userId: authResult.user.id, // セキュリティチェック
    },
    data: {
      ...(isCorrect
        ? { correctQuizCount: { increment: 1 } }
        : { incorrectQuizCount: { increment: 1 } }),
      lastQuizDate: new Date(),
    },
  });

  // 2. クイズ結果を記録
  await tx.quizResult.create({
    data: {
      phraseId,
      correct: isCorrect,
      date: new Date(),
    },
  });
});
```

### 更新されるフィールド

#### Phrase テーブル

| フィールド | 正解時 | 不正解時 |
|-----------|--------|---------|
| correctQuizCount | +1 | - |
| incorrectQuizCount | - | +1 |
| lastQuizDate | 現在日時 | 現在日時 |

#### QuizResult テーブル

| フィールド | 値 |
|-----------|-----|
| phraseId | フレーズID |
| correct | true / false |
| date | 現在日時 |

### セキュリティ

- 認証されたユーザーのフレーズのみ更新可能
- 他のユーザーのフレーズにはアクセス不可

## 使用例

```typescript
// フロントエンドでの使用例
async function submitQuizAnswer(phraseId: string, isCorrect: boolean) {
  const response = await fetch('/api/phrase/quiz/answer', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ phraseId, isCorrect }),
  });

  const data = await response.json();

  if (data.success) {
    console.log(`正解: ${data.phrase.correctQuizCount}回`);
    console.log(`不正解: ${data.phrase.incorrectQuizCount}回`);
  }
}
```

## 関連ファイル

- 型定義: `src/types/quiz.ts`
- クイズ取得: `src/app/api/phrase/quiz/route.ts`
- QuizResultモデル: `prisma/schema.prisma`
