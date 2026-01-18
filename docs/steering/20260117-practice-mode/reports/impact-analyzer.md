# Practice モード - 影響範囲分析レポート

**作成日**: 2026-01-17
**分析対象**: Practice モード（発話練習機能）実装
**分析者**: Impact Analyzer Agent

---

## 変更サマリー

Practice モード（発話練習機能）の実装により、以下の変更が加わります:

### 主要な変更点
1. **DBスキーマ変更**: 新規テーブル `PracticeLog`、`Phrase` テーブルに2カラム追加、`User` テーブルに1カラム追加
2. **新規APIエンドポイント**: 3つのPractice関連API追加
3. **新規コンポーネント**: 5つのPractice専用コンポーネント、3つの専用フック、2つのユーティリティ関数
4. **既存ファイルの変更**: ナビゲーション、設定フォーム、ランキングページ、フレーズ一覧ページ、型定義

---

## 影響レベル

**Critical**

理由:
- DBスキーマ変更が既存のPhraseテーブルとUserテーブルに影響
- 既存のフレーズ一覧・詳細表示ロジックの修正が必要
- ランキング機能への追加実装が必要
- 型定義の拡張が多数のファイルに波及

---

## 1. DBスキーマ変更の影響

### 1.1 Phraseテーブル参照箇所

| ファイル | 使用方法 | 影響 | 対応必要 |
|----------|----------|------|---------|
| `src/app/api/phrase/route.ts` | フレーズ作成・一覧取得 | **中** | `practiceCorrectCount` の初期値設定が自動的に `@default(0)` で対応 |
| `src/app/api/phrase/[id]/route.ts` | フレーズ詳細取得・更新・削除 | **低** | 既存のSELECTクエリは影響なし（新カラムは自動的にnullまたはデフォルト値） |
| `src/app/api/phrase/speak/route.ts` | Speakモードのフレーズ取得 | **低** | 新カラムは無視される（SELECT文に含めない限り影響なし） |
| `src/app/api/phrase/quiz/route.ts` | Quizモードのフレーズ取得 | **低** | 同上 |
| `src/app/api/dashboard/route.ts` | ダッシュボード統計 | **低** | 既存の集計ロジックは影響なし |
| `src/app/api/ranking/phrase/route.ts` | フレーズランキング | **低** | 既存のランキングロジックは影響なし |

**マイグレーション考慮事項**:
- `practiceCorrectCount Int @default(0)`: 既存レコードには自動的に `0` が設定される
- `lastPracticeDate DateTime?`: 既存レコードには `null` が設定される（nullable）
- リレーション `practiceLogs PracticeLog[]`: 既存レコードには空配列（リレーションなし）
- **既存データへの影響**: なし（後方互換性あり）
- **ダウンタイム**: 不要（カラム追加のみ、データ変換なし）

### 1.2 Userテーブル参照箇所

| ファイル | 使用方法 | 影響 | 対応必要 |
|----------|----------|------|---------|
| `src/utils/database-helpers.ts` | ユーザー操作ヘルパー | **低** | 新カラムは無視される |
| `src/app/api/user/settings/route.ts` | ユーザー設定取得・更新 | **高** | `phraseMode` の取得・更新ロジック追加が必要 |
| `src/hooks/data/useUserSettings.ts` | ユーザー設定フック | **高** | `phraseMode` をフォームに反映する処理が必要 |
| `src/components/settings/UserSettingsForm.tsx` | 設定フォーム | **高** | フレーズモード選択UIの追加が必要 |
| `src/types/userSettings.ts` | 型定義 | **高** | `phraseMode` を `UserSettingsResponse` に追加が必要 |
| その他24ファイル | ユーザー取得・認証 | **低** | `phraseMode` は使用しないため影響なし |

**マイグレーション考慮事項**:
- `phraseMode String @default("practice")`: 既存ユーザーにはデフォルト値 `"practice"` が設定される
- リレーション `practiceLogs PracticeLog[]`: 既存レコードには空配列
- **既存ユーザーへの影響**: デフォルトで Practice モードが有効になる（要件通り）
- **ダウンタイム**: 不要

