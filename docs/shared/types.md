# 型定義パターン

## 概要

`src/types/` ディレクトリには、APIリクエスト/レスポンス、フロントエンド状態管理、DB操作で使用する型定義が含まれます。

## 型定義ファイル一覧

| ファイル | 内容 | 主な用途 |
|----------|------|----------|
| `api.ts` | APIレスポンス共通型 | 全APIエンドポイント |
| `phrase.ts` | フレーズ関連型 | フレーズCRUD、生成API |
| `speech.ts` | スピーチ関連型 | スピーチ添削機能 |
| `quiz.ts` | クイズ関連型 | クイズモード |
| `ranking.ts` | ランキング関連型 | ランキング表示 |
| `situation.ts` | シチュエーション関連型 | コンテキスト選択 |
| `dashboard.ts` | ダッシュボード型 | 統計表示 |
| `common.ts` | 言語共通基本型 | 言語選択全般 |
| `language.ts` | 言語API型 | 言語一覧取得 |
| `speak.ts` | Speak練習設定型 | 音読練習モード |
| `userSettings.ts` | ユーザー設定型 | 設定画面 |
| `user.ts` | ユーザー型 | ユーザー操作 |

---

## 共通型（api.ts）

全APIで使用する基本型。エラーハンドリングの統一に使用。

### 基本型

```typescript
// 基本レスポンス型
interface BaseApiResponse {
  success?: boolean;
}

// 成功レスポンス型
interface ApiSuccessResponse<T = unknown> extends BaseApiResponse {
  success: true;
  data?: T;
}

// エラーレスポンス型
interface ApiErrorResponse {
  error: string;
  details?: unknown;
}

// 成功/失敗のユニオン型
type ApiResult<T> = T | ApiErrorResponse;
```

### エラー型

```typescript
// バリデーションエラー詳細
interface ValidationErrorDetail {
  code: string;
  expected?: unknown;
  received?: unknown;
  path: (string | number)[];
  message: string;
}

// Zodバリデーションエラー
interface ZodErrorResponse extends ApiErrorResponse {
  error: "Invalid request parameters" | "Invalid request data";
  details: ValidationErrorDetail[];
}

// 認証エラー
interface AuthErrorResponse extends ApiErrorResponse {
  error: "Authorization header required" | "Invalid token";
}

// 内部サーバーエラー
interface InternalErrorResponse extends ApiErrorResponse {
  error: "Internal server error";
  details?: string;
}

// 404エラー
interface NotFoundErrorResponse extends ApiErrorResponse {
  error: string; // 'User not found', 'Phrase not found' etc.
}

// 一般的なエラーのユニオン型
type CommonApiErrorResponse =
  | AuthErrorResponse
  | ZodErrorResponse
  | InternalErrorResponse
  | NotFoundErrorResponse;
```

### HTTPステータスマッピング

```typescript
type ApiResponseWithStatus<T> = {
  200: ApiSuccessResponse<T>;
  201: ApiSuccessResponse<T>;
  400: ZodErrorResponse | ApiErrorResponse;
  401: AuthErrorResponse;
  404: NotFoundErrorResponse;
  500: InternalErrorResponse;
};
```

---

## リソース型

### phrase.ts

フレーズのCRUD操作、生成API、練習記録で使用。

#### データ型

```typescript
// フレーズバリエーション（生成結果）
interface PhraseVariation {
  original: string;
  explanation?: string;
}

// 保存済みフレーズ
interface SavedPhrase {
  id: string;
  original: string;
  translation: string;
  explanation?: string;
  createdAt: string;
  practiceCount: number;
  correctAnswers: number;
  language: { name: string; code: string; };
}

// フレーズデータ（一覧・詳細表示用）
interface PhraseData {
  id: string;
  original: string;
  translation: string;
  explanation?: string;
  createdAt: string;
  practiceCount: number;
  correctAnswers: number;
  language: { name: string; code: string; };
}

// タブ種別
type TabType = "List" | "Add" | "Speak" | "Quiz";
```

#### リクエスト型

