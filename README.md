# Solo Speak

AI駆動の多言語学習プラットフォーム

## 🌟 概要

Solo Speakは、AI技術を活用して外国語学習を支援するWebアプリケーションです。ユーザーが実際に話したいフレーズを入力すると、AIが3つのスタイル（一般的、丁寧、カジュアル）で翻訳し、効果的な語学学習をサポートします。

## ✨ 主な機能

### 🤖 AI フレーズ生成

- ChatGPT APIを使用した高品質な翻訳
- 3つのスタイル（一般的、丁寧、カジュアル）での翻訳提案
- コンテキストを考慮した自然な翻訳

### 📚 多言語対応

- 9つの言語をサポート（英語、日本語、韓国語、中国語、フランス語、スペイン語、ポルトガル語、ドイツ語、タイ語）
- ユーザーの母国語と学習言語の設定
- 多言語UIに対応

### 🎯 パーソナライズド学習

- ユーザー専用のフレーズ管理
- 学習進捗の追跡
- 個別の学習体験

### 🎙️ 発音練習（予定）

- 音声入力機能
- 発音評価システム
- リアルタイムフィードバック

## 🛠️ 技術スタック

### フロントエンド

- **Next.js 15** - Reactフレームワーク
- **React 19** - UIライブラリ
- **TypeScript** - 型安全性
- **Tailwind CSS** - スタイリング
- **React Hook Form** - フォーム管理
- **React Hot Toast** - 通知システム

### バックエンド

- **Next.js API Routes** - サーバーサイドAPI
- **Prisma** - データベースORM
- **PostgreSQL** - データベース
- **Supabase** - 認証・データベースホスティング

### AI・API

- **OpenAI GPT-4o-mini** - フレーズ生成
- **Google Cloud Text-to-Speech** - 音声生成
- **Stripe** - 決済処理

### 開発ツール

- **ESLint** - コード品質
- **PostCSS** - CSS処理
- **tsx** - TypeScriptランナー

## 🚀 セットアップ

### 必要環境

- Node.js 18+
- npm または yarn
- PostgreSQL データベース

### 1. リポジトリのクローン

```bash
git clone https://github.com/kohei240155/solo-speak.git
cd solo-speak
```

### 2. 依存関係のインストール

```bash
npm install --legacy-peer-deps
```

### 3. 環境変数の設定

`.env.local` ファイルを作成し、以下の環境変数を設定：

```env
# データベース
DATABASE_URL="your_postgresql_url"
DIRECT_URL="your_postgresql_direct_url"

# Supabase
NEXT_PUBLIC_SUPABASE_URL="your_supabase_url"
NEXT_PUBLIC_SUPABASE_ANON_KEY="your_supabase_anon_key"

# OpenAI
OPENAI_API_KEY="your_openai_api_key"

# Google Cloud (オプション)
GOOGLE_CLOUD_PROJECT_ID="your_project_id"
GOOGLE_CLOUD_PRIVATE_KEY="your_private_key"
GOOGLE_CLOUD_CLIENT_EMAIL="your_client_email"

# Stripe (オプション)
STRIPE_SECRET_KEY="your_stripe_secret_key"
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="your_stripe_publishable_key"
```

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run generate

# データベースマイグレーション
npm run db:migrate:local

# シードデータの投入
npm run db:seed:local
```

### 5. 開発サーバーの起動

```bash
npm run dev:local
```

アプリケーションは `http://localhost:3000` で起動します。

## 📂 プロジェクト構造

```
solo-speak/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   ├── dashboard/         # ダッシュボード
│   │   ├── phrase/            # フレーズ機能
│   │   └── ...
│   ├── components/            # Reactコンポーネント
│   │   ├── auth/             # 認証関連
│   │   ├── common/           # 共通コンポーネント
│   │   ├── phrase/           # フレーズ関連
│   │   └── ...
│   ├── hooks/                # カスタムHooks
│   ├── types/                # TypeScript型定義
│   ├── utils/                # ユーティリティ関数
│   └── constants/            # 定数定義
├── prisma/                   # データベーススキーマ
├── public/                   # 静的ファイル
│   └── locales/             # 国際化ファイル
├── docs/                     # ドキュメント
└── scripts/                  # ユーティリティスクリプト
```

## 📚 使用方法

### 1. アカウント作成・ログイン

- Supabase Authを使用した安全な認証
- メールアドレスでの登録・ログイン

### 2. 言語設定

- 母国語と学習言語の設定
- プロフィール画面からいつでも変更可能

### 3. フレーズ生成

