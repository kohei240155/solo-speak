# 環境構築ガイド

## 必要環境

| ツール | バージョン | 備考 |
|--------|-----------|------|
| Node.js | 18+ | 推奨: 20 LTS |
| npm | 9+ | Node.jsに付属 |
| PostgreSQL | 14+ | ローカル開発用 |
| Git | 2.30+ | |

## クイックスタート

以下の順序で実行してください。各ステップは前のステップに依存しています。

```bash
# 1. リポジトリをクローン
git clone https://github.com/kohei240155/solo-speak.git
cd solo-speak

# 2. 依存関係をインストール
# ※ --legacy-peer-deps は必須（React 19とサードパーティライブラリの互換性問題のため）
npm install --legacy-peer-deps

# 3. 環境変数を設定
cp .env.example .env.local
# .env.local を編集（下記「環境変数」セクション参照）

# 4. Prismaクライアントを生成（マイグレーション前に必須）
npm run generate

# 5. データベースをセットアップ（generateの後に実行）
npm run db:migrate:local
npm run db:seed:local

# 6. 開発サーバーを起動
npm run dev:local
```

### セットアップフロー図

```
npm install --legacy-peer-deps
        ↓
npm run generate（Prismaクライアント生成）
        ↓
npm run db:migrate:local（スキーマ適用）
        ↓
npm run db:seed:local（初期データ投入）
        ↓
npm run dev:local（開発サーバー起動）
```

## 環境変数

`.env.local` に以下の環境変数を設定します。

### 開発必須（これがないと起動しない）

| 変数名 | 説明 | 設定値 |
|--------|------|--------|
| `DATABASE_URL` | PostgreSQL接続URL | `postgresql://user:pass@localhost:5432/solo_speak` |
| `DIRECT_URL` | PostgreSQL直接接続URL | DATABASE_URLと同じ値 |

### 認証必須（認証機能を使う場合）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase プロジェクトURL | Supabase Dashboard > Settings > API |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key | Supabase Dashboard > Settings > API |

### AI機能（翻訳・添削機能を使う場合）

| 変数名 | 説明 | 取得方法 |
|--------|------|----------|
| `OPENAI_API_KEY` | OpenAI APIキー | OpenAI Platform > API Keys |

### オプション（特定機能のみ）

| 変数名 | 説明 | 用途 |
|--------|------|------|
| `GOOGLE_CLOUD_PROJECT_ID` | GCPプロジェクトID | TTS音声合成 |
| `GOOGLE_CLOUD_PRIVATE_KEY` | GCPサービスアカウント秘密鍵 | TTS音声合成 |
| `GOOGLE_CLOUD_CLIENT_EMAIL` | GCPサービスアカウントメール | TTS音声合成 |
| `STRIPE_SECRET_KEY` | Stripe シークレットキー | 決済機能 |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe 公開キー | 決済機能 |
| `STRIPE_WEBHOOK_SECRET` | Stripe Webhook署名シークレット | 決済Webhook |
| `NEXT_PUBLIC_APP_URL` | アプリケーションURL | OGP・リダイレクト |

### 設定例

```env
# Database（必須）
DATABASE_URL="postgresql://postgres:password@localhost:5432/solo_speak"
DIRECT_URL="postgresql://postgres:password@localhost:5432/solo_speak"

# Supabase（認証必須）
NEXT_PUBLIC_SUPABASE_URL="https://xxxxx.supabase.co"
NEXT_PUBLIC_SUPABASE_ANON_KEY="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# OpenAI（AI機能）
OPENAI_API_KEY="sk-..."

# Google Cloud (Optional - TTS音声合成用)
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n..."
GOOGLE_CLOUD_CLIENT_EMAIL="your-service@your-project.iam.gserviceaccount.com"

# Stripe (Optional - 決済用)
STRIPE_SECRET_KEY="sk_test_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."

# Application
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

## 外部サービスのセットアップ

### Supabase

1. [Supabase](https://supabase.com/) でプロジェクトを作成
2. **Settings > API** から URL と Anon Key を取得
3. **Authentication > Providers** で Google OAuth を有効化
4. **Storage** でバケット `audio-files` を作成（音声ファイル用）

### OpenAI

1. [OpenAI Platform](https://platform.openai.com/) でアカウント作成
2. **API Keys** でキーを生成

### Google Cloud (TTS用)

1. [Google Cloud Console](https://console.cloud.google.com/) でプロジェクト作成
2. **Text-to-Speech API** を有効化
3. **IAM & Admin > Service Accounts** でサービスアカウント作成
4. JSONキーをダウンロードし、環境変数に設定

### Stripe (決済用)

1. [Stripe Dashboard](https://dashboard.stripe.com/) でアカウント作成
2. **Developers > API keys** からキーを取得
3. **Webhooks** でエンドポイントを設定（本番環境用）

## データベースセットアップ

### PostgreSQLのインストール

#### Mac

```bash
brew install postgresql@15
brew services start postgresql@15
createdb solo_speak
```

#### Windows

1. [PostgreSQL公式サイト](https://www.postgresql.org/download/windows/) からインストーラをダウンロード
2. インストール後、pgAdminまたはコマンドラインで `solo_speak` データベースを作成

#### Linux (Ubuntu/Debian)

```bash
sudo apt update
sudo apt install postgresql postgresql-contrib
sudo systemctl start postgresql
sudo -u postgres createdb solo_speak
```

#### Docker（全OS共通）

```bash
docker run --name solo-speak-db -e POSTGRES_PASSWORD=password -e POSTGRES_DB=solo_speak -p 5432:5432 -d postgres:15
```

### マイグレーション

```bash
# Prismaクライアントを生成（最初に必須）
npm run generate

