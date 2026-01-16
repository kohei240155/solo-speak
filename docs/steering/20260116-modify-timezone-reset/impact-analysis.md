# タイムゾーン対応リセット - 影響分析

**ステータス**: 分析完了
**作成日**: 2026-01-16
**最終更新日**: 2026-01-16
**変更要求**: [change-request.md](./change-request.md)

---

## 1. 影響を受けるコンポーネント

### 直接影響

| コンポーネント | パス | 変更内容 | 影響レベル |
|---------------|------|----------|-----------|
| DBスキーマ | `prisma/schema.prisma` | `User`モデルに`timezone`カラム追加 | Critical |
| フレーズ残回数API | `src/app/api/phrase/remaining/route.ts` | リセット判定をローカルTZ基準に変更 | Critical |
| スピーチ残回数API | `src/app/api/speech/remaining/route.ts` | リセット判定をローカルTZ基準に変更 | Critical |
| 日次音読リセットAPI | `src/app/api/user/reset-daily-speak-count/route.ts` | リセット判定をローカルTZ基準に変更 | Critical |
| ストリーク計算 | `src/utils/streak-calculator.ts` | TZパラメータ追加、ローカル日付で計算 | Critical |
| ダッシュボードAPI | `src/app/api/dashboard/route.ts` | ユーザーTZでストリーク計算 | Critical |
| フレーズストリークランキング | `src/app/api/ranking/phrase/streak/route.ts` | 各ユーザーTZでストリーク計算 | Critical |
| 音読ストリークランキング | `src/app/api/ranking/speak/streak/route.ts` | 各ユーザーTZでストリーク計算 | Critical |
| クイズストリークランキング | `src/app/api/ranking/quiz/streak/route.ts` | 各ユーザーTZでストリーク計算 | Critical |
| スピーチストリークランキング | `src/app/api/ranking/speech/streak/route.ts` | 各ユーザーTZでストリーク計算 | Critical |
| 設定ページ | `src/app/settings/page.tsx` | TZ変更UI追加 | High |
| 翻訳ファイル（app.json） | `public/locales/*/app.json`（9言語） | リセット時間説明更新 | High |
| 翻訳ファイル（landing.json） | `public/locales/*/landing.json`（9言語） | FAQリセット時間説明更新 | High |

### 間接影響

| コンポーネント | パス | 確認理由 |
|---------------|------|----------|
| ダッシュボードページ | `src/app/dashboard/page.tsx` | ストリーク表示の動作確認 |
| ランキングページ | `src/app/ranking/page.tsx` | ストリークランキング表示の動作確認 |
| フレーズ追加 | `src/components/phrase/PhraseAdd.tsx` | 残り回数表示の確認 |
| スピーチ追加 | `src/components/speech/SpeechAdd.tsx` | 残り回数表示の確認 |
| React Queryフック | `src/hooks/api/useReactQueryApi.ts` | 型定義の整合性確認 |
| ユーザー設定API | `src/app/api/user/settings/route.ts` | TZ保存ロジック追加 |

---

## 2. 依存関係

### この機能に依存するコード

| ファイル | 使用方法 | 影響 |
|----------|----------|------|
| `src/app/api/phrase/generate/route.ts` | `lastPhraseGenerationDate`参照 | リセット後の動作確認が必要 |
| `src/app/api/phrase/random-generate/route.ts` | `lastPhraseGenerationDate`参照 | リセット後の動作確認が必要 |
| `src/components/modals/SpeakModeModal.tsx` | `resetDailySpeakCount()`呼び出し | API変更の影響確認 |
| `src/hooks/ui/useShareStreak.ts` | ストリーク値のシェア | ストリーク計算変更の影響確認 |

### この機能が依存するコード

| ファイル | 依存内容 | 変更の必要性 |
|----------|----------|-------------|
| `prisma/schema.prisma` | Userモデル | あり（timezoneカラム追加） |
| `src/types/userSettings.ts` | UserSettings型 | あり（timezone追加） |

---

## 3. API影響

### 影響を受けるAPIエンドポイント

