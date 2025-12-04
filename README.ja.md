# Solo Speak

AI駆動の多言語学習プラットフォーム

## 🌟 概要

Solo Speakは、AI技術を活用して外国語学習を支援する総合的なWebアプリケーションです。ユーザーが実際に話したいフレーズを入力すると、AIが3つのスタイル（一般的、丁寧、カジュアル）で翻訳し、音声付きで学習できます。さらに、クイズ機能やスピーキング練習、ランキング機能により、体系的で楽しい語学学習体験を提供します。

## ✨ 主な機能

### 🤖 AI フレーズ生成

- ChatGPT APIを使用した高品質な翻訳
- 3つのスタイル（一般的、丁寧、カジュアル）での翻訳提案
- コンテキストとシチュエーションを考慮した自然な翻訳
- 7段階のレベル別学習（Lv1-Lv7）

### 🎙️ スピーキング練習

- **音声入力機能**: リアルタイム音声認識
- **AI添削システム**: ChatGPT APIによる発音と文法の自動添削
- **スピーキングプラン**: 段階的な学習計画の提示
- **練習履歴管理**: 過去の練習記録の確認と復習
- **ステータス管理**: 4段階の習熟度評価（A: 流暢、B: 一部参照、C: 参照必要、D: 未復習）

### 📚 多言語対応

- **9言語**をサポート（英語、日本語、韓国語、中国語、スペイン語、フランス語、ポルトガル語、ドイツ語、タイ語）
- ユーザーの母国語と学習言語の設定
- 多言語UIに完全対応
- 完全なi18n対応（97.8%の翻訳キー使用率）

### 🎯 パーソナライズド学習

- **フレーズ管理**: ユーザー専用のフレーズコレクション
- **クイズモード**: 復習用の4択クイズシステム
- **学習進捗追跡**: 練習回数、正解率、ストリーク記録
- **デイリーリセット**: 毎日のスピーキング回数制限
- 個別の学習体験とカスタマイズ

### 🏆 ランキングシステム

- **クイズランキング**: 正解率・ストリークによる競争
- **スピーキングランキング**: 練習量による順位付け
- **フレーズストリークランキング**: 連続学習日数の記録
- リアルタイムで更新されるグローバルランキング

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
- **Supabase** - 認証・データベースホスティング・ストレージ

### AI・API

- **OpenAI GPT-4o-mini** - フレーズ生成・添削システム
- **Google Cloud Text-to-Speech** - 音声生成（9言語対応）
- **Web Speech API** - 音声認識
- **Stripe** - サブスクリプション管理・決済処理

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
STRIPE_WEBHOOK_SECRET="your_stripe_webhook_secret"

# アプリケーション設定
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

### 4. データベースのセットアップ

```bash
# Prismaクライアントの生成
npm run generate

# データベースマイグレーション
npm run db:migrate:local

# シードデータの投入（言語、フレーズレベル、スピーチステータスを含む）
npm run db:seed:local
```

### 5. 開発サーバーの起動

```bash
npm run dev:local
```

アプリケーションは `http://localhost:3000` で起動します。

## 🎮 主要な機能の使い方

### フレーズ生成

1. `/phrase/add` にアクセス
2. シチュエーション選択
3. フレーズ入力
4. 3スタイルから選択

### クイズモード

1. `/phrase/quiz` にアクセス
2. レベル・フィルター設定
3. 4択クイズに挑戦
4. 正解率・ストリーク記録

### スピーキング練習

1. `/phrase/speak` にアクセス
2. フレーズを音声で練習
3. デイリーリセットに注意

### スピーチ練習

1. `/speech/add` にアクセス
2. 話題を入力
3. AI添削を受ける
4. `/speech/review` で復習

アプリケーションは `http://localhost:3000` で起動します。

## 📂 プロジェクト構造

