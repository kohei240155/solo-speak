# Practice モード - コードベース調査レポート

## 1. 既存のSpeak/Quizモード

### ファイルパス一覧

#### Speakモード
- **ページコンポーネント**: `src/app/phrase/speak/page.tsx`
- **練習コンポーネント**: `src/components/speak/SpeakPractice.tsx`
- **セッション管理**: `src/hooks/speak/useSpeakSession.ts`
- **複数フレーズ管理**: `src/hooks/speak/useMultiPhraseSpeak.ts`
- **単一フレーズ管理**: `src/hooks/speak/useSinglePhraseSpeak.ts`

#### Quizモード
- **ページコンポーネント**: `src/app/phrase/quiz/page.tsx`
- **練習コンポーネント**: `src/components/quiz/QuizPractice.tsx`
- **クイズ管理**: `src/hooks/quiz/useQuizPhrase.ts`

### 主要コンポーネントの役割

#### SpeakPractice
- **役割**: 学習言語のフレーズ（original）と母国語訳（translation）を表示し、音読練習を管理
- **主要機能**:
  - フレーズ表示（学習言語 + 母国語訳）
  - Countボタン（音読回数カウント）
  - Soundボタン（TTS音声再生）
  - Next/Finishボタン
  - 今日/合計カウント表示
  - 1秒のクールダウン機能
- **状態管理**: todayCount, totalCount, isCountDisabled

#### QuizPractice
- **役割**: 母国語訳を表示し、学習言語を思い出すクイズ形式の練習
- **主要機能**:
  - 母国語訳表示（メイン表示）
  - タップで学習言語表示（アニメーション付き）
  - Got It/No Ideaボタン（正解/不正解判定）
  - 音読回数カウント機能（+ボタン）
  - 音声再生機能
  - プログレスバー表示
- **状態管理**: hasAnswered, selectedAnswer, pendingSpeakCount, showTranslation

### 音声認識の実装方法

**重要な発見**: 現状、Web Speech APIを使った音声認識機能は実装されていません。

- Speakモードは「音読練習」であり、ユーザーが自主的にCountボタンを押す仕組み
- 音声の自動認識・一致判定機能は存在しない
- Practice モードで必要な「発話を認識して一致度判定」機能は新規実装が必要

**TTS（音声再生）の実装**:
- `src/hooks/ui/useTextToSpeech.ts`
- Google Cloud TTS APIを使用（`/api/tts` エンドポイント経由）
- キャッシュ機能あり
- 言語コード対応

## 2. DBスキーマ

### Phrase関連テーブル

```prisma
model Phrase {
  id                 String       @id @default(cuid())
  userId             String       @map("user_id")
  languageId         String       @map("language_id")
  original           String       // 学習言語のフレーズ
  translation        String       // 母国語訳
  explanation        String?      // 説明（オプション）
  totalSpeakCount    Int          @default(0) // 合計音読回数
  dailySpeakCount    Int          @default(0) // 今日の音読回数
  lastSpeakDate      DateTime?    @map("last_speak_date")
  lastQuizDate       DateTime?    @map("last_quiz_date")
  sessionSpoken      Boolean      @default(false) // セッション内で既に練習済みか
  correctQuizCount   Int          @default(0) // クイズ正解数
  incorrectQuizCount Int          @default(0) // クイズ不正解数
  phraseLevelId      String       @map("phrase_level_id")
  speechId           String?      @map("speech_id")
  speechOrder        Int?         @map("speech_order")
  createdAt          DateTime     @default(now())
  updatedAt          DateTime     @updatedAt
  deletedAt          DateTime?
}
```

**Practice モードで追加が必要なカラム**:
- `practiceCorrectCount` (Int, default: 0) - Practice正解回数（0〜5）
- `lastPracticeDate` (DateTime?) - 最後にPractice正解した日

### User関連テーブル

```prisma
model User {
  id                         String      @id @default(cuid())
  username                   String?
  iconUrl                    String?
  nativeLanguageId           String?
  defaultLearningLanguageId  String?
  email                      String      @unique
  timezone                   String?     // タイムゾーン設定あり
  remainingPhraseGenerations Int         @default(0)
  lastPhraseGenerationDate   DateTime?
  lastDailySpeakCountResetDate DateTime?
  remainingSpeechCount       Int         @default(0)
  lastSpeechCountResetDate   DateTime?
  createdAt                  DateTime    @default(now())
  updatedAt                  DateTime    @updatedAt
  deletedAt                  DateTime?
}
```

**Practice モードで追加が必要なカラム**:
- `phraseMode` (String, default: "practice") - "speak" | "quiz" | "practice"

### 既存の関連テーブル

- **QuizResult**: クイズ結果履歴（phraseId, date, correct）
- **SpeakLog**: 音読ログ（phraseId, date, count）

**Practice モード用の新規テーブル案**:
```prisma
model PracticeLog {
  id        String    @id @default(cuid())
  phraseId  String    @map("phrase_id")
  date      DateTime  // UTC日付
  correct   Boolean   // 正解/不正解
  createdAt DateTime  @default(now())
  phrase    Phrase    @relation(fields: [phraseId], references: [id])
}
```