```typescript
// フレーズ生成リクエスト
interface GeneratePhraseRequestBody {
  nativeLanguage: string;
  learningLanguage: string;
  desiredPhrase: string;
  selectedContext?: string;
}

// フレーズ作成リクエスト
interface CreatePhraseRequestBody {
  languageCode: string;
  original: string;
  translation: string;
  explanation?: string;
  context?: string;
}

// フレーズ更新リクエスト
interface UpdatePhraseRequestBody {
  original: string;
  translation: string;
}

// フレーズリストクエリパラメータ
interface PhrasesQueryParams {
  language?: string;
  limit?: string;
  page?: string;
}
```

#### レスポンス型

```typescript
// 生成レスポンス
interface GeneratePhraseResponseData {
  variations: PhraseVariation[];
}

// 作成レスポンス
interface CreatePhraseResponseData {
  success: true;
  phrase: PhraseData;
  totalPhraseCount: number;
}

// リストレスポンス
interface PhrasesListResponseData {
  success: true;
  phrases: PhraseData[];
  pagination: PaginationData;
}

// カウント更新レスポンス
interface PhraseCountResponse {
  success: true;
  phrase: {
    id: string;
    original: string;
    translation: string;
    totalSpeakCount: number;
    dailySpeakCount: number;
  };
}

// Speak APIレスポンス
interface SpeakPhraseResponse {
  success: boolean;
  phrase?: PhraseResponse;
  message?: string;
  allDone?: boolean;
}

// 残り生成回数レスポンス
interface RemainingGenerationsResponse {
  remainingGenerations: number;
}

// ランダムフレーズ生成リクエスト
interface RandomGeneratePhraseRequestBody {
  nativeLanguage: string;
  learningLanguage: string;
  selectedContext?: string | null;
}

// ランダムフレーズ生成レスポンス（既存のPhraseVariationを再利用）
interface RandomGeneratePhraseResponseData {
  variations: PhraseVariation[];
}
```

### speech.ts

スピーチ添削機能で使用。

#### データ型

```typescript
// 文データ
interface SentenceData {
  learningLanguage: string;
  nativeLanguage: string;
}

// フィードバックデータ
interface FeedbackData {
  category: string;
  content: string;
}

// スピーチステータス
interface SpeechStatus {
  id: string;
  name: string;
}

// スピーチリスト項目
interface SpeechListItem {
  id: string;
  title: string;
  firstPhrase: { original: string; };
  practiceCount: number;
  status: SpeechStatus;
  lastPracticedAt: string | null;
  createdAt: string;
}
```

#### リクエスト型

```typescript
// スピーチ保存リクエスト
interface SaveSpeechRequestBody {
  title: string;
  learningLanguageId: string;
  nativeLanguageId: string;
  firstSpeechText: string;
  notes?: string;
  speechPlans: string[];
  sentences: SentenceData[];
  feedback: FeedbackData[];
}

// スピーチ更新リクエスト
interface UpdateSpeechRequest {
  title: string;
  phrases: Array<{
    phraseId: string;
    original: string;
    translation: string;
  }>;
}

// ステータス更新リクエスト
interface UpdateSpeechStatusRequest {
  statusId: string;
}

// メモ更新リクエスト
interface UpdateSpeechNotesRequest {
  notes: string;
}
```

#### レスポンス型

```typescript
// 保存レスポンス
interface SaveSpeechResponseData {
  success: true;
  speech: { /* 詳細データ */ };
  phrases: Array<{ /* フレーズデータ */ }>;
  speechPlans: Array<{ /* プランデータ */ }>;
  feedbacks: Array<{ /* フィードバックデータ */ }>;
  totalSpeechCount: number;
}

// リストレスポンス
interface SpeechListResponseData {
  success: true;
  speeches: SpeechListItem[];
  pagination: PaginationData;
}

// レビューレスポンス
interface SpeechReviewResponseData {
  success: true;
  speech: { /* 詳細データ */ } | null;
}

// 残り回数レスポンス
interface RemainingSpeechCountResponse {
  remainingSpeechCount: number;
}
```

### quiz.ts

クイズモード機能で使用。

