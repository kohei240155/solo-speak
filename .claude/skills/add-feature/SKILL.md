---
description: 新機能追加のワークフロー（対話形式で要件定義→設計→実装）
---

# Add Feature Command

新機能の設計を対話形式で進め、ステアリングファイル群を生成するコマンドです。

## 出力ファイル

```
docs/steering/{YYYYMMDD}-{feature-name}/
├── progress.md       # プロセス進捗（Step 2で作成）
├── requirements.md   # 要件定義（Phase 1で作成）
├── design.md         # 技術設計（Phase 2で作成）
└── tasklist.md       # タスクリスト（Phase 3で作成）
```

命名例: `docs/steering/20260113-bookmark-feature/`

---

## 再開時の処理

コマンド実行時、まず `docs/steering/` 内に進行中のディレクトリがあるか確認する。

### 進行中ディレクトリの判定

1. `docs/steering/` 配下のディレクトリを日付降順でリスト
2. `archive/` ディレクトリは除外
3. 各ディレクトリの `progress.md` を確認
4. ステータスが「完了」以外のものを「進行中」と判定

### 複数の進行中ディレクトリがある場合

最も新しい日付のディレクトリを優先し、ユーザーに選択を求める:

```
複数の進行中作業が見つかりました。どちらを再開しますか？

1. 📁 `docs/steering/20260114-bookmark-feature/` (Phase 2, Step 5)
2. 📁 `docs/steering/20260113-notification/` (Phase 1, Step 3)
3. 🆕 新規で始める
```

### 単一の進行中ディレクトリがある場合

```
進行中の作業が見つかりました。

📁 ディレクトリ: `docs/steering/{dir}/`
📊 現在のフェーズ: {Phase X}
⏳ 次のステップ: Step {N}

この作業を再開しますか？
```

- 再開する場合、該当ステップから処理を続行
- 新規で始める場合、Phase 1 の Step 1 から開始

### チェックボックス状態の判定

`progress.md` のチェックリストを以下のルールでパース:

- `- [x]` → 完了
- `- [ ]` → 未完了
- 最初の未完了項目 = 次のステップ

**例**:
```markdown
- [x] Step 1: 機能概要のヒアリング
- [x] Step 2: ステアリングディレクトリの作成
- [ ] Step 3: ゴールと成功指標の明確化  ← 次のステップ
```

### 進行中のディレクトリがない場合

Phase 1 の Step 1 から開始。

---

## エージェントの呼び出し方法

本コマンドでは複数のエージェントを使用します。呼び出し方法は以下の通りです。

### Claude Code の Task ツールを使用

```
Task ツールを使用してエージェントを呼び出す:
- subagent_type: エージェント名（例: "file-finder"）
- prompt: エージェントへの指示（入力仕様に従う）
```

### 呼び出し例（Step 4: file-finder）

```
Task:
  subagent_type: "file-finder"
  prompt: |
    以下の機能に関連するファイルを検索してください。

    機能名: ブックマーク機能
    検索目的: 新機能追加のための既存コード調査
    検索範囲: src/app/api/, src/components/, src/hooks/, src/types/
```

**重要**: エージェントは独立コンテキストで実行されるため、必要な情報はすべてプロンプトに含めてください。

---

## Phase 1: 要件ヒアリング

### Step 1: 機能概要のヒアリング

ユーザーに以下を質問:

```
新機能の実装を始めましょう。まず、以下について教えてください:

1. **機能名**: この機能の名前は何ですか？
2. **解決したい課題**: どんな問題を解決したいですか？
3. **期待する結果**: この機能が完成したら、ユーザーは何ができるようになりますか？
```

### Step 2: ステアリングディレクトリの作成

ユーザーの回答をもとに:

1. 現在の日付を取得（`date +%Y%m%d`）
2. 機能名をkebab-caseに変換（日本語の場合は英語に翻訳）
3. `docs/steering/{YYYYMMDD}-{feature-name}/` ディレクトリを作成
4. `progress.md` を作成（テンプレート: `.claude/skills/add-feature/templates/progress-template.md`）
5. `requirements.md` を作成（テンプレート: `.claude/skills/add-feature/templates/requirements-template.md`）
6. 「1. 背景と課題」「2. 期待する結果」セクションを埋める
7. `progress.md` の Step 1, Step 2 のチェックを更新