## 3. ランキング機能

### 実装ファイル

- **ページ**: `src/app/ranking/page.tsx`
- **データ取得**: `src/hooks/data/useRankingData.ts`
- **APIエンドポイント例**:
  - `src/app/api/ranking/phrase/route.ts`
  - `src/app/api/ranking/speak/route.ts`
  - `src/app/api/ranking/quiz/route.ts`

### データ取得方法

#### Phraseランキング（例）
```typescript
// データベースクエリ（groupBy）
const phraseCounts = await prisma.phrase.groupBy({
  by: ["userId"],
  where: {
    deletedAt: null,
    languageId: languageRecord.id,
    speechId: null, // Speech用フレーズを除外
  },
  _count: { id: true },
});

// ソート: カウント降順、同数の場合は登録日時昇順
rankingData.sort((a, b) => {
  if (b.count === a.count) {
    return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
  }
  return b.count - a.count;
});
```

### UI構造

- 4タブ構造: Phrase / Speak / Quiz / Speech
- 各タブ内にさらにDaily/Total/Streak切り替え（機能により異なる）
- 上位10位を表示、11位以降のユーザーは「Your Ranking」として別表示
- 1〜3位はメダル色表示（金/銀/銅）

**Practice モード追加時の対応**:
- 新タブ「Practice」を追加
- 集計項目: 「マスター数」「合計正解回数」
- Daily/Total切り替え

## 4. ユーザー設定

### 設定画面の実装

- **ページ**: `src/app/settings/page.tsx`
- **フォーム**: `src/components/settings/UserSettingsForm.tsx`
- **データ取得**: `src/hooks/data/useUserSettings.ts`
- **データ送信**: `src/hooks/data/useUserSettingsSubmit.ts`
- **API**: `src/app/api/user/settings/route.ts`

### 設定項目の保存方法

#### API実装パターン
- **GET**: ユーザー設定取得（認証チェック → prisma.user.findUnique）
- **POST**: 新規作成（createUserSettings）
- **PUT**: 更新（updateUserSettings）

#### バリデーション
- `userSetupSchema` (Zod) による型検証
- サーバー側でも必須フィールドチェック、言語ID存在確認、タイムゾーン検証

**Practice モード設定追加**:
```typescript
// UserテーブルにphraseModeカラム追加
phraseMode: "speak" | "quiz" | "practice"

// フォームに選択UIを追加
<select name="phraseMode">
  <option value="speak">Speak/Quiz</option>
  <option value="practice">Practice</option>
</select>
```

## 5. 音声関連

### TTS実装

- **ファイル**: `src/hooks/ui/useTextToSpeech.ts`
- **API**: `/api/tts` (Google Cloud TTS経由)
- **機能**:
  - テキスト→音声変換
  - 言語コード対応
  - 音声キャッシュ（Map）
  - Base64 → Blob → HTMLAudioElement
- **使用箇所**: SpeakPractice, QuizPractice

### 音声認識実装

**現状**: 実装なし

**Practice モードで必要な実装**:
- Web Speech API (`SpeechRecognition`) の実装
- 発話テキストと正解フレーズの一致度判定（80%以上で正解）
- マイク権限処理
- ブラウザ対応（Chrome, Edge, Safari等）

**参考実装パターン**:
```typescript
const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
recognition.lang = languageCode; // 学習言語に設定
recognition.interimResults = false;

recognition.onresult = (event) => {
  const transcript = event.results[0][0].transcript;
  const similarity = calculateSimilarity(transcript, correctPhrase);
  if (similarity >= 0.8) {
    // 正解処理
  }
};
```

### 関連hooks

- `useTextToSpeech`: TTS機能
- `useAudio*`: 該当ファイルなし（TTS機能に統合されている）

## 6. API Routes

### 関連エンドポイント一覧

