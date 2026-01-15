---
description: バグ修正のワークフロー（対話形式で調査→原因特定→修正）
---

# Fix Bug Command

バグ修正を対話形式で進め、ステアリングファイル群を生成するコマンドです。

## 出力ファイル

```
docs/steering/{YYYYMMDD}-fix-{bug-name}/
├── progress.md        # プロセス進捗（Step 2 で作成）
├── investigation.md   # 調査結果（Step 2 で作成、Step 3-5 で更新）
├── fix-plan.md        # 修正計画（Step 6 で作成）
└── tasklist.md        # タスクリスト（Step 7 で作成）
```

命名例: `docs/steering/20260113-fix-login-error/`

---

## スキップ条件

CLAUDE.md の「実装ワークフロー」セクションに記載の例外条件に従う。

---

## 再開時の処理

コマンド実行時、`docs/steering/` 内に進行中の `-fix-` ディレクトリがあるか確認する。

- `archive/` は除外、`progress.md` のステータスが「完了」以外を「進行中」と判定
- 進行中がある場合: ユーザーに再開 or 新規開始を確認
- 進行中がない場合: Phase 1 Step 1 から開始
- 次のステップは `progress.md` の最初の `- [ ]` 項目で判定

---

## Phase 1: バグ情報収集

### Step 1: バグの症状ヒアリング

ユーザーに以下を質問:

```
バグ修正を始めましょう。まず、バグの状況について教えてください:

1. **バグの症状**: どのような問題が発生していますか？
2. **再現手順**: どのような操作をすると発生しますか？
3. **期待動作**: 本来どのように動作すべきですか？
4. **実際の動作**: 実際にはどうなりますか？
```

### Step 2: ステアリングディレクトリの作成

ユーザーの回答をもとに:

1. 日付取得（`date +%Y%m%d`）、バグ名をkebab-caseに変換
2. `docs/steering/{YYYYMMDD}-fix-{bug-name}/` ディレクトリを作成
3. テンプレートからファイル作成:
   - `progress.md`（テンプレート: `.claude/skills/fix-bug/templates/progress-template.md`）
   - `investigation.md`（テンプレート: `.claude/skills/fix-bug/templates/investigation-template.md`）
4. 「1. バグ概要」「2. 再現手順」「3. 期待動作 vs 実際の動作」セクションを埋める
5. `progress.md` の Step 1, Step 2 のチェックを更新

#### 🚀 ブランチ準備（大規模修正の場合）

200行超の修正が見込まれる場合、リリースブランチを作成:

```bash
git checkout main && git pull origin main
git checkout -b release/fix-{バグ名}
git push -u origin release/fix-{バグ名}
git checkout -b feature/fix-{バグ名}/investigation
```

### Step 3: 影響度と環境の確認

```
次に、バグの影響度と発生環境を確認します。

**影響度**:
- Critical: サービス停止、データ損失
- High: 主要機能が使用不可
- Medium: 機能の一部が使用不可、回避策あり
- Low: 軽微な不具合

**発生環境**:
- ブラウザ / OS は何ですか？
- 本番環境 / 開発環境 / 両方で発生しますか？

それぞれ教えてください。
```

回答を得たら、`investigation.md` の「4. 発生環境」セクションを更新。

---

## Phase 2: 原因調査

### Step 4: コードベース調査（file-finder エージェント）

```
原因調査に入ります。関連する既存コードを調査します。
🔍 **file-finder エージェントを実行します（独立コンテキスト）**
```

→ file-finder エージェントへの入力:
  - 機能名/キーワード: {バグに関連する機能名}
  - 検索範囲: src/app/api/, src/components/, src/hooks/, src/types/
  - 検索目的: バグ原因調査

調査結果を `investigation.md` の「5. 原因分析」セクションに反映。

### Step 5: 影響範囲分析（impact-analyzer エージェント）

