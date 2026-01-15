# システムアーキテクチャ

## 概要

Solo SpeakはNext.js 15のApp Routerを使用したフルスタックアプリケーションです。

## ディレクトリ構造と主要ファイル

```
src/
├── app/                           # Next.js App Router
│   └── api/                       # APIルート（49エンドポイント）
│       ├── phrase/route.ts        # GET/POST /api/phrase
│       ├── phrase/[id]/route.ts   # GET/PUT/DELETE /api/phrase/[id]
│       ├── phrase/generate/route.ts # POST AI翻訳生成
│       └── ...
│
├── components/                    # Reactコンポーネント（68個）
│   ├── common/                    # 汎用（BaseModal, LoadingSpinner等）
│   ├── phrase/                    # フレーズ関連
│   └── ...
│
├── hooks/                         # カスタムフック（43個）
│   ├── api/                       # useApi, useReactQueryApi
│   ├── phrase/                    # usePhraseList, usePhraseManager
│   └── ...
│
├── types/                         # TypeScript型定義
│   ├── api.ts                     # ApiErrorResponse等
│   ├── phrase.ts                  # PhraseData, CreatePhraseRequestBody等
│   └── ...
│
├── utils/                         # ユーティリティ
│   ├── prisma.ts                  # Prismaクライアント
│   ├── api-helpers.ts             # authenticateRequest等
│   ├── api-i18n.ts                # getLocaleFromRequest, getTranslation
│   └── ...
│
├── contexts/                      # Reactコンテキスト
│   ├── AuthContext.tsx            # 認証状態管理
│   └── LanguageContext.tsx        # 言語設定
│
└── generated/prisma/              # Prisma生成ファイル（カスタム出力先）
```

---

## 重要な注意事項

### Prismaクライアントの出力先

```
src/generated/prisma/  ← デフォルトと異なる
```

インポート: `import { prisma } from "@/utils/prisma"`

### npm install

`npm install --legacy-peer-deps` を使用（必須）。コマンド一覧: [docs/setup.md](setup.md)

### 論理削除

すべてのテーブルに `deletedAt` カラムがあり、クエリ時は `deletedAt: null` で絞り込む。

### 認証必須

すべてのAPIルートで `authenticateRequest()` を呼び出す（Stripe Webhookを除く）。

---

## 詳細ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [frontend/components.md](frontend/components.md) | コンポーネント一覧・作成パターン |
| [frontend/hooks.md](frontend/hooks.md) | カスタムフック実装パターン |
| [backend/api-routes.md](backend/api-routes.md) | APIルート実装パターン |
| [backend/database.md](backend/database.md) | DBスキーマ・クエリパターン |
| [shared/types.md](shared/types.md) | 型定義パターン |
| [api/README.md](api/README.md) | API仕様一覧 |
