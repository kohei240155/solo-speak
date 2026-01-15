---
description: 既存機能修正のワークフロー（対話形式で変更要求→影響分析→実装）
---

# Modify Feature Command

既存機能の修正・改善を対話形式で進め、ステアリングファイル群を生成するコマンドです。

## 出力ファイル

```
docs/steering/{YYYYMMDD}-modify-{feature-name}/
├── progress.md          # プロセス進捗（Step 2で作成）
├── change-request.md    # 変更要求（Step 2で作成）
├── impact-analysis.md   # 影響分析（Step 5で作成）
└── tasklist.md          # タスクリスト（Step 6で作成）
```

命名例: `docs/steering/20260113-modify-user-profile/`

---

## スキップ条件

CLAUDE.md の「実装ワークフロー」セクションに記載の例外条件に従う。

---

## 再開時の処理

コマンド実行時、`docs/steering/` 内に進行中の `-modify-` ディレクトリがあるか確認する。

- `archive/` は除外、`progress.md` のステータスが「完了」以外を「進行中」と判定
- 進行中がある場合: ユーザーに再開 or 新規開始を確認
- 進行中がない場合: Phase 1 Step 1 から開始
- 次のステップは `progress.md` の最初の `- [ ]` 項目で判定

---

## Phase 1: 変更要求確認

### Step 1: 変更内容のヒアリング

ユーザーに以下を質問:

```
既存機能の修正を始めましょう。変更内容について教えてください:

1. **対象機能**: どの機能を変更しますか？
2. **変更理由**: なぜ変更が必要ですか？
3. **現在の動作**: 今はどのように動作していますか？
4. **変更後の動作**: どのように変更したいですか？
```

### Step 2: ステアリングディレクトリの作成

ユーザーの回答をもとに:

1. 日付取得（`date +%Y%m%d`）、機能名をkebab-caseに変換
2. `docs/steering/{YYYYMMDD}-modify-{feature-name}/` ディレクトリを作成
3. テンプレートからファイル作成:
   - `progress.md`（テンプレート: `.claude/skills/modify-feature/templates/progress-template.md`）
   - `change-request.md`（テンプレート: `.claude/skills/modify-feature/templates/change-request-template.md`）
4. 変更概要・理由・内容を記入
5. `progress.md` の Step 1, Step 2 のチェックを更新

#### 🚀 ブランチ準備（大規模修正の場合）

200行超の変更が見込まれる場合、リリースブランチを作成:

```bash
git checkout main && git pull origin main
git checkout -b release/modify-{機能名}
git push -u origin release/modify-{機能名}
git checkout -b feature/modify-{機能名}/analysis
```

### Step 3: 後方互換性・成功指標の確認

```
次に、後方互換性と成功指標を確認します。

**後方互換性**: 既存の動作が変わりますか？移行対応は必要ですか？
**成功指標**: 何が改善され、どう測定しますか？

それぞれ教えてください。
```

回答を得たら、`change-request.md` を更新。

---

## Phase 2: 影響分析

### Step 4: コードベース調査（file-finder エージェント）

```
影響分析に入ります。関連する既存コードを調査します。
🔍 **file-finder エージェントを実行します（独立コンテキスト）**
```

→ file-finder エージェントへの入力:
  - 機能名/キーワード: {変更対象の機能名}
  - 検索範囲: src/app/api/, src/components/, src/hooks/, src/types/
  - 検索目的: 変更影響の調査

### Step 5: 影響範囲分析（impact-analyzer エージェント）

```
関連コードを調査しました。次に、変更の影響範囲を分析します。
🔍 **impact-analyzer エージェントを実行します（独立コンテキスト）**
```

→ impact-analyzer エージェントへの入力:
  - 変更内容: {変更概要}
  - 変更対象ファイル: {変更予定のファイルパス}
  - 分析観点: 破壊的変更、関連機能への影響

分析結果を `impact-analysis.md` に記録（テンプレート: `.claude/skills/modify-feature/templates/impact-analysis-template.md`）

---

## Phase 3: 実装計画

### Step 6: タスクリスト作成

