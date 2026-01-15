---
name: add-feature
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

## Phase 1: 対話的な要件ヒアリング

### Step 1: 初期入力の受け取り

ユーザーが自由形式で入力できるように促す:

```
新機能の実装を始めましょう！

どんな機能を作りたいですか？
自由に教えてください。「〇〇みたいなことがしたい」「△△ができると嬉しい」など、何でもOKです。
```

### Step 2: 初期入力の解釈と確認

ユーザーの回答を受け取ったら:

1. AIが内容を解釈・整理
2. 理解内容を要約して提示
3. 最初の深掘り質問を行う

```
ありがとうございます！いくつか確認させてください。

---
### 現時点での理解

**やりたいこと**: {AIが解釈した内容を1-2文で要約}

---

では、詳しく教えてください。

{最初の質問}
```

### Step 3: 一問一答の深掘り

以下のルールで質問を進める:

**質問スタイルの使い分け**:
- **技術的な質問** → 選択肢付きで提示
- **ユーザー体験の質問** → オープン形式

**質問例（技術的・選択肢付き）**:
```
**Q. データの保存**
この機能で扱うデータは保存が必要ですか？

A. はい、DBに永続化したい
B. はい、ローカルストレージに一時保存したい
C. いいえ、保存不要（その場限り）
D. まだわからない
```

**質問例（ユーザー体験・オープン）**:
```
**Q. 完了したときの体験**
この機能が完成したら、ユーザーにとって何が嬉しいですか？
今できないことで、できるようになることを教えてください。
```

**質問カテゴリ**:
- ユースケース理解（誰が、いつ、どんな状況で使うか）
- 技術的な方向性（データ保存、API、UI配置）
- 期待値・優先度（何を重視するか）

### Step 4: 中間確認（3-4回の質問ごと）

3-4回の質問を行ったら、中間確認を挟む:

```
---
### ここまでの理解

**機能概要**: {1-2文で要約}

**ユースケース**:
- {ユースケース1}
- {ユースケース2}

**技術的な方向性**:
- データ保存: {選択された方式}
- UI: {想定されるUI}

---

ここまでの理解は合っていますか？修正点があれば教えてください。
問題なければ「OK」と入力してください。
```

ユーザーが「OK」と回答したら、必要に応じてさらに質問を続ける。

### Step 5: 終了判定と仕様確定

以下が明確になったら終了を提案:
- 解決したい課題
- ユーザーが得られる価値
- 主要なユースケース（1-2個）
- 技術的な方向性（DB/API/UIの有無）
- ゴールと非ゴール

```
十分な情報が集まりました！

---
### 要件サマリー

**機能名（提案）**: {AIが提案する機能名}

**解決する課題**:
{1-2文}

**期待する結果**:
- ユーザーは〇〇できるようになる
- ユーザーは△△できるようになる

**ゴール**:
- [ ] {ゴール1}
- [ ] {ゴール2}

**非ゴール**:
- {今回は対象外とすること}

**成功指標**:
- {指標1}

---

この内容で仕様を固めてよいですか？
修正したい点があれば教えてください。OKであれば「確定」と入力してください。
```

### Step 6: ステアリングディレクトリの作成

ユーザーが「確定」と回答したら:

1. 日付取得（`date +%Y%m%d`）、機能名をkebab-caseに変換
2. `docs/steering/{YYYYMMDD}-{feature-name}/` ディレクトリを作成
3. テンプレートからファイル作成:
   - `progress.md`（テンプレート: `.claude/skills/add-feature/templates/progress-template.md`）
   - `requirements.md`（テンプレート: `.claude/skills/add-feature/templates/requirements-template.md`）
4. 対話で得た内容を `requirements.md` に反映
5. `progress.md` の Phase 1 チェックを更新
6. ステータスを `要件確定` に変更

#### 🚀 ブランチ準備（大規模機能の場合）

200行超の変更が見込まれる場合、リリースブランチを作成:

