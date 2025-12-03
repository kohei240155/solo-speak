import {
	useQuery,
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from "@tanstack/react-query";
import { api } from "@/utils/api";
import {
	RemainingGenerationsResponse,
	PhrasesListResponseData,
	PhraseDetailResponse,
	SpeakPhraseResponse,
	UpdatePhraseCountResponseData,
} from "@/types/phrase";
import { SituationsListResponse, SituationResponse } from "@/types/situation";
import { DashboardData } from "@/types/dashboard";
import { LanguageInfo } from "@/types/common";
import {
	SpeakRankingResponseData,
	QuizRankingResponseData,
	PhraseRankingResponseData,
	UnifiedRankingUser,
	PhraseStreakRankingResponseData,
	SpeakStreakRankingResponseData,
	QuizStreakRankingResponseData,
} from "@/types/ranking";
import { UserSettingsResponse } from "@/types/userSettings";
import {
	RemainingSpeechCountResponse,
	SpeechListResponseData,
} from "@/types/speech";
import { useAuth } from "@/contexts/AuthContext";

// React Query用の統一fetcher関数
const fetcher = async <T = unknown>(
	url: string,
	options?: { showErrorToast?: boolean; useAuth?: boolean },
): Promise<T> => {
	return await api.get<T>(url, options || {});
};

// クエリキーを定義
export const queryKeys = {
	userSettings: (userId: string | null) => ["userSettings", userId] as const,
	languages: () => ["languages"] as const,
	dashboard: (userId: string, language: string) =>
		["dashboard", userId, language] as const,
	phrases: (userId: string, language: string, page: number) =>
		["phrases", userId, language, page] as const,
	infinitePhrases: (userId: string, language: string) =>
		["infinitePhrases", userId, language] as const,
	infiniteSpeeches: (userId: string, language: string) =>
		["infiniteSpeeches", userId, language] as const,
	phrase: (userId: string, phraseId: string) =>
		["phrase", userId, phraseId] as const,
	speakPhrase: (userId: string, language: string) =>
		["speakPhrase", userId, language] as const,
	speakPhraseById: (userId: string, phraseId: string) =>
		["speakPhraseById", userId, phraseId] as const,
	ranking: (userId: string, type: string, language: string, period?: string) =>
		period
			? (["ranking", userId, type, language, period] as const)
			: (["ranking", userId, type, language] as const),
	remainingGenerations: (userId: string) =>
		["remainingGenerations", userId] as const,
	remainingSpeechCount: (userId: string) =>
		["remainingSpeechCount", userId] as const,
	situations: (userId: string) => ["situations", userId] as const,
	situation: (userId: string, situationId: string) =>
		["situation", userId, situationId] as const,
	phraseStreakRanking: (userId: string, language: string) =>
		["phraseStreakRanking", userId, language] as const,
	speakStreakRanking: (userId: string, language: string) =>
		["speakStreakRanking", userId, language] as const,
	quizStreakRanking: (userId: string, language: string) =>
		["quizStreakRanking", userId, language] as const,
	speechStreakRanking: (userId: string, language: string) =>
		["speechStreakRanking", userId, language] as const,
	speechAddRanking: (userId: string, language: string) =>
		["speechAddRanking", userId, language] as const,
	speechAddStreakRanking: (userId: string, language: string) =>
		["speechAddStreakRanking", userId, language] as const,
	speechReviewRanking: (userId: string, language: string, period: string) =>
		["speechReviewRanking", userId, language, period] as const,
	speechReviewStreakRanking: (userId: string, language: string) =>
		["speechReviewStreakRanking", userId, language] as const,
};

// ユーザー設定を取得するフック
export function useUserSettingsData(userId: string | null) {
	const { data, error, isLoading, refetch } = useQuery({
		queryKey: queryKeys.userSettings(userId),
		queryFn: async () => {
			return await fetcher<UserSettingsResponse>("/api/user/settings", {
				showErrorToast: false,
			});
		},
		enabled: !!userId,
		staleTime: 5 * 60 * 1000, // 5分
		gcTime: 10 * 60 * 1000, // 10分
		retry: 2,
		retryDelay: 3000,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return {
		userSettings: data,
		isLoading,
		error,
		refresh: refetch,
	};
}

// ユーザー設定を取得するフック（軽量版 - AuthContextのデータを参照）
export function useUserSettings() {
	const { userSettings, userSettingsLoading, refreshUserSettings } = useAuth();

	return {
		userSettings: userSettings,
		isLoading: userSettingsLoading,
		error: null,
		refetch: refreshUserSettings,
	};
}

// 言語リストを取得するフック（認証不要）
export function useLanguages() {
	const { data, error, isLoading, refetch } = useQuery({
		queryKey: queryKeys.languages(),
		queryFn: async () =>
			fetcher<LanguageInfo[]>("/api/languages", { useAuth: false }),
		staleTime: 30 * 60 * 1000, // 30分
		gcTime: 60 * 60 * 1000, // 60分
	});

	return {
		languages: data,
		isLoading,
		error,
		refetch,
	};
}

// ダッシュボードデータを取得するフック
export function useDashboardData(language?: string) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language ? queryKeys.dashboard(user.id, language) : [],
		queryFn: async () =>
			fetcher<DashboardData>(`/api/dashboard?language=${language}`),
		enabled: !!user?.id && !!language,
		staleTime: 5 * 60 * 1000, // 5分
		refetchInterval: 5 * 60 * 1000, // 5分間隔で自動更新
	});

	return {
		dashboardData: data,
		isLoading,
		error,
		refetch,
	};
}

