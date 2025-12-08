// ダッシュボードAPI用の型定義
import { ApiSuccessResponse, CommonApiErrorResponse } from "./api";

// クエリパラメータの型
export interface DashboardQueryParams {
	language: string;
}

// フレーズレベル統計の型
export interface QuizMasteryLevel {
	level: string;
	score: number;
	color: string;
}

// Speechレベル統計の型
export interface SpeechLevelStatistic {
	status: string;
	count: number;
	color: string;
}

// ダッシュボードレスポンスデータの型
export interface DashboardData {
	totalPhraseCount: number;
	speakCountTotal: number;
	quizMastery: QuizMasteryLevel[];
	phraseStreak: number;
	speakStreak: number;
	quizStreak: number;
	speechReviewStreak: number;
	speechLevelStatistics: SpeechLevelStatistic[];
}

// ダッシュボードAPI成功レスポンスの型
export type DashboardSuccessResponse = ApiSuccessResponse<DashboardData>;

// ダッシュボードAPIエラーレスポンスの型
export type DashboardErrorResponse = CommonApiErrorResponse;

// ダッシュボードAPIのレスポンス型（全体）
export type DashboardApiResponse =
	| DashboardSuccessResponse
	| DashboardErrorResponse;