作成後、次のステップに進む旨を報告。

### Step 3: ゴールと成功指標の明確化

```
次に、ゴールと成功指標を明確にしましょう。

**ゴール**（この機能で達成すること）:
**非ゴール**（今回は対象外とすること）:
**成功指標**（どうなれば成功か）:

それぞれ教えてください。
```

回答を得たら、`requirements.md` の「3. ゴール」「4. 成功指標」セクションを更新。
ステータスを `要件確定` に変更。

---

## Phase 2: 技術設計

### Step 4: コードベース調査（file-finder エージェント）

```
技術設計に入る前に、関連する既存コードを調査します。
🔍 **file-finder エージェントを実行します（独立コンテキスト）**
```

→ 入力仕様: `.claude/agents/file-finder.md` を参照

調査結果を表示後、設計の検討に進む。

### Step 5: 技術設計の検討

```
技術設計を検討しましょう。以下の観点で考えていきます:

1. **データ設計**: 新しいテーブルやカラムは必要ですか？
2. **API設計**: どんなエンドポイントが必要ですか？
3. **UI設計**: どの画面に、どんなUIを追加しますか？

まず、データの保存について考えましょう。この機能で扱うデータは何ですか？
```

対話を通じて以下を決定:

- データベーススキーマ（Prismaモデル）
- APIエンドポイント
- コンポーネント構成

決定後、`design.md` を作成（テンプレート: `.claude/skills/add-feature/templates/design-template.md`）

### Step 6: 影響範囲分析（impact-analyzer エージェント）

```
設計内容をもとに、既存コードへの影響を分析します。
🔍 **impact-analyzer エージェントを実行します（独立コンテキスト）**
```

→ 入力仕様: `.claude/agents/impact-analyzer.md` を参照

分析結果を `design.md` の「7. 影響範囲」「8. リスクと代替案」セクションに反映。

---

## Phase 3: 実装計画

### Step 7: 実装計画の策定

```
実装計画を策定しましょう。

**機能タイプの確認**:
この機能はどのタイプに該当しますか？

A. **フロントエンドのみ**: UIコンポーネント、モーダル追加
B. **バックエンドのみ**: APIエンドポイント追加・拡張
C. **フルスタック**: DB + API + UI の新機能
D. **複合ページ**: 複数機能を持つページ追加
```

#### タイプ選択ガイド

| ケース | 判断基準 | タイプ |
|--------|----------|--------|
| 既存データを表示するUI追加 | DBスキーマ変更なし、既存API使用 | A |
| 新しいデータ入力フォーム | 新規保存が必要 → API/DB必要 | C |
| 外部APIとの連携追加 | バックエンドのみ変更 | B |
| ダッシュボード追加 | 複数データソース、複数コンポーネント | D |
| 設定画面に新オプション | 保存が必要なら C、表示のみなら A | A or C |

#### 迷った場合のフローチャート

```
DBスキーマ変更が必要？
├─ Yes → タイプ C（フルスタック）
└─ No
    ├─ 新しいAPIエンドポイントが必要？
    │   ├─ Yes → タイプ B or C
    │   └─ No → タイプ A（フロントエンドのみ）
    └─ 複数の独立した機能を含む？
        ├─ Yes → タイプ D（複合ページ）
        └─ No → タイプ A, B, or C
```

機能タイプが決まったら、該当するテンプレートで `tasklist.md` を作成:
- A → `.claude/skills/add-feature/templates/tasklist-frontend.md`
- B → `.claude/skills/add-feature/templates/tasklist-backend.md`
- C → `.claude/skills/add-feature/templates/tasklist-fullstack.md`
- D → `.claude/skills/add-feature/templates/tasklist-complex.md`

### Step 8: 最終確認と実装開始