# マイグレーションを実行（generateの後）
npm run db:migrate:local

# シードデータを投入（migrateの後）
npm run db:seed:local
```

### シードデータの内容

シードデータには以下のマスターデータが含まれます：

| データ | 内容 |
|--------|------|
| 言語マスター | 日本語、英語、中国語、韓国語、スペイン語、フランス語、ドイツ語、イタリア語、ポルトガル語（9言語） |
| フレーズレベル | Lv1（超初級）〜Lv7（ネイティブ）の7段階 |
| スピーチステータス | A（優秀）、B（良好）、C（普通）、D（要改善）の4段階 |

### Prisma Studio

データベースの内容をGUIで確認：

```bash
npm run db:studio:local
```

http://localhost:5555 でPrisma Studioが起動します。

## 開発コマンド一覧

> **Note**: `npm install` は必ず `--legacy-peer-deps` フラグを使用してください。
> React 19とサードパーティライブラリの互換性問題を回避するために必要です。

### 基本コマンド（日常使用）

| コマンド | 説明 |
|----------|------|
| `npm run dev:local` | ローカル開発サーバー起動（.env.local使用） |
| `npm run build:local` | ローカルビルド（.env.local使用） |
| `npm run lint` | ESLint実行 |
| `npm run start` | ビルド済みアプリを本番モードで起動 |
| `npm run clean-start` | .nextフォルダを削除してから開発サーバー起動 |

### テストコマンド

| コマンド | 説明 |
|----------|------|
| `npm run test` | 全テスト実行 |
| `npm run test:watch` | ウォッチモードでテスト実行（TDD開発時推奨） |
| `npm run test:coverage` | カバレッジレポート付きテスト実行 |
| `npm run test:ci` | CI環境用テスト実行 |

詳細: [docs/testing.md](testing.md)

### Prismaコマンド

| コマンド | 説明 |
|----------|------|
| `npm run generate` | Prismaクライアント生成 |
| `npm run postinstall` | パッケージインストール後に自動実行（Prisma生成） |

### データベースコマンド（ローカル）

| コマンド | 説明 |
|----------|------|
| `npm run db:migrate:local` | マイグレーション実行 |
| `npm run db:push:local` | スキーマをDBにプッシュ（開発用） |
| `npm run db:studio:local` | Prisma Studio起動（http://localhost:5555） |
| `npm run db:seed:local` | シードデータ投入 |

### セットアップ・ユーティリティ（ローカル）

| コマンド | 説明 |
|----------|------|
| `npm run setup:phrase-levels:local` | フレーズレベル設定 |
| `npm run update:phrase-levels:local` | フレーズレベル更新 |
| `npm run cleanup:phrase-levels:local` | フレーズレベルクリーンアップ |
| `npm run seed:speech-statuses:local` | スピーチステータス初期化 |
| `npm run diagnose:db` | データベース診断 |
| `npm run insert:languages` | 言語データ挿入 |
| `npm run test:phrase-levels` | フレーズレベルロジックテスト |

### 本番環境コマンド（要注意）

> **Warning**: 本番環境への操作は以下の点に注意してください。
> - 実行前に必ずデータベースのバックアップを取得すること
> - コマンドの `:production` サフィックスを必ず確認すること
> - 不可逆な操作（reset、recreate等）は特に慎重に

| コマンド | 説明 |
|----------|------|
| `npm run dev:production` | 本番環境設定で開発サーバー起動 |
| `npm run build:production` | 本番ビルド（.env.production使用） |
| `npm run db:migrate:production` | 本番DBマイグレーション |
| `npm run db:push:production` | 本番DBにスキーマプッシュ |
| `npm run db:studio:production` | 本番DB用Prisma Studio起動 |
| `npm run db:seed:production` | 本番DBにシードデータ投入 |
| `npm run setup:phrase-levels:production` | 本番フレーズレベル設定 |
| `npm run update:phrase-levels:production` | 本番フレーズレベル更新 |
| `npm run cleanup:phrase-levels:production` | 本番フレーズレベルクリーンアップ |
| `npm run seed:speech-statuses:production` | 本番スピーチステータス初期化 |
| `npm run reset:production-db:production` | 本番DBリセット |
| `npm run recreate:tables:production` | 本番テーブル再作成 |
| `npm run seed:production:production` | 本番データシード |

### 環境なしコマンド（ベース）

通常は `:local` または `:production` サフィックス付きを使用してください。

| コマンド | 説明 |
|----------|------|
| `npm run dev` | 開発サーバー起動（環境変数なし） |
| `npm run build` | ビルド（環境変数なし） |
| `npm run db:push` | DBプッシュ（環境変数なし） |
| `npm run db:migrate` | マイグレーション（環境変数なし） |
| `npm run db:studio` | Prisma Studio（環境変数なし） |
| `npm run db:seed` | シード（環境変数なし） |

## トラブルシューティング

### npm install でエラーが発生する

**症状**: peer dependency の競合エラー

```bash
# 解決策: --legacy-peer-deps フラグを使用
npm install --legacy-peer-deps
```

### Prismaエラー

**症状**: `PrismaClientInitializationError` や `Cannot find module '.prisma/client'`

```bash
# 解決策: Prismaクライアントを再生成
npm run generate