### 1.3 新規テーブル: PracticeLog

**影響**: なし（新規テーブル、既存システムへの影響なし）

**インデックス設計**:
- `@@index([phraseId])`: フレーズ単位のログ取得用
- `@@index([userId])`: ユーザー単位のログ取得用
- `@@index([userId, practiceDate])`: 日次集計・ランキング用（パフォーマンス重要）

**カスケード削除**:
- `onDelete: Cascade`: フレーズまたはユーザー削除時にログも自動削除

---

## 2. 型定義の影響

### 2.1 Phrase型使用箇所

| ファイル | 使用方法 | 影響 |
|----------|----------|------|
| `src/types/phrase.ts` | `PhraseData`, `SavedPhrase` 型定義 | **高** - `practiceCorrectCount` プロパティ追加が必要 |
| `src/components/phrase/PhraseItem.tsx` | フレーズ一覧アイテム表示 | **中** - 正解回数（0/5〜5/5）表示の追加が必要 |
| `src/components/phrase/PhraseList.tsx` | フレーズ一覧 | **低** - `PhraseItem` の変更に依存 |
| `src/components/phrase/EditPhraseModal.tsx` | フレーズ編集モーダル | **低** - 型定義の変更のみ（UI変更なし） |
| `src/app/api/phrase/route.ts` | フレーズ作成・一覧API | **中** - レスポンスに `practiceCorrectCount` を含める必要 |
| `src/hooks/speak/useSinglePhraseSpeak.ts` | 単一フレーズSpeak | **低** - 型定義の変更のみ |

**必要な型追加**:
```typescript
// src/types/phrase.ts
export interface PhraseData {
  // 既存プロパティ...
  practiceCorrectCount?: number; // 追加（オプショナル: 既存コードの互換性維持）
}

export interface SavedPhrase {
  // 既存プロパティ...
  practiceCorrectCount?: number; // 追加
}
```

### 2.2 User型使用箇所

| ファイル | 使用方法 | 影響 |
|----------|----------|------|
| `src/types/userSettings.ts` | `UserSettingsResponse` 型定義 | **高** - `phraseMode` プロパティ追加が必要 |
| `src/components/settings/UserSettingsForm.tsx` | 設定フォーム | **高** - フレーズモード選択UI追加が必要 |
| `src/hooks/data/useUserSettings.ts` | 設定フック | **高** - `phraseMode` の読み込み・保存ロジック追加 |
| `src/app/api/user/settings/route.ts` | ユーザー設定API | **高** - `phraseMode` の取得・更新処理追加 |

**必要な型追加**:
```typescript
// src/types/userSettings.ts
export interface UserSettingsResponse {
  // 既存プロパティ...
  phraseMode?: "speak" | "quiz" | "practice"; // 追加
}

export interface UserSettingsUpdateRequest {
  // 既存プロパティ...
  phraseMode?: "speak" | "quiz" | "practice"; // 追加
}
```

### 2.3 TabType型の影響

| ファイル | 現在の定義 | 影響 |
|----------|----------|------|
| `src/types/phrase.ts` | `type TabType = "List" \| "Add" \| "Speak" \| "Quiz"` | **高** - `"Practice"` の追加が必要 |
| `src/components/navigation/PhraseTabNavigation.tsx` | TabType使用 | **高** - Practiceタブの追加が必要 |

**変更案**:
```typescript
// src/types/phrase.ts
export type TabType = "List" | "Add" | "Speak" | "Quiz" | "Practice";
```

---

## 3. UIコンポーネントの影響

### 3.1 直接影響を受けるコンポーネント

| コンポーネント | 変更内容 | 影響レベル |
|---------------|----------|-----------|
| `PhraseTabNavigation.tsx` | Practiceタブ追加（モーダル形式） | **高** - タブ配列に `{ key: "Practice", label: "Practice", path: "/phrase/practice" }` 追加 |
| `UserSettingsForm.tsx` | フレーズモード選択追加 | **高** - ラジオボタンまたはセレクトボックスで "Speak/Quiz" ↔ "Practice" 選択 |
| `ranking/page.tsx` | Practiceタブ追加 | **高** - `{ key: "practice", label: "Practice" }` タブ追加 |
| `PhraseItem.tsx` | 正解回数表示追加 | **中** - `{phrase.practiceCorrectCount || 0}/5` 表示追加 |
| `phrase/list/page.tsx` | 型定義変更の反映 | **低** - 型のみ（UI変更なし） |