すべてのファイルが揃ったら:

```
ステアリングファイルが完成しました！

📁 **ステアリングディレクトリ**: `docs/steering/{YYYYMMDD}-{feature-name}/`

| ファイル | 内容 |
|----------|------|
| requirements.md | 要件定義（ゴール、成功指標） |
| design.md | 技術設計（API、DB、UI） |
| tasklist.md | タスクリスト |

---

## サマリー

- **機能名**: {機能名}
- **変更ファイル数**: {概算}
- **影響範囲**: {低/中/高}

### 推奨エージェントフロー
file-finder → impact-analyzer → [実装] → test-runner → code-reviewer

---

実装を開始しますか？
```

---

## Phase 4: 実装・検証

### Step 9: 実装

`tasklist.md` に従って実装を進める。各タスク完了時に `progress.md` のチェックを更新。

### Step 10: ビルド確認（build-executor エージェント）

🔧 **build-executor エージェントを実行**（独立コンテキスト）
→ 入力仕様: `.claude/agents/build-executor.md` を参照

エラーがあれば修正し、再度ビルドを実行。

### Step 11: テスト・Lint（test-runner エージェント）

🧪 **test-runner エージェントを実行**（独立コンテキスト）
→ 入力仕様: `.claude/agents/test-runner.md` を参照

エラー・警告を解消。

### Step 12: コードレビュー（code-reviewer エージェント）

🔍 **code-reviewer エージェントを実行**（独立コンテキスト）
→ 入力仕様: `.claude/agents/code-reviewer.md` を参照

Critical Issues を解消。

### Step 13: セキュリティチェック（security-checker エージェント）

🔒 **security-checker エージェントを実行**（独立コンテキスト）
→ 入力仕様: `.claude/agents/security-checker.md` を参照

脆弱性があれば修正。

### Step 14: ドキュメント整合性（review-docs エージェント）

📝 **review-docs エージェントを実行**（独立コンテキスト）
→ 入力仕様: `.claude/agents/review-docs.md` を参照

関連ドキュメントを更新。

---

## 注意事項

- ディレクトリは Step 2 で即座に作成し、以降のファイルは随時追加・更新する
- 各ステップでユーザーの回答を待ってから次に進む
- 既存のコードパターンに従った設計を提案する
- 技術的な判断が必要な場合は、CLAUDE.md を参照する
- 対話が中断されても、途中まで入力した内容はファイルに保存されている
- 完了後、`mv docs/steering/{dir} docs/steering/archive/` でアーカイブ

---

## エラーハンドリング

各ステップで問題が発生した場合の対応フロー:

### Step 10 (ビルド) で失敗した場合

1. エラーメッセージを分析
2. `build-executor` エージェントの提案に従って修正
3. 修正後、再度 Step 10 を実行
4. 3回失敗した場合、ユーザーに状況を報告し対応を相談

### Step 11 (テスト/Lint) で失敗した場合

1. 失敗内容を分類（Lint エラー / 型エラー / テスト失敗）
2. 優先順位: 型エラー → Lint エラー → テスト失敗
3. 各エラーを修正し、再度 Step 11 を実行
4. テスト失敗が実装ロジックに起因する場合、Step 9 に戻る

### Step 12-14 で問題が見つかった場合

1. 問題の重大度を判定（Critical / Warning / Info）
2. Critical: 即座に修正し、Step 10 から再検証
3. Warning: ユーザーに報告し、修正するか確認
4. Info: 記録のみ、次のステップへ進む

### フローチャート

```
[Step 10: ビルド]
    ↓ 失敗
    → 修正 → 再実行（最大3回）
    → 3回失敗 → ユーザーに相談
    ↓ 成功
[Step 11: テスト/Lint]
    ↓ 失敗
    → 修正 → 再実行
    → ロジック問題 → Step 9 に戻る
    ↓ 成功
[Step 12-14: レビュー系]
    ↓ Critical
    → 修正 → Step 10 に戻る
    ↓ Warning/Info
    → 記録 → 次へ
```