// フレーズリストを取得するフック
export function usePhrases(language?: string, page = 1) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language ? queryKeys.phrases(user.id, language, page) : [],
		queryFn: async () =>
			fetcher<PhrasesListResponseData>(
				`/api/phrase?languageCode=${language}&page=${page}&limit=10&minimal=true`,
			),
		enabled: !!user?.id && !!language,
		staleTime: 2 * 60 * 1000, // 2分
	});

	return {
		phrases: data?.phrases,
		hasMore: data?.pagination?.hasMore,
		totalCount: data?.pagination?.total,
		isLoading,
		error,
		refetch,
	};
}

// 特定のフレーズを取得するフック
export function usePhrase(phraseId?: string) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey: user?.id && phraseId ? queryKeys.phrase(user.id, phraseId) : [],
		queryFn: async () =>
			fetcher<PhraseDetailResponse>(`/api/phrase/${phraseId}`),
		enabled: !!user?.id && !!phraseId,
		staleTime: 10 * 60 * 1000, // 10分
	});

	return {
		phrase: data,
		isLoading,
		error,
		refetch,
	};
}

// Speakモード用のフレーズを取得するフック
export function useSpeakPhrase(language?: string) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language ? queryKeys.speakPhrase(user.id, language) : [],
		queryFn: async () =>
			fetcher<SpeakPhraseResponse>(`/api/phrase/speak?language=${language}`),
		enabled: !!user?.id && !!language,
		staleTime: 0, // キャッシュしない（毎回新しいランダムなフレーズを取得）
		gcTime: 0,
		refetchOnWindowFocus: false,
		refetchOnReconnect: false,
	});

	return {
		data: data,
		phrase: data?.phrase,
		isLoading,
		error,
		refetch,
	};
}

// 特定のフレーズのSpeakデータを取得するフック
export function useSpeakPhraseById(phraseId?: string) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && phraseId ? queryKeys.speakPhraseById(user.id, phraseId) : [],
		queryFn: async () =>
			fetcher<UpdatePhraseCountResponseData>(`/api/phrase/${phraseId}/speak`),
		enabled: !!user?.id && !!phraseId,
		staleTime: 5 * 60 * 1000, // 5分
		refetchInterval: 5 * 60 * 1000, // 5分間隔で自動更新
	});

	return {
		data: data,
		phrase: data?.phrase,
		isLoading,
		error,
		refetch,
	};
}

