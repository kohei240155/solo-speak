# {機能名} - タスクリスト（バックエンド）

**ステータス**: 計画中 | 実装中 | 完了
**作成日**: {YYYY-MM-DD}
**設計**: [design.md](./design.md)
**機能タイプ**: B. バックエンドのみ

---

## 用途

APIエンドポイント追加、既存APIの拡張、バッチ処理追加

## タスク

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1 | API型定義・Zodスキーマ作成 | `src/types/api.ts` | [ ] |
| 2 | APIルート実装 | `src/app/api/` | [ ] |
| 3 | エラーハンドリング追加 | | [ ] |
| 4 | 動作確認 | - | [ ] |

**参考ファイル**: `src/app/api/phrase/route.ts`, `src/app/api/speech/route.ts`

**注意**: `authenticateRequest(request)` で認証、Zodスキーマでバリデーション、`userId` スコープでデータアクセス

---

## TodoWrite用データ

```json
[
  {"content": "[エージェント] file-finder: 関連ファイル検索", "activeForm": "file-finderで関連ファイルを検索中", "status": "pending"},
  {"content": "API型定義・Zodスキーマ作成", "activeForm": "API型定義・Zodスキーマを作成中", "status": "pending"},
  {"content": "APIルート実装", "activeForm": "APIルートを実装中", "status": "pending"},
  {"content": "エラーハンドリング追加", "activeForm": "エラーハンドリングを追加中", "status": "pending"},
  {"content": "動作確認", "activeForm": "動作確認中", "status": "pending"},
  {"content": "[エージェント] test-runner: lint/ビルド確認", "activeForm": "test-runnerでlint/ビルドを確認中", "status": "pending"},
  {"content": "[エージェント] code-reviewer: コードレビュー", "activeForm": "code-reviewerでコードをレビュー中", "status": "pending"}
]
```
