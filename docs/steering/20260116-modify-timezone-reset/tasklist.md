# タイムゾーン対応リセット - タスクリスト（機能修正）

**ステータス**: 計画中
**作成日**: 2026-01-16
**変更要求**: [change-request.md](./change-request.md)
**影響分析**: [impact-analysis.md](./impact-analysis.md)

---

## 用途

フレーズ生成回数・スピーチ可能回数のリセット、およびストリーク計算を
UTC基準からユーザーのローカルタイムゾーン基準に変更する。

---

## Phase 1: 基盤整備

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 1.1 | DBスキーマ変更（timezoneカラム追加） | `prisma/schema.prisma` | [ ] |
| 1.2 | マイグレーション実行 | - | [ ] |
| 1.3 | TZ日付計算ユーティリティ作成 | `src/utils/timezone.ts`（新規） | [ ] |
| 1.4 | TZ日付計算のテスト作成 | `src/utils/__tests__/timezone.test.ts` | [ ] |

---

## Phase 2: バックエンド - リセットロジック

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 2.1 | フレーズ残回数APIのリセットロジック修正 | `src/app/api/phrase/remaining/route.ts` | [ ] |
| 2.2 | スピーチ残回数APIのリセットロジック修正 | `src/app/api/speech/remaining/route.ts` | [ ] |
| 2.3 | 日次音読リセットAPIのロジック修正 | `src/app/api/user/reset-daily-speak-count/route.ts` | [ ] |
| 2.4 | **20時間ルール**の実装（不正防止） | 上記3ファイル | [ ] |

---

## Phase 3: バックエンド - ストリーク計算

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 3.1 | streak-calculator.tsにTZパラメータ追加 | `src/utils/streak-calculator.ts` | [ ] |
| 3.2 | ストリーク計算テストの更新 | `src/utils/__tests__/streak-calculator.test.ts` | [ ] |
| 3.3 | ダッシュボードAPIの修正 | `src/app/api/dashboard/route.ts` | [ ] |
| 3.4 | フレーズストリークランキングAPIの修正 | `src/app/api/ranking/phrase/streak/route.ts` | [ ] |
| 3.5 | 音読ストリークランキングAPIの修正 | `src/app/api/ranking/speak/streak/route.ts` | [ ] |
| 3.6 | クイズストリークランキングAPIの修正 | `src/app/api/ranking/quiz/streak/route.ts` | [ ] |
| 3.7 | スピーチストリークランキングAPIの修正 | `src/app/api/ranking/speech/streak/route.ts` | [ ] |

---

## Phase 4: フロントエンド

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 4.1 | TZ自動検出ロジック実装 | `src/hooks/useTimezone.ts`（新規） | [ ] |
| 4.2 | 初回アクセス時TZ保存処理 | `src/contexts/AuthContext.tsx` or 適切な場所 | [ ] |
| 4.3 | ユーザー設定API修正（TZ保存対応） | `src/app/api/user/settings/route.ts` | [ ] |
| 4.4 | 設定画面にTZ変更UI追加 | `src/app/settings/page.tsx` | [ ] |
| 4.5 | 型定義更新 | `src/types/userSettings.ts` | [ ] |

---

## Phase 5: 検証

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 5.1 | [エージェント] build-executor: ビルド確認 | - | [ ] |
| 5.2 | [エージェント] test-runner: テスト・Lint | - | [ ] |
| 5.3 | [エージェント] code-reviewer: コードレビュー | - | [ ] |
| 5.4 | [エージェント] security-checker: セキュリティ | - | [ ] |
| 5.5 | [エージェント] review-docs: ドキュメント | - | [ ] |

---

## Phase 6: 翻訳・説明文更新

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 6.1 | リセット時間説明更新（app.json） | `public/locales/*/app.json`（9言語） | [ ] |
| 6.2 | FAQリセット時間説明更新（landing.json） | `public/locales/*/landing.json`（9言語） | [ ] |

---

## Phase 7: ドキュメント更新

| # | タスク | 対象ファイル | ステータス |
|---|--------|-------------|-----------|
| 7.1 | API仕様書更新 | `docs/backend/api-routes.md` | [ ] |
| 7.2 | DBスキーマドキュメント更新 | `docs/backend/database.md` | [ ] |
| 7.3 | 型定義ドキュメント更新 | `docs/shared/types.md` | [ ] |

---

## 重要な実装ポイント

### 20時間ルール（不正防止）

```typescript
// リセット条件
const canReset = (
  userTimezone: string,
  lastResetTimestamp: Date
): boolean => {
  const now = new Date();
  const localToday = getLocalDate(now, userTimezone);
  const localLastReset = getLocalDate(lastResetTimestamp, userTimezone);

  // 条件1: ローカルTZで日付が変わっている
  const isDifferentDay = localToday > localLastReset;

  // 条件2: 前回リセットから20時間以上経過
  const hoursSinceLastReset = (now.getTime() - lastResetTimestamp.getTime()) / (1000 * 60 * 60);
  const hasPassedMinimumTime = hoursSinceLastReset >= 20;

  return isDifferentDay && hasPassedMinimumTime;
};
```

### 既存ユーザーのTZ自動設定

```typescript
// 初回アクセス時（timezoneがUTCの場合）
if (user.timezone === 'UTC') {
  const browserTimezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  await updateUserTimezone(user.id, browserTimezone);
}
```

---

## 注意事項

- 後方互換性を最大限維持すること
- 既存機能への影響を最小限に抑える
- DBマイグレーションは手動で実行（自動実行禁止）
- TZ変更による不正リセットを20時間ルールで防止

---

## TodoWrite用データ

```json
[
  {"content": "Phase 1: 基盤整備（DBスキーマ、TZユーティリティ）", "activeForm": "基盤整備を実装中", "status": "pending"},
  {"content": "Phase 2: リセットロジック修正（3API + 20時間ルール）", "activeForm": "リセットロジックを修正中", "status": "pending"},
  {"content": "Phase 3: ストリーク計算修正（calculator + 5API）", "activeForm": "ストリーク計算を修正中", "status": "pending"},
  {"content": "Phase 4: フロントエンド（TZ検出、設定UI）", "activeForm": "フロントエンドを実装中", "status": "pending"},
  {"content": "Phase 5: 検証（ビルド、テスト、レビュー）", "activeForm": "検証を実行中", "status": "pending"},
  {"content": "Phase 6: 翻訳・説明文更新（18ファイル）", "activeForm": "翻訳・説明文を更新中", "status": "pending"},
  {"content": "Phase 7: ドキュメント更新", "activeForm": "ドキュメントを更新中", "status": "pending"}
]
```
