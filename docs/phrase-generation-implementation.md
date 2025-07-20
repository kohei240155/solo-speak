# フレーズ生成機能の実装ドキュメント

## 概要
ChatGPT APIと連携してユーザーが入力したフレーズを学習言語に翻訳し、3つのスタイル（一般的、丁寧、カジュアル）で提案する機能です。

## アーキテクチャ

### 1. APIエンドポイント

#### フレーズ生成API (`/api/phrase/generate`)
- **メソッド**: POST
- **用途**: ChatGPT APIを使用してフレーズの翻訳バリエーションを生成
- **リクエスト形式**:
```json
{
  "nativeLanguage": "ja",
  "learningLanguage": "en", 
  "desiredPhrase": "トイレはどこにありますか？"
}
```

- **レスポンス形式**:
```json
{
  "variations": [
    { "type": "common", "text": "Where is the restroom?" },
    { "type": "polite", "text": "Excuse me, could you please tell me where the restroom is?" },
    { "type": "casual", "text": "Where's the bathroom?" }
  ]
}
```

#### フレーズ登録API (`/api/phrase`)
- **メソッド**: POST
- **用途**: 選択されたフレーズをデータベースに保存
- **リクエスト形式**:
```json
{
  "userId": "uuid-user-1234",
  "languageId": "uuid-lang-en",
  "text": "トイレはどこにありますか？",
  "translation": "Where is the restroom?"
}
```

### 2. フロントエンドコンポーネント

#### PhraseGeneratorPage (`/phrase-generator`)
- **場所**: `src/app/phrase-generator/page.tsx`
- **機能**:
  - フレーズ入力（日本語80文字、英語200文字制限）
  - 言語選択（母国語・学習言語）
  - AI生成ボタン
  - 生成結果表示（3スタイル）
  - フレーズ選択・登録
  - 残り生成回数表示

## 実装のポイント

### 1. ChatGPT APIとの連携

#### プロンプト設計
```typescript
function getSystemPrompt(nativeLanguage: string, learningLanguage: string): string {
  return `あなたは語学学習をサポートするAIアシスタントです。
ユーザーが${nativeLangName}で話したいことを${learningLangName}で表現するのを手伝います。

以下のルールに従って回答してください：
1. 一般的（Common）、丁寧（Polite）、カジュアル（Casual）の3つのバリエーションを提供する
2. 各バリエーションは自然で実用的な表現にする
3. 文化的に適切で、ネイティブスピーカーが実際に使う表現を選ぶ
4. 応答は以下のJSON形式で返す：

{
  "common": "一般的な表現",
  "polite": "丁寧な表現", 
  "casual": "カジュアルな表現"
}

JSON以外の文字は含めないでください。`
}
```

#### APIパラメータ
- **モデル**: `gpt-4o-mini` （コスト効率と品質のバランス）
- **temperature**: `0.7` （適度な創造性）
- **max_tokens**: `1000` （十分な応答長）

### 2. エラーハンドリング

#### APIレベル
- Zodスキーマによる入力検証
- OpenAI API エラーの適切な処理
- レスポンスパースエラーのフォールバック

#### フロントエンドレベル
- ネットワークエラー処理
- 入力値検証（文字数制限）
- ローディング状態管理

### 3. ユーザビリティ

#### レスポンシブデザイン
- モバイル・デスクトップ対応
- Tailwind CSSによる一貫したスタイリング

#### 状態管理
- フレーズ生成の進行状況表示
- 残り生成回数の動的更新
- 成功・エラーメッセージの表示

## データベース設計

### Phraseモデル
```prisma
model Phrase {
  id                  String    @id @default(cuid())
  userId              String    @map("user_id")
  languageId          String    @map("language_id")
  text                String    // 母国語のフレーズ
  translation         String    // 学習言語の翻訳
  totalReadCount      Int       @default(0)
  dailyReadCount      Int       @default(0)
  correctQuizCount    Int       @default(0)
  incorrectQuizCount  Int       @default(0)
  phraseLevelId       String    @map("phrase_level_id")
  createdAt           DateTime  @default(now())
  updatedAt           DateTime  @updatedAt
  deletedAt           DateTime?

  // リレーション
  user         User        @relation(fields: [userId], references: [id])
  language     Language    @relation(fields: [languageId], references: [id])
  phraseLevel  PhraseLevel @relation(fields: [phraseLevelId], references: [id])
}
```

## セキュリティ考慮事項

### 1. API認証
- ユーザー認証の確認
- レート制限の実装（1日の生成回数制限）

### 2. 入力検証
- XSS攻撃防止
- SQL インジェクション防止（Prisma使用）
- 入力文字数制限

### 3. APIキー管理
- 環境変数でOpenAI APIキー管理
- 本番環境での適切な設定

## パフォーマンス最適化

### 1. APIレスポンス
- OpenAI APIのタイムアウト設定
- エラー時の適切なフォールバック

### 2. フロントエンド
- 不要な再レンダリング防止
- APIコールの重複防止

## 今後の拡張可能性

### 1. 機能拡張
- 音声入力対応
- フレーズの難易度自動判定
- 学習進捗追跡

### 2. 多言語対応
- より多くの言語ペアのサポート
- 言語固有のニュアンス対応

### 3. AI機能強化
- ユーザーの学習レベルに応じたカスタマイズ
- コンテキストを考慮した翻訳
- 発音ガイドの生成

## トラブルシューティング

### よくある問題

#### OpenAI API エラー
- APIキーの確認
- レート制限の確認
- ネットワーク接続の確認

#### フレーズ登録エラー
- ユーザー認証状態の確認
- データベース接続の確認
- 入力値の検証

#### フロントエンドエラー
- ブラウザコンソールでのエラー確認
- ネットワークタブでのAPI呼び出し確認

## 開発・運用

### 環境変数
```env
OPENAI_API_KEY=your_openai_api_key
DATABASE_URL=your_database_url
```

### テスト
- ユニットテスト（API関数）
- 統合テスト（API エンドポイント）
- E2Eテスト（ユーザーフロー）

### モニタリング
- API使用量の監視
- エラー率の監視
- ユーザー利用パターンの分析