### 3.2 間接的に影響を受ける可能性

**影響なし**:
- `PhraseAdd.tsx`: フレーズ追加フォーム（Practice機能と独立）
- `EditPhraseModal.tsx`: フレーズ編集（型定義のみ）
- `SpeakModeModal.tsx`: Speakモード設定（Practice機能と独立）
- `QuizModeModal.tsx`: Quizモード設定（Practice機能と独立）

**潜在的な影響**:
- `PhraseCard.tsx`（存在する場合）: 正解回数表示の追加が必要な可能性

---

## 4. API変更の影響

### 4.1 既存APIとの整合性

| 既存API | Practice機能との関係 | 影響 |
|---------|---------------------|------|
| `GET /api/phrase` | フレーズ一覧取得 | **低** - レスポンスに `practiceCorrectCount` を追加（オプショナル） |
| `POST /api/phrase` | フレーズ作成 | **低** - `practiceCorrectCount: 0` を初期値として設定（自動） |
| `GET /api/phrase/[id]` | フレーズ詳細取得 | **低** - レスポンスに `practiceCorrectCount` を追加可能（オプショナル） |
| `PUT /api/phrase/[id]` | フレーズ更新 | **なし** - Practice機能に影響なし |
| `DELETE /api/phrase/[id]` | フレーズ削除 | **なし** - Cascade削除で `PracticeLog` も自動削除 |
| `GET /api/phrase/speak` | Speak用フレーズ取得 | **なし** - 独立した機能 |
| `GET /api/phrase/quiz` | Quiz用フレーズ取得 | **なし** - 独立した機能 |
| `GET /api/ranking/*` | ランキング取得 | **高** - `/api/ranking/practice` 新規追加が必要 |
| `GET /api/user/settings` | ユーザー設定取得 | **高** - `phraseMode` の追加が必要 |
| `PUT /api/user/settings` | ユーザー設定更新 | **高** - `phraseMode` の保存が必要 |

### 4.2 新規APIエンドポイント

| エンドポイント | 認証 | 既存APIとの関係 |
|---------------|------|----------------|
| `GET /api/phrase/practice` | 必須 | `/api/phrase/speak` と類似（フィルタ条件が異なる） |
| `POST /api/phrase/practice/answer` | 必須 | 新規（一致度判定ロジック） |
| `GET /api/ranking/practice` | 必須 | `/api/ranking/speak`, `/api/ranking/quiz` と類似 |

**既存パターンとの整合性**:
- 認証: `authenticateRequest()` 使用（既存と同じ）
- エラーハンドリング: `ApiErrorResponse` 使用（既存と同じ）
- レスポンス形式: `{ success: true, ... }` 形式（既存と同じ）

---

## 5. テストへの影響

### 5.1 修正が必要な既存テスト

**現状**: プロジェクト内にテストファイルが存在しない（`find` コマンドで確認済み、`node_modules` 内のみ）

**影響**: なし（既存テストがないため、修正不要）

### 5.2 新規テストが必要な箇所

| 対象 | テストファイル | 優先度 | 理由 |
|------|---------------|--------|------|
| `GET /api/phrase/practice` | `src/app/api/phrase/practice/route.test.ts` | **必須** | フレーズ取得ロジックの正確性が重要 |
| `POST /api/phrase/practice/answer` | `src/app/api/phrase/practice/answer/route.test.ts` | **必須** | 一致度判定・カウント更新の正確性が重要 |
| `GET /api/ranking/practice` | `src/app/api/ranking/practice/route.test.ts` | **必須** | ランキング集計の正確性が重要 |
| `src/utils/similarity.ts` | `src/utils/similarity.test.ts` | **必須** | コア機能（一致度判定） |
| `src/utils/diff.ts` | `src/utils/diff.test.ts` | **必須** | コア機能（差分計算） |
| `useSpeechRecognition.ts` | `useSpeechRecognition.test.ts` | **推奨** | ブラウザAPIのモック検証 |
| `usePracticeSession.ts` | `usePracticeSession.test.ts` | **推奨** | セッション状態管理の検証 |
| `DiffHighlight.tsx` | `DiffHighlight.test.tsx` | **推奨** | 差分表示UIの検証 |