テンプレートで `tasklist.md` を作成:
- テンプレート: `.claude/skills/modify-feature/templates/tasklist.md`

### Step 7: 最終確認と実装開始

すべてのファイルが揃ったら:

```
ステアリングファイルが完成しました！

📁 **ステアリングディレクトリ**: `docs/steering/{YYYYMMDD}-modify-{feature-name}/`

| ファイル | 内容 |
|----------|------|
| change-request.md | 変更要求（対象、理由、変更内容） |
| impact-analysis.md | 影響分析（破壊的変更、リスク） |
| tasklist.md | タスクリスト |

---

## サマリー

- **対象機能**: {機能名}
- **破壊的変更**: {あり/なし}
- **リスクレベル**: {低/中/高}

### 推奨エージェントフロー
file-finder → impact-analyzer → [実装] → test-runner → code-reviewer

---

実装を開始しますか？
```

#### 📝 影響分析PR作成（大規模修正の場合）

影響分析ドキュメントが完成したら、影響分析PRを作成:

```bash
git add docs/steering/{YYYYMMDD}-modify-{機能名}/
git commit -m "docs(modify-{機能名}): add change request and impact analysis"
git push -u origin feature/modify-{機能名}/analysis

gh pr create \
  --base release/modify-{機能名} \
  --title "📝 [modify-{機能名}] 変更要求・影響分析" \
  --body "$(cat <<'EOF'
## 概要
{機能名}の変更要求と影響分析

## 変更種別
- [x] 📝 分析ドキュメント

## 含まれるファイル
- change-request.md（変更要求）
- impact-analysis.md（影響分析）
- tasklist.md（タスクリスト）

## レビュー観点
- [ ] 変更要求の妥当性
- [ ] 影響範囲の網羅性
- [ ] 後方互換性の考慮
EOF
)"
```

---

## Phase 4: 実装・検証

### Step 8: [オプション] テスト作成（TDD）

複雑なロジック変更やリグレッション防止が重要な場合、TDDアプローチを使用:

```
🔴 **Red Phase**: 変更後の動作を検証するテストを作成（失敗確認）
🟢 **Green Phase**: 変更を実装（テストパス）
🔵 **Refactor Phase**: 必要に応じてリファクタリング
```

単純な修正はスキップ可。

### Step 9: 実装

`tasklist.md` に従って実装。各タスク完了時に `progress.md` のチェックを更新。

TDDを使用した場合は、テストがパスすることを確認しながら進める。

#### 🔧 バックエンドPR作成（大規模修正の場合）

バックエンド実装が完了したら、バックエンドPRを作成:

```bash
git checkout release/modify-{機能名}
git pull origin release/modify-{機能名}
git checkout -b feature/modify-{機能名}/backend

# 実装をコミット
git add src/app/api/ src/types/ prisma/ __tests__/api/
git commit -m "feat(modify-{機能名}): implement backend changes"
git push -u origin feature/modify-{機能名}/backend

gh pr create \
  --base release/modify-{機能名} \
  --title "🔧 [modify-{機能名}] バックエンド修正" \
  --body "$(cat <<'EOF'
## 概要
{機能名}のバックエンド修正

## 変更種別
- [x] 🔧 バックエンド（API/DB）

## 含まれるファイル
- APIルート
- 型定義・Zodスキーマ
- DBスキーマ（該当する場合）
- APIテスト

## レビュー観点
- [ ] 後方互換性
- [ ] バリデーションの網羅性
- [ ] エラーハンドリング
EOF
)"
```

#### 🎨 フロントエンドPR作成（大規模修正の場合）

フロントエンド実装が完了したら、フロントエンドPRを作成:

```bash
git checkout release/modify-{機能名}
git pull origin release/modify-{機能名}
git checkout -b feature/modify-{機能名}/frontend

# 実装をコミット
git add src/hooks/ src/components/ __tests__/components/
git commit -m "feat(modify-{機能名}): implement frontend changes"
git push -u origin feature/modify-{機能名}/frontend

gh pr create \
  --base release/modify-{機能名} \
  --title "🎨 [modify-{機能名}] フロントエンド修正" \
  --body "$(cat <<'EOF'
## 概要
{機能名}のフロントエンド修正

## 変更種別
- [x] 🎨 フロントエンド（UI/フック）

## 含まれるファイル
- カスタムフック
- UIコンポーネント
- コンポーネントテスト

## レビュー観点
- [ ] パフォーマンス
- [ ] アクセシビリティ
- [ ] レスポンシブ対応
EOF
)"
```

