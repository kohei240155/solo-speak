# カスタムフック実装パターン

## ディレクトリ構造

```
src/hooks/
├── api/              # API関連
│   ├── useApi.ts           # APIユーティリティ関数
│   ├── useReactQueryApi.ts # React Queryフック群
│   └── index.ts            # 再エクスポート
├── phrase/           # フレーズ関連
│   ├── usePhraseList.ts    # フレーズリスト管理
│   └── usePhraseManager.ts # フレーズ生成・保存
├── practice/         # Practice（発話練習）関連
│   ├── usePracticeSession.ts  # セッション管理
│   ├── usePracticeAnswer.ts   # 回答送信
│   └── useSpeechRecognition.ts # 音声認識
├── speech/           # スピーチ関連
│   ├── useSpeechList.ts    # スピーチリスト管理
│   └── useSaveSpeech.ts    # スピーチ保存
└── ui/               # UI関連
    ├── useTranslation.ts   # 翻訳
    ├── useTextToSpeech.ts  # TTS再生
    └── useModalManager.ts  # モーダル管理
```

---

## API関連 (api/)

### useApi

**ファイル**: `src/hooks/api/useApi.ts`

APIユーティリティ関数（フックではなく非同期関数群）。

```typescript
import {
  deletePhrase,
  updatePhrase,
  resetSessionSpoken,
  getSpeakPhraseCount,
  isApiError,
  isApiSuccess,
} from "@/hooks/api/useApi";

// フレーズ削除
await deletePhrase(phraseId);

// フレーズ更新
await updatePhrase(phraseId, { translation: "新しい翻訳" });

// Speak用フレーズ数取得（型安全）
const result = await getSpeakPhraseCount(languageCode, {
  excludeIfSpeakCountGTE: 5,
  excludeTodayPracticed: true,
});

if (isApiSuccess(result)) {
  console.log(result.count);
} else if (isApiError(result)) {
  console.error(result.error);
}
```

**主要関数:**

| 関数 | 引数 | 戻り値 | 説明 |
|------|------|--------|------|
| `deletePhrase` | `phraseId: string` | `Promise<unknown>` | フレーズ削除 |
| `updatePhrase` | `phraseId, updates` | `Promise<unknown>` | フレーズ更新 |
| `resetSessionSpoken` | なし | `Promise<unknown>` | session_spokenリセット |
| `getSpeakPhraseCount` | `languageCode, options?` | `Promise<ApiResult>` | Speak用フレーズ数取得 |
| `isApiError<T>` | `response` | 型ガード | エラーチェック |
| `isApiSuccess<T>` | `response` | 型ガード | 成功チェック |

---

### useReactQueryApi（React Queryフック群）

**ファイル**: `src/hooks/api/useReactQueryApi.ts`

React Queryを使用したデータ取得フック。キャッシュ・自動再取得機能付き。

#### useLanguages

言語リストを取得（認証不要）。

```typescript
import { useLanguages } from "@/hooks/api/useReactQueryApi";

const { languages, isLoading, error, refetch } = useLanguages();
// languages: LanguageInfo[] | undefined
```

#### useUserSettings

ユーザー設定を取得。

```typescript
import { useUserSettings } from "@/hooks/api/useReactQueryApi";

const { userSettings, isLoading, error, refresh } = useUserSettings();
// userSettings: UserSettingsResponse | undefined
```

#### useDashboardData

ダッシュボードデータを取得。

```typescript
import { useDashboardData } from "@/hooks/api/useReactQueryApi";

const { dashboardData, isLoading, error, refetch } = useDashboardData(language);
// dashboardData: DashboardData | undefined
```

#### usePhrases

フレーズリストを取得（ページネーション）。

```typescript
import { usePhrases } from "@/hooks/api/useReactQueryApi";

const { phrases, hasMore, totalCount, isLoading, refetch } = usePhrases(language, page);
// phrases: Phrase[]
```

#### useInfinitePhrases

無限スクロール対応フレーズリスト。

```typescript
import { useInfinitePhrases } from "@/hooks/api/useReactQueryApi";

const {
  phrases,
  totalCount,
  hasMore,
  isLoading,
  isLoadingMore,
  setSize,
  refetch,
} = useInfinitePhrases(language);

// 追加読み込み
const loadMore = () => setSize((prev) => prev + 1);
```

