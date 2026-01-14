# CLAUDE.md

このファイルはClaude Code (claude.ai/code) がこのリポジトリで作業する際のガイドです。

## プロジェクト概要

Solo Speakは、AIを活用した多言語学習プラットフォームです。AIによるフレーズ翻訳（3スタイル：一般、丁寧、カジュアル）、音声認識を使ったスピーキング練習、クイズモード、スピーチ添削機能を提供します。9言語対応、TTS音声再生、ランキングシステムを搭載。

## 技術スタック

- **フロントエンド**: Next.js 15 (App Router), React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes, Prisma ORM, PostgreSQL
- **認証・ストレージ**: Supabase
- **AI**: OpenAI GPT-4o-mini, Google Cloud TTS
- **決済**: Stripe
- **音声**: FFmpeg (Safari互換性), Web Speech API

## 基本コマンド

```bash
npm install --legacy-peer-deps   # 依存関係インストール（必ず--legacy-peer-depsを使用）
npm run dev:local                # ローカル開発サーバー起動
npm run build:local              # ローカルビルド
npm run lint                     # ESLint実行
```

全コマンド一覧: [docs/setup.md](docs/setup.md#開発コマンド一覧)

### コマンドドキュメントのルール

- **正式な情報源**: [docs/setup.md](docs/setup.md) のみ
- **コマンド修正時**: setup.mdを更新後、`grep "npm run" docs/` で他ファイルのインライン記載も確認・修正
- **ドキュメント更新時**: setup.md以外にコードブロック形式（```bash）でコマンドを追加しない

## 重要な規約

### Prismaクライアント

- 出力先: `src/generated/prisma`（デフォルトと異なる）
- インポート: `import { prisma } from "@/utils/prisma"`

### APIルートパターン

すべてのAPIルートは以下の順序で処理：

1. `authenticateRequest(request)` - JWT認証
2. Zodスキーマでバリデーション
3. ビジネスロジック実行
4. エラーレスポンスを返却

※ ユーザー向けエラーメッセージをローカライズする場合のみ `getLocaleFromRequest()` と `getTranslation()` を使用

### TypeScriptパス

- `@/` エイリアスで `src/` を参照（例: `@/utils/prisma`）

## 必須ルール

- `npm install` では必ず `--legacy-peer-deps` を使用
- `.env` ファイルはコミット禁止（`.env.local` を使用）
- APIルートでは必ず `authenticateRequest()` で認証（Stripe Webhookを除く）
- 複数ステップのDB操作はPrismaトランザクションを使用

### 自動実行禁止事項（重要）

以下の操作は**絶対に自動実行しない**。必ずユーザーに確認し、明示的な許可を得てから実行すること。

- **DBマイグレーション**: `prisma migrate dev`, `prisma migrate deploy`, `prisma migrate reset` 等
- **テーブル定義・スキーマ変更**: `schema.prisma` の変更後のマイグレーション適用
- **DB初期化・シード**: `prisma db push`, `prisma db seed`, `prisma migrate reset` 等
- **本番環境への変更**: デプロイ、本番DB操作、本番環境の設定変更
- **破壊的なDB操作**: データ削除、テーブルDROP、カラム削除を伴う変更

これらの操作が必要な場合は、コマンドを提示して実行の許可を求めること。

## 実装ワークフロー（必須）

機能追加・バグ修正・既存機能修正を依頼された場合は、対応するコマンドを使用すること。

| 指示のタイプ | コマンド          | 詳細                                                    |
| ------------ | ----------------- | ------------------------------------------------------- |
| 新機能追加   | `/add-feature`    | [add-feature.md](.claude/commands/add-feature.md)       |
| バグ修正     | `/fix-bug`        | [fix-bug.md](.claude/commands/fix-bug.md)               |
| 既存機能修正 | `/modify-feature` | [modify-feature.md](.claude/commands/modify-feature.md) |

**例外**: ユーザーが「設計不要」と明示、または1ファイル以内の小規模変更はスキップ可。
スキップ時は「設計ドキュメントなしで実装を進めてよいですか？」と確認すること。

## 詳細ドキュメント

タスクに関連する場合のみ、以下のドキュメントを参照してください。
また、実装を修正した場合、関連する詳細ドキュメントも最新化すること。

| ドキュメント                                                     | 参照タイミング                        |
| ---------------------------------------------------------------- | ------------------------------------- |
| [docs/architecture.md](docs/architecture.md)                     | プロジェクト構造を理解するとき        |
| [docs/frontend/components.md](docs/frontend/components.md)       | コンポーネントを作成・修正するとき    |
| [docs/frontend/hooks.md](docs/frontend/hooks.md)                 | カスタムフックを作成するとき          |
| [docs/backend/api-routes.md](docs/backend/api-routes.md)         | APIエンドポイントを追加・修正するとき |
| [docs/backend/database.md](docs/backend/database.md)             | DBクエリ・スキーマ変更するとき        |
| [docs/shared/types.md](docs/shared/types.md)                     | 型定義を追加・修正するとき            |
| [docs/api/README.md](docs/api/README.md)                         | API仕様を確認するとき                 |
| [docs/ai-prompts.md](docs/ai-prompts.md)                         | AIプロンプトを修正・追加するとき      |
| [docs/testing.md](docs/testing.md)                               | テストを実装・実行するとき            |
| [docs/setup.md](docs/setup.md)                                   | 環境構築するとき                      |
| [docs/deployment.md](docs/deployment.md)                         | デプロイするとき                      |
| [docs/troubleshooting.md](docs/troubleshooting.md)               | 問題が発生したとき                    |
| [docs/glossary.md](docs/glossary.md)                             | 用語定義を確認・更新するとき          |
| [docs/development-guidelines.md](docs/development-guidelines.md) | 開発規約を確認するとき                |
| [docs/templates/](docs/templates/)                               | 設計・開発テンプレートを確認するとき  |
| [docs/steering/](docs/steering/)                                 | 進行中・完了した設計を確認するとき    |