```typescript
// クイズ設定
interface QuizConfig {
  mode: "normal" | "random";
  language: string;
  questionCount?: number;
  speakCountFilter?: number | null;
  excludeTodayQuizzed?: boolean;
}

// クイズ用フレーズ
interface QuizPhrase {
  id: string;
  original: string;
  translation: string;
  languageCode: string;
  correctQuizCount: number;
  totalSpeakCount: number;
}

// クイズセッション
interface QuizSession {
  phrases: QuizPhrase[];
  currentIndex: number;
  totalCount: number;
  availablePhraseCount: number;
}

// クイズモード状態
interface QuizModeState {
  active: boolean;
  config: QuizConfig | null;
  session: QuizSession | null;
}

// 回答レスポンス
interface QuizAnswerResponse {
  success: true;
  phrase: {
    id: string;
    correctQuizCount: number;
    incorrectQuizCount: number;
  };
}
```

### ranking.ts

ランキング機能で使用。

```typescript
// クエリパラメータ
interface RankingQueryParams {
  language?: string;
  period?: "daily" | "weekly" | "monthly";
}

// ランキングユーザー
interface RankingUser {
  userId: string;
  username: string;
  iconUrl: string | null;
  count: number;
  rank: number;
}

// 統一ランキングユーザー（フロントエンド用）
interface UnifiedRankingUser {
  userId: string;
  username: string;
  iconUrl: string | null;
  totalCount: number;
  rank: number;
}

// 各種ランキングレスポンス
interface SpeakRankingResponseData { /* ... */ }
interface QuizRankingResponseData { /* ... */ }
interface PhraseRankingResponseData { /* ... */ }
interface DailyRankingResponseData { /* ... */ }
interface PhraseStreakRankingResponseData { /* ... */ }
interface SpeakStreakRankingResponseData { /* ... */ }
interface QuizStreakRankingResponseData { /* ... */ }
```

### situation.ts

シチュエーション（コンテキスト）選択で使用。

```typescript
// シチュエーション
interface Situation {
  id: string;
  userId: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date | null;
}

// 作成リクエスト
interface CreateSituationRequest {
  name: string;
}

// レスポンス
interface SituationResponse {
  id: string;
  name: string;
  createdAt: string;
  updatedAt: string;
}

// 一覧レスポンス
interface SituationsListResponse {
  situations: Array<{
    id: string;
    name: string;
    createdAt: string;
    updatedAt: string;
  }>;
}
```

### dashboard.ts

ダッシュボード統計表示で使用。

```typescript
// クエリパラメータ
interface DashboardQueryParams {
  language: string;
}

// クイズ習熟度レベル
interface QuizMasteryLevel {
  level: string;
  score: number;
  color: string;
}

// スピーチレベル統計
interface SpeechLevelStatistic {
  status: string;
  count: number;
  color: string;
}

// ダッシュボードデータ
interface DashboardData {
  totalPhraseCount: number;
  speakCountTotal: number;
  quizMastery: QuizMasteryLevel[];
  phraseStreak: number;
  speakStreak: number;
  quizStreak: number;
  speechReviewStreak: number;
  speechLevelStatistics: SpeechLevelStatistic[];
}

// レスポンス型
type DashboardSuccessResponse = ApiSuccessResponse<DashboardData>;
type DashboardErrorResponse = CommonApiErrorResponse;
type DashboardApiResponse = DashboardSuccessResponse | DashboardErrorResponse;
```

---

## 設定型

### common.ts

言語選択で使用する基本型。

```typescript
// 言語の基本型（最小限）
interface BaseLanguage {
  id: string;
  name: string;
  code: string;
}

// 完全な言語型（DB構造）
interface Language extends BaseLanguage {
  createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null;
}

// APIレスポンス用（フロントエンド）
interface LanguageInfo {
  id: string;
  name: string;
  code: string;
}
```

### language.ts

言語一覧APIで使用。

```typescript
// 言語一覧レスポンス
type LanguagesResponseData = Language[];
```

### speak.ts

音読練習モードで使用。

```typescript
// 練習設定
interface SpeakConfig {
  language: string;
  excludeIfSpeakCountGTE?: number; // 指定回数以上を除外
  excludeTodayPracticed?: boolean; // 今日練習済みを除外
}

// 練習用フレーズ
interface SpeakPhrase {
  id: string;
  original: string;
  translation: string;
  totalSpeakCount: number;
  dailySpeakCount: number;
  explanation?: string;
}

// 練習モード状態
interface SpeakModeState {
  active: boolean;
  config: SpeakConfig | null;
}
```