#### useInfiniteSpeeches

無限スクロール対応スピーチリスト。

```typescript
import { useInfiniteSpeeches } from "@/hooks/api/useReactQueryApi";

const {
  speeches,
  totalCount,
  hasMore,
  isLoading,
  isLoadingMore,
  setSize,
  refetch,
} = useInfiniteSpeeches(language);
```

#### useSpeakPhrase / useSpeakPhraseById

Speakモード用フレーズを取得。

```typescript
import { useSpeakPhrase, useSpeakPhraseById } from "@/hooks/api/useReactQueryApi";

// ランダムフレーズ取得
const { phrase, isLoading, refetch } = useSpeakPhrase(language);

// 特定フレーズ取得
const { phrase, isLoading, refetch } = useSpeakPhraseById(phraseId);
```

#### useRanking

ランキングデータを取得。

```typescript
import { useRanking } from "@/hooks/api/useReactQueryApi";

const { rankingData, currentUser, isLoading, refetch } = useRanking(
  "phrase",           // type: "phrase" | "speak" | "quiz" | "speech"
  language,
  "weekly"            // period: "daily" | "weekly" | "total"
);
// rankingData: UnifiedRankingUser[]
// currentUser: UnifiedRankingUser | null
```

#### useRemainingGenerations / useRemainingSpeechCount

残り回数を取得。

```typescript
import { useRemainingGenerations, useRemainingSpeechCount } from "@/hooks/api/useReactQueryApi";

const { remainingGenerations, isLoading } = useRemainingGenerations();
const { remainingSpeechCount, isLoading } = useRemainingSpeechCount();
```

#### useSituations / useSituationDetail / useMutateSituation

シチュエーション管理。

```typescript
import { useSituations, useSituationDetail, useMutateSituation } from "@/hooks/api/useReactQueryApi";

// 一覧取得
const { situations, isLoading } = useSituations();

// 詳細取得
const { situation, isLoading } = useSituationDetail(situationId);

// 追加・削除
const { addSituation, deleteSituation, isAdding, isDeleting } = useMutateSituation();
await addSituation("新しいシチュエーション");
await deleteSituation(id);
```

---

## フレーズ関連 (phrase/)

### usePhraseList

**ファイル**: `src/hooks/phrase/usePhraseList.ts`

フレーズリスト管理フック。

```typescript
import { usePhraseList } from "@/hooks/phrase/usePhraseList";

const {
  learningLanguage,
  languages,
  savedPhrases,
  isLoadingPhrases,
  isLoadingMore,
  hasMorePhrases,
  nativeLanguage,
  handleLearningLanguageChange,
  loadMorePhrases,
  refreshPhrases,
} = usePhraseList();

// 言語変更
handleLearningLanguageChange("en");

// 追加読み込み
loadMorePhrases();

// リフレッシュ
refreshPhrases();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `learningLanguage` | `string \| undefined` | 学習言語コード |
| `languages` | `LanguageInfo[]` | 言語リスト |
| `savedPhrases` | `Phrase[]` | フレーズ一覧 |
| `isLoadingPhrases` | `boolean` | 初回ローディング中 |
| `isLoadingMore` | `boolean` | 追加ローディング中 |
| `hasMorePhrases` | `boolean` | 追加データあり |
| `nativeLanguage` | `string` | 母国語コード |
| `handleLearningLanguageChange` | `(lang: string) => void` | 言語変更ハンドラ |
| `loadMorePhrases` | `() => void` | 追加読み込み |
| `refreshPhrases` | `() => void` | リフレッシュ |

---

### usePhraseManager

**ファイル**: `src/hooks/phrase/usePhraseManager.ts`

フレーズ生成・保存・管理フック。フレーズ生成ページで使用。

```typescript
import { usePhraseManager } from "@/hooks/phrase/usePhraseManager";

const {
  // State
  desiredPhrase,
  generatedVariations,
  isLoading,
  error,
  remainingGenerations,
  languages,
  situations,
  isSaving,
  savingVariationIndex,
  editingVariations,
  selectedContext,

  // Handlers
  handlePhraseChange,
  handleGeneratePhrase,
  handleEditVariation,
  handleSelectVariation,
  handleLearningLanguageChange,
  handleContextChange,
  addSituation,
  deleteSituation,
  checkUnsavedChanges,
} = usePhraseManager();

