# Practice モード（発話練習機能） - 技術設計

**ステータス**: レビュー中
**作成日**: 2026-01-17
**最終更新日**: 2026-01-17
**要件**: [requirements.md](./requirements.md)

---

## 1. アーキテクチャ概要

### システムフロー

1. ユーザーがPracticeモードを開始（通常/復習モード選択モーダル）
2. APIから練習対象フレーズを取得（登録日時順、1日1回制限考慮）
3. 母国語訳を表示、ユーザーが発話
4. Web Speech APIで音声認識、認識テキストを取得
5. 認識テキストをサーバーに送信、一致度判定（80%以上で正解）
6. 結果表示（一致率、差分ハイライト、TTS再生、自分の発話再生）
7. 正解の場合、practiceCorrectCount更新、PracticeLog記録
8. 次のフレーズへ、または完了画面表示

### 主要コンポーネント

| コンポーネント | パス | 責務 |
|---------------|------|------|
| PracticePage | `src/app/[locale]/phrase/practice/page.tsx` | Practiceモードのページ |
| PracticePractice | `src/components/practice/PracticePractice.tsx` | 練習画面のメインコンポーネント |
| PracticeModeModal | `src/components/practice/PracticeModeModal.tsx` | 学習言語 + 通常/復習モード選択モーダル |
| PracticeResult | `src/components/practice/PracticeResult.tsx` | 結果表示（差分ハイライト含む） |
| DiffHighlight | `src/components/practice/DiffHighlight.tsx` | テキスト差分のハイライト表示 |
| useSpeechRecognition | `src/hooks/practice/useSpeechRecognition.ts` | 音声認識フック |
| usePracticeSession | `src/hooks/practice/usePracticeSession.ts` | セッション管理フック |
| usePracticeAnswer | `src/hooks/practice/usePracticeAnswer.ts` | 回答送信フック |

---

## 2. データ設計

### 新規テーブル: PracticeLog

```prisma
model PracticeLog {
  id          String   @id @default(cuid())
  phraseId    String   @map("phrase_id")
  userId      String   @map("user_id")
  correct     Boolean  // 正解/不正解
  similarity  Float    // 一致率（0.0〜1.0）
  transcript  String?  // 認識されたテキスト
  practiceDate DateTime @map("practice_date") // 練習日（UTC）
  createdAt   DateTime @default(now()) @map("created_at")

  phrase Phrase @relation(fields: [phraseId], references: [id], onDelete: Cascade)
  user   User   @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([phraseId])
  @@index([userId])
  @@index([userId, practiceDate])
  @@map("practice_logs")
}
```

### Phraseテーブルへの追加カラム

```prisma
model Phrase {
  // 既存カラム...

  // 追加カラム
  practiceCorrectCount   Int       @default(0) @map("practice_correct_count") // 正解回数（0〜5）
  practiceIncorrectCount Int       @default(0) @map("practice_incorrect_count") // 不正解回数
  lastPracticeDate       DateTime? @map("last_practice_date") // 最後に正解した日（UTC）

  // リレーション追加
  practiceLogs PracticeLog[]
}
```

### Userテーブルへの追加カラム

```prisma
model User {
  // 既存カラム...

  // 追加カラム
  phraseMode String @default("practice") @map("phrase_mode") // "speak" | "quiz" | "practice"
  practiceIncludeExisting Boolean @default(false) @map("practice_include_existing") // 既存フレーズをPractice対象に含めるか
  practiceStartDate DateTime? @map("practice_start_date") // Practiceモード有効化日時（この日以降のフレーズが対象）

  // リレーション追加
  practiceLogs PracticeLog[]
}
```

**既存フレーズの扱い**:
- `practiceIncludeExisting = false`（デフォルト）: `practiceStartDate` 以降に登録されたフレーズのみが対象
- `practiceIncludeExisting = true`: 全フレーズが対象
- `practiceStartDate`: ユーザーが初めてPracticeモードを使用した日時を自動設定

### 既存テーブルへの影響

- [x] 以下のテーブルに影響:
  - `Phrase`: `practiceCorrectCount`, `practiceIncorrectCount`, `lastPracticeDate` カラム追加、`practiceLogs` リレーション追加
  - `User`: `phraseMode`, `practiceIncludeExisting`, `practiceStartDate` カラム追加、`practiceLogs` リレーション追加

