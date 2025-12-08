import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
	useLanguages,
	useRanking,
	usePhraseStreakRanking,
	useSpeakStreakRanking,
	useQuizStreakRanking,
	useSpeechAddRanking,
	useSpeechAddStreakRanking,
	useSpeechReviewRanking,
	useSpeechReviewStreakRanking,
} from "@/hooks/api";
import { DEFAULT_LANGUAGE } from "@/constants/languages";

export const useRankingData = (speechMode?: "add" | "review") => {
	const { languages } = useLanguages();
	const { userSettings } = useAuth(); // AuthContextから直接ユーザー設定を取得

	// ユーザーのデフォルト学習言語を初期値として設定
	const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
		return userSettings?.defaultLearningLanguage?.code || DEFAULT_LANGUAGE;
	});
	const [activeTab, setActiveTab] = useState("Daily"); // 初期値はDaily
	const [activeRankingType, setActiveRankingType] = useState<
		"phrase" | "speak" | "quiz" | "speech"
	>("phrase");

	// APIフックを使用してデータを取得

	// ランキングデータを取得
	// PhraseとSpeechの場合は常にtotal、それ以外はactiveTabに基づいてperiodを決定
	const period =
		activeRankingType === "phrase" || activeRankingType === "speech"
			? "total"
			: (activeTab.toLowerCase() as "daily" | "weekly" | "total");
	const {
		rankingData: normalRankingData,
		currentUser: normalCurrentUser,
		isLoading: normalIsLoading,
		error: normalError,
		message: normalMessage,
		refetch: normalRefetch,
	} = useRanking(activeRankingType, selectedLanguage, period);

	// Phrase Streakランキングデータを取得
	const {
		rankingData: streakRankingData,
		currentUser: streakCurrentUser,
		isLoading: streakIsLoading,
		error: streakError,
		refetch: streakRefetch,
	} = usePhraseStreakRanking(selectedLanguage);

	// Speak Streakランキングデータを取得
	const {
		rankingData: speakStreakRankingData,
		currentUser: speakStreakCurrentUser,
		isLoading: speakStreakIsLoading,
		error: speakStreakError,
		refetch: speakStreakRefetch,
	} = useSpeakStreakRanking(selectedLanguage);

	// Quiz Streakランキングデータを取得
	const {
		rankingData: quizStreakRankingData,
		currentUser: quizStreakCurrentUser,
		isLoading: quizStreakIsLoading,
		error: quizStreakError,
		refetch: quizStreakRefetch,
	} = useQuizStreakRanking(selectedLanguage);

	// Speech Add (登録数) ランキングデータを取得
	const {
		rankingData: speechAddRankingData,
		currentUser: speechAddCurrentUser,
		isLoading: speechAddIsLoading,
		error: speechAddError,
		refetch: speechAddRefetch,
	} = useSpeechAddRanking(
		activeRankingType === "speech" && speechMode === "add"
			? selectedLanguage
			: undefined,
	);

	// Speech Add Streak (登録連続日数) ランキングデータを取得
	const {
		rankingData: speechAddStreakRankingData,
		currentUser: speechAddStreakCurrentUser,
		isLoading: speechAddStreakIsLoading,
		error: speechAddStreakError,
		refetch: speechAddStreakRefetch,
	} = useSpeechAddStreakRanking(
		activeRankingType === "speech" && speechMode === "add"
			? selectedLanguage
			: undefined,
	);

	// Speech Review (練習回数) ランキングデータを取得
	const reviewPeriod = activeTab.toLowerCase() as "daily" | "weekly" | "total";
	const {
		rankingData: speechReviewRankingData,
		currentUser: speechReviewCurrentUser,
		isLoading: speechReviewIsLoading,
		error: speechReviewError,
		refetch: speechReviewRefetch,
	} = useSpeechReviewRanking(
		activeRankingType === "speech" && speechMode === "review"
			? selectedLanguage
			: undefined,
		activeRankingType === "speech" && speechMode === "review"
			? reviewPeriod
			: undefined,
	);

	// Speech Review Streak (練習連続日数) ランキングデータを取得
	const {
		rankingData: speechReviewStreakRankingData,
		currentUser: speechReviewStreakCurrentUser,
		isLoading: speechReviewStreakIsLoading,
		error: speechReviewStreakError,
		refetch: speechReviewStreakRefetch,
	} = useSpeechReviewStreakRanking(
		activeRankingType === "speech" && speechMode === "review"
			? selectedLanguage
			: undefined,
	);

	// 表示するデータを決定
	const isPhraseStreakTab =
		activeRankingType === "phrase" && activeTab === "Streak";
	const isSpeakStreakTab =
		activeRankingType === "speak" && activeTab === "Streak";
	const isQuizStreakTab =
		activeRankingType === "quiz" && activeTab === "Streak";
	const isSpeechAddTab =
		activeRankingType === "speech" &&
		speechMode === "add" &&
		activeTab === "Total";
	const isSpeechAddStreakTab =
		activeRankingType === "speech" &&
		speechMode === "add" &&
		activeTab === "Streak";
	const isSpeechReviewTab =
		activeRankingType === "speech" &&
		speechMode === "review" &&
		activeTab !== "Streak";
	const isSpeechReviewStreakTab =
		activeRankingType === "speech" &&
		speechMode === "review" &&
		activeTab === "Streak";

	let rankingData, currentUser, isLoading, error, message;

	if (isPhraseStreakTab) {
		rankingData = streakRankingData;
		currentUser = streakCurrentUser;
		isLoading = streakIsLoading;
		error = streakError;
		message = undefined;
	} else if (isSpeakStreakTab) {
		rankingData = speakStreakRankingData;
		currentUser = speakStreakCurrentUser;
		isLoading = speakStreakIsLoading;
		error = speakStreakError;
		message = undefined;
	} else if (isQuizStreakTab) {
		rankingData = quizStreakRankingData;
		currentUser = quizStreakCurrentUser;
		isLoading = quizStreakIsLoading;
		error = quizStreakError;
		message = undefined;
	} else if (isSpeechAddTab) {
		rankingData = speechAddRankingData;
		currentUser = speechAddCurrentUser;
		isLoading = speechAddIsLoading;
		error = speechAddError;
		message = undefined;
	} else if (isSpeechAddStreakTab) {
		rankingData = speechAddStreakRankingData;
		currentUser = speechAddStreakCurrentUser;
		isLoading = speechAddStreakIsLoading;
		error = speechAddStreakError;
		message = undefined;
	} else if (isSpeechReviewTab) {
		rankingData = speechReviewRankingData;
		currentUser = speechReviewCurrentUser;
		isLoading = speechReviewIsLoading;
		error = speechReviewError;
		message = undefined;
	} else if (isSpeechReviewStreakTab) {
		rankingData = speechReviewStreakRankingData;
		currentUser = speechReviewStreakCurrentUser;
		isLoading = speechReviewStreakIsLoading;
		error = speechReviewStreakError;
		message = undefined;
	} else {
		rankingData = normalRankingData;
		currentUser = normalCurrentUser;
		isLoading = normalIsLoading;
		error = normalError;
		message = normalMessage;
	}

	// ユーザー設定が読み込まれた時に言語を初期化（初回のみ）
	useEffect(() => {
		if (
			userSettings?.defaultLearningLanguage?.code &&
			(selectedLanguage === DEFAULT_LANGUAGE || !selectedLanguage)
		) {
			setSelectedLanguage(userSettings.defaultLearningLanguage.code);
		}
	}, [userSettings?.defaultLearningLanguage?.code, selectedLanguage]);

	// 言語変更ハンドラー
	const handleLanguageChange = (languageCode: string) => {
		setSelectedLanguage(languageCode);
	};

	// タブ変更ハンドラー
	const handleTabChange = (tab: string) => {
		setActiveTab(tab);
	};

	// ランキングタイプ変更ハンドラー
	const handleRankingTypeChange = (
		type: "phrase" | "speak" | "quiz" | "speech",
	) => {
		setActiveRankingType(type);

		// ランキングタイプ変更時に適切なタブを設定
		// PhraseとSpeech Addの場合はTotal、それ以外はDaily
		if (type === "phrase" || (type === "speech" && speechMode === "add")) {
			setActiveTab("Total");
		} else {
			setActiveTab("Daily");
		}
	};

	// 手動リフレッシュ関数
	const refreshRanking = () => {
		if (isPhraseStreakTab) {
			streakRefetch();
		} else if (isSpeakStreakTab) {
			speakStreakRefetch();
		} else if (isQuizStreakTab) {
			quizStreakRefetch();
		} else if (isSpeechAddTab) {
			speechAddRefetch();
		} else if (isSpeechAddStreakTab) {
			speechAddStreakRefetch();
		} else if (isSpeechReviewTab) {
			speechReviewRefetch();
		} else if (isSpeechReviewStreakTab) {
			speechReviewStreakRefetch();
		} else {
			normalRefetch();
		}
	};

	return {
		// State
		selectedLanguage,
		activeTab,
		activeRankingType,
		languages: languages || [],
		rankingData: rankingData || [],
		currentUser,
		isLoading,
		error,
		message,

		// Handlers
		handleLanguageChange,
		handleTabChange,
		handleRankingTypeChange,
		refreshRanking,
	};
};