// フレーズ入力
handlePhraseChange("こんにちは");

// フレーズ生成
await handleGeneratePhrase();

// バリエーション編集
handleEditVariation(0, "Hello there");

// バリエーション選択・保存
await handleSelectVariation(generatedVariations[0], 0);
```

**主要な戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `desiredPhrase` | `string` | 入力フレーズ |
| `generatedVariations` | `PhraseVariation[]` | 生成された3スタイル |
| `isLoading` | `boolean` | 生成中 |
| `isSaving` | `boolean` | 保存中 |
| `savingVariationIndex` | `number \| null` | 保存中のインデックス |
| `remainingGenerations` | `number` | 残り生成回数 |
| `situations` | `Situation[]` | シチュエーション一覧 |
| `handleGeneratePhrase` | `() => Promise<void>` | フレーズ生成 |
| `handleSelectVariation` | `(v, i) => Promise<void>` | バリエーション保存 |
| `randomMode` | `boolean` | ランダムモードの状態 |
| `randomGeneratedVariations` | `PhraseVariation[]` | ランダム生成されたフレーズ |
| `isRandomLoading` | `boolean` | ランダム生成中 |
| `isRandomSaving` | `boolean` | ランダムフレーズ保存中 |
| `handleToggleRandomMode` | `() => void` | ランダムモード切り替え |
| `handleRandomGenerate` | `() => Promise<void>` | ランダムフレーズ生成 |
| `handleSaveRandomPhrase` | `() => Promise<void>` | ランダムフレーズ保存 |

---

## スピーチ関連 (speech/)

### useSpeechList

**ファイル**: `src/hooks/speech/useSpeechList.ts`

スピーチリスト管理フック。

```typescript
import { useSpeechList } from "@/hooks/speech/useSpeechList";

const {
  learningLanguage,
  languages,
  savedSpeeches,
  isLoadingSpeeches,
  isLoadingMore,
  hasMoreSpeeches,
  nativeLanguage,
  handleLearningLanguageChange,
  loadMoreSpeeches,
  refreshSpeeches,
} = useSpeechList();
```

**戻り値:** `usePhraseList`と同様の構造。

---

### saveSpeech

**ファイル**: `src/hooks/speech/useSaveSpeech.ts`

スピーチ保存関数（フックではなく非同期関数）。

```typescript
import { saveSpeech } from "@/hooks/speech/useSaveSpeech";

const result = await saveSpeech(
  {
    title: "My Speech",
    speechPlan: ["Point 1", "Point 2"],
    yourSpeech: "This is my speech...",
    sentences: [...],
    feedback: [...],
    languageCode: "en",
  },
  audioBlob,      // オプション: Blob | null
  "audio/webm"    // オプション: MIMEタイプ
);

// result: { totalSpeechCount: number }
```

---

## UI関連 (ui/)

### useTranslation

**ファイル**: `src/hooks/ui/useTranslation.ts`

翻訳機能フック。

```typescript
import { useTranslation } from "@/hooks/ui/useTranslation";

const { t, locale, isLoading } = useTranslation();

// 基本使用
<p>{t("common.save")}</p>

// 変数埋め込み
<p>{t("phrase.remaining", { count: 5 })}</p>

// 配列取得
const items = t("onboarding.steps", { returnObjects: true }) as string[];
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `t` | `(key: string, options?) => string` | 翻訳関数 |
| `locale` | `string` | 現在のロケール |
| `isLoading` | `boolean` | 翻訳ファイル読み込み中 |

---

### useTextToSpeech

**ファイル**: `src/hooks/ui/useTextToSpeech.ts`

テキスト音声合成フック（音声キャッシュ機能付き）。

```typescript
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";

const { isPlaying, error, playText, stopAudio, clearCache } = useTextToSpeech({
  languageCode: "en",  // オプション
});

// 再生
await playText("Hello, world!");

// 停止
stopAudio();

// キャッシュクリア
clearCache();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `isPlaying` | `boolean` | 再生中かどうか |
| `error` | `string \| null` | エラーメッセージ |
| `playText` | `(text: string) => Promise<void>` | テキスト再生 |
| `stopAudio` | `() => void` | 再生停止 |
| `clearCache` | `() => void` | 音声キャッシュクリア |

---

### useModalManager

**ファイル**: `src/hooks/ui/useModalManager.ts`

Speak/Quizモーダル管理フック。URLクエリによるShallow routingを使用。

```typescript
import { useModalManager } from "@/hooks/ui/useModalManager";