---

## 3. API設計

### エンドポイント一覧

| メソッド | パス | 説明 | 認証 |
|----------|------|------|------|
| GET | `/api/phrase/practice` | 練習対象フレーズ取得 | 必須 |
| POST | `/api/phrase/practice/answer` | 回答送信・判定 | 必須 |
| GET | `/api/ranking/practice` | Practiceランキング取得 | 必須 |

### リクエスト/レスポンス型

#### GET /api/phrase/practice

```typescript
// クエリパラメータ
interface GetPracticePhrasesQuery {
  languageId: string;
  mode: "normal" | "review"; // 通常 or 復習
}

// レスポンス
interface GetPracticePhrasesResponse {
  success: true;
  phrases: Array<{
    id: string;
    original: string;      // 学習言語（正解テキスト）
    translation: string;   // 母国語訳（表示用）
    practiceCorrectCount: number;
    createdAt: string;
  }>;
  totalCount: number;
}

// フィルタ条件（サーバー側で自動適用）
// 1. practiceIncludeExisting = false の場合:
//    - phrase.createdAt >= user.practiceStartDate のフレーズのみ対象
// 2. practiceIncludeExisting = true の場合:
//    - 全フレーズが対象
```

#### POST /api/phrase/practice/answer

```typescript
// リクエスト
interface PostPracticeAnswerRequest {
  phraseId: string;
  transcript: string;  // 音声認識で得たテキスト
  mode: "normal" | "review";
}

// レスポンス
interface PostPracticeAnswerResponse {
  success: true;
  correct: boolean;
  similarity: number;  // 0.0〜1.0
  expectedText: string;  // 正解テキスト
  diffResult: DiffResult[];  // 差分情報（ハイライト用）
  newCorrectCount: number;  // 更新後の正解回数
  isMastered: boolean;  // 5回達成でtrue
}

interface DiffResult {
  type: "equal" | "insert" | "delete";
  value: string;
}
```

#### GET /api/ranking/practice

```typescript
// クエリパラメータ
interface GetPracticeRankingQuery {
  languageId: string;
  type: "master" | "total";  // マスター数 or 合計正解回数
  period: "daily" | "total"; // 今日 or 累計
}

// レスポンス
interface GetPracticeRankingResponse {
  success: true;
  rankings: Array<{
    rank: number;
    userId: string;
    username: string;
    iconUrl: string | null;
    count: number;
    createdAt: string;
  }>;
  userRanking: {
    rank: number;
    count: number;
  } | null;
}
```

### エラーハンドリング

| エラーコード | HTTPステータス | 説明 |
|-------------|----------------|------|
| PHRASE_NOT_FOUND | 404 | フレーズが存在しない |
| ALREADY_PRACTICED_TODAY | 400 | 本日すでに正解済み |
| VALIDATION_ERROR | 400 | 入力が無効 |
| UNAUTHORIZED | 401 | 認証エラー |

---

## 4. UI設計

### 画面構成

1. **Practiceページ** (`/[locale]/phrase/practice`)
   - モード選択モーダル（初回表示）
   - 練習画面（メイン）
   - 完了画面

2. **設定ページ** (`/[locale]/settings`)
   - フレーズモード選択追加（Speak/Quiz or Practice）
   - 既存フレーズをPractice対象に含めるかの設定追加

3. **ランキングページ** (`/[locale]/ranking`)
   - Practiceタブ追加

4. **フレーズ一覧ページ** (`/[locale]/phrase`) - 既存ページを使用
   - ユーザー設定 `phraseMode` に応じて表示を切り替え:
     - `speak` / `quiz`: 音読回数、クイズ回数を表示（現状維持）
     - `practice`: Practice正解回数（0/5〜5/5）を表示

### コンポーネント構成

```
PracticePage
├── PracticeModeModal          # 学習言語 + 通常/復習モード選択（Quizモードと同様）
│   ├── LanguageSelector       # 学習言語選択（既存コンポーネント流用）
│   └── ModeSelector           # 通常/復習モード選択
├── PracticePractice           # メイン練習画面
│   ├── PhraseDisplay          # 母国語訳表示
│   ├── ProgressIndicator      # 正解回数(2/5)、プログレスバー
│   ├── RecordButton           # 録音ボタン（useSpeechRecognition使用）
│   ├── PracticeResult         # 結果表示
│   │   ├── SimilarityDisplay  # 一致率表示
│   │   ├── DiffHighlight      # 差分ハイライト表示
│   │   └── AudioPlayback      # TTS再生 / 自分の発話再生
│   └── NavigationButtons      # 次へ / 終了
└── AllDoneScreen              # 完了画面（既存コンポーネント流用）
```