```
solo-speak/
├── src/
│   ├── app/                    # Next.js App Router
│   │   ├── api/               # API Routes
│   │   │   ├── dashboard/    # ダッシュボードAPI
│   │   │   ├── languages/    # 言語マスターAPI
│   │   │   ├── phrase/       # フレーズ生成・管理
│   │   │   ├── ranking/      # ランキングシステム
│   │   │   ├── speech/       # スピーチ練習
│   │   │   ├── stripe/       # サブスクリプション
│   │   │   ├── tts/          # 音声合成
│   │   │   └── user/         # ユーザー設定
│   │   ├── auth/             # 認証ページ
│   │   ├── dashboard/        # ダッシュボード
│   │   ├── phrase/           # フレーズ機能
│   │   │   ├── add/         # フレーズ生成
│   │   │   ├── list/        # フレーズ一覧
│   │   │   ├── quiz/        # クイズモード
│   │   │   └── speak/       # スピーキング練習
│   │   ├── ranking/          # ランキング
│   │   ├── settings/         # 設定
│   │   ├── speech/           # スピーチ練習
│   │   │   ├── add/         # 新規スピーチ
│   │   │   ├── list/        # スピーチ一覧
│   │   │   └── review/      # スピーチ復習
│   │   └── ...
│   ├── components/           # Reactコンポーネント
│   │   ├── auth/            # 認証関連
│   │   ├── common/          # 共通コンポーネント
│   │   ├── navigation/      # ナビゲーション
│   │   ├── phrase/          # フレーズ関連
│   │   ├── ranking/         # ランキング
│   │   ├── speech/          # スピーチ関連
│   │   └── ...
│   ├── hooks/               # カスタムHooks
│   │   ├── phrase/         # フレーズ関連Hooks
│   │   ├── speech/         # スピーチ関連Hooks
│   │   └── ...
│   ├── types/              # TypeScript型定義
│   ├── utils/              # ユーティリティ関数
│   ├── constants/          # 定数定義
│   ├── contexts/           # Reactコンテキスト
│   ├── data/               # マスターデータ
│   ├── prompts/            # AIプロンプト
│   └── generated/          # 生成ファイル
├── prisma/                 # データベーススキーマ
│   ├── schema.prisma      # Prismaスキーマ
│   ├── seed.ts            # シードスクリプト
│   └── migrations/        # マイグレーション
├── public/                # 静的ファイル
│   ├── locales/          # 国際化ファイル（ja/en）
│   │   ├── ja/common.json
│   │   └── en/common.json
│   ├── images/           # 画像ファイル
│   ├── manifest.json     # PWAマニフェスト
│   └── sw.js            # Service Worker
├── docs/                 # ドキュメント
│   ├── api/             # APIドキュメント
│   └── ...
└── scripts/             # ユーティリティスクリプト
```

## 📚 使用方法

### 1. アカウント作成・ログイン

- Supabase Authを使用した安全な認証
- メールアドレスでの登録・ログイン
- Googleアカウント連携

### 2. 言語設定

- 母国語と学習言語の設定
- 9言語から選択可能
- プロフィール画面からいつでも変更可能

### 3. フレーズ生成

1. ダッシュボードから「AIフレーズ生成」を選択
2. シチュエーションを選択（友達との会話、カフェ、ビジネス等）
3. 話したいフレーズを入力
4. AIが3つのスタイル（一般的、丁寧、カジュアル）で翻訳を提案
5. 気に入ったフレーズを選択・保存
6. Google Text-to-Speechで音声を確認

### 4. クイズで復習

1. 「クイズモード」を選択
2. 学習したフレーズから4択問題が出題
3. 正解率とストリークを記録
4. ランキングで他のユーザーと競争

### 5. スピーキング練習

1. 「スピーチ練習」を選択
2. 練習したい話題を入力
3. AIが添削結果とスピーキングプランを提案
4. 音声入力で実際に話して練習
5. 練習履歴を確認して復習
6. ステータス（A〜D）で習熟度を管理

### 6. ランキングをチェック