const {
  showSpeakModal,
  showQuizModal,
  openSpeakModal,
  openQuizModal,
  closeSpeakModal,
  closeQuizModal,
  handleSpeakStartWithModal,
  handleQuizStartWithModal,
} = useModalManager({
  handleSpeakStart: async (config) => {
    // Speak開始処理
    return true; // 成功時
  },
});

// モーダル表示
openSpeakModal();
openQuizModal();

// 設定選択後に開始
await handleSpeakStartWithModal({ mode: "random", count: 10 });
await handleQuizStartWithModal({ mode: "weakest", count: 5 });
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `showSpeakModal` | `boolean` | Speakモーダル表示状態 |
| `showQuizModal` | `boolean` | Quizモーダル表示状態 |
| `openSpeakModal` | `() => void` | Speakモーダルを開く |
| `openQuizModal` | `() => void` | Quizモーダルを開く |
| `closeSpeakModal` | `() => void` | Speakモーダルを閉じる |
| `closeQuizModal` | `() => void` | Quizモーダルを閉じる |
| `handleSpeakStartWithModal` | `(config) => Promise<void>` | Speak開始 |
| `handleQuizStartWithModal` | `(config) => Promise<void>` | Quiz開始 |

---

## 基本テンプレート

**ファイル**: `src/hooks/[feature]/use[Feature].ts`

```typescript
import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";

interface UseFeatureReturn {
  data: DataType | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => void;
}

export const useFeature = (): UseFeatureReturn => {
  const { userSettings } = useAuth();
  const [data, setData] = useState<DataType | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/feature");
      const result = await response.json();
      setData(result);
    } catch (e) {
      setError("データの取得に失敗しました");
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return {
    data,
    isLoading,
    error,
    refetch: fetchData,
  };
};
```

---

## よく使うインポート

```typescript
// API関連
import { useLanguages, useInfinitePhrases, useInfiniteSpeeches } from "@/hooks/api";
import { deletePhrase, updatePhrase, isApiError } from "@/hooks/api/useApi";

// フレーズ
import { usePhraseList } from "@/hooks/phrase/usePhraseList";
import { usePhraseManager } from "@/hooks/phrase/usePhraseManager";

// スピーチ
import { useSpeechList } from "@/hooks/speech/useSpeechList";
import { saveSpeech } from "@/hooks/speech/useSaveSpeech";

// Practice
import { usePracticeSession } from "@/hooks/practice/usePracticeSession";
import { usePracticeAnswer } from "@/hooks/practice/usePracticeAnswer";
import { useSpeechRecognition } from "@/hooks/practice/useSpeechRecognition";

// UI
import { useTranslation } from "@/hooks/ui/useTranslation";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import { useModalManager } from "@/hooks/ui/useModalManager";

// 認証
import { useAuth } from "@/contexts/AuthContext";
```

---

## クイズ関連 (quiz/)

### useQuizPhrase

**ファイル**: `src/hooks/quiz/useQuizPhrase.ts`

クイズセッション管理フック。

```typescript
import { useQuizPhrase } from "@/hooks/quiz/useQuizPhrase";

const {
  session,
  currentPhrase,
  isLoadingPhrase,
  showTranslation,
  fetchQuizSession,
  handleShowTranslation,
  handleHideTranslation,
  handleAnswer,
  handleNext,
  handleSpeakCount,
  resetQuiz,
} = useQuizPhrase();

// クイズ開始
const success = await fetchQuizSession({
  language: "en",
  mode: "random",      // "random" | "weakest"
  questionCount: 10,
  speakCountFilter: 3,
  excludeTodayQuizzed: true,
});

// 翻訳表示/非表示
handleShowTranslation();
handleHideTranslation();

// 回答送信
await handleAnswer(true);  // 正解/不正解

// 次の問題
handleNext();

// 音読回数加算
await handleSpeakCount(phraseId, 1);

// リセット
resetQuiz();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `session` | `QuizSession \| null` | セッション情報 |
| `currentPhrase` | `QuizPhrase \| null` | 現在のフレーズ |
| `isLoadingPhrase` | `boolean` | ローディング中 |
| `showTranslation` | `boolean` | 翻訳表示状態 |
| `fetchQuizSession` | `(config) => Promise<boolean>` | セッション開始 |
| `handleAnswer` | `(isCorrect) => Promise<void>` | 回答送信 |
| `handleNext` | `() => void` | 次の問題へ |
| `resetQuiz` | `() => void` | リセット |

---

## スピーキング関連 (speak/)

### useSpeakSession

**ファイル**: `src/hooks/speak/useSpeakSession.ts`

スピーキング練習セッション管理フック。URLクエリ連携・日付変更検知機能付き。

```typescript
import { useSpeakSession } from "@/hooks/speak/useSpeakSession";