### userSettings.ts

ユーザー設定画面で使用。Zodバリデーション付き。

```typescript
import { z } from "zod";

// バリデーションスキーマ
const userSetupSchema = z.object({
  username: z.string().min(1, "Display Name is required"),
  iconUrl: z.string().optional(),
  nativeLanguageId: z.string().min(1, "Native Language is required"),
  defaultLearningLanguageId: z.string().min(1, "Default Learning Language is required"),
  email: z.string().email("Please enter a valid email address"),
});

type UserSetupFormData = z.infer<typeof userSetupSchema>;

// 設定レスポンス
interface UserSettingsResponse {
  iconUrl?: string | null;
  username?: string | null;
  nativeLanguageId?: string | null;
  defaultLearningLanguageId?: string | null;
  nativeLanguage?: { id: string; name: string; code: string } | null;
  defaultLearningLanguage?: { id: string; name: string; code: string } | null;
  email?: string | null;
}

// 更新リクエスト
interface UserSettingsUpdateRequest {
  username?: string;
  iconUrl?: string;
  nativeLanguageId?: string;
  defaultLearningLanguageId?: string;
  email?: string;
}

// 作成リクエスト
interface UserSettingsCreateRequest extends UserSettingsUpdateRequest {
  email: string;
}
```

### user.ts

ユーザー操作で使用。

```typescript
// 日次リセットレスポンス
interface UserDailyResetResponse {
  success: boolean;
  reset: boolean;
  message: string;
  count: number;
  lastDailySpeakCountResetDate: Date | null;
}
```

---

## 使用パターン

### APIルートでの使用

```typescript
// src/app/api/phrases/route.ts
import {
  CreatePhraseRequestBody,
  CreatePhraseResponseData,
  PhrasesListResponseData
} from "@/types/phrase";
import { ZodErrorResponse, AuthErrorResponse } from "@/types/api";

export async function POST(request: Request) {
  const body: CreatePhraseRequestBody = await request.json();
  // 処理...
  const response: CreatePhraseResponseData = { /* ... */ };
  return NextResponse.json(response);
}
```

### フロントエンドでの使用

```typescript
// コンポーネントでの使用
import { PhraseData, PhrasesListResponseData } from "@/types/phrase";

const [phrases, setPhrases] = useState<PhraseData[]>([]);

const fetchPhrases = async () => {
  const res = await fetch("/api/phrases");
  const data: PhrasesListResponseData = await res.json();
  if (data.success) {
    setPhrases(data.phrases);
  }
};
```

### 型ガードの使用

```typescript
import { ApiErrorResponse, ApiSuccessResponse } from "@/types/api";

function isErrorResponse(res: unknown): res is ApiErrorResponse {
  return typeof res === "object" && res !== null && "error" in res;
}

const response = await fetch("/api/phrases");
const data = await response.json();

if (isErrorResponse(data)) {
  console.error(data.error);
} else {
  // 成功処理
}
```

---

## インポート早見表

```typescript
// === 共通型 ===
import {
  ApiSuccessResponse,
  ApiErrorResponse,
  CommonApiErrorResponse,
  ZodErrorResponse,
  AuthErrorResponse
} from "@/types/api";

// === フレーズ ===
import {
  PhraseData,
  CreatePhraseRequestBody,
  PhrasesListResponseData,
  SpeakPhraseResponse
} from "@/types/phrase";

// === スピーチ ===
import {
  SaveSpeechRequestBody,
  SpeechListResponseData,
  SpeechReviewResponseData
} from "@/types/speech";

// === クイズ ===
import { QuizConfig, QuizSession, QuizModeState } from "@/types/quiz";

// === ランキング ===
import { RankingUser, UnifiedRankingUser } from "@/types/ranking";

// === 設定 ===
import { LanguageInfo, BaseLanguage } from "@/types/common";
import { SpeakConfig, SpeakModeState } from "@/types/speak";
import { UserSettingsResponse, userSetupSchema } from "@/types/userSettings";

// === ダッシュボード ===
import { DashboardData, DashboardApiResponse } from "@/types/dashboard";

// === シチュエーション ===
import { Situation, SituationsListResponse } from "@/types/situation";
```
