# フレーズレベルシステム実装完了レポート

## 実装概要
フレーズの正解数に応じてカード左端の縦線の色が変化するフレーズレベルシステムを実装しました。

## 実装内容

### 1. データベーススキーマの更新
- `PhraseLevel`テーブルに`color`フィールドを追加
- 正解数に基づく7段階のレベル設定

### 2. フレーズレベルデータの設定
正解数に応じた7つのレベルを設定（スコアは閾値として機能）：

| レベル | スコア | 正解数範囲 | 色コード | 説明 |
|--------|--------|-----------|---------|------|
| Level 1 | 0 | 正解数 = 0 | #D9D9D9 | 未回答・初期状態 |
| Level 2 | 1 | 正解数 ≥ 1 | #BFBFBF | 最初の正解 |
| Level 3 | 3 | 正解数 ≥ 3 | #A6A6A6 | 基礎レベル |
| Level 4 | 5 | 正解数 ≥ 5 | #8C8C8C | 中級レベル |
| Level 5 | 10 | 正解数 ≥ 10 | #737373 | 上級レベル |
| Level 6 | 20 | 正解数 ≥ 20 | #595959 | エキスパート |
| Level 7 | 30 | 正解数 ≥ 30 | #404040 | マスター |

**判定ロジック**: 大きい順の閾値 [30, 20, 10, 5, 3, 1, 0] で判定し、正解数が閾値以上なら該当レベルに決定

### 3. 新規ファイル

#### スクリプト
- `scripts/setup-phrase-levels.ts` - フレーズレベル初期設定
- `scripts/update-phrase-levels.ts` - 既存フレーズレベル更新
- `scripts/cleanup-phrase-levels.ts` - 不要なレベルのクリーンアップ
- `scripts/test-phrase-level-logic.ts` - レベル判定ロジックのテスト

#### ユーティリティ
- `src/utils/phrase-level-utils.ts` - レベル計算・色取得関数

#### API
- `src/app/api/phrase/stats/route.ts` - フレーズ統計更新API

#### ドキュメント
- `PHRASE_LEVEL_TEST_GUIDE.md` - テスト・運用ガイド

### 4. 既存ファイルの更新

#### Prisma Schema
```prisma
model PhraseLevel {
  id        String    @id @default(cuid())
  name      String
  score     Int
  color     String?   // 新規追加
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")
  phrases   Phrase[]

  @@map("phrase_levels")
}
```

#### PhraseListコンポーネント
- `getBorderColor`から`getPhraseLevelColorByCorrectAnswers`に変更
- 正解数に基づく動的な色表示

#### フレーズ作成API
- 新規フレーズ作成時に正解数(0)に基づくレベル自動設定

#### package.json
新しいスクリプトコマンドを追加：
```json
{
  "setup:phrase-levels": "tsx scripts/setup-phrase-levels.ts",
  "setup:phrase-levels:local": "cp .env.local .env && tsx scripts/setup-phrase-levels.ts",
  "setup:phrase-levels:production": "cp .env.production .env && tsx scripts/setup-phrase-levels.ts",
  "update:phrase-levels": "tsx scripts/update-phrase-levels.ts",
  "update:phrase-levels:local": "cp .env.local .env && tsx scripts/update-phrase-levels.ts",
  "update:phrase-levels:production": "cp .env.production .env && tsx scripts/update-phrase-levels.ts"
}
```

## 主要機能

### 1. 自動レベル計算
```typescript
export function getPhraseLevelScoreByCorrectAnswers(correctAnswers: number): number {
  // 閾値を大きい順に定義（スコア値と対応）
  const thresholds = [30, 20, 10, 5, 3, 1, 0]
  
  // 大きい順から判定していき、回数に満たなかったら1つ下のレベルへ
  for (const threshold of thresholds) {
    if (correctAnswers >= threshold) {
      return threshold
    }
  }
  
  return 0 // 最低レベル
}
```

### 2. 動的色取得
```typescript
export function getPhraseLevelColorByCorrectAnswers(correctAnswers: number): string {
  const score = getPhraseLevelScoreByCorrectAnswers(correctAnswers)
  
  const colorMap: Record<number, string> = {
    0: '#D9D9D9',   // Level 1: 正解数 = 0
    1: '#BFBFBF',   // Level 2: 正解数 ≥ 1
    3: '#A6A6A6',   // Level 3: 正解数 ≥ 3
    5: '#8C8C8C',   // Level 4: 正解数 ≥ 5
    10: '#737373',  // Level 5: 正解数 ≥ 10
    20: '#595959',  // Level 6: 正解数 ≥ 20
    30: '#404040',  // Level 7: 正解数 ≥ 30
  }
  
  return colorMap[score] || '#D9D9D9'
}
```

### 3. フレーズ統計更新API
クイズの正解/不正解時にフレーズレベルを自動更新：
```typescript
PATCH /api/phrase/stats
{
  "phraseId": "phrase-id",
  "action": "quiz_correct" | "quiz_incorrect" | "practice"
}
```

## セットアップ手順

### 開発環境
```bash
# フレーズレベル初期設定
npm run setup:phrase-levels:local

# 既存フレーズのレベル更新（データがある場合）
npm run update:phrase-levels:local
```

### 本番環境
```bash
# フレーズレベル初期設定
npm run setup:phrase-levels:production

# 既存フレーズのレベル更新
npm run update:phrase-levels:production
```

## 視覚的効果
- フレーズカードの左端に4pxの縦線を表示
- 正解数に応じて色が薄いグレーから濃いグレーへ段階的に変化
- ユーザーの学習進度が一目で分かる直感的なデザイン

## 今後の拡張可能性
1. **アニメーション効果**: レベルアップ時の視覚的フィードバック
2. **レベル名表示**: カード上でのレベル表示
3. **達成システム**: 特定レベル到達時の報酬
4. **統計ダッシュボード**: ユーザーのレベル分布表示
5. **カスタムテーマ**: 色テーマのユーザー設定

## 実装状況
✅ データベーススキーマ更新
✅ フレーズレベルデータ設定
✅ ユーティリティ関数実装
✅ UI更新（PhraseList）
✅ API更新（フレーズ作成）
✅ 統計更新API実装
✅ スクリプト・ドキュメント作成
✅ ローカル環境での動作確認

## 注意事項
- 本番環境での適用前にバックアップ必須
- 大量データがある場合は段階的な更新を推奨
- ユーザーのクイズ機能実装後に統計更新APIが活用される
