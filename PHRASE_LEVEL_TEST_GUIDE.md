# フレーズレベルシステム テストガイド

## 概要
このガイドでは、正解数に応じてフレーズカードの左端の縦線の色が変化するフレーズレベルシステムの動作確認方法を説明します。

## フレーズレベルの仕様

### レベル定義
| レベル | 正解数の範囲 | 色 | 説明 |
|-------|-------------|---|------|
| Level 0 | 正解数 = 0 | #D9D9D9 | 未回答・初期状態 |
| Level 1 | 0 < 正解数 ≤ 1 | #BFBFBF | 最初の正解 |
| Level 2 | 1 < 正解数 ≤ 3 | #A6A6A6 | 基礎レベル |
| Level 3 | 3 < 正解数 ≤ 5 | #8C8C8C | 中級レベル |
| Level 4 | 5 < 正解数 ≤ 10 | #737373 | 上級レベル |
| Level 5 | 10 < 正解数 ≤ 20 | #595959 | エキスパート |
| Level 6 | 20 < 正解数 ≤ 30+ | #404040 | マスター |

## セットアップ手順

### 1. フレーズレベルの初期化
```bash
# フレーズレベルテーブルをセットアップ
npm run setup:phrase-levels:local

# 既存フレーズのレベルを更新（データがある場合）
npm run update:phrase-levels:local
```

### 2. フレーズの追加
1. アプリケーションにログイン
2. Phrase > Add タブに移動
3. テスト用フレーズを追加
   - 例: "こんにちは" → "Hello"

### 3. 初期状態の確認
- Phrase > List タブで追加したフレーズを確認
- カードの左端が薄いグレー(#D9D9D9)であることを確認
- 正解数が 0 と表示されていることを確認

## テスト手順

### API経由でのテスト

#### フレーズの正解数を増やす
```bash
# PowerShellでのテスト例
$phraseId = "your-phrase-id-here"
$headers = @{
    "Content-Type" = "application/json"
    "Authorization" = "Bearer your-access-token"
}

# 正解を1回記録
$body = @{
    phraseId = $phraseId
    action = "quiz_correct"
} | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/api/phrase/stats" -Method PATCH -Headers $headers -Body $body
```

#### 各レベルでの色の確認
1. **Level 1 (正解数1)**: 
   - 色: #BFBFBF (薄いグレー)
   - 上記APIを1回実行後、List画面で確認

2. **Level 2 (正解数2-3)**:
   - 色: #A6A6A6 (中間グレー)
   - 追加で1-2回実行後確認

3. **Level 3 (正解数4-5)**:
   - 色: #8C8C8C (濃いグレー)
   - 正解数が4-5になるまで実行

4. **Level 4 (正解数6-10)**:
   - 色: #737373 (より濃いグレー)

5. **Level 5 (正解数11-20)**:
   - 色: #595959 (かなり濃いグレー)

6. **Level 6 (正解数21+)**:
   - 色: #404040 (最も濃いグレー)

### データベース確認

#### フレーズレベルの確認
```sql
-- フレーズレベル一覧
SELECT * FROM phrase_levels ORDER BY score;

-- フレーズと現在のレベル
SELECT 
    p.id,
    p.text,
    p.translation,
    p.correct_quiz_count,
    pl.name AS level_name,
    pl.score AS level_score,
    pl.color AS level_color
FROM phrases p
JOIN phrase_levels pl ON p.phrase_level_id = pl.id
WHERE p.deleted_at IS NULL
ORDER BY p.correct_quiz_count DESC;
```

### フロントエンド確認ポイント

#### PhraseListコンポーネント
- カードの左端の縦線の色が正解数に応じて変化することを確認
- 色の変化がスムーズで視覚的に分かりやすいことを確認

#### レスポンシブ対応
- デスクトップ、タブレット、モバイルで色が正しく表示されることを確認

## トラブルシューティング

### よくある問題

#### 1. 色が変化しない
- ブラウザのキャッシュをクリア
- `getPhraseLevelColorByCorrectAnswers`関数が正しく呼ばれているか確認
- 正解数が正しく更新されているかデータベースで確認

#### 2. APIエラー
- 認証トークンが有効か確認
- フレーズIDが正しいか確認
- サーバーログでエラー詳細を確認

#### 3. レベルが更新されない
- フレーズレベルテーブルにデータが存在するか確認
- `update-phrase-levels.ts`スクリプトを実行
- Prismaクライアントが最新の状態か確認

### デバッグ用ログ
```typescript
// PhraseList.tsx での確認
console.log('Phrase correct answers:', phrase.correctAnswers)
console.log('Calculated color:', getPhraseLevelColorByCorrectAnswers(phrase.correctAnswers || 0))
```

## 本番環境での適用

### 本番データベースへの適用
```bash
# 本番環境でフレーズレベルをセットアップ
npm run setup:phrase-levels:production

# 既存フレーズのレベルを更新
npm run update:phrase-levels:production
```

### 注意事項
- 本番環境での作業前には必ずバックアップを取得
- ピークタイム以外での実行を推奨
- 更新後はアプリケーションの動作確認を実施

## 機能拡張の可能性

### 今後の改善案
1. **アニメーション効果**: レベルアップ時の視覚的フィードバック
2. **レベル表示**: フレーズレベル名の表示オプション
3. **統計画面**: ユーザーのレベル分布表示
4. **達成バッジ**: 特定レベル到達時の報酬システム
5. **色カスタマイズ**: ユーザー設定での色テーマ変更

### 技術的な拡張
- WebSocketでのリアルタイム更新
- IndexedDBでのオフライン対応
- Service Workerでのバックグラウンド同期