```bash
git checkout main && git pull origin main
git checkout -b release/{機能名}
git push -u origin release/{機能名}
git checkout -b feature/{機能名}/design
```

---

## Phase 2: 技術設計

### Step 7: コードベース調査（file-finder エージェント）

```
技術設計に入る前に、関連する既存コードを調査します。
🔍 **file-finder エージェントを実行します（独立コンテキスト）**
```

→ file-finder エージェントへの入力:
  - 機能名/キーワード: {Phase1で決まった機能名}
  - 検索範囲: src/app/api/, src/components/, src/hooks/, src/types/
  - 検索目的: 技術設計のための既存コード調査

調査結果を表示後、設計の検討に進む。

### Step 8: 技術設計の検討

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

### Step 9: 影響範囲分析（impact-analyzer エージェント）

```
設計内容をもとに、既存コードへの影響を分析します。
🔍 **impact-analyzer エージェントを実行します（独立コンテキスト）**
```

→ impact-analyzer エージェントへの入力:
  - 変更内容: {技術設計で決まった変更概要}
  - 変更対象ファイル: {新規作成・修正予定のファイルパス}
  - 分析観点: DBスキーマ変更、API変更、型変更など該当する観点

分析結果を `design.md` の「7. 影響範囲」「8. リスクと代替案」セクションに反映。

### Step 10: テストケース設計

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

### Step 11: 実装計画の策定

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

### Step 12: 最終確認と実装開始

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

#### 📝 設計PR作成（大規模機能の場合）

設計ドキュメントが完成したら、設計PRを作成:

```bash
git add docs/steering/{YYYYMMDD}-{機能名}/
git commit -m "docs({機能名}): add design documents"
git push -u origin feature/{機能名}/design

gh pr create \
  --base release/{機能名} \
  --title "📝 [{機能名}] 設計ドキュメント" \
  --body "$(cat <<'EOF'
## 概要
{機能名}の設計ドキュメントを追加

## 変更種別
- [x] 📝 設計ドキュメント

## 含まれるファイル
- requirements.md（要件定義）
- design.md（技術設計）
- tasklist.md（実装計画）

## レビュー観点
- [ ] 要件の妥当性
- [ ] 技術設計の実現可能性
- [ ] タスク分解の粒度
EOF
)"
```

---

## Phase 4: TDD実装・検証

### Step 13: TDDサイクル - Red Phase（テスト作成）

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

### Step 14: TDDサイクル - Green Phase（最小実装）

```
🟢 **Green Phase**: テストを通す最小限のコードを実装します。

design.md に従いつつ、まずはテストを通すことを優先してください。
完璧な実装でなくてOKです。
```

### Step 15: TDDサイクル - Refactor Phase（リファクタリング）

```
🔵 **Refactor Phase**: コードを改善します。

テストがパスした状態を維持しながら:
- 重複の除去
- 命名の改善
- パフォーマンス最適化

を行います。リファクタリング後もテストがパスすることを確認してください。
```

### Step 16: TDDサイクル繰り返し

`tasklist.md` の残りのタスクに対して、Step 13-15 を繰り返す。
各タスク完了時に `progress.md` のチェックを更新。

**TDDサイクルの凡例**:
- 🔴 Red: テスト作成（失敗するテスト）
- 🟢 Green: 最小実装（テストをパス）
- 🔵 Refactor: コード改善（テスト維持）

#### 🔧 バックエンドPR作成（大規模機能の場合）

バックエンド実装が完了したら、バックエンドPRを作成:

