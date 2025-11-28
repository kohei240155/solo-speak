import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguages, useInfinitePhrases } from "@/hooks/api";

export const usePhraseList = () => {
	const { languages } = useLanguages();
	const { userSettings } = useAuth();

	// ユーザーのデフォルト学習言語を初期値として設定
	const [learningLanguage, setLearningLanguage] = useState<string | undefined>(
		userSettings?.defaultLearningLanguage?.code,
	);

	// 無限スクロール対応のフレーズリスト取得
	const {
		phrases: savedPhrases,
		hasMore: hasMorePhrases,
		isLoading,
		isLoadingMore,
		setSize,
		refetch,
	} = useInfinitePhrases(learningLanguage);

	// ユーザー設定が読み込まれた時に言語を初期化（初回のみ）
	useEffect(() => {
		if (userSettings?.defaultLearningLanguage?.code && !learningLanguage) {
			setLearningLanguage(userSettings.defaultLearningLanguage.code);
		}
	}, [userSettings?.defaultLearningLanguage?.code, learningLanguage]);

	// 言語変更ハンドラー
	const handleLearningLanguageChange = useCallback((language: string) => {
		setLearningLanguage(language);
	}, []);

	// 無限スクロール
	const loadMorePhrases = useCallback(() => {
		if (!isLoadingMore && hasMorePhrases) {
			setSize();
		}
	}, [setSize, isLoadingMore, hasMorePhrases]);

	// リフレッシュ
	const refreshPhrases = useCallback(() => {
		refetch();
	}, [refetch]);

	return {
		learningLanguage,
		languages: languages || [],
		savedPhrases: savedPhrases || [],
		isLoadingPhrases: isLoading,
		isLoadingMore,
		hasMorePhrases: hasMorePhrases || false,
		nativeLanguage: userSettings?.nativeLanguage?.code || "",
		handleLearningLanguageChange,
		loadMorePhrases,
		refreshPhrases,
	};
};
