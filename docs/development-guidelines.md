# Solo Speak 開発ガイドライン

このドキュメントはプロジェクト全体で遵守すべき開発規約をまとめています。
新機能の設計時、このガイドラインに準拠してください。

## 1. コーディング規約

### 命名規則

| 対象 | 規則 | 例 |
|------|------|-----|
| ファイル名（コンポーネント） | PascalCase | `PhraseCard.tsx` |
| ファイル名（その他） | kebab-case | `api-helpers.ts` |
| 関数名 | camelCase | `fetchPhraseList` |
| 定数 | UPPER_SNAKE_CASE | `MAX_PHRASE_LENGTH` |
| 型名・インターフェース | PascalCase | `PhraseData` |
| APIエンドポイント | kebab-case | `/api/phrase-list` |
| 環境変数 | UPPER_SNAKE_CASE | `DATABASE_URL` |

### インポート順序

```typescript
// 1. 外部ライブラリ
import { useState, useEffect } from 'react';
import { z } from 'zod';

// 2. 内部モジュール（@/エイリアス）
import { prisma } from '@/utils/prisma';
import { authenticateRequest } from '@/utils/api-helpers';

// 3. 型定義
import type { PhraseData } from '@/types/phrase';

// 4. ローカルファイル
import { localHelper } from './helpers';
```

### TypeScript

- `@/` エイリアスで `src/` を参照
- `any` 型の使用は禁止（やむを得ない場合は `unknown` を使用）
- 明示的な型定義を推奨（型推論に頼りすぎない）

## 2. APIルート規約

### 必須パターン

すべてのAPIルートは以下の順序で処理:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { authenticateRequest } from '@/utils/api-helpers';
import { prisma } from '@/utils/prisma';

const RequestSchema = z.object({
  field: z.string().min(1),
});

