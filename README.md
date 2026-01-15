# Solo Speak

AI-Powered Multilingual Learning Platform

## 概要

Solo Speakは、AIを活用した多言語学習プラットフォームです。ユーザーが話したいフレーズを入力すると、AIが3つのスタイル（一般、丁寧、カジュアル）で翻訳を生成し、音声付きで学習できます。

### 主な機能

| 機能 | 説明 |
|------|------|
| **AIフレーズ生成** | GPT-4o-miniによる3スタイル翻訳、7段階レベルシステム |
| **スピーキング練習** | 音声認識によるリアルタイム発音練習 |
| **スピーチ添削** | AI添削、スピーキングプラン、習熟度管理（A〜D） |
| **クイズモード** | 4択クイズ、正答率・連続記録トラッキング |
| **ランキング** | クイズ、スピーキング、連続学習日数のランキング |
| **多言語対応** | 9言語対応（英語、日本語、韓国語、中国語、スペイン語、フランス語、ポルトガル語、ドイツ語、タイ語） |

## 技術スタック

| カテゴリ | 技術 |
|----------|------|
| **フロントエンド** | Next.js 15, React 19, TypeScript, Tailwind CSS |
| **バックエンド** | Next.js API Routes, Prisma ORM, PostgreSQL |
| **認証・ストレージ** | Supabase (Auth, Storage) |
| **AI** | OpenAI GPT-4o-mini, Google Cloud Text-to-Speech |
| **決済** | Stripe |
| **音声処理** | FFmpeg, Web Speech API |

## クイックスタート

**必要環境**: Node.js 18+, PostgreSQL, npm

```bash
git clone https://github.com/kohei240155/solo-speak.git
cd solo-speak
npm install --legacy-peer-deps
cp .env.example .env.local      # 環境変数を設定
npm run db:migrate:local && npm run db:seed:local
npm run dev:local
```

http://localhost:3000 でアプリケーションにアクセスできます。

詳細な環境構築手順・全コマンド一覧は [docs/setup.md](docs/setup.md) を参照してください。

## プロジェクト構造

```
src/
├── app/
│   ├── api/              # APIルート（49エンドポイント）
│   ├── phrase/           # フレーズ機能（生成、リスト、クイズ、スピーキング）
│   ├── speech/           # スピーチ機能（追加、リスト、レビュー）
│   ├── ranking/          # ランキング
│   ├── settings/         # ユーザー設定
│   └── dashboard/        # ダッシュボード
├── components/           # Reactコンポーネント（68個）
├── hooks/                # カスタムフック（43個）
├── types/                # TypeScript型定義
├── utils/                # ユーティリティ関数
├── contexts/             # Reactコンテキスト
├── prompts/              # AIプロンプト
└── generated/prisma/     # Prisma生成ファイル
```

詳細は [docs/architecture.md](docs/architecture.md) を参照してください。

## ドキュメント

| ドキュメント | 内容 |
|-------------|------|
| [docs/architecture.md](docs/architecture.md) | システムアーキテクチャ |
| [docs/setup.md](docs/setup.md) | 環境構築手順 |
| [docs/frontend/components.md](docs/frontend/components.md) | コンポーネント一覧 |
| [docs/frontend/hooks.md](docs/frontend/hooks.md) | カスタムフック |
| [docs/backend/api-routes.md](docs/backend/api-routes.md) | APIルート実装パターン |
| [docs/backend/database.md](docs/backend/database.md) | データベーススキーマ |
| [docs/shared/types.md](docs/shared/types.md) | 型定義パターン |
| [docs/api/README.md](docs/api/README.md) | API仕様 |
| [docs/ai-prompts.md](docs/ai-prompts.md) | AIプロンプト |
| [docs/deployment.md](docs/deployment.md) | デプロイ手順 |
| [docs/testing.md](docs/testing.md) | テスト方針 |
| [docs/troubleshooting.md](docs/troubleshooting.md) | トラブルシューティング |

## リンク

- **本番環境**: https://solo-speak.vercel.app
- **GitHub**: https://github.com/kohei240155/solo-speak

## ライセンス

MIT License