// 無限スクロール対応のフレーズリストを取得するフック
export function useInfinitePhrases(language?: string) {
	const { user } = useAuth();

	const {
		data,
		error,
		isLoading,
		isFetchingNextPage,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery({
		queryKey:
			user?.id && language ? queryKeys.infinitePhrases(user.id, language) : [],
		queryFn: async ({ pageParam = 1 }) => {
			return await fetcher<PhrasesListResponseData>(
				`/api/phrase?languageCode=${language}&page=${pageParam}&limit=10&minimal=true`,
			);
		},
		getNextPageParam: (lastPage) => {
			return lastPage.pagination?.hasMore
				? (lastPage.pagination.page || 0) + 1
				: undefined;
		},
		initialPageParam: 1,
		enabled: !!user?.id && !!language,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// 全ページのフレーズを平坦化
	const phrases = data ? data.pages.flatMap((page) => page.phrases || []) : [];
	const totalCount = data?.pages[0]?.pagination?.total || 0;

	return {
		phrases,
		totalCount,
		hasMore: hasNextPage,
		isLoading,
		isLoadingMore: isFetchingNextPage,
		error,
		size: data?.pages.length || 0,
		setSize: fetchNextPage, // React QueryではfetchNextPageを使用
		refetch,
	};
}

// 無限スクロール対応のスピーチリストを取得するフック
export function useInfiniteSpeeches(language?: string) {
	const { user } = useAuth();

	const {
		data,
		error,
		isLoading,
		isFetchingNextPage,
		fetchNextPage,
		hasNextPage,
		refetch,
	} = useInfiniteQuery({
		queryKey:
			user?.id && language ? queryKeys.infiniteSpeeches(user.id, language) : [],
		queryFn: async ({ pageParam = 1 }) => {
			return await fetcher<SpeechListResponseData>(
				`/api/speech?languageCode=${language}&page=${pageParam}&limit=10`,
			);
		},
		getNextPageParam: (lastPage) => {
			return lastPage.pagination?.hasMore
				? (lastPage.pagination.page || 0) + 1
				: undefined;
		},
		initialPageParam: 1,
		enabled: !!user?.id && !!language,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// 全ページのスピーチを平坦化
	const speeches = data
		? data.pages.flatMap((page) => page.speeches || [])
		: [];
	const totalCount = data?.pages[0]?.pagination?.total || 0;

	return {
		speeches,
		totalCount,
		hasMore: hasNextPage,
		isLoading,
		isLoadingMore: isFetchingNextPage,
		error,
		size: data?.pages.length || 0,
		setSize: fetchNextPage,
		refetch,
	};
}

// ランキングデータを取得するフック
export function useRanking(
	type?: "phrase" | "speak" | "quiz" | "speech",
	language?: string,
	period?: "daily" | "weekly" | "total",
) {
	const { user } = useAuth();

	// エンドポイントを構築
	let url: string | null = null;
	if (type && language) {
		if (type === "phrase" || type === "speech") {
			url = `/api/ranking/${type}?language=${language}`;
		} else if (type === "speak" || type === "quiz") {
			const validPeriod = period || "daily";
			url = `/api/ranking/${type}?language=${language}&period=${validPeriod}`;
		}
	}

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && type && language
				? queryKeys.ranking(user.id, type, language, period)
				: [],
		queryFn: async () =>
			fetcher<
				| SpeakRankingResponseData
				| QuizRankingResponseData
				| PhraseRankingResponseData
			>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success) {
		if ("topUsers" in data) {
			transformedData = data.topUsers.map((user) => ({
				userId: user.userId,
				username: user.username,
				iconUrl: user.iconUrl,
				totalCount: user.count,
				rank: user.rank,
			}));
		} else if ("rankings" in data) {
			transformedData = data.rankings.map((user) => ({
				userId: user.userId,
				username: user.username,
				iconUrl: user.iconUrl || null,
				totalCount:
					"totalCorrect" in user
						? user.totalCorrect
						: "totalPhrases" in user
							? user.totalPhrases
							: 0,
				rank: user.rank,
			}));
		}
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data && "currentUser" in data && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.count,
			rank: data.currentUser.rank,
		};
	} else if (data && "userRank" in data && data.userRank) {
		currentUser = {
			userId: data.userRank.userId,
			username: data.userRank.username,
			iconUrl: data.userRank.iconUrl || null,
			totalCount:
				"totalCorrect" in data.userRank
					? data.userRank.totalCorrect
					: "totalPhrases" in data.userRank
						? data.userRank.totalPhrases
						: 0,
			rank: data.userRank.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: data && "message" in data ? data.message : undefined,
		refetch,
	};
}

// 残り生成回数を取得するフック
export function useRemainingGenerations() {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey: user?.id ? queryKeys.remainingGenerations(user.id) : [],
		queryFn: async () =>
			fetcher<RemainingGenerationsResponse>("/api/phrase/remaining", {
				showErrorToast: false,
			}),
		enabled: !!user?.id,
		staleTime: 10 * 60 * 1000, // 10分
	});

	return {
		remainingGenerations: data?.remainingGenerations || 0,
		isLoading,
		error,
		refetch,
	};
}

// 残りスピーチ回数を取得するフック
export function useRemainingSpeechCount() {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey: user?.id ? queryKeys.remainingSpeechCount(user.id) : [],
		queryFn: async () =>
			fetcher<RemainingSpeechCountResponse>("/api/speech/remaining", {
				showErrorToast: false,
			}),
		enabled: !!user?.id,
		staleTime: 0, // キャッシュしない（毎回最新の残回数を取得）
		gcTime: 0, // ガベージコレクション時間も0に設定
		refetchOnWindowFocus: true, // ウィンドウフォーカス時に再取得
		refetchOnReconnect: true, // 再接続時に再取得
	});

	return {
		remainingSpeechCount: data?.remainingSpeechCount || 0,
		isLoading,
		error,
		refetch,
	};
}