**テスト戦略**:
- TDDアプローチ: 厳格（Red-Green-Refactor）
- カバレッジ目標: 80%
- モック: Prisma, Supabase Auth, Web Speech API, MediaRecorder

---

## 6. リスク評価

| リスク | 影響度 | 発生確率 | 軽減策 |
|--------|--------|----------|--------|
| **DBマイグレーション失敗** | 高 | 低 | ローカルで事前検証、ロールバックスクリプト準備 |
| **既存フレーズ表示の不具合** | 中 | 中 | `practiceCorrectCount` をオプショナルにして後方互換性維持 |
| **Web Speech API非対応ブラウザ** | 中 | 中 | 対応ブラウザを明示、非対応時はフォールバックUI表示 |
| **音声認識精度の低さ** | 中 | 高 | 80%閾値を調整可能に設計、言語ごとの設定も検討 |
| **ランキング集計パフォーマンス** | 低 | 低 | インデックス `(userId, practiceDate)` で最適化済み |
| **型定義の不整合** | 中 | 低 | TypeScript厳格モードで検出、段階的な型追加で対応 |

---

## 7. 推奨事項

### 7.1 実装順序の推奨

1. **Phase 1: DBスキーマ変更とマイグレーション**
   - `schema.prisma` 変更
   - マイグレーションファイル生成・検証
   - ローカル環境でマイグレーション実行・確認

2. **Phase 2: 型定義の拡張**
   - `src/types/phrase.ts` に `practiceCorrectCount` 追加（オプショナル）
   - `src/types/userSettings.ts` に `phraseMode` 追加
   - `TabType` に `"Practice"` 追加

3. **Phase 3: ユーティリティ実装**
   - `src/utils/similarity.ts` 実装（テスト駆動）
   - `src/utils/diff.ts` 実装（テスト駆動）

4. **Phase 4: APIルート実装**
   - `GET /api/phrase/practice` 実装（テスト駆動）
   - `POST /api/phrase/practice/answer` 実装（テスト駆動）
   - `GET /api/ranking/practice` 実装（テスト駆動）

5. **Phase 5: フック実装**
   - `useSpeechRecognition.ts` 実装
   - `usePracticeSession.ts` 実装
   - `usePracticeAnswer.ts` 実装

6. **Phase 6: コンポーネント実装**
   - `PracticeModeModal.tsx` 実装
   - `DiffHighlight.tsx` 実装（テスト推奨）
   - `PracticeResult.tsx` 実装
   - `PracticePractice.tsx` 実装
   - `PracticePage.tsx` 実装

7. **Phase 7: 既存コンポーネント修正**
   - `PhraseTabNavigation.tsx` に Practiceタブ追加
   - `PhraseItem.tsx` に正解回数表示追加
   - `UserSettingsForm.tsx` にフレーズモード選択追加
   - `ranking/page.tsx` に Practiceタブ追加

8. **Phase 8: ユーザー設定API修正**
   - `GET /api/user/settings` に `phraseMode` 追加
   - `PUT /api/user/settings` に `phraseMode` 保存追加
   - `useUserSettings.ts` に `phraseMode` ロジック追加

9. **Phase 9: 翻訳キー追加**
   - `public/locales/*/app.json` に Practice関連キー追加

10. **Phase 10: 統合テスト・E2Eテスト**
    - 全機能の動作確認
    - ブラウザ互換性テスト

### 7.2 注意すべきポイント

#### 後方互換性の維持
- `practiceCorrectCount` は **オプショナル** として実装
- 既存のフレーズ一覧・詳細APIは `practiceCorrectCount` がなくてもエラーにしない
- Prismaクエリで `select` を使用する場合は明示的に含める

#### パフォーマンス
- ランキング取得時のインデックス活用を確認
- `practiceDate` でのフィルタリングが頻繁に行われるため、複合インデックス `(userId, practiceDate)` が重要

