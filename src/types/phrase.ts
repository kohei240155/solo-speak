import { LanguageInfo } from "./common";
import { ApiSuccessResponse, CommonApiErrorResponse } from "./api";

export interface PhraseVariation {
	original: string;
	translation?: string;
	explanation?: string;
}

// 再エクスポート（後方互換性のため）
export type Language = LanguageInfo;

export interface SavedPhrase {
	id: string;
	original: string;
	translation: string;
	explanation?: string;
	createdAt: string;
	practiceCount: number;
	correctAnswers: number;
	language: {
		name: string;
		code: string;
	};
}

export const typeLabels = {
	common: "Common",
	business: "Business",
	casual: "Casual",
};

export type TabType = "List" | "Add" | "Speak" | "Quiz";

// === フレーズ生成API関連の型定義 ===

export interface GeneratePhraseRequestBody {
	nativeLanguage: string;
	learningLanguage: string;
	desiredPhrase: string;
	selectedContext?: string;
}

export interface GeneratePhraseResponseData {
	variations: PhraseVariation[];
}

// === フレーズAPI関連の型定義 ===

// フレーズ作成リクエストボディの型
export interface CreatePhraseRequestBody {
	languageCode: string;
	original: string;
	translation: string;
	explanation?: string;
	context?: string;
}

// フレーズ更新リクエストボディの型
export interface UpdatePhraseRequestBody {
	original: string;
	translation: string;
}

// フレーズレスポンスデータの型
export interface PhraseData {
	id: string;
	original: string;
	translation: string;
	explanation?: string;
	createdAt: string;
	practiceCount: number;
	correctAnswers: number;
	language: {
		name: string;
		code: string;
	};
}

// フレーズ作成/更新レスポンスの型
export interface CreatePhraseResponseData {
	success: true;
	phrase: PhraseData;
	totalPhraseCount: number;
}

// フレーズリスト取得のクエリパラメータ型
export interface PhrasesQueryParams {
	language?: string;
	limit?: string;
	page?: string;
}

// フレーズ詳細取得レスポンスの型
export interface GetPhraseResponseData {
	id: string;
	original: string;
	translation: string;
	totalSpeakCount: number;
	dailySpeakCount: number;
	language: {
		id: string;
		name: string;
		code: string;
	};
}

// フレーズ更新レスポンスの型
export interface UpdatePhraseResponseData {
	id: string;
	original: string;
	translation: string;
	createdAt: string;
	practiceCount: number;
	correctAnswers: number;
	language: {
		name: string;
		code: string;
	};
}

// フレーズ削除レスポンスの型
export interface DeletePhraseResponseData {
	message: string;
}

// フレーズ音読カウント更新レスポンスの型
export interface UpdatePhraseCountResponseData {
	success: true;
	phrase: {
		id: string;
		original: string;
		translation: string;
		totalSpeakCount: number;
		dailySpeakCount: number;
	};
}

// ページネーション情報の型
export interface PaginationData {
	total: number;
	limit: number;
	page: number;
	hasMore: boolean;
}

// フレーズリスト取得レスポンスの型
export interface PhrasesListResponseData {
	success: true;
	phrases: PhraseData[];
	pagination: PaginationData;
}

// フレーズAPI成功レスポンスの型
export type PhraseSuccessResponse =
	| ApiSuccessResponse<CreatePhraseResponseData>
	| ApiSuccessResponse<PhrasesListResponseData>
	| ApiSuccessResponse<PhraseData>;

// フレーズAPIエラーレスポンスの型
export type PhraseErrorResponse = CommonApiErrorResponse;

// フレーズAPIのレスポンス型（全体）
export type PhraseApiResponse = PhraseSuccessResponse | PhraseErrorResponse;

// フレーズカウント更新のレスポンス型（フロントエンド・バックエンド共通）
export interface PhraseCountResponse {
	success: true;
	phrase: {
		id: string;
		original: string;
		translation: string;
		totalSpeakCount: number;
		dailySpeakCount: number;
	};
}

// フレーズ取得のレスポンス型
export interface PhraseResponse {
	id: string;
	original: string;
	translation: string;
	explanation?: string;
	totalSpeakCount: number;
	dailySpeakCount: number;
	languageCode: string;
}

// Speak API レスポンス型
export interface SpeakPhraseResponse {
	success: boolean;
	phrase?: PhraseResponse;
	message?: string;
	allDone?: boolean;
}

// Speak用フレーズカウントレスポンス型
export interface SpeakPhraseCountResponse {
	success: boolean;
	count: number;
	message?: string;
}

// フレーズ詳細取得レスポンス型
export interface PhraseDetailResponse {
	id: string;
	original: string;
	translation: string;
	totalSpeakCount: number;
	dailySpeakCount: number;
	language: {
		id: string;
		name: string;
		code: string;
	};
}

// 残りのフレーズ生成回数レスポンス型
export interface RemainingGenerationsResponse {
	remainingGenerations: number;
}

// === ランダムフレーズ生成API関連の型定義 ===

// ランダム生成フレーズの型
export interface RandomPhraseVariation {
	original: string; // フレーズ本文（学習中の言語）
	translation: string; // 日本語訳
	explanation: string; // 説明（表現の解説含む）
}

// ランダムフレーズ生成リクエストボディの型
export interface RandomGeneratePhraseRequestBody {
	nativeLanguage: string;
	learningLanguage: string;
	selectedContext?: string | null;
}

// ランダムフレーズ生成レスポンスの型
export interface RandomGeneratePhraseResponseData {
	variations: RandomPhraseVariation[];
}
