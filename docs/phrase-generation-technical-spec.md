# フレーズ生成機能 技術仕様書

## 1. 機能要件

### 1.1 基本機能
- [ ] ユーザーが言えなかったフレーズを80文字まで入力できること（母国語：日本語）
- [ ] ユーザーが日本語で話したいフレーズを200文字まで入力できること（母国語：英語）
- [ ] フレーズ生成ボタンが配置されていること
- [ ] 「一般的」な表現のフレーズが生成されること
- [ ] 「丁寧」な表現のフレーズが生成されること
- [ ] 「カジュアル」な表現のフレーズが生成されること
- [ ] 選択したフレーズを登録できること
- [ ] 当日における残りの生成回数が表示されていること
- [ ] ヘッダーが表示されていること
- [ ] フッターが表示されていること
- [ ] スマホ版で表示崩れがないこと
- [ ] PC版で表示崩れがないこと

### 1.2 API仕様

#### フレーズ生成API
```
POST /api/phrase/generate
Content-Type: application/json

Request Body:
{
  "nativeLanguage": "ja" | "en",
  "learningLanguage": "en" | "ja", 
  "desiredPhrase": string (max: 200文字)
}

Response:
{
  "variations": [
    {
      "type": "common" | "polite" | "casual",
      "text": string,
      "explanation"?: string
    }
  ]
}
```

#### フレーズ登録API
```
POST /api/phrase
Content-Type: application/json

Request Body:
{
  "userId": string,
  "languageId": string,
  "text": string (max: 200文字),
  "translation": string (max: 200文字)
}

Response:
{
  "id": string,
  "userId": string,
  "languageId": string,
  "text": string,
  "translation": string,
  "phraseLevelId": string,
  "createdAt": string,
  "updatedAt": string,
  "language": Language,
  "phraseLevel": PhraseLevel,
  "user": {
    "id": string,
    "username": string
  }
}
```

## 2. 非機能要件

### 2.1 パフォーマンス
- フレーズ生成の応答時間: 10秒以内
- API応答時間: 3秒以内（ChatGPT API除く）
- 同時アクセス: 100ユーザー

### 2.2 可用性
- システム稼働率: 99.5%
- メンテナンス時間: 月4時間以内

### 2.3 セキュリティ
- ユーザー認証必須
- APIキーの適切な管理
- 入力値検証とサニタイズ
- レート制限（1日100回）

## 3. システム構成

### 3.1 技術スタック
- **フロントエンド**: Next.js 15, React 19, TypeScript, Tailwind CSS
- **バックエンド**: Next.js API Routes
- **データベース**: PostgreSQL + Prisma
- **外部API**: OpenAI GPT-4o-mini
- **認証**: Supabase Auth
- **ホスティング**: Vercel

### 3.2 アーキテクチャ図
```
[ユーザー] → [Next.js Frontend] → [API Routes] → [OpenAI API]
                    ↓                    ↓
                [Supabase Auth]    [PostgreSQL + Prisma]
```

## 4. データベース設計

### 4.1 テーブル定義

#### users テーブル
```sql
CREATE TABLE users (
  id VARCHAR PRIMARY KEY,
  username VARCHAR UNIQUE NOT NULL,
  email VARCHAR UNIQUE NOT NULL,
  native_language_id VARCHAR NOT NULL,
  default_learning_language_id VARCHAR NOT NULL,
  remaining_phrase_generations INTEGER DEFAULT 100,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

#### phrases テーブル
```sql
CREATE TABLE phrases (
  id VARCHAR PRIMARY KEY,
  user_id VARCHAR NOT NULL REFERENCES users(id),
  language_id VARCHAR NOT NULL REFERENCES languages(id),
  text VARCHAR(200) NOT NULL,
  translation VARCHAR(200) NOT NULL,
  phrase_level_id VARCHAR NOT NULL REFERENCES phrase_levels(id),
  total_read_count INTEGER DEFAULT 0,
  daily_read_count INTEGER DEFAULT 0,
  correct_quiz_count INTEGER DEFAULT 0,
  incorrect_quiz_count INTEGER DEFAULT 0,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  deleted_at TIMESTAMP NULL
);
```

## 5. セキュリティ仕様

### 5.1 認証・認可
- Supabase Auth による OAuth認証
- JWTトークンによるセッション管理
- API アクセス時のユーザー認証チェック

### 5.2 入力検証
```typescript
const generatePhraseSchema = z.object({
  nativeLanguage: z.string().min(1),
  learningLanguage: z.string().min(1),
  desiredPhrase: z.string().min(1).max(200),
})
```

### 5.3 レート制限
- ユーザーあたり1日100回の生成制限
- IPアドレスベースの短期制限（1分間10回）

## 6. エラーハンドリング

### 6.1 APIエラー
```typescript
// 400 Bad Request
{
  "error": "Invalid request data",
  "details": [...]
}