```bash
git checkout release/{機能名}
git pull origin release/{機能名}
git checkout -b feature/{機能名}/backend

# 実装をコミット
git add src/app/api/ src/types/ prisma/ __tests__/api/
git commit -m "feat({機能名}): implement backend API"
git push -u origin feature/{機能名}/backend

gh pr create \
  --base release/{機能名} \
  --title "🔧 [{機能名}] バックエンド実装" \
  --body "$(cat <<'EOF'
## 概要
{機能名}のバックエンド実装

## 変更種別
- [x] 🔧 バックエンド（API/DB）

## 含まれるファイル
- APIルート
- 型定義・Zodスキーマ
- DBスキーマ（該当する場合）
- APIテスト

## レビュー観点
- [ ] 認証・認可の適切性
- [ ] バリデーションの網羅性
- [ ] エラーハンドリング
- [ ] セキュリティ（OWASP Top 10）
EOF
)"
```

#### 🎨 フロントエンドPR作成（大規模機能の場合）

フロントエンド実装が完了したら、フロントエンドPRを作成:

```bash
git checkout release/{機能名}
git pull origin release/{機能名}
git checkout -b feature/{機能名}/frontend

# 実装をコミット
git add src/hooks/ src/components/ __tests__/components/
git commit -m "feat({機能名}): implement frontend UI"
git push -u origin feature/{機能名}/frontend

gh pr create \
  --base release/{機能名} \
  --title "🎨 [{機能名}] フロントエンド実装" \
  --body "$(cat <<'EOF'
## 概要
{機能名}のフロントエンド実装

## 変更種別
- [x] 🎨 フロントエンド（UI/フック）

## 含まれるファイル
- カスタムフック
- UIコンポーネント
- コンポーネントテスト

## レビュー観点
- [ ] パフォーマンス（不要な再レンダリング）
- [ ] アクセシビリティ
- [ ] レスポンシブ対応
- [ ] エラー状態の表示
EOF
)"
```

### Step 17-21: 検証

以下のエージェントを順次実行し、問題があれば修正:

| Step | エージェント | 確認内容 |
|------|-------------|----------|
| 17 | build-executor | ビルドエラー（`npm run build:local`） |
| 18 | test-runner | テスト・Lint（`npm run test && npm run lint`） |
| 19 | code-reviewer | コード品質（認証、バリデーション、型安全性） |
| 20 | security-checker | セキュリティ（認証・認可、インジェクション） |
| 21 | review-docs | ドキュメント整合性 |

#### 🚀 リリースPR作成

すべての検証が完了したら、リリースPRを作成:

```bash
git checkout release/{機能名}
git pull origin release/{機能名}

# progress.md を完了状態に更新
git add docs/steering/{YYYYMMDD}-{機能名}/progress.md
git commit -m "docs({機能名}): mark as completed"
git push origin release/{機能名}

gh pr create \
  --base main \
  --title "🚀 [{機能名}] リリース" \
  --body "$(cat <<'EOF'
## 概要
{機能名}の全実装をmainにマージ

## 変更種別
- [x] 🔗 統合・検証

## 含まれるPR
- #XXX 設計ドキュメント
- #XXX バックエンド実装
- #XXX フロントエンド実装

## 検証状況
- [x] ビルド通過
- [x] テスト通過
- [x] セキュリティチェック通過
- [x] ドキュメント整合性確認

## 設計ドキュメント
- `docs/steering/{YYYYMMDD}-{機能名}/`
EOF
)"
```

**小規模変更時（〜200行）**: PR分割不要。直接 `main` へPRを作成。

---

## ステータス遷移

| ファイル | 初期値 | 主な遷移 |
|----------|--------|----------|
| progress.md | Phase 1 | Phase 1 → 2（Step 7）→ 3（Step 11）→ 4（Step 13）→ 完了（Step 21） |
| requirements.md | 作成中 | → 要件確定（Step 6） |
| design.md | 設計中 | → 設計確定（Step 10） |
| tasklist.md | 計画中 | → 実装中（Step 13）→ 完了（Step 21） |

---

## ブランチ戦略について

PR分割フローの詳細は [docs/branching-strategy.md](/docs/branching-strategy.md) を参照。

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
- **レビューで Critical**: 即座に修正し Step 17 から再検証
- **レビューで Warning**: ユーザーに修正要否を確認