- クイズランキング: 正解率・ストリークで競争
- スピーキングランキング: 練習量を競う
- フレーズストリークランキング: 連続学習日数を記録

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

# フレーズレベルクリーンアップ
npm run cleanup:phrase-levels:local

# スピーチステータス設定
npm run seed:speech-statuses:local      # ローカル環境
npm run seed:speech-statuses:production # 本番環境

# データベース診断
npm run diagnose:db

# 本番データベース再作成
npm run recreate:tables:production

# 本番環境へのシード実行
npm run seed:production:production
```

## 💾 i18n管理ツール

翻訳キーの使用状況を確認・管理するPythonスクリプトが用意されています：

```bash
# 翻訳キー使用状況チェック
python check_i18n_usage.py

# 未使用キーの削除
python remove_unused_i18n_keys.py
```

詳細は以下のレポートを参照：

- `i18n_final_report.md` - i18n整理完了レポート
- `i18n_analysis_report.md` - 分析レポート
- `i18n_cleanup_guide.md` - クリーンアップガイド

### スピーチステータスのシード値について

このプロジェクトでは、スピーチの習熟度を表すSpeechStatusが定義されています：

| ステータス | 説明                                 |
| ---------- | ------------------------------------ |
| A          | スクリプトを見なくても流暢に話せる   |
| B          | スクリプトの一部を見れば流暢に話せる |
| C          | スクリプトを見れば流暢に話せる       |
| D          | まだ復習をしていない                 |

これらのステータスは以下のコマンドで投入できます：

```bash
# 開発環境
npm run seed:speech-statuses:local

# 本番環境
npm run seed:speech-statuses:production