1. ダッシュボードから「AI フレーズ生成」を選択
2. 話したいフレーズを入力
3. AIが3つのスタイルで翻訳を提案
4. 気に入ったフレーズを選択・保存

### 4. フレーズ管理

- 保存したフレーズの一覧表示
- 検索・フィルタリング機能
- 学習進捗の確認

## 🛠️ 開発コマンド

### 基本コマンド

```bash
# 開発サーバー起動
npm run dev:local              # ローカル環境
npm run dev:production         # 本番環境設定

# ビルド
npm run build:local            # ローカル環境
npm run build:production       # 本番環境

# リント
npm run lint
```

### データベース管理

```bash
# マイグレーション
npm run db:migrate:local       # ローカル環境
npm run db:migrate:production  # 本番環境

# Prisma Studio
npm run db:studio:local        # ローカル環境
npm run db:studio:production   # 本番環境

# シード実行
npm run db:seed:local          # ローカル環境
npm run db:seed:production     # 本番環境
```

### スクリプト

```bash
# フレーズレベル設定
npm run setup:phrase-levels:local

# フレーズレベル更新
npm run update:phrase-levels:local

# データベース診断
npm run diagnose:db
```

## 📱 MacでNext.jsローカル環境をスマホで確認する手順

### ✅ 前提条件

- Macとスマホが**同じWi-Fiネットワーク**に接続されていること
- Next.jsの開発サーバーを起動中であること

---

### 🪜 手順

#### ① MacのローカルIPアドレスを確認

ターミナルで以下を実行します：

```bash
ipconfig getifaddr en0
```

> 💡 `en0` はWi-Fi接続のインターフェースです。
> 有線LANを使っている場合は `en1` の可能性もあります。

出力例：

```
192.168.1.23
```

このIPアドレスをメモしておきます。

---

#### ② Next.jsを外部アクセス可能に起動

通常 `npm run dev` では「localhost」しかアクセスできません。
スマホからもアクセスできるように、以下のコマンドを使います：

```bash
npx next dev --hostname 0.0.0.0
```

> 💡 `--hostname 0.0.0.0` を指定することで、
> 同一ネットワーク内の他のデバイス（スマホなど）からアクセス可能になります。

---

#### ③ スマホのブラウザでアクセス

スマホのブラウザ（SafariやChromeなど）で、以下のURLを入力します：

```
http://<MacのIPアドレス>:3000
```

例：

```
http://192.168.1.23:3000
```

これで、スマホからNext.jsのローカルアプリを確認できます 🎉

---

#### ④（必要に応じて）ファイアウォールの確認

もし接続できない場合は、Macの**システム設定 → ネットワーク → ファイアウォール**を開き、
Next.jsがポート3000で通信できるように一時的に許可してください。

---

### 🔍 まとめ

| 手順 | 内容                                               |
| ---- | -------------------------------------------------- |
| ①    | `ipconfig getifaddr en0` でMacのIPを確認           |
| ②    | `npx next dev --hostname 0.0.0.0` でサーバーを起動 |
| ③    | スマホのブラウザで `http://<IP>:3000` にアクセス   |
| ④    | 必要ならファイアウォールを許可                     |

---

## 🌍 多言語対応

現在サポートしている言語：

- 🇺🇸 English
- 🇯🇵 日本語
- 🇰🇷 한국어
- 🇨🇳 中文
- 🇫🇷 Français
- 🇪🇸 Español
- 🇵🇹 Português
- 🇩🇪 Deutsch
- 🇹🇭 ไทย

## 📖 ドキュメント

詳細なドキュメントは `docs/` ディレクトリに含まれています：

- [フレーズ生成機能](docs/phrase-generation-README.md)
- [API クライアントガイド](docs/api-client-guide.md)
- [サブスクリプションシステム](docs/subscription-system-documentation.md)
- [技術仕様書](docs/phrase-generation-technical-spec.md)

## 🤝 コントリビューション

1. フォークしてブランチを作成

```bash
git checkout -b feature/new-feature
```

2. 変更をコミット

```bash
git commit -am 'Add new feature'
```

3. ブランチにプッシュ

```bash
git push origin feature/new-feature
```

4. プルリクエストを作成

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 🔗 リンク

- [本番サイト](https://solo-speak.vercel.app)
- [GitHub](https://github.com/kohei240155/solo-speak)
- [ドキュメント](docs/)

## 📞 サポート

質問やサポートが必要な場合は、GitHubのIssuesを作成してください。

---

**Solo Speak** - AIで学ぶ、新しい語学学習体験