| メソッド | パス | 変更内容 | 破壊的変更 |
|----------|------|----------|-----------|
| GET | `/api/phrase/remaining` | ローカルTZでリセット判定 | なし |
| GET | `/api/speech/remaining` | ローカルTZでリセット判定 | なし |
| POST | `/api/user/reset-daily-speak-count` | ローカルTZでリセット判定 | なし |
| GET | `/api/dashboard` | ローカルTZでストリーク計算 | なし |
| GET | `/api/ranking/phrase/streak` | 各ユーザーTZでストリーク計算 | なし |
| GET | `/api/ranking/speak/streak` | 各ユーザーTZでストリーク計算 | なし |
| GET | `/api/ranking/quiz/streak` | 各ユーザーTZでストリーク計算 | なし |
| GET | `/api/ranking/speech/streak` | 各ユーザーTZでストリーク計算 | なし |
| PUT | `/api/user/settings` | TZ保存ロジック追加 | なし |

### APIの後方互換性

- レスポンス形式に変更なし
- 内部計算ロジックのみ変更
- 既存クライアントへの影響なし

---

## 4. データベース影響

### スキーマ変更

- [x] スキーマ変更あり:
  - `User`モデルに`timezone String @default("UTC")`カラムを追加

### データマイグレーション

- [x] マイグレーション必要:
  - 新規カラム追加のマイグレーション
  - 既存ユーザーにはデフォルト値"UTC"が設定される

### 既存データへの影響

- 既存ユーザーのタイムゾーンは"UTC"がデフォルト設定される
- 初回アクセス時にブラウザから検出したTZで上書き
- 既存ストリークデータへの直接的な変更なし

---

## 5. リスク評価

### リスク一覧

| リスク | 影響度 | 発生確率 | 軽減策 |
|--------|--------|----------|--------|
| 既存ストリークの不整合 | 高 | 中 | 既存ユーザーはデフォルトUTC、初回アクセスで正しいTZを自動取得 |
| TZ変更による不正リセット | 高 | 中 | **前回リセットから20時間以上経過**しないとリセットしない |
| TZ変更時のリセット重複/スキップ | 中 | 低 | 20時間ルールで防止 |
| ランキングの公平性への懸念 | 低 | 低 | 「前日までのストリーク」計算のため影響なし |
| パフォーマンス劣化 | 低 | 低 | 必要に応じてキャッシュを検討 |

### 全体リスクレベル

- [x] 中: 十分なテストとレビューが必要

---

## 6. テスト戦略

### TDDアプローチ

- [x] TDDアプローチを使用する（推奨: 複雑なロジック変更、リグレッション防止が重要な場合）

**TDDを使用する場合のテストファイル**:
- `src/utils/__tests__/streak-calculator.test.ts` - タイムゾーン対応ストリーク計算テスト
- `src/app/api/phrase/remaining/__tests__/route.test.ts` - リセット判定テスト

### 変更確認テスト

- [ ] 異なるタイムゾーン（UTC-12, UTC, UTC+9, UTC+14）でストリーク計算が正しく動作
- [ ] タイムゾーン境界（午前0時）でリセット判定が正しく動作
- [ ] 既存ユーザーの初回アクセス時にTZが自動設定される
- [ ] ダッシュボードでストリークが正しく表示される
- [ ] **20時間ルール**: 前回リセットから20時間未満ではリセットされない
- [ ] **TZ変更UI**: 設定画面からTZを変更できる
- [ ] **TZ変更後**: 20時間経過後に新TZでリセットが発生する

### リグレッションテスト

- [ ] フレーズ追加・更新・削除が正常に動作
- [ ] スピーチ追加・練習が正常に動作
- [ ] クイズモードが正常に動作
- [ ] ランキング表示が正常に動作

### パフォーマンステスト

- [ ] パフォーマンステスト不要（初期リリース後、必要に応じて実施）

---

## 7. ロールバック計画

### ロールバック可能性

- [x] ロールバックに条件あり（以下に記載）

### ロールバック手順

1. バックエンドコードをリバート（UTC基準のロジックに戻す）
2. `timezone`カラムはそのまま残す（データは保持）
3. フロントエンドのTZ検出ロジックを無効化
4. 再度UTC基準でリセット・ストリーク計算を実行

**注意**: ロールバック後、TZ変更後に発生したストリークデータの整合性を確認

---

## 参考資料

- [docs/backend/api-routes.md](../../backend/api-routes.md) - API仕様
- [docs/backend/database.md](../../backend/database.md) - DBスキーマ
- [streak-calculator.ts](../../../src/utils/streak-calculator.ts) - ストリーク計算ロジック
