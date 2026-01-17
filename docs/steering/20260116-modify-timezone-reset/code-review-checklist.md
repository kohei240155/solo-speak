# タイムゾーン対応リセット機能 - コードレビューチェックリスト

このチェックリストは、実装されたソースコードを理解するためのガイドです。
すべての項目をチェックすることで、実装全体を理解したことを確認できます。

---

## レビュー推奨順序

```
1. 基盤層（DB・ユーティリティ）→ 2. バックエンド（API）→ 3. フロントエンド → 4. 翻訳・テスト
```

---

## Phase 1: 基盤層（データベース・ユーティリティ）

### 1.1 データベーススキーマ
**ファイル**: `prisma/schema.prisma`

- [ ] `User`モデルに`timezone`カラムが追加されていることを確認（デフォルト値: "UTC"）
- [ ] 既存ユーザーへの影響（デフォルト値によるマイグレーション互換性）を理解した

**理解確認質問**:
- Q: なぜデフォルト値が"UTC"なのか？
- A: 既存ユーザーの後方互換性を保ちつつ、タイムゾーン未設定でも動作するため

---

### 1.2 タイムゾーンユーティリティ（コア実装）
**ファイル**: `src/utils/timezone.ts`

#### 関数1: `getLocalDate(date, timezone)`
- [ ] `Intl.DateTimeFormat`を使用してUTC日時をローカル日付に変換していることを確認
- [ ] 返却値が時刻00:00:00にリセットされた`Date`オブジェクトであることを理解した

#### 関数2: `getLocalDateString(date, timezone)`
- [ ] YYYY-MM-DD形式の日付文字列を返すことを確認
- [ ] この関数がリセット判定や日付比較に使用されることを理解した

#### 関数3: `canReset(timezone, lastResetTimestamp, now)` ★重要
- [ ] **20時間ルール**の実装を理解した：
  - 条件1: ローカル日付が変わっている（`isDifferentDay`）
  - 条件2: 前回リセットから20時間以上経過（`hasPassedMinimumTime`）
  - 両方の条件を満たす場合のみ`true`を返す
- [ ] `lastResetTimestamp`が`null`の場合（初回）は常に`true`を返すことを確認
- [ ] なぜ20時間ルールが必要か理解した（タイムゾーン変更による不正リセット防止）

#### 関数4: `isValidTimezone(timezone)`
- [ ] `Intl`APIを使用した妥当性検証を確認
- [ ] 無効なタイムゾーン文字列を拒否することを理解した

**理解確認質問**:
- Q: ユーザーがAsia/TokyoからAmerica/New_Yorkに変更して即座にリセットできるか？
- A: できない。20時間ルールにより、日付が変わっても20時間経過しないとリセット不可

---

### 1.3 ストリーク計算ユーティリティ
**ファイル**: `src/utils/streak-calculator.ts`

- [ ] `calculateStreak(dates, timezone)`関数に`timezone`パラメータが追加されていることを確認
- [ ] `formatDatesToStrings(dateObjects, timezone)`がタイムゾーンを考慮して日付変換していることを確認
- [ ] ストリーク計算がユーザーのローカル日付基準で行われることを理解した

**理解確認質問**:
- Q: Asia/Tokyo（UTC+9）のユーザーが1/15 23:00 UTCに活動した場合、何日として記録される？
- A: 1/16（ローカル時刻は1/16 08:00）

---

## Phase 2: バックエンド（API Routes）

### 2.1 リセットAPI群（3つ）

#### フレーズ生成残回数API
**ファイル**: `src/app/api/phrase/remaining/route.ts`

- [ ] ユーザーの`timezone`カラムを取得していることを確認
- [ ] `canReset()`関数でリセット判定していることを確認
- [ ] リセット時に`remainingPhraseGenerations`を5に設定していることを確認

#### スピーチ残回数API
**ファイル**: `src/app/api/speech/remaining/route.ts`

- [ ] 同様に`canReset()`でリセット判定していることを確認
- [ ] リセット時に`remainingSpeechCount`を1に設定していることを確認

#### 日次音読カウントリセットAPI
**ファイル**: `src/app/api/user/reset-daily-speak-count/route.ts`

- [ ] `canReset()`でリセット判定していることを確認
- [ ] リセット時に全フレーズの`dailySpeakCount`を0にリセットしていることを確認
- [ ] `lastDailySpeakCountResetDate`を現在時刻に更新していることを確認

**理解確認質問**:
- Q: 3つのAPIすべてで共通して使用されている関数は？
- A: `canReset()`（timezone.tsからインポート）

---

### 2.2 ストリーク計算API群（5つ）

#### ダッシュボードAPI
**ファイル**: `src/app/api/dashboard/route.ts`

- [ ] ユーザーのタイムゾーンを取得していることを確認
- [ ] 以下4つのストリーク計算すべてに`timezone`を渡していることを確認：
  - [ ] `phraseStreak`（フレーズ作成日ベース）
  - [ ] `speakStreak`（スピーク記録日ベース）
  - [ ] `quizStreak`（クイズ実行日ベース）
  - [ ] `speechReviewStreak`（スピーチ練習日ベース）

#### ランキングAPI（4つ）
**ファイル**:
- `src/app/api/ranking/phrase/streak/route.ts`
- `src/app/api/ranking/speak/streak/route.ts`
- `src/app/api/ranking/quiz/streak/route.ts`
- `src/app/api/ranking/speech/streak/route.ts`