# 全シードデータ（言語、フレーズレベル、スピーチステータス含む）
npm run db:seed:local          # ローカル環境
npm run db:seed:production     # 本番環境
```

### データベースモデル

主要なデータベースモデル：

- **User**: ユーザー情報・認証
- **Language**: サポート言語マスター（9言語）
- **PhraseLevel**: フレーズレベル（Lv1-Lv7）
- **Phrase**: ユーザーフレーズ
- **QuizResult**: クイズ結果・ストリーク
- **SpeakLog**: スピーキング練習ログ
- **Speech**: スピーチ練習データ
- **SpeechFeedback**: AI添削フィードバック
- **SpeechPlan**: スピーキングプラン
- **SpeechStatus**: 習熟度ステータス
- **Situation**: シチュエーションマスター

詳細は `prisma/schema.prisma` を参照してください。

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

現在サポートしている言語（9言語）：

### 主要国際言語

- 🇺🇸 English（英語）
- 🇨🇳 Chinese（中国語）
- 🇪🇸 Spanish（スペイン語）
- 🇫🇷 French（フランス語）
- 🇵🇹 Portuguese（ポルトガル語）

### アジア言語

- 🇯🇵 Japanese（日本語）
- 🇰🇷 Korean（韓国語）
- 🇹🇭 Thai（タイ語）

### ヨーロッパ言語

- 🇩🇪 German（ドイツ語）

### 機能サポート

- **音声合成**: 全9言語でGoogle Cloud TTS対応
- **シチュエーション**: 全言語で基本シチュエーション対応
- **UI言語**: 完全なi18n対応（全9言語）

## 📖 ドキュメント

詳細なドキュメントは `docs/` ディレクトリに含まれています：

### 機能ドキュメント

- [フレーズ生成機能](docs/phrase-generation-README.md)
- [サブスクリプションシステム](docs/subscription-system-documentation.md)
- [技術仕様書](docs/phrase-generation-technical-spec.md)
- [サポート言語一覧](docs/supported-languages.md)
- [デイリーリセットロジック](docs/daily-reset-logic.md)

### コンポーネントドキュメント

- [ドロップダウンメニュー](docs/dropdown-menu-component.md)
- [モードモーダル](docs/mode-modal-component.md)

### APIドキュメント

各APIエンドポイントの詳細は `docs/api/` ディレクトリを参照：

- [Dashboard API](docs/api/dashboard.md)
- [Languages API](docs/api/languages.md)
- [Phrase APIs](docs/api/phrase.md)
- [Quiz APIs](docs/api/phrase-quiz.md)
- [Speaking APIs](docs/api/phrase-speak.md)
- [Speech APIs](docs/api/speech-save.md)
- [Ranking APIs](docs/api/ranking-speak.md)
- [Stripe APIs](docs/api/stripe-checkout.md)
- [User APIs](docs/api/user-settings.md)

### セットアップガイド

- [Supabase Storage セットアップ](docs/supabase-storage-setup.md)
- [Stripe Webhook セットアップ](docs/stripe-webhook-setup.md)
- [API クライアントガイド](docs/api-client-guide.md)
- [Safari音声修正（FFmpeg）](docs/safari-audio-fix-ffmpeg.md)

## 🤝 コントリビューション

プロジェクトへの貢献を歓迎します！

### 開発フロー

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

### コーディング規約

- TypeScriptの型安全性を重視
- ESLintルールに従う
- コンポーネントは適切に分割
- APIクライアントは型安全に実装

### テスト

- 機能追加時は適切にテストを実施
- データベース変更時はマイグレーションを作成
- 本番環境へのデプロイ前に動作確認

## 🚀 デプロイ

### Vercel（推奨）

1. Vercelにプロジェクトをインポート
2. 環境変数を設定
3. 自動デプロイ

### データベース

- Supabase（推奨）
- PostgreSQL互換のデータベース

### ストレージ

- Supabase Storage（音声ファイル保存）

## 📊 機能の詳細

### サブスクリプションシステム

- Stripeによる決済処理
- プラン管理とキャンセル機能
- Webhook による自動更新

詳細: [docs/subscription-system-documentation.md](docs/subscription-system-documentation.md)

### デイリーリセット

- 毎日のスピーキング回数制限
- 自動リセット機能

詳細: [docs/daily-reset-logic.md](docs/daily-reset-logic.md)

### ランキングシステム

- リアルタイム更新
- 複数のランキング種別
- ストリーク記録

## 🔒 セキュリティ

- Supabase Authによる認証
- Row Level Security (RLS)
- 環境変数による機密情報管理
- Stripe Webhookの署名検証

## 📄 ライセンス

このプロジェクトはMITライセンスのもとで公開されています。

## 🔗 リンク

- [本番サイト](https://solo-speak.vercel.app)
- [GitHub](https://github.com/kohei240155/solo-speak)
- [ドキュメント](docs/)

## 📞 サポート

質問やサポートが必要な場合は、GitHubのIssuesを作成してください。

## 📝 更新履歴

### 最新の機能追加

- ✅ スピーキング練習機能（音声認識・AI添削）
- ✅ クイズモード（4択問題・ストリーク記録）
- ✅ ランキングシステム（3種類のランキング）
- ✅ スピーチ練習機能（習熟度管理）
- ✅ 9言語サポート
- ✅ 完全なi18n対応（日本語・英語UI）
- ✅ デイリーリセット機能
- ✅ サブスクリプションシステム（Stripe連携）
- ✅ Google認証連携
- ✅ PWA対応

### 今後の予定

- 🔄 より詳細な発音評価
- 🔄 学習統計ダッシュボード
- 🔄 ソーシャル機能
- 🔄 オフライン対応の強化
- 🔄 追加言語のサポート

## 🙏 謝辞

このプロジェクトは以下の素晴らしいテクノロジーにより実現されています：

- Next.js / React - フロントエンドフレームワーク
- OpenAI - AI機能
- Google Cloud - 音声合成
- Supabase - 認証・データベース・ストレージ
- Stripe - 決済処理
- Vercel - ホスティング

---

**Solo Speak** - AIで学ぶ、新しい語学学習体験 🚀
