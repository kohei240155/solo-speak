// Practice機能の型定義

// === API関連の型定義 ===

// GET /api/phrase/practice クエリパラメータ
export interface GetPracticePhrasesQuery {
	languageId: string;
	mode: PracticeMode;
}

// 練習モード
export type PracticeMode = "normal" | "review";

// 練習対象フレーズ
export interface PracticePhrase {
	id: string;
	original: string;
	translation: string;
	practiceCorrectCount: number;
	createdAt: string;
}

// GET /api/phrase/practice レスポンス
export interface GetPracticePhrasesResponse {
	success: true;
	phrases: PracticePhrase[];
	totalCount: number;
}

// POST /api/phrase/practice/answer リクエスト
export interface PostPracticeAnswerRequest {
	phraseId: string;
	transcript: string;
	mode: PracticeMode;
}

// 差分情報（ハイライト用）
export interface DiffResult {
	type: "equal" | "insert" | "delete";
	value: string;
}

// POST /api/phrase/practice/answer レスポンス
export interface PostPracticeAnswerResponse {
	success: true;
	correct: boolean;
	similarity: number;
	expectedText: string;
	diffResult: DiffResult[];
	newCorrectCount: number;
	isMastered: boolean;
}

// GET /api/ranking/practice クエリパラメータ
export interface GetPracticeRankingQuery {
	languageId: string;
	type: PracticeRankingType;
	period: PracticeRankingPeriod;
}

export type PracticeRankingType = "master" | "total";
export type PracticeRankingPeriod = "daily" | "total";

// ランキングエントリ
export interface PracticeRankingEntry {
	rank: number;
	userId: string;
	username: string;
	iconUrl: string | null;
	count: number;
	createdAt: string;
}

// GET /api/ranking/practice レスポンス
export interface GetPracticeRankingResponse {
	success: true;
	rankings: PracticeRankingEntry[];
	userRanking: {
		rank: number;
		count: number;
	} | null;
}

// === フック・コンポーネント関連の型定義 ===

// Practice設定（モーダルで選択）
export interface PracticeConfig {
	mode: PracticeMode;
	languageId: string;
	questionCount?: number; // 0 = 全て、未指定はデフォルト値
}

// Practiceセッションの状態
export interface PracticeSessionState {
	mode: PracticeMode;
	phrases: PracticePhrase[];
	currentIndex: number;
	isRecording: boolean;
	result: PracticeResultState | null;
	userAudioBlob: Blob | null;
}

// 練習結果の状態
export interface PracticeResultState {
	correct: boolean;
	similarity: number;
	transcript: string;
	diffResult: DiffResult[];
	newCorrectCount: number;
	isMastered: boolean;
}

// === ユーザー設定関連の型定義 ===

// フレーズモード（ユーザー設定）
export type PhraseMode = "speak" | "quiz" | "practice";

// Practice関連のユーザー設定
export interface PracticeUserSettings {
	phraseMode: PhraseMode;
	practiceIncludeExisting: boolean;
	practiceStartDate: string | null;
}

// === エラーコード ===

export type PracticeErrorCode =
	| "PHRASE_NOT_FOUND"
	| "ALREADY_PRACTICED_TODAY"
	| "VALIDATION_ERROR"
	| "UNAUTHORIZED";

// === 定数 ===

// マスター判定の閾値
export const PRACTICE_MASTERY_COUNT = 5;

// 1セッションあたりのデフォルト出題数
export const PRACTICE_DEFAULT_SESSION_SIZE = 5;

// 出題数の選択肢
export const PRACTICE_SESSION_SIZE_OPTIONS = [5, 10, 15, 0] as const; // 0 = 全て
export type PracticeSessionSize = (typeof PRACTICE_SESSION_SIZE_OPTIONS)[number];

// 正解判定の一致率閾値
export const PRACTICE_SIMILARITY_THRESHOLD = 0.9;