# それでも解決しない場合: node_modulesを削除して再インストール
rm -rf node_modules
npm install --legacy-peer-deps
```

### データベース接続エラー

**症状**: `Error: P1001: Can't reach database server`

1. PostgreSQLが起動しているか確認
   ```bash
   # Mac
   brew services list | grep postgresql

   # Linux
   systemctl status postgresql

   # Docker
   docker ps | grep postgres
   ```
2. `DATABASE_URL` が正しいか確認（ホスト、ポート、ユーザー名、パスワード）
3. データベース `solo_speak` が存在するか確認

**症状**: `Error: P1003: Database does not exist`

```bash
# データベースを作成
createdb solo_speak
```

### Supabase接続エラー

**症状**: `Invalid API key` や `Failed to fetch`

1. `.env.local` の `NEXT_PUBLIC_SUPABASE_URL` と `NEXT_PUBLIC_SUPABASE_ANON_KEY` を確認
2. Supabase Dashboardで API キーが有効か確認
3. キーをコピーし直す（前後の空白に注意）

### OpenAI APIエラー

**症状**: `401 Unauthorized` や `429 Rate limit exceeded`

| エラー | 原因 | 対処 |
|--------|------|------|
| 401 | APIキーが無効 | OpenAI Platformで新しいキーを生成 |
| 429 | レート制限 | しばらく待つ、または使用量を確認 |
| 500 | OpenAI側の障害 | [status.openai.com](https://status.openai.com) を確認 |

### ポート3000が使用中

**症状**: `Error: listen EADDRINUSE: address already in use :::3000`

```bash
# 使用中のプロセスを確認
lsof -i :3000

# プロセスを終了（PIDは上記コマンドで確認）
kill -9 <PID>

# または別ポートで起動
PORT=3001 npm run dev:local
```

### .env.local が読み込まれない

**症状**: 環境変数が `undefined` になる

1. ファイル名が正確に `.env.local` か確認（`.env.local.txt` などになっていないか）
2. プロジェクトルートに配置されているか確認
3. 開発サーバーを再起動

```bash
# サーバーを停止して再起動
# Ctrl+C で停止後
npm run dev:local
```

### マイグレーションエラー

**症状**: `Error: P3009: migrate found failed migrations`

```bash
# マイグレーション履歴を確認
npx prisma migrate status --env-file=.env.local

# 開発環境でリセット（データは消える）
npx prisma migrate reset --env-file=.env.local
```

### diagnose:db の結果の見方

```bash
npm run diagnose:db
```

| 出力 | 意味 |
|------|------|
| `✓ Database connection successful` | DB接続OK |
| `✓ Tables exist` | テーブル作成済み |
| `✓ Seed data present` | シードデータ投入済み |
| `✗ Missing tables` | マイグレーション未実行 |
| `✗ No seed data` | シード未実行 |

詳細は [docs/troubleshooting.md](troubleshooting.md) を参照してください。
