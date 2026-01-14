# {機能名} - タスクリスト（フルスタック）

**ステータス**: 計画中 | 実装中 | 完了
**作成日**: {YYYY-MM-DD}
**設計**: [design.md](./design.md)
**機能タイプ**: C. フルスタック

---

## 用途

DB変更を伴う新機能、新しいエンティティの追加、既存機能の大幅拡張

## タスク

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1 | DBスキーマ設計・更新 | `prisma/schema.prisma` | [ ] |
| 2 | マイグレーション実行 | - | [ ] |
| 3 | API型定義・Zodスキーマ作成 | `src/types/` | [ ] |
| 4 | APIルート実装 | `src/app/api/` | [ ] |
| 5 | フロントエンド型定義追加 | `src/types/` | [ ] |
| 6 | カスタムフック作成 | `src/hooks/` | [ ] |
| 7 | UIコンポーネント作成 | `src/components/` | [ ] |
| 8 | 統合・動作確認 | - | [ ] |

**参考ファイル**: `prisma/schema.prisma`, `src/hooks/`, `src/components/phrase/`

**注意**: マイグレーション実行前にユーザー確認必須、複数DB操作は `prisma.$transaction()` を使用

---

## TodoWrite用データ

```json
[
  {"content": "[エージェント] file-finder: 関連ファイル検索", "activeForm": "file-finderで関連ファイルを検索中", "status": "pending"},
  {"content": "DBスキーマ設計・更新", "activeForm": "DBスキーマを設計・更新中", "status": "pending"},
  {"content": "マイグレーション実行", "activeForm": "マイグレーションを実行中", "status": "pending"},
  {"content": "API型定義・Zodスキーマ作成", "activeForm": "API型定義・Zodスキーマを作成中", "status": "pending"},
  {"content": "APIルート実装", "activeForm": "APIルートを実装中", "status": "pending"},
  {"content": "フロントエンド型定義追加", "activeForm": "フロントエンド型定義を追加中", "status": "pending"},
  {"content": "カスタムフック作成", "activeForm": "カスタムフックを作成中", "status": "pending"},
  {"content": "UIコンポーネント作成", "activeForm": "UIコンポーネントを作成中", "status": "pending"},
  {"content": "統合・動作確認", "activeForm": "統合・動作確認中", "status": "pending"},
  {"content": "[エージェント] test-runner: lint/ビルド確認", "activeForm": "test-runnerでlint/ビルドを確認中", "status": "pending"},
  {"content": "[エージェント] code-reviewer: コードレビュー", "activeForm": "code-reviewerでコードをレビュー中", "status": "pending"}
]
```