#### セキュリティ
- 一致度判定は **必ずサーバー側** で実行（クライアント側での改ざん防止）
- `phraseId` の所有者チェックを必ず実施（他ユーザーのフレーズにアクセスさせない）

#### ユーザー体験
- 既存ユーザーには `phraseMode` のデフォルト値 `"practice"` が設定される
- 設定画面で「Speak/Quiz」モードに戻せることを明示

#### 翻訳
- 13言語すべてに翻訳キーを追加（日本語、英語、中国語、韓国語、ポルトガル語、ドイツ語など）
- 翻訳漏れがないか確認

---

## 8. 必要なアクション

### 8.1 実装が必要な箇所

**高優先度**:
1. ✅ `prisma/schema.prisma` - PracticeLog追加、Phrase/User変更
2. ✅ `src/types/phrase.ts` - `practiceCorrectCount` 追加、`TabType` 拡張
3. ✅ `src/types/userSettings.ts` - `phraseMode` 追加
4. ⬜ `src/utils/similarity.ts` - 一致度判定実装（新規）
5. ⬜ `src/utils/diff.ts` - 差分計算実装（新規）
6. ⬜ `src/app/api/phrase/practice/route.ts` - 練習フレーズ取得API（新規）
7. ⬜ `src/app/api/phrase/practice/answer/route.ts` - 回答判定API（新規）
8. ⬜ `src/app/api/ranking/practice/route.ts` - Practiceランキング（新規）
9. ⬜ `src/components/navigation/PhraseTabNavigation.tsx` - Practiceタブ追加
10. ⬜ `src/components/settings/UserSettingsForm.tsx` - フレーズモード選択追加
11. ⬜ `src/app/ranking/page.tsx` - Practiceタブ追加
12. ⬜ `src/components/phrase/PhraseItem.tsx` - 正解回数表示追加
13. ⬜ `src/app/api/user/settings/route.ts` - `phraseMode` 対応
14. ⬜ `src/hooks/data/useUserSettings.ts` - `phraseMode` 対応

**中優先度**:
15. ⬜ `src/hooks/practice/useSpeechRecognition.ts` - 音声認識フック（新規）
16. ⬜ `src/hooks/practice/usePracticeSession.ts` - セッション管理フック（新規）
17. ⬜ `src/hooks/practice/usePracticeAnswer.ts` - 回答送信フック（新規）
18. ⬜ `src/components/practice/PracticeModeModal.tsx` - モード選択モーダル（新規）
19. ⬜ `src/components/practice/DiffHighlight.tsx` - 差分ハイライト（新規）
20. ⬜ `src/components/practice/PracticeResult.tsx` - 結果表示（新規）
21. ⬜ `src/components/practice/PracticePractice.tsx` - メイン練習画面（新規）
22. ⬜ `src/app/[locale]/phrase/practice/page.tsx` - Practiceページ（新規）

**低優先度**:
23. ⬜ `public/locales/*/app.json` - 翻訳キー追加（13言語）
24. ⬜ `docs/backend/api-routes.md` - API仕様ドキュメント更新
25. ⬜ `docs/frontend/components.md` - コンポーネント一覧更新
26. ⬜ `docs/shared/types.md` - 型定義ドキュメント更新

### 8.2 テストが必要な箇所

**必須**:
1. ⬜ `src/utils/similarity.test.ts` - 一致度判定のテスト
2. ⬜ `src/utils/diff.test.ts` - 差分計算のテスト
3. ⬜ `src/app/api/phrase/practice/route.test.ts` - 練習フレーズ取得APIのテスト
4. ⬜ `src/app/api/phrase/practice/answer/route.test.ts` - 回答判定APIのテスト
5. ⬜ `src/app/api/ranking/practice/route.test.ts` - Practiceランキングのテスト

**推奨**:
6. ⬜ `src/hooks/practice/useSpeechRecognition.test.ts` - 音声認識フックのテスト
7. ⬜ `src/hooks/practice/usePracticeSession.test.ts` - セッション管理フックのテスト
8. ⬜ `src/components/practice/DiffHighlight.test.tsx` - 差分ハイライトのテスト

