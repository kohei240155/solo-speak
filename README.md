# Solo Speak

言語学習アプリケーション - フレーズ学習、クイズ、スピーキング練習をサポート

## 技術スタック

- **フロントエンド**: Next.js 15.3.5, React 19, TypeScript
- **データベース**: PostgreSQL (Supabase)
- **認証**: Supabase Auth (Google OAuth)
- **ORM**: Prisma 6.11.1
- **スタイリング**: Tailwind CSS
- **デプロイ**: Vercel

## 環境設定

このプロジェクトは開発環境と本番環境で異なるSupabaseプロジェクトを使用します。

### 開発環境
- **Supabase Project**: `rxxhmujumdlltouyukbs.supabase.co`
- **サイトURL**: `http://localhost:3000`
- **設定ファイル**: `.env.local`

### 本番環境
- **Supabase Project**: `wswukmshauusgvklfwzv.supabase.co`
- **サイトURL**: `https://solo-speak-1q0xfm00p-solo-speaks-projects.vercel.app`
- **設定ファイル**: `.env.production`

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数の設定

開発環境用の設定は既に `.env.local` に設定済みです。

### 3. データベースの初期化

```bash
# 開発用データベースにスキーマを適用
npm run db:push

# 言語データをシード
npm run db:seed
```

## 開発環境での使用方法

### 基本的な開発

```bash
# 開発サーバーの起動（開発用データベース使用）
npm run dev

# ブラウザで http://localhost:3000 を開く
```

### データベース操作

```bash
# Prisma Studio の起動（開発用データベース）
npx prisma studio
# または
npm run db:studio

# データベーススキーマの更新
npm run db:push

# シードデータの投入
npm run db:seed
```

### 本番環境での確認

```bash
# 本番用設定で開発サーバーを起動
npm run dev:production

# 本番用データベースでPrisma Studio
npm run db:studio:production

# 本番用データベースにスキーマを適用
npm run db:push:production
```

## 利用可能なスクリプト

### 開発・ビルド
- `npm run dev` - 開発サーバー起動（開発用設定）
- `npm run dev:production` - 開発サーバー起動（本番用設定）
- `npm run build` - プロダクションビルド
- `npm run build:production` - プロダクションビルド（本番用設定）

### データベース操作
- `npm run db:push` - スキーマをデータベースに適用
- `npm run db:push:production` - 本番用データベースにスキーマを適用
- `npm run db:studio` - Prisma Studio起動
- `npm run db:studio:production` - 本番用データベースでPrisma Studio起動
- `npm run db:seed` - シードデータ投入
- `npm run db:seed:production` - 本番用データベースにシードデータ投入

## 認証設定

### Google OAuth設定

Google Cloud Platformで以下の設定が必要です：

1. **Google Cloud Console** → **APIとサービス** → **認証情報**
2. **承認済みのリダイレクトURI**に以下を追加：
   - 開発用: `https://rxxhmujumdlltouyukbs.supabase.co/auth/v1/callback`
   - 本番用: `https://wswukmshauusgvklfwzv.supabase.co/auth/v1/callback`

### Supabase設定

#### 開発用プロジェクト
- **Site URL**: `http://localhost:3000`
- **Redirect URLs**: `http://localhost:3000/auth/callback`

#### 本番用プロジェクト
- **Site URL**: `https://solo-speak-1q0xfm00p-solo-speaks-projects.vercel.app`
- **Redirect URLs**: `https://solo-speak-1q0xfm00p-solo-speaks-projects.vercel.app/auth/callback`

## デプロイ

### Vercel

1. Vercelプロジェクトに環境変数を設定（`.env.production`の内容）
2. 自動デプロイ設定

```bash
# ローカルでVercelデプロイ
vercel --prod
```

## プロジェクト構造

```
solo-speak/
├── prisma/
│   ├── schema.prisma        # データベーススキーマ
│   ├── seed.ts             # シードデータ
│   └── seed_languages.sql  # 言語データ（SQL）
├── src/
│   ├── app/                # Next.js App Router
│   ├── components/         # Reactコンポーネント
│   ├── contexts/          # React Context
│   ├── generated/         # Prisma生成ファイル
│   └── utils/             # ユーティリティ
├── .env.local             # 開発環境設定
├── .env.production        # 本番環境設定
└── package.json
```

## 機能

- **認証**: Google OAuth による認証
- **ユーザー管理**: プロフィール設定、言語設定
- **フレーズ学習**: 多言語対応フレーズ管理
- **クイズ機能**: 学習効果測定
- **スピーキング練習**: 発音練習機能（予定）

## 開発者向け情報

### データベースモデル

- **User**: ユーザー情報
- **Language**: 言語マスター
- **Phrase**: フレーズデータ
- **PhraseLevel**: フレーズレベル
- **QuizResult**: クイズ結果
- **SpeakLog**: スピーキングログ

### 環境変数

必要な環境変数は以下の通りです：

```bash
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# データベース
DATABASE_URL=
DIRECT_URL=

# アプリケーション
NEXT_PUBLIC_SITE_URL=
```

## トラブルシューティング

### 認証エラー
- Supabaseの認証設定を確認
- Google OAuth設定を確認
- リダイレクトURLの設定を確認

### データベースエラー
- 環境変数の設定を確認
- Prismaスキーマの同期状態を確認
- 接続情報の正確性を確認

## ライセンス

このプロジェクトは MIT ライセンスの下で提供されています。