```
原因が特定できました。次に、修正の影響範囲を分析します。
🔍 **impact-analyzer エージェントを実行します（独立コンテキスト）**
```

→ impact-analyzer エージェントへの入力:
  - 変更内容: {修正予定の変更概要}
  - 変更対象ファイル: {修正予定のファイルパス}
  - 分析観点: 修正による副作用、関連機能への影響

分析結果を `investigation.md` の「6. 影響範囲」セクションに反映。
ステータスを `原因特定済み` に変更。

### Step 6: 修正計画の策定

```
原因と影響範囲が明確になりました。修正計画を策定しましょう。

**修正方針の検討**:
考慮事項:
- 最小限の変更で修正できるか
- 同様のバグを防ぐための対策が必要か
- ロールバックが必要になった場合の対応
```

対話を通じて以下を決定:

- 修正方針
- テスト計画
- ロールバック計画

決定後、`fix-plan.md` を作成（テンプレート: `.claude/skills/fix-bug/templates/fix-plan-template.md`）

---

## Phase 3: 実装計画

### Step 7: タスクリストの作成

バグ修正専用テンプレートで `tasklist.md` を作成:
- テンプレート: `.claude/skills/fix-bug/templates/tasklist.md`

### Step 8: 最終確認と実装開始

すべてのファイルが揃ったら:

```
ステアリングファイルが完成しました！

📁 **ステアリングディレクトリ**: `docs/steering/{YYYYMMDD}-fix-{bug-name}/`

| ファイル | 内容 |
|----------|------|
| investigation.md | 調査結果（症状、再現手順、原因） |
| fix-plan.md | 修正計画（方針、テスト計画） |
| tasklist.md | タスクリスト |

---

## サマリー

- **バグ名**: {バグ名}
- **影響度**: {Critical/High/Medium/Low}
- **変更ファイル数**: {概算}

### 推奨エージェントフロー
file-finder → impact-analyzer → [修正] → test-runner → code-reviewer

---

修正を開始しますか？
```

#### 📝 調査PR作成（大規模修正の場合）

調査・計画ドキュメントが完成したら、調査PRを作成:

```bash
git add docs/steering/{YYYYMMDD}-fix-{バグ名}/
git commit -m "docs(fix-{バグ名}): add investigation and fix plan"
git push -u origin feature/fix-{バグ名}/investigation

gh pr create \
  --base release/fix-{バグ名} \
  --title "📝 [fix-{バグ名}] 調査・修正計画" \
  --body "$(cat <<'EOF'
## 概要
{バグ名}の調査結果と修正計画

## 変更種別
- [x] 📝 調査・計画ドキュメント

## 含まれるファイル
- investigation.md（調査結果）
- fix-plan.md（修正計画）
- tasklist.md（タスクリスト）

## レビュー観点
- [ ] 原因分析の妥当性
- [ ] 修正方針の適切性
- [ ] 影響範囲の網羅性
EOF
)"
```

---

## Phase 4: 実装・検証

### Step 9: [オプション] リグレッションテスト作成（TDD）

複雑なロジックや再発防止が重要な場合、TDDアプローチを使用:

```
🔴 **Red Phase**: バグを再現するテストを作成（失敗確認）
🟢 **Green Phase**: バグを修正（テストパス）
🔵 **Refactor Phase**: 必要に応じてリファクタリング
```

設定ミス・タイポ・UI問題などはスキップ可。

### Step 10: 実装

`tasklist.md` に従って修正を進める。各タスク完了時に `progress.md` のチェックを更新。

TDDを使用した場合は、テストがパスすることを確認しながら修正。

### Step 11-15: 検証

以下のエージェントを順次実行し、問題があれば修正:

| Step | エージェント | 確認内容 |
|------|-------------|----------|
| 11 | build-executor | ビルドエラー（`npm run build:local`） |
| 12 | test-runner | テスト・Lint（`npm run test && npm run lint`） |
| 13 | code-reviewer | コード品質（認証、バリデーション、型安全性） |
| 14 | security-checker | セキュリティ（認証・認可、インジェクション） |
| 15 | review-docs | ドキュメント整合性 |