各ファイルについて：
- [ ] 各ユーザーの`timezone`カラムを取得していることを確認
- [ ] ユーザーごとに個別のタイムゾーンで`calculateStreak()`を呼んでいることを確認
- [ ] ランキング計算が各ユーザーの正しいローカル日付で行われることを理解した

**理解確認質問**:
- Q: ランキングAPIで、ユーザーAがAsia/Tokyo、ユーザーBがAmerica/New_Yorkの場合、どう計算される？
- A: それぞれのタイムゾーンでストリークが個別に計算され、公平にランキングされる

---

### 2.3 ユーザー設定API
**ファイル**: `src/app/api/user/settings/route.ts`

- [ ] GET: レスポンスに`timezone`フィールドが含まれていることを確認
- [ ] PUT: リクエストボディから`timezone`を受け取り、更新していることを確認

---

### 2.4 データベースヘルパー
**ファイル**: `src/utils/database-helpers.ts`

- [ ] `getUserSettings()`: `timezone`を取得・返却していることを確認
- [ ] `createUserSettings()`: 新規作成時に`timezone`をレスポンスに含めていることを確認
- [ ] `updateUserSettings()`: `timezone`フィールドを更新対象に含めていることを確認

---

## Phase 3: フロントエンド

### 3.1 タイムゾーン設定コンポーネント
**ファイル**: `src/components/settings/TimezoneSettings.tsx`

- [ ] `COMMON_TIMEZONES`リスト（32のタイムゾーン）を確認
- [ ] ブラウザ自動検出機能（`Intl.DateTimeFormat().resolvedOptions().timeZone`）を確認
- [ ] 以下のUI要素が実装されていることを確認：
  - [ ] タイムゾーン選択ドロップダウン
  - [ ] 「自動検出」ボタン
  - [ ] 検出されたタイムゾーンの表示
  - [ ] 保存ボタン（成功/エラーメッセージ）
- [ ] `formatTimezoneDisplay()`関数でGMTオフセット表示していることを確認

**理解確認質問**:
- Q: ユーザーがリストにないタイムゾーン（例: Pacific/Fiji）の場合はどうなる？
- A: 「自動検出」ボタンで検出可能、選択肢になくても保存できる

---

### 3.2 設定ページ統合
**ファイル**: `src/app/settings/page.tsx`

- [ ] `TimezoneSettings`コンポーネントがインポートされていることを確認
- [ ] `currentTimezone`ステートの管理を確認
- [ ] `fetchTimezone()`で現在のタイムゾーンを取得していることを確認
- [ ] `handleSaveTimezone()`で`/api/user/settings`にPUTリクエストを送信していることを確認

---

### 3.3 型定義
**ファイル**: `src/types/userSettings.ts`

- [ ] `UserSettingsResponse`に`timezone?: string | null`が追加されていることを確認
- [ ] `UserSettingsUpdateRequest`に`timezone?: string`が追加されていることを確認

---

## Phase 4: 翻訳・テスト

### 4.1 翻訳ファイル（9言語）
**ファイル**: `public/locales/{lang}/app.json`（ja, en, ko, zh, es, fr, de, pt, th）

各言語ファイルについて：
- [ ] `settings.timezone`セクションが追加されていることを確認
- [ ] 以下のキーがすべて翻訳されていることを確認：
  - `title`, `description`, `selectLabel`, `detectButton`
  - `detectedTimezone`, `saveButton`, `saving`
  - `saveSuccess`, `saveError`, `invalidTimezone`

**ファイル**: `public/locales/{lang}/landing.json`（9言語）

- [ ] FAQ `q2`（リセット時刻）の説明文がタイムゾーン対応に更新されていることを確認

---

### 4.2 テスト
**ファイル**: `src/utils/timezone.test.ts`

以下のテストケースを理解したことを確認：

#### `getLocalDate`テスト
- [ ] UTC日時が正しくローカル日付に変換されることを確認

#### `getLocalDateString`テスト
- [ ] YYYY-MM-DD形式で正しく出力されることを確認

#### `canReset`テスト（★重要）
- [ ] 日付変更あり + 20時間経過 → `true`
- [ ] 日付変更あり + 20時間未満 → `false`
- [ ] 20時間経過 + 日付変更なし → `false`
- [ ] 初回リセット（null） → `true`
- [ ] TZ変更後も20時間ルール適用 → `false`

#### `isValidTimezone`テスト
- [ ] 有効なTZ → `true`
- [ ] 無効なTZ → `false`

---

## 最終確認

### アーキテクチャ理解
- [ ] データの流れを理解した：
  ```
  ユーザー設定(timezone) → API(canReset判定) → DB更新
  ```
- [ ] ストリーク計算の流れを理解した：
  ```
  DB(日付データ) → streak-calculator(TZ変換) → ローカル日付基準で計算
  ```

### セキュリティ・不正防止
- [ ] 20時間ルールがタイムゾーン変更による不正リセットを防止することを理解した
- [ ] `isValidTimezone()`による入力検証が行われていることを確認

### 後方互換性
- [ ] 既存ユーザーのデフォルトタイムゾーンが"UTC"であることを理解した
- [ ] 既存機能への影響がないことを確認

---

## チェック完了確認

すべての項目にチェックが入った場合、以下を理解したことになります：

1. ✅ タイムゾーン対応の基盤実装（ユーティリティ関数）
2. ✅ 20時間ルールによる不正防止メカニズム
3. ✅ リセットAPIへのタイムゾーン適用
4. ✅ ストリーク計算へのタイムゾーン適用
5. ✅ フロントエンドUI実装
6. ✅ 多言語対応（9言語）
7. ✅ テストによる品質保証
