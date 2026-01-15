# PUT /api/speech/[id]

スピーチとフレーズを更新します。

## 概要

| 項目 | 内容 |
|------|------|
| エンドポイント | `/api/speech/[id]` |
| メソッド | `PUT` |
| 認証 | 必要 |
| ファイル | `src/app/api/speech/[id]/route.ts` |

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
interface UpdateSpeechRequest {
  title: string;  // 最大50文字
  phrases: Array<{
    phraseId: string;
    original: string;     // 最大500文字
    translation: string;  // 最大500文字
  }>;
}
```

**例:**

```json
{
  "title": "自己紹介（更新版）",
  "phrases": [
    {
      "phraseId": "phrase_1",
      "original": "Hello, my name is John Smith.",
      "translation": "こんにちは、私の名前はジョン・スミスです。"
    },
    {
      "phraseId": "phrase_2",
      "original": "I work as a software engineer.",
      "translation": "私はソフトウェアエンジニアとして働いています。"
    }
  ]
}
```

### バリデーション（Zod）

```typescript
const updateSpeechSchema = z.object({
  title: z.string().max(50),
  phrases: z.array(
    z.object({
      phraseId: z.string(),
      original: z.string().max(500),
      translation: z.string().max(500),
    }),
  ),
});
```

## レスポンス

### 成功時 (200 OK)

```json
{
  "message": "Speech updated successfully"
}
```

### エラー時

| ステータス | 説明 |
|-----------|------|
| 400 | バリデーションエラー |
| 401 | 認証エラー |
| 404 | スピーチが見つからない、またはアクセス権限なし |
| 500 | 内部サーバーエラー |

## 実装詳細

### トランザクション処理

スピーチとフレーズの更新は単一トランザクションで実行：

```typescript
await prisma.$transaction(async (tx) => {
  // スピーチのタイトルを更新
  await tx.speech.update({
    where: { id },
    data: { title },
  });

  // 各フレーズを更新
  for (const phrase of phrases) {
    await tx.phrase.update({
      where: {
        id: phrase.phraseId,
        userId: authResult.user.id,
      },
      data: {
        original: phrase.original,
        translation: phrase.translation,
      },
    });
  }
});
```

### セキュリティ

- 認証されたユーザーのスピーチのみ更新可能
- フレーズ更新時もユーザーIDをチェック

## 関連ファイル

- 型定義: `src/types/speech.ts`