### 状態管理

```typescript
// usePracticeSession の状態
interface PracticeSessionState {
  mode: "normal" | "review";
  phrases: PracticePhrase[];
  currentIndex: number;
  isRecording: boolean;
  result: PracticeResult | null;
  userAudioBlob: Blob | null;  // 自分の発話音声
}

// 結果の状態
interface PracticeResult {
  correct: boolean;
  similarity: number;
  transcript: string;
  diffResult: DiffResult[];
}
```

### 差分ハイライトUI

発話テキストと正解テキストの差分を視覚的に表示:

```
正解: "I would like to have a coffee"
発話: "I would like to have coffee"

表示例:
I would like to have [a] coffee
                     ↑ 欠落（赤色ハイライト）
```

- **一致部分**: 通常表示
- **欠落部分**: 赤色背景 + 取り消し線
- **追加部分**: 黄色背景
- **置換部分**: 赤色（削除）+ 緑色（挿入）

---

## 5. セキュリティとパフォーマンス

### セキュリティ考慮事項

- [x] 認証: `authenticateRequest()` 使用
- [x] 認可: ユーザー所有フレーズのみアクセス可能
- [x] 入力検証: Zodスキーマでバリデーション
- [x] 一致度判定: サーバー側で実行（改ざん防止）
- [x] レート制限: 1日1回の正解カウント制限（サーバー側で検証）

### パフォーマンス考慮事項

- [x] インデックス設計: `practice_logs(user_id, practice_date)` 複合インデックス
- [x] クエリ最適化: フレーズ取得時に必要なカラムのみSELECT
- [x] キャッシュ: React Queryによるクライアントキャッシュ

---

## 6. テスト戦略

### テスト方針

**TDDアプローチ**: 厳格（Red-Green-Refactor）
**カバレッジ目標**: 80%

### テスト対象一覧

| 対象 | ファイルパス | テストファイル | 優先度 |
|------|-------------|---------------|--------|
| 練習フレーズ取得API | `src/app/api/phrase/practice/route.ts` | `route.test.ts` | 必須 |
| 回答送信API | `src/app/api/phrase/practice/answer/route.ts` | `route.test.ts` | 必須 |
| ランキングAPI | `src/app/api/ranking/practice/route.ts` | `route.test.ts` | 必須 |
| 一致度判定ロジック | `src/utils/similarity.ts` | `similarity.test.ts` | 必須 |
| 差分計算ロジック | `src/utils/diff.ts` | `diff.test.ts` | 必須 |
| 音声認識フック | `src/hooks/practice/useSpeechRecognition.ts` | `useSpeechRecognition.test.ts` | 推奨 |
| セッション管理フック | `src/hooks/practice/usePracticeSession.ts` | `usePracticeSession.test.ts` | 推奨 |
| 差分ハイライトコンポーネント | `src/components/practice/DiffHighlight.tsx` | `DiffHighlight.test.tsx` | 推奨 |

### テストケース詳細

#### APIルート: `GET /api/phrase/practice`

**正常系**:
- [ ] 通常モード: 未マスター（0〜4）かつ本日未正解のフレーズを登録日時順で取得
- [ ] 復習モード: マスター済み（5）かつ本日未正解のフレーズを登録日時順で取得
- [ ] 該当フレーズがない場合、空配列を返す

**異常系**:
- [ ] 認証なしで401を返す
- [ ] 無効なlanguageIdで400を返す
- [ ] 無効なmodeで400を返す

#### APIルート: `POST /api/phrase/practice/answer`

**正常系**:
- [ ] 80%以上一致で正解判定、practiceCorrectCount +1
- [ ] 80%未満で不正解判定、カウント変更なし
- [ ] 5回目の正解でisMastered: true
- [ ] PracticeLogが作成される
- [ ] 差分情報が正しく返される