// フレーズStreakランキングを取得するフック
export function usePhraseStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language
		? `/api/ranking/phrase/streak?language=${language}`
		: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.phraseStreakRanking(user.id, language)
				: [],
		queryFn: async () => fetcher<PhraseStreakRankingResponseData>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeakStreakランキングを取得するフック
export function useSpeakStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language
		? `/api/ranking/speak/streak?language=${language}`
		: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.speakStreakRanking(user.id, language)
				: [],
		queryFn: async () => fetcher<SpeakStreakRankingResponseData>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// QuizStreakランキングを取得するフック
export function useQuizStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language ? `/api/ranking/quiz/streak?language=${language}` : null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.quizStreakRanking(user.id, language)
				: [],
		queryFn: async () => fetcher<QuizStreakRankingResponseData>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeechStreakランキングを取得するフック
export function useSpeechStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language
		? `/api/ranking/speech/streak?language=${language}`
		: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.speechStreakRanking(user.id, language)
				: [],
		queryFn: async () => fetcher<QuizStreakRankingResponseData>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeechAdd (登録数) ランキングを取得するフック
export function useSpeechAddRanking(language?: string) {
	const { user } = useAuth();

	const url = language ? `/api/ranking/speech/add?language=${language}` : null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language ? queryKeys.speechAddRanking(user.id, language) : [],
		queryFn: async () =>
			fetcher<{
				success: boolean;
				topUsers: Array<{
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					count: number;
				}>;
				currentUser: {
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					count: number;
				} | null;
			}>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.count,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.count,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeechAddStreak (登録連続日数) ランキングを取得するフック
export function useSpeechAddStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language
		? `/api/ranking/speech/add/streak?language=${language}`
		: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.speechAddStreakRanking(user.id, language)
				: [],
		queryFn: async () =>
			fetcher<{
				success: boolean;
				topUsers: Array<{
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					streakDays: number;
				}>;
				currentUser: {
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					streakDays: number;
				} | null;
			}>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeechReview (練習回数) ランキングを取得するフック
export function useSpeechReviewRanking(language?: string, period?: string) {
	const { user } = useAuth();

	const url =
		language && period
			? `/api/ranking/speech?language=${language}&period=${period}`
			: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language && period
				? queryKeys.speechReviewRanking(user.id, language, period)
				: [],
		queryFn: async () =>
			fetcher<{
				success: boolean;
				topUsers: Array<{
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					count: number;
				}>;
				currentUser: {
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					count: number;
				} | null;
			}>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.count,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.count,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// SpeechReviewStreak (練習連続日数) ランキングを取得するフック
export function useSpeechReviewStreakRanking(language?: string) {
	const { user } = useAuth();

	const url = language
		? `/api/ranking/speech/streak?language=${language}`
		: null;

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && language
				? queryKeys.speechReviewStreakRanking(user.id, language)
				: [],
		queryFn: async () =>
			fetcher<{
				success: boolean;
				topUsers: Array<{
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					streakDays: number;
				}>;
				currentUser: {
					rank: number;
					userId: string;
					username: string;
					iconUrl: string | null;
					streakDays: number;
				} | null;
			}>(url!),
		enabled: !!user?.id && !!url,
		staleTime: 2 * 60 * 1000, // 2分
	});

	// データを統一形式に変換
	let transformedData: UnifiedRankingUser[] = [];

	if (data?.success && data.topUsers) {
		transformedData = data.topUsers.map((user) => ({
			userId: user.userId,
			username: user.username,
			iconUrl: user.iconUrl,
			totalCount: user.streakDays,
			rank: user.rank,
		}));
	}

	// currentUserも統一形式に変換
	let currentUser: UnifiedRankingUser | null = null;

	if (data?.success && data.currentUser) {
		currentUser = {
			userId: data.currentUser.userId,
			username: data.currentUser.username,
			iconUrl: data.currentUser.iconUrl,
			totalCount: data.currentUser.streakDays,
			rank: data.currentUser.rank,
		};
	}

	return {
		rankingData: transformedData,
		currentUser,
		isLoading,
		error,
		message: undefined,
		refetch,
	};
}

