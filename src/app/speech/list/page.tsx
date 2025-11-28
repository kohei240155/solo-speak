"use client";

import { useEffect } from "react";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useSpeechList } from "@/hooks/speech";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import SpeechList from "@/components/speech/SpeechList";

export default function SpeechListPage() {
	const { loading: authLoading } = useAuthGuard();

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
	} = useSpeechList();

	// 無限スクロール
	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + window.scrollY >=
					document.documentElement.offsetHeight - 1000 &&
				hasMoreSpeeches &&
				!isLoadingSpeeches &&
				!isLoadingMore
			) {
				loadMoreSpeeches();
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [hasMoreSpeeches, isLoadingSpeeches, isLoadingMore, loadMoreSpeeches]);

	// 認証ローディング中は何も表示しない
	if (authLoading) {
		return (
			<div className="min-h-screen flex justify-center items-start pt-28">
				<LoadingSpinner message="Loading..." />
			</div>
		);
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
				{/* Speech タイトルと言語選択を同じ行に配置 */}
				<div className="flex justify-between items-center mb-[18px]">
					<h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
						Speech
					</h1>

					<LanguageSelector
						learningLanguage={learningLanguage}
						onLanguageChange={handleLearningLanguageChange}
						languages={languages || []}
						nativeLanguage={nativeLanguage}
					/>
				</div>

				{/* タブメニュー */}
				<SpeechTabNavigation activeTab="List" />

				{/* コンテンツエリア */}
				<SpeechList
					speeches={savedSpeeches}
					isLoadingSpeeches={isLoadingSpeeches}
					isLoadingMore={isLoadingMore}
					learningLanguage={learningLanguage}
				/>
			</div>
		</div>
	);
}