#### 🐛 修正PR作成

すべての検証が完了したら、修正PRを作成:

**小規模修正（〜200行）の場合**:

```bash
git checkout main && git pull origin main
git checkout -b fix/{バグ名}
# 修正をコミット
git add .
git commit -m "fix({バグ名}): resolve {問題概要}"
git push -u origin fix/{バグ名}

gh pr create \
  --base main \
  --title "🐛 [{バグ名}] バグ修正" \
  --body "$(cat <<'EOF'
## 概要
{バグ名}を修正

## 変更種別
- [x] 🐛 バグ修正

## 修正内容
- {修正内容}

## 検証
- [x] 再現手順で問題が解消されることを確認
- [x] ビルド通過
- [x] テスト通過

## 設計ドキュメント
- `docs/steering/{YYYYMMDD}-fix-{バグ名}/`
EOF
)"
```

**大規模修正（200行超）の場合**:

```bash
git checkout release/fix-{バグ名}
git pull origin release/fix-{バグ名}
git checkout -b feature/fix-{バグ名}/implementation

# 修正をコミット
git add .
git commit -m "fix({バグ名}): resolve {問題概要}"
git push -u origin feature/fix-{バグ名}/implementation

gh pr create \
  --base release/fix-{バグ名} \
  --title "🐛 [fix-{バグ名}] 修正実装" \
  --body "$(cat <<'EOF'
## 概要
{バグ名}の修正実装

## 変更種別
- [x] 🐛 バグ修正

## 修正内容
- {修正内容}

## 検証
- [x] 再現手順で問題が解消されることを確認
- [x] ビルド通過
- [x] テスト通過
EOF
)"

# リリースPR作成
git checkout release/fix-{バグ名}
git pull origin release/fix-{バグ名}

gh pr create \
  --base main \
  --title "🚀 [fix-{バグ名}] リリース" \
  --body "$(cat <<'EOF'
## 概要
{バグ名}の全修正をmainにマージ

## 変更種別
- [x] 🔗 統合・検証

## 含まれるPR
- #XXX 調査・修正計画
- #XXX 修正実装

## 検証状況
- [x] ビルド通過
- [x] テスト通過
- [x] セキュリティチェック通過

## 設計ドキュメント
- `docs/steering/{YYYYMMDD}-fix-{バグ名}/`
EOF
)"
```

---

## ステータス遷移

| ファイル | 初期値 | 主な遷移 |
|----------|--------|----------|
| progress.md | Phase 1 | Phase 1 → 2（Step 4）→ 3（Step 7）→ 4（Step 9）→ 完了（Step 15） |
| investigation.md | 調査中 | → 原因特定済み（Step 5）→ 修正中（Step 10）→ 完了（Step 15） |
| fix-plan.md | 計画中 | → 承認済み（Step 8 でユーザー承認後） |
| tasklist.md | 計画中 | → 実装中（Step 10）→ 完了（Step 15） |

---

## ブランチ戦略について

PR分割フローの詳細は [docs/branching-strategy.md](/docs/branching-strategy.md) を参照。

---

## 注意事項

- ディレクトリは Step 2 で即座に作成し、以降のファイルは随時追加・更新する
- 各ステップでユーザーの回答を待ってから次に進む
- 最小限の修正で問題を解決することを優先する
- 技術的な判断が必要な場合は、CLAUDE.md を参照する
- 対話が中断されても、途中まで入力した内容はファイルに保存されている
- 完了後、`mv docs/steering/{dir} docs/steering/archive/` でアーカイブ

---

## エラーハンドリング

- **ビルド/テスト失敗**: エラーを修正して再実行。3回失敗でユーザーに相談
- **レビューで Critical**: 即座に修正し Step 11 から再検証
- **レビューで Warning**: ユーザーに修正要否を確認
