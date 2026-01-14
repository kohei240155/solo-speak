# {機能名} - タスクリスト（フロントエンド）

**ステータス**: 計画中 | 実装中 | 完了
**作成日**: {YYYY-MM-DD}
**設計**: [design.md](./design.md)
**機能タイプ**: A. フロントエンドのみ

---

## 用途

UIコンポーネント追加、モーダル追加、既存画面のUI改善

## タスク

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1 | 型定義の追加 | `src/types/` | [ ] |
| 2 | コンポーネント作成 | `src/components/` | [ ] |
| 3 | 親コンポーネントへの統合 | | [ ] |
| 4 | 動作確認 | - | [ ] |

**参考ファイル**: `src/components/modals/`, `src/components/common/`

---

## TodoWrite用データ

```json
[
  {"content": "[エージェント] file-finder: 関連ファイル検索", "activeForm": "file-finderで関連ファイルを検索中", "status": "pending"},
  {"content": "型定義の追加", "activeForm": "型定義を追加中", "status": "pending"},
  {"content": "コンポーネント作成", "activeForm": "コンポーネントを作成中", "status": "pending"},
  {"content": "親コンポーネントへの統合", "activeForm": "親コンポーネントに統合中", "status": "pending"},
  {"content": "動作確認", "activeForm": "動作確認中", "status": "pending"},
  {"content": "[エージェント] test-runner: lint/ビルド確認", "activeForm": "test-runnerでlint/ビルドを確認中", "status": "pending"},
  {"content": "[エージェント] code-reviewer: コードレビュー", "activeForm": "code-reviewerでコードをレビュー中", "status": "pending"}
]
```