### Step 10-14: 検証

以下のエージェントを順次実行し、問題があれば修正:

| Step | エージェント | 確認内容 |
|------|-------------|----------|
| 10 | build-executor | ビルドエラー（`npm run build:local`） |
| 11 | test-runner | テスト・Lint（`npm run test && npm run lint`） |
| 12 | code-reviewer | コード品質（認証、バリデーション、型安全性） |
| 13 | security-checker | セキュリティ（認証・認可、インジェクション） |
| 14 | review-docs | ドキュメント整合性 |

#### ✨ 修正PR作成

すべての検証が完了したら、修正PRを作成:

**小規模修正（〜200行）の場合**:

```bash
git checkout main && git pull origin main
git checkout -b modify/{機能名}
# 修正をコミット
git add .
git commit -m "feat(modify-{機能名}): {変更概要}"
git push -u origin modify/{機能名}

gh pr create \
  --base main \
  --title "✨ [{機能名}] 機能修正" \
  --body "$(cat <<'EOF'
## 概要
{機能名}を修正

## 変更種別
- [x] ✨ 機能修正

## 変更内容
- {変更内容}

## 後方互換性
- {あり/なし}

## 検証
- [x] 変更後の動作を確認
- [x] ビルド通過
- [x] テスト通過

## 設計ドキュメント
- `docs/steering/{YYYYMMDD}-modify-{機能名}/`
EOF
)"
```

**大規模修正（200行超）の場合**:

```bash
git checkout release/modify-{機能名}
git pull origin release/modify-{機能名}

# progress.md を完了状態に更新
git add docs/steering/{YYYYMMDD}-modify-{機能名}/progress.md
git commit -m "docs(modify-{機能名}): mark as completed"
git push origin release/modify-{機能名}

gh pr create \
  --base main \
  --title "🚀 [modify-{機能名}] リリース" \
  --body "$(cat <<'EOF'
## 概要
{機能名}の全修正をmainにマージ

## 変更種別
- [x] 🔗 統合・検証

## 含まれるPR
- #XXX 変更要求・影響分析
- #XXX バックエンド修正
- #XXX フロントエンド修正

## 検証状況
- [x] ビルド通過
- [x] テスト通過
- [x] セキュリティチェック通過

## 設計ドキュメント
- `docs/steering/{YYYYMMDD}-modify-{機能名}/`
EOF
)"
```

---

## ステータス遷移

| ファイル | 初期値 | 主な遷移 |
|----------|--------|----------|
| progress.md | Phase 1 | Phase 1 → 2（Step 4）→ 3（Step 6）→ 4（Step 8）→ 完了（Step 14） |
| change-request.md | 作成中 | → 確定（Step 3） |
| impact-analysis.md | 分析中 | → 分析完了（Step 5） |
| tasklist.md | 計画中 | → 実装中（Step 9）→ 完了（Step 14） |

---

## ブランチ戦略について

PR分割フローの詳細は [docs/branching-strategy.md](/docs/branching-strategy.md) を参照。

---

## 注意事項

- ディレクトリは Step 2 で即座に作成し、以降のファイルは随時追加・更新する
- 各ステップでユーザーの回答を待ってから次に進む
- 後方互換性を最大限維持することを優先する
- 技術的な判断が必要な場合は、CLAUDE.md を参照する
- 対話が中断されても、途中まで入力した内容はファイルに保存されている
- 完了後、`mv docs/steering/{dir} docs/steering/archive/` でアーカイブ

---

## エラーハンドリング

- **ビルド/テスト失敗**: エラーを修正して再実行。3回失敗でユーザーに相談
- **レビューで Critical**: 即座に修正し Step 10 から再検証
- **レビューで Warning**: ユーザーに修正要否を確認