#### Phraseエンドポイント
| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/api/phrase/speak` | GET | Speak用フレーズ取得 |
| `/api/phrase/speak/count` | GET | Speak対象フレーズ数取得 |
| `/api/phrase/[id]/count` | POST | 音読回数更新 |
| `/api/phrase/quiz` | GET | Quiz用フレーズ取得 |
| `/api/phrase/quiz/answer` | POST | クイズ回答送信 |
| `/api/phrase/[id]` | GET/PUT/DELETE | フレーズCRUD |

#### Rankingエンドポイント
| エンドポイント | メソッド | 用途 |
|---------------|---------|------|
| `/api/ranking/phrase` | GET | フレーズ数ランキング |
| `/api/ranking/speak` | GET | 音読回数ランキング |
| `/api/ranking/quiz` | GET | クイズ正解数ランキング |

### 認証パターン

**すべてのエンドポイントで必須**（Stripe Webhook除く）:
```typescript
const authResult = await authenticateRequest(request);
if ("error" in authResult) {
  return authResult.error;
}
const userId = authResult.user.id;
```

**認証方式**: Supabaseの`Authorization`ヘッダートークン検証

### レスポンス形式

**成功レスポンス**:
```typescript
{
  success: true,
  phrase: { ... },
  // その他のデータ
}
```

**エラーレスポンス**:
```typescript
{
  success: false,
  error: "Error message",
  message?: "詳細メッセージ"
}
```

**Practice モード用の新規エンドポイント案**:
- `GET /api/phrase/practice` - Practice用フレーズ取得
- `POST /api/phrase/practice/answer` - Practice回答送信
- `GET /api/ranking/practice` - Practiceランキング取得

## 7. 再利用可能なコンポーネント/hooks

### 再利用可能なコンポーネント

| コンポーネント | パス | 用途 |
|--------------|------|------|
| `PhraseTabNavigation` | `src/components/navigation/PhraseTabNavigation.tsx` | タブメニュー |
| `AllDoneScreen` | `src/components/common/AllDoneScreen.tsx` | 完了画面 |
| `LoadingSpinner` | `src/components/common/LoadingSpinner.tsx` | ローディング表示 |
| `AnimatedButton` | `src/components/common/AnimatedButton.tsx` | アニメーション付きボタン |
| `LanguageSelector` | `src/components/common/LanguageSelector.tsx` | 言語選択UI |

### 再利用可能なhooks

| フック | パス | 用途 |
|-------|------|------|
| `useTextToSpeech` | `src/hooks/ui/useTextToSpeech.ts` | TTS音声再生 |
| `usePhraseSettings` | `src/hooks/phrase/usePhraseSettings.ts` | 言語設定取得 |
| `usePageLeaveWarning` | `src/hooks/ui/usePageLeaveWarning.ts` | 離脱警告 |
| `useModalManager` | `src/hooks/ui/useModalManager.ts` | モーダル管理 |
| `useAllDoneScreen` | `src/hooks/ui/useAllDoneScreen.ts` | 完了画面管理 |
| `useTranslation` | `src/hooks/ui/useTranslation.ts` | 国際化対応 |
| `useInfinitePhrases` | `src/hooks/api/index.ts` | フレーズリストキャッシュ |

### Practice モードで流用できる既存実装

#### セッション管理パターン（useSpeakSession参考）
- URLパラメータによる設定の保存・復元
- pendingCount管理（未送信カウント）
- 日付変更検出（UTC基準）
- ページ離脱時の自動保存

#### UI/UX パターン
- QuizPracticeのプログレスバー
- SpeakPracticeのCount/Soundボタンレイアウト
- クールダウン機能（1秒間ボタン無効化）
- TTS音声再生機能

#### API設計パターン
- フレーズ取得APIの構造（条件フィルタリング、ソート）
- トランザクション処理（複数DB操作）
- 認証チェック
- エラーハンドリング

## 8. 設計上の注意点

### 既存パターンに従うべき点

1. **日付管理はUTC基準**
   - `dailySpeakCount`リセットはUTC 0時基準
   - 日付比較は`toISOString().split('T')[0]`で統一

2. **トランザクション処理の徹底**
   - 複数テーブル更新は必ず`prisma.$transaction`を使用
   - 例: QuizResultの作成とPhraseの更新

3. **認証チェック必須**
   - すべてのAPIで`authenticateRequest()`を最初に実行
   - ユーザーIDによるデータアクセス制限

4. **セッション管理パターン**
   - `sessionSpoken`フラグによる重複練習防止
   - URLパラメータによる設定永続化
   - ページ離脱時の自動保存

5. **国際化対応**
   - ハードコードせず`useTranslation`を使用
   - エラーメッセージもi18n対応

6. **タイムゾーン対応**
   - Userテーブルに`timezone`カラムあり
   - ユーザーのタイムゾーンを考慮した日付計算が可能

7. **キャッシュ無効化**
   - セッション終了時に`refetchPhraseList()`を呼び出し
   - React Queryのキャッシュ管理

### 避けるべきアンチパターン

1. **ローカルタイムゾーンでの日付判定**
   - UTCで統一すること

2. **複数DB操作をトランザクションなしで実行**
   - データ不整合の原因

3. **クライアント側での一致度判定のみ**
   - セキュリティリスク
   - サーバー側でも検証必須

4. **既存のtotalSpeakCountを流用**
   - Practice独自のカウント（practiceCorrectCount）を追加

5. **設定変更時のマイグレーション不足**
   - schema.prisma変更後は必ずマイグレーション実行

6. **エラー時のユーザー体験無視**
   - `toast.error`で適切なフィードバック
   - ローディング状態の適切な管理

## まとめ

### 主要な発見

1. **音声認識機能は存在しない** → 新規実装が必要
2. Speak/Quizモードの実装パターンが非常に整っており、流用可能
3. DB設計は拡張性が高く、Practice用カラム追加は容易
4. 認証・セッション管理・国際化などの基盤は整備済み
5. ランキング機能の構造は明確で、Practice対応も容易

### 次のステップ

1. 技術設計書作成（音声認識・一致度判定の詳細設計）
2. DBマイグレーション計画
3. API設計（Practice用エンドポイント）
4. UI/UXモックアップ作成
5. 実装フェーズ分割（Phase 1: 基本機能、Phase 2: ランキング等）
