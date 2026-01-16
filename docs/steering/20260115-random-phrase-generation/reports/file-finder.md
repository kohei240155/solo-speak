# ランダムフレーズ生成 - コードベース調査レポート

**調査日**: 2026-01-15
**調査目的**: ランダムフレーズ生成機能の技術設計のため、既存のフレーズ生成機能の実装を調査

---

## 検索結果

### 見つかったファイル

| ファイル | 役割 | 関連度 |
|----------|------|--------|
| `src/app/api/phrase/generate/route.ts` | フレーズ生成API（AI生成） | 高 |
| `src/app/api/phrase/route.ts` | フレーズCRUD API（POST: 作成、GET: 一覧取得） | 高 |
| `src/app/api/phrase/remaining/route.ts` | 残りのフレーズ生成回数取得API | 高 |
| `src/components/phrase/PhraseAdd.tsx` | フレーズ追加UIコンポーネント | 高 |
| `src/components/phrase/GeneratedVariations.tsx` | AI生成結果表示コンポーネント | 高 |
| `src/hooks/phrase/usePhraseManager.ts` | フレーズ管理カスタムフック | 高 |
| `src/hooks/api/useReactQueryApi.ts` | React Query APIフック（残り回数取得等） | 高 |
| `src/contexts/AuthContext.tsx` | 認証コンテキスト（ユーザー設定取得） | 中 |
| `src/types/phrase.ts` | フレーズ関連型定義 | 中 |
| `src/prompts/phraseGeneration.ts` | フレーズ生成AIプロンプト | 中 |
| `prisma/schema.prisma` | DBスキーマ（Userテーブル等） | 中 |

---

## ファイル間の関係

### 1. フレーズ生成フロー

```
[PhraseAdd.tsx] (UI)
    ↓ (ユーザー入力)
[usePhraseManager.ts] (ロジック)
    ↓ (handleGeneratePhrase)
[/api/phrase/generate] (API)
    ↓ (OpenAI API呼び出し)
[getPhraseGenerationPrompt] (プロンプト構築)
    ↓ (3つのバリエーション生成)
[GeneratedVariations.tsx] (結果表示)
```

### 2. フレーズ保存フロー

```
[GeneratedVariations.tsx] (Selectボタンクリック)
    ↓
[usePhraseManager.ts] (handleSelectVariation)
    ↓
[/api/phrase] (POST)
    ↓
[Prisma] (DB保存)
```

### 3. 使用回数制限の管理

```
[User.remainingPhraseGenerations] (DBカラム: 残り回数)
    ↓
[/api/phrase/remaining] (残り回数取得API)
    ↓
[useRemainingGenerations] (React Query フック)
    ↓
[usePhraseManager.ts] (残り回数チェック)
    ↓
[/api/phrase/generate] (生成成功後にカウント減算)
```

### 4. 学習言語設定の取得

```
AuthContext
  ↓ useUserSettingsData (API: /api/user/settings)
  ↓ userSettings.defaultLearningLanguage.code
  ↓ usePhraseManager (learningLanguage state)
  ↓ PhraseAdd (LanguageSelector)
```

---

## 主要な実装詳細

### 1. フレーズ生成機能（/api/phrase/generate）

**入力パラメータ:**
- `nativeLanguage`: ユーザーの母国語コード
- `learningLanguage`: 学習言語コード
- `desiredPhrase`: ユーザーが入力したフレーズ（100文字以内）
- `selectedContext`: 選択されたシチュエーション（オプション）

**処理フロー:**
1. 認証チェック (`authenticateRequest`)
2. 残り生成回数チェック (`user.remainingPhraseGenerations`)
3. OpenAI GPT-4.1-mini に Structured Outputs でリクエスト
4. 3つのバリエーション（各200文字以内）を生成
5. 成功時に残り回数を1減算

**回数制限ロジック:**
- DB: `User.remainingPhraseGenerations` (デフォルト: 0)
- DB: `User.lastPhraseGenerationDate` (最終生成日時)
- 制限: 1日5回まで（UTCベースでリセット）
- リセット処理: `/api/phrase/remaining` で日付チェック & 自動リセット

### 2. フレーズ追加機能（/api/phrase POST）

**入力パラメータ:**
- `languageCode`: 言語コード
- `original`: フレーズ原文（200文字以内）
- `translation`: 翻訳（200文字以内）
- `explanation`: 説明（オプション）

**処理フロー:**
1. 認証チェック
2. 言語の存在確認
3. 初期レベル設定（Lv1、score=0）
4. Prismaでフレーズ作成
5. 総フレーズ数を返却

### 3. 使用回数制限

**DBスキーマ（User）:**
```prisma
remainingPhraseGenerations Int         @default(0)
lastPhraseGenerationDate   DateTime?
```

**リセットロジック（/api/phrase/remaining）:**
- 初回: 5回に設定
- 日付変更検知: UTC基準で前日以前なら5回にリセット
- 残り回数は毎回DBから取得し、フロントエンドで表示

### 4. 学習言語設定

**取得経路:**
```
AuthContext
  ↓ useUserSettingsData (API: /api/user/settings)
  ↓ userSettings.defaultLearningLanguage.code
  ↓ usePhraseManager (learningLanguage state)
  ↓ PhraseAdd (LanguageSelector)
```

---

## 推奨確認ファイル

ランダムフレーズ生成機能の設計時に確認すべきファイル:

1. **`src/app/api/phrase/generate/route.ts`** - 既存のフレーズ生成ロジック
2. **`src/hooks/phrase/usePhraseManager.ts`** - フレーズ生成〜保存の一連のフロー
3. **`src/app/api/phrase/remaining/route.ts`** - 回数制限のリセットロジック
4. **`prisma/schema.prisma` (Userモデル)** - 回数制限用のカラム
5. **`src/prompts/phraseGeneration.ts`** - プロンプトの構成
6. **`src/components/phrase/PhraseAdd.tsx`** - UI実装
7. **`src/types/phrase.ts`** - 型定義

---

## ランダムフレーズ生成機能への示唆

### 再利用可能な要素
1. **認証フロー**: `authenticateRequest()` を使用
2. **回数制限の仕組み**: `User.remainingPhraseGenerations` を流用（共有）
3. **日付リセットロジック**: `/api/phrase/remaining` のUTCベース処理
4. **フック構造**: `useRemainingGenerations()` と同様のパターン
5. **UIコンポーネント**: `GeneratedVariations.tsx` の表示形式を参考

### 差異が必要な箇所
1. **入力パラメータ**: `desiredPhrase` が不要（ランダム生成のため）
2. **APIエンドポイント**: 新規に `/api/phrase/random-generate` を作成
3. **プロンプト**: ランダム順位に基づくフレーズ生成用の新しいプロンプト
4. **表示内容**: 「表現の解説」を追加表示

### 技術的制約
- OpenAI APIの呼び出し制限
- 生成時間（ユーザー体験への影響）
- 回数制限は既存と共有（要件通り）
