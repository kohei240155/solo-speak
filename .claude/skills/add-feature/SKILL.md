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

## スキップ条件

CLAUDE.md の「実装ワークフロー」セクションに記載の例外条件に従う。

---

## 再開時の処理

コマンド実行時、`docs/steering/` 内に進行中のディレクトリがあるか確認する。

- `archive/` は除外、`progress.md` のステータスが「完了」以外を「進行中」と判定
- 進行中がある場合: ユーザーに再開 or 新規開始を確認
- 進行中がない場合: Phase 1 Step 1 から開始
- 次のステップは `progress.md` の最初の `- [ ]` 項目で判定

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

1. 日付取得（`date +%Y%m%d`）、機能名をkebab-caseに変換
2. `docs/steering/{YYYYMMDD}-{feature-name}/` ディレクトリを作成
3. テンプレートからファイル作成:
   - `progress.md`（テンプレート: `.claude/skills/add-feature/templates/progress-template.md`）
   - `requirements.md`（テンプレート: `.claude/skills/add-feature/templates/requirements-template.md`）
4. 「1. 背景と課題」「2. 期待する結果」セクションを埋める
5. `progress.md` の Step 1, Step 2 のチェックを更新

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

→ file-finder エージェントへの入力:
  - 機能名/キーワード: {Phase1で決まった機能名}
  - 検索範囲: src/app/api/, src/components/, src/hooks/, src/types/
  - 検索目的: 技術設計のための既存コード調査

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

→ impact-analyzer エージェントへの入力:
  - 変更内容: {技術設計で決まった変更概要}
  - 変更対象ファイル: {新規作成・修正予定のファイルパス}
  - 分析観点: DBスキーマ変更、API変更、型変更など該当する観点

分析結果を `design.md` の「7. 影響範囲」「8. リスクと代替案」セクションに反映。

### Step 7: テストケース設計

```
技術設計に基づいて、テストケースを設計しましょう。

**テスト対象の確認**:
この機能で作成するコンポーネント/関数のうち、テストが必要なものはどれですか？

- [ ] APIルート（バリデーション、認証、レスポンス）
- [ ] カスタムフック（状態管理、副作用）
- [ ] UIコンポーネント（レンダリング、ユーザー操作）
- [ ] ユーティリティ関数（純粋関数）
```

対話を通じて以下を決定:

- テスト対象の優先度（必須 / 推奨 / オプション）
- 各対象の正常系・異常系テストケース
- モックが必要な外部依存

決定後、`design.md` の「6. テスト戦略」セクションを詳細に記入。

---

## Phase 3: 実装計画

### Step 8: 実装計画の策定

```
実装計画を策定しましょう。

**機能タイプの確認**:
この機能はどのタイプに該当しますか？

A. **フロントエンドのみ**: UIコンポーネント、モーダル追加
B. **バックエンドのみ**: APIエンドポイント追加・拡張
C. **フルスタック**: DB + API + UI の新機能
D. **複合ページ**: 複数機能を持つページ追加
```

機能タイプが決まったら、該当するテンプレートで `tasklist.md` を作成:
- A → `.claude/skills/add-feature/templates/tasklist-frontend.md`
- B → `.claude/skills/add-feature/templates/tasklist-backend.md`
- C → `.claude/skills/add-feature/templates/tasklist-fullstack.md`
- D → `.claude/skills/add-feature/templates/tasklist-complex.md`

### Step 9: 最終確認と実装開始

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

## Phase 4: TDD実装・検証

### Step 10: TDDサイクル - Red Phase（テスト作成）

```
🔴 **Red Phase**: まずテストを書きます。

tasklist.md の最初の実装タスクに対応するテストファイルを作成します。
テストは失敗する状態（Red）で開始します。

**テストファイル作成手順**:
1. design.md の「6. テスト戦略」に記載したテストケースを確認
2. 対象ファイルと同階層にテストファイルを作成
   - コンポーネント: `ComponentName.test.tsx`
   - フック: `useHookName.test.ts`
   - APIルート: `route.test.ts`
3. テストケースを実装
4. `npm run test:watch` でテスト失敗を確認
```

### Step 11: TDDサイクル - Green Phase（最小実装）

```
🟢 **Green Phase**: テストを通す最小限のコードを実装します。

design.md に従いつつ、まずはテストを通すことを優先してください。
完璧な実装でなくてOKです。
```

### Step 12: TDDサイクル - Refactor Phase（リファクタリング）

```
🔵 **Refactor Phase**: コードを改善します。

テストがパスした状態を維持しながら:
- 重複の除去
- 命名の改善
- パフォーマンス最適化

を行います。リファクタリング後もテストがパスすることを確認してください。
```

### Step 13: TDDサイクル繰り返し

`tasklist.md` の残りのタスクに対して、Step 10-12 を繰り返す。
各タスク完了時に `progress.md` のチェックを更新。

**TDDサイクルの凡例**:
- 🔴 Red: テスト作成（失敗するテスト）
- 🟢 Green: 最小実装（テストをパス）
- 🔵 Refactor: コード改善（テスト維持）

### Step 14-18: 検証

以下のエージェントを順次実行し、問題があれば修正:

| Step | エージェント | 確認内容 |
|------|-------------|----------|
| 14 | build-executor | ビルドエラー（`npm run build:local`） |
| 15 | test-runner | テスト・Lint（`npm run test && npm run lint`） |
| 16 | code-reviewer | コード品質（認証、バリデーション、型安全性） |
| 17 | security-checker | セキュリティ（認証・認可、インジェクション） |
| 18 | review-docs | ドキュメント整合性 |

---

## ステータス遷移

| ファイル | 初期値 | 主な遷移 |
|----------|--------|----------|
| progress.md | Phase 1 | Phase 1 → 2（Step 4）→ 3（Step 8）→ 4（Step 10）→ 完了（Step 18） |
| requirements.md | 作成中 | → 要件確定（Step 3） |
| design.md | 設計中 | → 設計確定（Step 7） |
| tasklist.md | 計画中 | → 実装中（Step 10）→ 完了（Step 18） |

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

- **ビルド/テスト失敗**: エラーを修正して再実行。3回失敗でユーザーに相談
- **レビューで Critical**: 即座に修正し Step 14 から再検証
- **レビューで Warning**: ユーザーに修正要否を確認