// シチュエーション一覧を取得するフック
export function useSituations() {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey: user?.id ? queryKeys.situations(user.id) : [],
		queryFn: async () =>
			fetcher<SituationsListResponse>("/api/situations", {
				showErrorToast: false,
			}),
		enabled: !!user?.id,
		staleTime: 5 * 60 * 1000, // 5分
		gcTime: 10 * 60 * 1000, // 10分
	});

	return {
		situations: data?.situations || [],
		isLoading,
		error,
		refetch,
	};
}

// 特定のシチュエーションを取得するフック
export function useSituationDetail(situationId?: string) {
	const { user } = useAuth();

	const { data, error, isLoading, refetch } = useQuery({
		queryKey:
			user?.id && situationId ? queryKeys.situation(user.id, situationId) : [],
		queryFn: async () =>
			fetcher<{ situation: SituationResponse }>(
				`/api/situations/${situationId}`,
			),
		enabled: !!user?.id && !!situationId,
		staleTime: 5 * 60 * 1000, // 5分
	});

	return {
		situation: data?.situation,
		isLoading,
		error,
		refetch,
	};
}

// シチュエーションのミューテーション操作
export function useMutateSituation() {
	const { user } = useAuth();
	const queryClient = useQueryClient();

	// シチュエーション追加
	const addMutation = useMutation({
		mutationFn: async (name: string) => {
			return await api.post<SituationResponse>("/api/situations", { name });
		},
		onSuccess: () => {
			// キャッシュを無効化して再取得
			if (user?.id) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.situations(user.id),
				});
			}
		},
	});

	// シチュエーション削除
	const deleteMutation = useMutation({
		mutationFn: async (id: string) => {
			return await api.delete(`/api/situations/${id}`);
		},
		onSuccess: () => {
			// キャッシュを無効化して再取得
			if (user?.id) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.situations(user.id),
				});
			}
		},
	});

	return {
		addSituation: addMutation.mutateAsync,
		deleteSituation: deleteMutation.mutateAsync,
		isAdding: addMutation.isPending,
		isDeleting: deleteMutation.isPending,
	};
}
