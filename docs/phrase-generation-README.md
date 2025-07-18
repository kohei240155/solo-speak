# Solo Speak - フレーズ生成機能

## 🚀 新機能: AI フレーズ生成

ChatGPT APIと連携して、ユーザーが話したいフレーズを3つのスタイル（一般的、丁寧、カジュアル）で提案する機能を実装しました。

![フレーズ生成機能のデモ](docs/demo-screenshot.png)

## ✨ 主な機能

### 🤖 AI によるフレーズ生成
- ユーザーの入力フレーズを解析
- 「一般的」「丁寧」「カジュアル」の3スタイルで翻訳
- OpenAI GPT-4o-mini を使用した高品質な翻訳

### 📝 フレーズ管理
- 生成されたフレーズの選択・登録
- データベースへの永続化
- ユーザーごとの個別管理

### 🎯 使いやすいUI
- レスポンシブデザイン（モバイル・デスクトップ対応）
- リアルタイムでの生成状況表示
- 残り生成回数の表示

### 🔒 セキュリティ
- ユーザー認証必須
- 入力値検証とサニタイズ
- レート制限（1日100回）

## 🛠️ 技術スタック

- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma
- **AI**: OpenAI GPT-4o-mini
- **認証**: Supabase Auth

## 📁 実装されたファイル

### API エンドポイント
```
src/app/api/
├── phrase/
│   ├── generate/
│   │   └── route.ts      # フレーズ生成API
│   └── route.ts          # フレーズ登録・取得API
```

### ページコンポーネント
```
src/app/
├── phrase-generator/
│   └── page.tsx          # フレーズ生成ページ
└── dashboard/
    └── page.tsx          # ダッシュボード（更新済み）
```

### ドキュメント
```
docs/
├── phrase-generation-implementation.md      # 実装ドキュメント
├── phrase-generation-technical-spec.md      # 技術仕様書
└── phrase-generation-development-guide.md   # 開発ガイド
```

## 🚀 使用方法

### 1. セットアップ

#### 環境変数の設定
`.env.local` ファイルに以下を追加:
```env
OPENAI_API_KEY=your_openai_api_key
```

#### 依存関係のインストール
```bash
npm install --legacy-peer-deps
```

### 2. 開発サーバーの起動
```bash
npm run dev:local
```

### 3. 機能へのアクセス
1. ログイン後、ダッシュボードに移動
2. 「AI フレーズ生成」カードをクリック
3. フレーズを入力して生成開始

## 📊 API 仕様

### フレーズ生成
```http
POST /api/phrase/generate
Content-Type: application/json

{
  "nativeLanguage": "ja",
  "learningLanguage": "en",
  "desiredPhrase": "トイレはどこにありますか？"
}
```

**レスポンス:**
```json
{
  "variations": [
    { "type": "common", "text": "Where is the restroom?" },
    { "type": "polite", "text": "Excuse me, could you please tell me where the restroom is?" },
    { "type": "casual", "text": "Where's the bathroom?" }
  ]
}
```

### フレーズ登録
```http
POST /api/phrase
Content-Type: application/json

{
  "userId": "user_id",
  "languageId": "language_id",
  "text": "トイレはどこにありますか？",
  "translation": "Where is the restroom?"
}
```

## 🎨 UI/UX の特徴

### デザインガイドライン
- 添付画像のデザインに基づいた実装
- Solo Speak のブランドカラーを使用
- アクセシビリティを考慮したUIコンポーネント

### レスポンシブ対応
- モバイルファーストアプローチ
- Tailwind CSS による効率的なスタイリング
- 画面サイズに応じた最適な表示

### ユーザビリティ
- 直感的な操作フロー
- 適切なフィードバック（ローディング、エラー、成功メッセージ）
- アクセシビリティ対応

## 🔧 今後の改善点

### 短期的改善
- [ ] 音声入力対応
- [ ] フレーズの難易度自動判定
- [ ] 学習進捗の可視化

### 中長期的改善
- [ ] より多くの言語ペアのサポート
- [ ] コンテキストを考慮した翻訳
- [ ] オフライン対応
- [ ] 音声読み上げ機能

## 📚 詳細ドキュメント

- [実装ドキュメント](docs/phrase-generation-implementation.md) - 実装の詳細と技術的なポイント
- [技術仕様書](docs/phrase-generation-technical-spec.md) - 機能要件と非機能要件
- [開発ガイド](docs/phrase-generation-development-guide.md) - 開発手順とベストプラクティス

## 🤝 コントリビューション

1. ブランチを作成: `git checkout -b feature/new-feature`
2. 変更をコミット: `git commit -am 'Add new feature'`
3. ブランチにプッシュ: `git push origin feature/new-feature`
4. プルリクエストを作成

## 📄 ライセンス

このプロジェクトは MIT ライセンスのもとで公開されています。
