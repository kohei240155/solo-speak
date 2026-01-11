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
# 依存関係インストール（必ず--legacy-peer-depsを使用）
npm install --legacy-peer-deps

# ローカル開発
npm run dev:local

# ビルド・リント
npm run build:local
npm run lint

# データベース
npm run db:migrate:local    # マイグレーション実行
npm run db:studio:local     # Prisma Studio起動
npm run db:seed:local       # シードデータ投入
```

## 重要な規約

### Prismaクライアント
- 出力先: `src/generated/prisma`（デフォルトと異なる）
- インポート: `import { prisma } from "@/utils/prisma"`

### APIルートパターン
すべてのAPIルートは以下の順序で処理：
1. `getLocaleFromRequest(request)` - ロケール取得
2. `authenticateRequest(request)` - JWT認証
3. Zodスキーマでバリデーション
4. ビジネスロジック実行
5. `getTranslation(locale, key)` でローカライズされたエラーを返却

### TypeScriptパス
- `@/` エイリアスで `src/` を参照（例: `@/utils/prisma`）

## 必須ルール

- `npm install` では必ず `--legacy-peer-deps` を使用
- `.env` ファイルはコミット禁止（`.env.local` を使用）
- APIルートでは必ず `authenticateRequest()` で認証
- エラーメッセージは必ず `getTranslation()` でローカライズ
- 複数ステップのDB操作はPrismaトランザクションを使用

## 詳細ドキュメント

タスクに関連する場合のみ、以下のドキュメントを参照してください：

## プロジェクト構造

```
src/
├── app/api/          # APIルート
├── components/       # Reactコンポーネント
├── hooks/            # カスタムフック
├── utils/            # ユーティリティ関数
├── prompts/          # AIプロンプト
└── generated/prisma/ # 生成されたPrismaクライアント
```

## 参考リンク

- 本番環境: https://solo-speak.vercel.app
- GitHub: https://github.com/kohei240155/solo-speak
