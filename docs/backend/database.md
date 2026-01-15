# データベーススキーマ

## Prisma設定

**ファイル**: `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../src/generated/prisma"  // カスタム出力先（重要）
}
```

**インポート**: `import { prisma } from "@/utils/prisma"`

---

## テーブル一覧とリレーション

完全なER図は **[er-diagram.md](./er-diagram.md)** を参照してください。

### テーブル一覧

| テーブル | 説明 |
|----------|------|
| User | ユーザー情報 |
| Language | 言語マスター（9言語） |
| PhraseLevel | フレーズ習熟度（7段階） |
| Phrase | 学習フレーズ |
| QuizResult | クイズ結果 |
| SpeakLog | 発話ログ |
| Situation | シチュエーション |
| Speech | スピーチ |
| SpeechFeedback | スピーチフィードバック |
| SpeechPlan | スピーチプラン |
| SpeechStatus | スピーチステータス（4段階） |

### 主要リレーション

```
User (1) ───► (n) Phrase, Speech, Situation
User (n) ◄───► (1) Language [native, learning]

Phrase (n) ◄──► (1) User, Language, PhraseLevel
Phrase (n) ◄──► (0..1) Speech
Phrase (1) ──► (n) QuizResult, SpeakLog

Speech (n) ◄──► (1) User, SpeechStatus
Speech (n) ◄──► (1) Language [learning, native]
Speech (1) ──► (n) SpeechFeedback, SpeechPlan, Phrase
```

---

## よく使うクエリパターン

### 論理削除

```typescript
// 取得時は常に deletedAt: null を指定
const items = await prisma.phrase.findMany({
  where: {
    userId,
    deletedAt: null,  // 重要
  },
});

// 論理削除の実行
await prisma.phrase.update({
  where: { id: phraseId },
  data: { deletedAt: new Date() },
});
```

### 並列クエリ

```typescript
// パフォーマンス向上のため Promise.all を使用
const [phrases, total, user] = await Promise.all([
  prisma.phrase.findMany({ ... }),
  prisma.phrase.count({ ... }),
  prisma.user.findUnique({ ... }),
]);
```

### トランザクション

```typescript
// 複数の関連レコードを一括操作
const result = await prisma.$transaction(async (tx) => {
  const speech = await tx.speech.create({ ... });
  await tx.speechFeedback.createMany({ ... });
  await tx.speechPlan.create({ ... });
  return speech;
});
```

### インクリメント更新

```typescript
// カウンタの増加
await prisma.phrase.update({
  where: { id: phraseId },
  data: {
    totalSpeakCount: { increment: 1 },
    dailySpeakCount: { increment: 1 },
    lastSpeakDate: new Date(),
  },
});
```

### 一括更新（updateMany）

```typescript
// セッションリセット
await prisma.phrase.updateMany({
  where: {
    userId,
    sessionSpoken: true,
  },
  data: {
    sessionSpoken: false,
  },
});
```

### select / include の使い分け

```typescript
// select: 必要なフィールドのみ取得（パフォーマンス向上）
const user = await prisma.user.findUnique({
  where: { id: userId },
  select: {
    id: true,
    username: true,
    iconUrl: true,
  },
});

// include: リレーションを含める
const phrase = await prisma.phrase.findUnique({
  where: { id: phraseId },
  include: {
    language: true,
    phraseLevel: true,
  },
});

// include + select: リレーションの特定フィールドのみ
const phrase = await prisma.phrase.findUnique({
  where: { id: phraseId },
  include: {
    language: {
      select: {
        id: true,
        name: true,
        code: true,
      },
    },
    user: {
      select: {
        id: true,
        username: true,
      },
    },
  },
});
```

### N+1問題の回避

```typescript
// NG: N+1クエリ（各ユーザーごとにクエリ発行）
const users = await prisma.user.findMany();
for (const user of users) {
  const phrases = await prisma.phrase.findMany({
    where: { userId: user.id },
  });
}

// OK: include で一括取得
const users = await prisma.user.findMany({
  include: {
    phrases: true,
  },
});

// OK: Promise.all で並列化（独立したクエリの場合）
const [user, phrases, language] = await Promise.all([
  prisma.user.findUnique({ where: { id: userId } }),
  prisma.phrase.findMany({ where: { userId } }),
  prisma.language.findUnique({ where: { code: languageCode } }),
]);
```

---

## マイグレーション

データベースコマンド一覧: [docs/setup.md](../setup.md#データベースコマンドローカル)

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| `prisma/schema.prisma` | スキーマ定義 |
| `prisma/seed.ts` | シードスクリプト |
| `prisma/migrations/` | マイグレーションファイル |
| `src/utils/prisma.ts` | Prismaクライアント |
| `src/utils/phrase-level-utils.ts` | レベル計算ロジック |