const {
  // セッション状態
  sessionState,

  // フレーズデータ
  currentPhrase,
  isLoadingPhrase,
  todayCount,
  totalCount,
  pendingCount,
  isCountDisabled,

  // 操作関数
  handleStart,
  handleCount,
  handleNext,
  handleFinish,
  resetSession,
} = useSpeakSession(learningLanguage);

// 練習開始
const success = await handleStart({
  language: "en",
  excludeIfSpeakCountGTE: 5,
  excludeTodayPracticed: true,
});

// カウント加算（ローカル + 遅延送信）
handleCount();

// 次のフレーズ（pendingCount送信後に取得）
const result = await handleNext(config);
if (result === "allDone") {
  // 練習完了
}

// 練習終了（pendingCount送信 + リセット）
await handleFinish();

// セッションリセット（URLクリア）
resetSession();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `sessionState` | `{ active: boolean; config: SpeakConfig \| null }` | セッション状態 |
| `currentPhrase` | `SpeakPhrase \| null` | 現在のフレーズ |
| `isLoadingPhrase` | `boolean` | ローディング中 |
| `todayCount` | `number` | 今日の音読回数 |
| `totalCount` | `number` | 総音読回数 |
| `pendingCount` | `number` | 未送信カウント |
| `isCountDisabled` | `boolean` | カウント無効（100回制限） |
| `handleStart` | `(config) => Promise<boolean>` | 練習開始 |
| `handleCount` | `() => Promise<void>` | カウント加算 |
| `handleNext` | `(config) => Promise<boolean \| "allDone">` | 次のフレーズ |
| `handleFinish` | `() => Promise<void>` | 練習終了 |
| `resetSession` | `() => void` | セッションリセット |

---

## Practice関連 (practice/)

### usePracticeSession

**ファイル**: `src/hooks/practice/usePracticeSession.ts`

Practiceセッション管理フック。フレーズ取得、進捗管理、統計記録機能を提供。

```typescript
import { usePracticeSession } from "@/hooks/practice/usePracticeSession";

const {
  // セッション状態
  sessionState,
  phrases,
  currentIndex,
  currentPhrase,
  totalCount,
  isLoading,
  error,

  // 操作関数
  startSession,
  goToNext,
  handleSkip,
  handleFinish,
  resetSession,
} = usePracticeSession();

// セッション開始
const success = await startSession({
  mode: "normal",        // "normal" | "review"
  languageId: "en",
  questionCount: 5,      // 0 = 全て
});

// 次のフレーズへ
goToNext();

// スキップ
handleSkip();

// 練習終了
handleFinish();

// セッションリセット
resetSession();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `sessionState` | `PracticeSessionState \| null` | セッション状態 |
| `phrases` | `PracticePhrase[]` | フレーズ一覧 |
| `currentIndex` | `number` | 現在のインデックス |
| `currentPhrase` | `PracticePhrase \| null` | 現在のフレーズ |
| `totalCount` | `number` | 総フレーズ数 |
| `isLoading` | `boolean` | ローディング中 |
| `error` | `string \| null` | エラーメッセージ |
| `startSession` | `(config) => Promise<boolean>` | セッション開始 |
| `goToNext` | `() => void` | 次のフレーズへ |
| `handleSkip` | `() => void` | スキップ |
| `handleFinish` | `() => void` | 練習終了 |
| `resetSession` | `() => void` | セッションリセット |

---

### usePracticeAnswer

**ファイル**: `src/hooks/practice/usePracticeAnswer.ts`

Practice回答送信フック。類似度判定、差分計算、結果取得機能を提供。

```typescript
import { usePracticeAnswer } from "@/hooks/practice/usePracticeAnswer";