### 8.3 確認が必要な箇所

1. ✅ 既存の `PhraseData` 型を使用している全ファイル → オプショナルプロパティのため影響なし
2. ✅ 既存の `UserSettingsResponse` 型を使用している全ファイル → オプショナルプロパティのため影響なし
3. ⬜ ランキングページの既存タブレイアウト → Practiceタブ追加時のUI崩れ確認
4. ⬜ フレーズ一覧の表示レイアウト → 正解回数追加時のUI崩れ確認
5. ⬜ 設定フォームのレイアウト → フレーズモード選択追加時のUI崩れ確認

---

## 9. テスト推奨事項

### 9.1 ユニットテスト

**一致度判定ロジック** (`similarity.ts`):
- 完全一致で1.0を返す
- 完全不一致で0.0を返す
- 部分一致で正しい一致率を返す
- 大文字小文字を無視して判定
- 句読点を無視して判定（オプション）
- 境界値: 80%（正解）、79.9%（不正解）

**差分計算ロジック** (`diff.ts`):
- 完全一致で `equal` 配列のみ返す
- 単語欠落で `delete` 要素を含む
- 単語追加で `insert` 要素を含む
- 単語置換で `delete` + `insert` 要素を含む

**練習フレーズ取得API** (`GET /api/phrase/practice`):
- 通常モード: 未マスター（0〜4）かつ本日未正解のフレーズを登録日時順で取得
- 復習モード: マスター済み（5）かつ本日未正解のフレーズを登録日時順で取得
- 該当フレーズがない場合、空配列を返す
- 認証なしで401を返す
- 無効なlanguageIdで400を返す

**回答判定API** (`POST /api/phrase/practice/answer`):
- 80%以上一致で正解判定、`practiceCorrectCount` +1
- 80%未満で不正解判定、カウント変更なし
- 5回目の正解で `isMastered: true`
- PracticeLogが作成される
- 差分情報が正しく返される
- 本日すでに正解済みの場合、カウントは増えない（正解判定はする）
- 存在しないphraseIdで404
- 他ユーザーのフレーズで403

### 9.2 統合テスト

1. ユーザーがPracticeモードを開始 → フレーズが正しく取得される
2. 音声認識で発話 → 認識テキストが取得される
3. 回答送信 → 一致度判定・カウント更新が正しく行われる
4. 5回正解 → マスター済みになり、通常モードでは出題されなくなる
5. 復習モード → マスター済みフレーズが出題される
6. ランキング表示 → 正しい順位と件数が表示される

### 9.3 E2Eテスト

1. 新規ユーザー登録 → デフォルトでPracticeモードが有効
2. フレーズ追加 → Practiceモードで出題される
3. 設定でSpeak/Quizモードに切替 → Practiceタブが非表示になる（または無効化）
4. 再度Practiceモードに戻す → 正解回数が保持されている

---

## 10. まとめ

### 影響範囲の総括

- **直接影響を受けるファイル**: 約14ファイル
- **間接的に影響を受けるファイル**: 約10ファイル
- **新規作成ファイル**: 約12ファイル
- **テストが必要な箇所**: 8ファイル（必須5 + 推奨3）

### 実装の難易度

- **DBスキーマ変更**: 低（カラム追加のみ、後方互換性あり）
- **API実装**: 中（既存パターンを踏襲、一致度判定ロジックが新規）
- **UI実装**: 中（既存コンポーネントを参考、音声認識が新規）
- **テスト実装**: 高（TDDアプローチ、モック多数）

### 推奨される実装期間

- **Phase 1-3**: 1日（DBスキーマ、型定義、ユーティリティ）
- **Phase 4**: 2日（APIルート、テスト）
- **Phase 5-6**: 3日（フック、コンポーネント）
- **Phase 7-8**: 1日（既存コンポーネント修正、ユーザー設定）
- **Phase 9-10**: 1日（翻訳、統合テスト）
- **合計**: 約8日（テスト含む）

---

**分析完了日**: 2026-01-17
**次のステップ**: `/implement-feature` で実装開始を推奨