**異常系**:
- [ ] 本日すでに正解済みの場合、カウントは増えない（正解判定はする）
- [ ] 存在しないphraseIdで404
- [ ] 他ユーザーのフレーズで403

**境界値**:
- [ ] 一致率ちょうど80%で正解
- [ ] 一致率79.9%で不正解
- [ ] 空文字の発話で0%

#### ユーティリティ: `similarity.ts`

**一致度判定**:
- [ ] 完全一致で1.0
- [ ] 完全不一致で0.0
- [ ] 部分一致で正しい一致率
- [ ] 大文字小文字を無視して判定
- [ ] 句読点を無視して判定（オプション）

#### ユーティリティ: `diff.ts`

**差分計算**:
- [ ] 完全一致でequal配列のみ
- [ ] 単語欠落でdelete要素を含む
- [ ] 単語追加でinsert要素を含む
- [ ] 単語置換でdelete+insert要素を含む

### モック戦略

| 依存 | モック方法 | 備考 |
|------|-----------|------|
| Prisma | `jest.mock('@/utils/prisma')` | `__mocks__/prisma.ts` 使用 |
| Supabase Auth | `jest.mock('@/utils/supabase-server')` | `__mocks__/supabase.ts` 使用 |
| Web Speech API | `jest.fn()` | ブラウザAPIのモック |
| MediaRecorder | `jest.fn()` | 音声録音のモック |

---

## 7. 影響範囲

### 直接影響を受けるファイル

| ファイル | 変更内容 | 影響レベル |
|----------|----------|-----------|
| `prisma/schema.prisma` | PracticeLog追加、Phrase/User変更 | Critical |
| `src/components/navigation/PhraseTabNavigation.tsx` | Practiceタブ追加 | Medium |
| `src/components/settings/UserSettingsForm.tsx` | フレーズモード選択追加 | Medium |
| `src/app/[locale]/ranking/page.tsx` | Practiceタブ追加 | Medium |
| `src/app/[locale]/phrase/page.tsx` | 正解回数表示追加 | Low |
| `src/types/index.ts` | Practice関連型追加 | Low |
| `src/locales/*.json` | 翻訳キー追加 | Low |

### 間接的に影響を受ける可能性のあるファイル

- `src/hooks/data/useUserSettings.ts` - phraseMode対応確認
- `src/app/api/user/settings/route.ts` - phraseMode保存対応
- `src/components/phrase/PhraseCard.tsx` - 正解回数表示追加の可能性

---

## 8. リスクと代替案

### リスク

| リスク | 影響度 | 軽減策 |
|--------|--------|--------|
| Web Speech APIのブラウザ互換性 | 中 | 対応ブラウザを明示、非対応時はフォールバックUI |
| 音声認識の精度が低い | 中 | 80%閾値は調整可能に設計、言語ごとに異なる設定も検討 |
| 一致度判定の公平性（言語差） | 低 | 将来的に言語ごとの閾値設定を検討 |

### 検討した代替案

#### 代替案A: クライアント側で一致度判定

- **説明**: サーバーに送信せず、ブラウザ側で判定を完結
- **メリット**: 低遅延、サーバー負荷なし
- **デメリット**: 改ざんリスク、ランキングの信頼性低下
- **却下理由**: ランキング機能があるため、サーバー側検証が必須

#### 代替案B: 外部音声認識API（Google Speech-to-Text等）

- **説明**: Web Speech APIの代わりに外部APIを使用
- **メリット**: 認識精度向上、サーバー側で音声処理可能
- **デメリット**: コスト増、レイテンシ増加、実装複雑化
- **却下理由**: MVP段階ではWeb Speech APIで十分、将来的に検討

---

## 9. 未解決の質問

- [x] 一致度判定をクライアント/サーバーどちらで行うか → サーバー側で決定
- [x] モード切替UIの形式 → モーダル形式で決定
- [ ] 一致度閾値（80%）を言語ごとに変えるか → 初期実装では固定、将来検討

---

## 参考資料

- [既存Speakモード実装](../../../src/components/speak/)
- [既存Quizモード実装](../../../src/components/quiz/)
- [Web Speech API MDN](https://developer.mozilla.org/en-US/docs/Web/API/Web_Speech_API)
- [コードベース調査レポート](./reports/file-finder.md)