const {
  result,
  isSubmitting,
  error,
  submitAnswer,
  clearResult,
} = usePracticeAnswer();

// 回答送信
const response = await submitAnswer({
  phraseId: "phrase-123",
  transcript: "Hello world",
  mode: "normal",
});

// response: PostPracticeAnswerResponse
// {
//   success: true,
//   correct: true,
//   similarity: 0.95,
//   expectedText: "Hello, world!",
//   diffResult: [{ type: "equal", value: "Hello" }, ...],
//   newCorrectCount: 3,
//   isMastered: false,
// }

// 結果クリア
clearResult();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `result` | `PostPracticeAnswerResponse \| null` | 回答結果 |
| `isSubmitting` | `boolean` | 送信中 |
| `error` | `string \| null` | エラーメッセージ |
| `submitAnswer` | `(req) => Promise<Response>` | 回答送信 |
| `clearResult` | `() => void` | 結果クリア |

---

### useSpeechRecognition

**ファイル**: `src/hooks/practice/useSpeechRecognition.ts`

音声認識フック。Web Speech APIを使用した音声認識と録音機能を提供。

```typescript
import { useSpeechRecognition } from "@/hooks/practice/useSpeechRecognition";

const {
  isRecording,
  transcript,
  error,
  isSupported,
  startRecording,
  stopRecording,
  resetTranscript,
} = useSpeechRecognition({
  language: "en-US",  // BCP-47言語コード
  continuous: true,   // 継続認識
  interimResults: true, // 中間結果
});

// 録音開始
startRecording();

// 録音停止（認識テキストを返す）
const recognizedText = stopRecording();

// トランスクリプトリセット
resetTranscript();

// ブラウザサポート確認
if (!isSupported) {
  console.log("音声認識はサポートされていません");
}
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `isRecording` | `boolean` | 録音中かどうか |
| `transcript` | `string` | 認識テキスト |
| `error` | `string \| null` | エラーメッセージ |
| `isSupported` | `boolean` | ブラウザサポート |
| `startRecording` | `() => void` | 録音開始 |
| `stopRecording` | `() => string` | 録音停止（テキスト返却） |
| `resetTranscript` | `() => void` | トランスクリプトリセット |

**注意事項:**
- Web Speech APIはChrome、Safari、Edgeでサポート
- HTTPSが必要（localhostは例外）
- マイクへのアクセス許可が必要

---

## 認証 (contexts/)

### useAuth

**ファイル**: `src/contexts/AuthContext.tsx`

認証状態とユーザー設定管理。

```typescript
import { useAuth } from "@/contexts/AuthContext";

const {
  user,
  userSettings,
  userSettingsLoading,
  refreshUserSettings,
  signOut,
} = useAuth();

// ユーザー情報
console.log(user?.id, user?.email);

// ユーザー設定
console.log(userSettings?.nativeLanguage?.code);
console.log(userSettings?.defaultLearningLanguage?.code);

// 設定リフレッシュ
await refreshUserSettings();

// サインアウト
await signOut();
```

**戻り値:**

| プロパティ | 型 | 説明 |
|-----------|-----|------|
| `user` | `User \| null` | Supabase User |
| `userSettings` | `UserSettingsResponse \| null` | ユーザー設定 |
| `userSettingsLoading` | `boolean` | 設定ローディング中 |
| `refreshUserSettings` | `() => Promise<void>` | 設定再取得 |
| `signOut` | `() => Promise<void>` | サインアウト |

---

## 関連ファイル

| ファイル | 説明 |
|----------|------|
| `src/hooks/api/useApi.ts` | APIユーティリティ関数 |
| `src/hooks/api/useReactQueryApi.ts` | React Queryフック群 |
| `src/hooks/phrase/` | フレーズ関連フック |
| `src/hooks/practice/` | Practice（発話練習）関連フック |
| `src/hooks/speech/` | スピーチ関連フック |
| `src/hooks/quiz/` | クイズ関連フック |
| `src/hooks/speak/` | スピーキング関連フック |
| `src/hooks/ui/` | UI関連フック |
| `src/contexts/AuthContext.tsx` | 認証コンテキスト |