// 401 Unauthorized
{
  "error": "Authentication required"
}

// 429 Too Many Requests
{
  "error": "Rate limit exceeded"
}

// 500 Internal Server Error
{
  "error": "Internal server error"
}
```

### 6.2 フロントエンドエラー
- ネットワークエラー時の再試行機能
- エラーメッセージの多言語対応
- ユーザーフレンドリーなエラー表示

## 7. ログ設計

### 7.1 アプリケーションログ
```typescript
// フレーズ生成ログ
{
  timestamp: "2025-07-18T08:00:00Z",
  level: "INFO",
  event: "phrase_generated",
  userId: "user_123",
  nativeLanguage: "ja",
  learningLanguage: "en",
  inputLength: 15,
  responseTime: 2500
}

// エラーログ
{
  timestamp: "2025-07-18T08:00:00Z",
  level: "ERROR", 
  event: "openai_api_error",
  userId: "user_123",
  error: "Rate limit exceeded",
  statusCode: 429
}
```

## 8. テスト仕様

### 8.1 ユニットテスト
- API関数のテスト
- バリデーション関数のテスト
- ユーティリティ関数のテスト

### 8.2 統合テスト
- API エンドポイントのテスト
- データベース操作のテスト
- 外部API連携のテスト

### 8.3 E2Eテスト
```typescript
describe('フレーズ生成機能', () => {
  it('ユーザーがフレーズを入力して生成できる', async () => {
    // 1. ログイン
    await login()
    
    // 2. フレーズ生成ページに移動
    await page.goto('/phrase-generator')
    
    // 3. フレーズを入力
    await page.fill('[data-testid="phrase-input"]', 'こんにちは')
    
    // 4. 生成ボタンをクリック
    await page.click('[data-testid="generate-button"]')
    
    // 5. 結果が表示されることを確認
    await expect(page.locator('[data-testid="phrase-variations"]')).toBeVisible()
  })
})
```

## 9. 運用・保守

### 9.1 監視項目
- API応答時間
- エラー率
- OpenAI API使用量
- データベースパフォーマンス
- ユーザー利用状況

### 9.2 アラート設定
- API エラー率 > 5%
- 応答時間 > 10秒
- データベース接続エラー
- OpenAI APIクォータ超過

### 9.3 バックアップ
- データベースの日次バックアップ
- 設定ファイルのバージョン管理
- ログファイルの定期アーカイブ

## 10. デプロイメント

### 10.1 環境設定
```env
# 本番環境
OPENAI_API_KEY=sk-...
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXTAUTH_SECRET=...
SUPABASE_URL=...
SUPABASE_ANON_KEY=...
```

### 10.2 CI/CD パイプライン
1. コードプッシュ
2. 自動テスト実行
3. ビルド作成
4. ステージング環境デプロイ
5. 本番環境デプロイ

### 10.3 リリース手順
1. 機能開発・テスト
2. プルリクエスト作成
3. コードレビュー
4. ステージング環境での動作確認
5. 本番環境デプロイ
6. 動作確認・監視

## 11. パフォーマンス最適化

### 11.1 フロントエンド
- コードスプリッティング
- 画像最適化
- CDN活用
- キャッシュ戦略

### 11.2 バックエンド
- データベースインデックス最適化
- N+1クエリ対策
- API応答のキャッシュ
- 不要な処理の削減

### 11.3 外部API
- OpenAI APIの効率的な利用
- プロンプト最適化
- レスポンスキャッシュ（適切な場合）

## 12. 今後の課題・改善点

### 12.1 短期的改善
- レスポンス速度の向上
- エラーハンドリングの強化
- UIの改善

### 12.2 中長期的改善
- 多言語対応の拡張
- AI機能の強化
- オフライン対応
- 音声入力対応
