# {機能名} - タスクリスト（複合ページ）

**ステータス**: 計画中 | 実装中 | 完了
**作成日**: {YYYY-MM-DD}
**設計**: [design.md](./design.md)
**機能タイプ**: D. 複合ページ

---

## 用途

複数機能を持つ新規ページ、ウィザード形式のフロー、複雑な状態管理が必要な画面

## タスク

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1 | ページ設計（状態・フロー） | - | [ ] |
| 2 | 型定義追加 | `src/types/` | [ ] |
| 3 | APIエンドポイント実装 | `src/app/api/` | [ ] |
| 4 | カスタムフック作成 | `src/hooks/` | [ ] |
| 5 | メインコンポーネント作成 | `src/components/` | [ ] |
| 6 | サブコンポーネント・モーダル作成 | `src/components/` | [ ] |
| 7 | エラーハンドリング実装 | | [ ] |
| 8 | 統合テスト | - | [ ] |

**参考ファイル**: `src/components/speech/SpeechAdd.tsx`, `src/components/phrase/PhraseAdd.tsx`

**注意**: 複数のローディング状態を管理、ボタンの有効/無効条件を明確に

---

## TodoWrite用データ

```json
[
  {"content": "[エージェント] file-finder: 関連ファイル検索", "activeForm": "file-finderで関連ファイルを検索中", "status": "pending"},
  {"content": "ページ設計（状態・フロー）", "activeForm": "ページ設計中", "status": "pending"},
  {"content": "型定義追加", "activeForm": "型定義を追加中", "status": "pending"},
  {"content": "APIエンドポイント実装", "activeForm": "APIエンドポイントを実装中", "status": "pending"},
  {"content": "カスタムフック作成", "activeForm": "カスタムフックを作成中", "status": "pending"},
  {"content": "メインコンポーネント作成", "activeForm": "メインコンポーネントを作成中", "status": "pending"},
  {"content": "サブコンポーネント・モーダル作成", "activeForm": "サブコンポーネント・モーダルを作成中", "status": "pending"},
  {"content": "エラーハンドリング実装", "activeForm": "エラーハンドリングを実装中", "status": "pending"},
  {"content": "統合テスト", "activeForm": "統合テスト中", "status": "pending"},
  {"content": "[エージェント] test-runner: lint/ビルド確認", "activeForm": "test-runnerでlint/ビルドを確認中", "status": "pending"},
  {"content": "[エージェント] code-reviewer: コードレビュー", "activeForm": "code-reviewerでコードをレビュー中", "status": "pending"}
]
```