export async function POST(request: NextRequest) {
  // 1. 認証（必須）※Stripe Webhookを除く
  const authResult = await authenticateRequest(request);
  if ('error' in authResult) {
    return authResult.error;
  }
  const { userId } = authResult;

  // 2. リクエストボディ取得とバリデーション（必須）
  const body = await request.json();
  const validated = RequestSchema.safeParse(body);
  if (!validated.success) {
    return NextResponse.json(
      { error: 'Validation error', details: validated.error.errors },
      { status: 400 }
    );
  }

  // 3. ビジネスロジック
  try {
    const result = await prisma.entity.create({
      data: {
        userId,
        ...validated.data,
      },
    });

    // 4. 成功レスポンス
    return NextResponse.json(result);
  } catch (error) {
    // 5. エラーハンドリング
    console.error('API Error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### エラーレスポンス形式

```typescript
interface ApiErrorResponse {
  error: string;
  details?: unknown;
}
```

### ローカライズ

ユーザー向けエラーメッセージをローカライズする場合のみ:

```typescript
import { getLocaleFromRequest, getTranslation } from '@/utils/i18n';

const locale = getLocaleFromRequest(request);
const t = getTranslation(locale);
```

## 3. データベース規約

### Prismaクライアント

- **出力先**: `src/generated/prisma`（デフォルトと異なる）
- **インポート**: `import { prisma } from "@/utils/prisma"`

### 必須カラム

すべてのテーブルに以下を含める:

```sql
id         UUID PRIMARY KEY DEFAULT gen_random_uuid()
created_at TIMESTAMP NOT NULL DEFAULT NOW()
updated_at TIMESTAMP NOT NULL DEFAULT NOW()
deleted_at TIMESTAMP  -- 論理削除用（必要に応じて）
```

### クエリパターン

```typescript
// 論理削除を考慮したクエリ
const items = await prisma.entity.findMany({
  where: {
    userId,
    deletedAt: null,  // 論理削除されていないもののみ
  },
});

// 複数操作はトランザクション（必須）
await prisma.$transaction([
  prisma.entity.update({ where: { id }, data: { ... } }),
  prisma.relatedEntity.create({ data: { ... } }),
]);

// または
await prisma.$transaction(async (tx) => {
  const entity = await tx.entity.update({ ... });
  await tx.relatedEntity.create({ ... });
  return entity;
});
```

### マイグレーション

- 実行前に必ずユーザーの許可を得る
- `npm run db:migrate:local` でローカル実行

## 4. コンポーネント規約

### Props型定義

```typescript
interface ComponentProps {
  // 必須Props
  data: DataType;

  // オプションProps（デフォルト値を設定）
  variant?: 'primary' | 'secondary';
  onAction?: () => void;
}

export function Component({
  data,
  variant = 'primary',
  onAction
}: ComponentProps) {
  // ...
}
```

### 状態管理

- ローカル状態: `useState`
- 複雑な状態: `useReducer`
- サーバー状態: カスタムフック（`useSWR` パターン）

### エラーハンドリング

- ローディング状態を必ず表示
- エラー時はユーザーにフィードバック
- 可能な場合はリトライ機能を提供

## 5. セキュリティ規約

### 必須チェック項目

- [ ] すべてのAPIで `authenticateRequest()` を使用（Stripe Webhook除く）
- [ ] ユーザーは自身のデータのみアクセス可能（`userId` で絞り込み）
- [ ] 入力値はZodスキーマでバリデーション
- [ ] 機密情報はログに出力しない
- [ ] 環境変数は `.env.local` で管理（コミット禁止）

### 禁止事項

- `eval()` の使用
- ユーザー入力をそのままクエリに使用
- 機密情報のハードコーディング

## 6. パフォーマンス規約

### DBクエリ

- N+1クエリを避ける（`include` / `select` を活用）
- 大量データは `take` / `skip` でページネーション
- 必要なカラムのみ取得（`select` を使用）
- 適切なインデックスを設計

### フロントエンド

- 画像は適切なサイズに圧縮
- 不要な再レンダリングを防ぐ（`useMemo` / `useCallback`）
- 遅延ローディングを活用
- バンドルサイズを意識

## 7. テスト規約

### テスト対象

| 対象 | 必須/推奨 | ツール |
|------|----------|--------|
| APIルート | 必須 | Jest + Supertest |
| ユーティリティ関数 | 必須 | Jest |
| コンポーネント | 推奨 | React Testing Library |
| E2E | 推奨 | Playwright |

### テスト命名

```typescript
describe('機能名', () => {
  it('正常系: 期待する動作', () => {});
  it('異常系: エラーケース', () => {});
});
```

## 8. Git規約

### ブランチ命名

```
# 小規模変更（〜200行）
feature/{機能名}     # 新機能
fix/{バグ名}         # バグ修正
refactor/{対象}      # リファクタリング
docs/{対象}          # ドキュメント更新
modify/{機能名}      # 既存機能修正

# 大規模変更（200行超）- PR分割用
release/{機能名}              # リリースブランチ（機能の統合先）
feature/{機能名}/design       # 設計ドキュメント用
feature/{機能名}/backend      # バックエンド実装用
feature/{機能名}/frontend     # フロントエンド実装用
```

### PR分割フロー（大規模変更時）

200行を超える変更では、レビューしやすい単位でPRを分割:

```
main ──► release/{機能名} ──┬── feature/{機能名}/design    → 設計PR
                           ├── feature/{機能名}/backend   → バックエンドPR
                           ├── feature/{機能名}/frontend  → フロントエンドPR
                           └──► main                      → リリースPR
```

詳細: [docs/branching-strategy.md](/docs/branching-strategy.md)

### コミットメッセージ

```
feat: 新機能の追加
fix: バグ修正
refactor: リファクタリング
docs: ドキュメント更新
style: コードフォーマット
test: テスト追加・修正
chore: ビルド・設定の変更
```

### コミット時の注意

- `.env` ファイルはコミット禁止
- 大きな変更は小さなコミットに分割
- WIP コミットは避ける

---

## 参照

- [CLAUDE.md](/CLAUDE.md) - プロジェクトガイドライン
- [docs/backend/api-routes.md](/docs/backend/api-routes.md) - APIルート詳細
- [docs/backend/database.md](/docs/backend/database.md) - DB設計詳細
- [docs/frontend/components.md](/docs/frontend/components.md) - コンポーネント詳細
- [docs/testing.md](/docs/testing.md) - テスト戦略
- [docs/branching-strategy.md](/docs/branching-strategy.md) - ブランチ戦略・PR分割
