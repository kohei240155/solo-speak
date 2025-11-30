import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import {
	useLanguages,
	useRanking,
	usePhraseStreakRanking,
	useSpeakStreakRanking,
	useQuizStreakRanking,
	useSpeechStreakRanking,
} from "@/hooks/api";
import { DEFAULT_LANGUAGE } from "@/constants/languages";

export const useRankingData = () => {
	const { languages } = useLanguages();
	const { userSettings } = useAuth(); // AuthContextから直接ユーザー設定を取得

	// ユーザーのデフォルト学習言語を初期値として設定
	const [selectedLanguage, setSelectedLanguage] = useState<string>(() => {
		return userSettings?.defaultLearningLanguage?.code || DEFAULT_LANGUAGE;
	});
	const [activeTab, setActiveTab] = useState("Total"); // Phraseがデフォルトなので初期値はTotal
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

	// Speech Streakランキングデータを取得
	const {
		rankingData: speechStreakRankingData,
		currentUser: speechStreakCurrentUser,
		isLoading: speechStreakIsLoading,
		error: speechStreakError,
		refetch: speechStreakRefetch,
	} = useSpeechStreakRanking(selectedLanguage);

	// 表示するデータを決定
	const isPhraseStreakTab =
		activeRankingType === "phrase" && activeTab === "Streak";
	const isSpeakStreakTab =
		activeRankingType === "speak" && activeTab === "Streak";
	const isQuizStreakTab =
		activeRankingType === "quiz" && activeTab === "Streak";
	const isSpeechStreakTab =
		activeRankingType === "speech" && activeTab === "Streak";

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
	} else if (isSpeechStreakTab) {
		rankingData = speechStreakRankingData;
		currentUser = speechStreakCurrentUser;
		isLoading = speechStreakIsLoading;
		error = speechStreakError;
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
		if (type === "phrase" || type === "speech") {
			setActiveTab("Total");
		} else if (type === "speak" || type === "quiz") {
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
		} else if (isSpeechStreakTab) {
			speechStreakRefetch();
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
