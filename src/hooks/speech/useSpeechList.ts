import { useState, useEffect, useCallback } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguages, useInfiniteSpeeches } from "@/hooks/api";

export const useSpeechList = () => {
	const { languages } = useLanguages();
	const { userSettings } = useAuth();

	// ユーザーのデフォルト学習言語を初期値として設定
	const [learningLanguage, setLearningLanguage] = useState<string | undefined>(
		userSettings?.defaultLearningLanguage?.code,
	);

	// 無限スクロール対応のスピーチリスト取得
	const {
		speeches: savedSpeeches,
		hasMore: hasMoreSpeeches,
		isLoading,
		isLoadingMore,
		setSize,
		refetch,
	} = useInfiniteSpeeches(learningLanguage);

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
	const loadMoreSpeeches = useCallback(() => {
		if (!isLoadingMore && hasMoreSpeeches) {
			setSize();
		}
	}, [setSize, isLoadingMore, hasMoreSpeeches]);

	// リフレッシュ
	const refreshSpeeches = useCallback(() => {
		refetch();
	}, [refetch]);

	return {
		learningLanguage,
		languages: languages || [],
		savedSpeeches: savedSpeeches || [],
		isLoadingSpeeches: isLoading,
		isLoadingMore,
		hasMoreSpeeches: hasMoreSpeeches || false,
		nativeLanguage: userSettings?.nativeLanguage?.code || "",
		handleLearningLanguageChange,
		loadMoreSpeeches,
		refreshSpeeches,
	};
};
