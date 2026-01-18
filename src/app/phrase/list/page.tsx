"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePhraseList } from "@/hooks/phrase/usePhraseList";
import { useSpeakModal } from "@/hooks/speak/useSpeakModal";
import { useQuizModal } from "@/hooks/quiz/useQuizModal";
import LanguageSelector from "@/components/common/LanguageSelector";
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";
import PhraseList from "@/components/phrase/PhraseList";
import SpeakModeModal from "@/components/modals/SpeakModeModal";
import QuizModeModal from "@/components/modals/QuizModeModal";
import PracticeModeModal from "@/components/practice/PracticeModeModal";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import FadeIn from "@/components/common/FadeIn";
import type { PracticeConfig } from "@/types/practice";

export default function PhraseListPage() {
	const { loading: authLoading } = useAuthGuard();
	const { userSettings } = useAuth();
	const router = useRouter();

	const {
		learningLanguage,
		languages,
		savedPhrases,
		isLoadingPhrases,
		isLoadingMore,
		hasMorePhrases,
		nativeLanguage,
		handleLearningLanguageChange,
		loadMorePhrases,
		refreshPhrases,
	} = usePhraseList();

	// ユーザー設定からphraseModeを取得（デフォルトはpractice）
	const phraseMode = (userSettings?.phraseMode as "speak" | "quiz" | "practice") || "practice";

	// 学習言語IDを取得
	const learningLanguageId = languages.find(
		(l) => l.code === learningLanguage
	)?.id;

	// Modal functionality
	const { showSpeakModal, openSpeakModal, closeSpeakModal, handleSpeakStart } =
		useSpeakModal();

	const { showQuizModal, openQuizModal, closeQuizModal, handleQuizStart } =
		useQuizModal();

	// Practice Modal
	const [showPracticeModal, setShowPracticeModal] = useState(false);

	const openPracticeModal = () => setShowPracticeModal(true);
	const closePracticeModal = () => setShowPracticeModal(false);

	const handlePracticeStart = (config: PracticeConfig) => {
		// セッショントークンを生成してsessionStorageに保存
		const sessionToken = crypto.randomUUID();
		sessionStorage.setItem("practiceSessionToken", sessionToken);

		const params = new URLSearchParams({
			languageId: config.languageId,
			mode: config.mode,
			sessionToken,
		});
		if (config.questionCount !== undefined) {
			params.set("questionCount", config.questionCount.toString());
		}
		router.push(`/phrase/practice?${params.toString()}`);
	};

	// 無限スクロール
	useEffect(() => {
		const handleScroll = () => {
			if (
				window.innerHeight + window.scrollY >=
					document.documentElement.offsetHeight - 1000 &&
				hasMorePhrases &&
				!isLoadingPhrases &&
				!isLoadingMore
			) {
				loadMorePhrases();
			}
		};

		window.addEventListener("scroll", handleScroll, { passive: true });
		return () => window.removeEventListener("scroll", handleScroll);
	}, [hasMorePhrases, isLoadingPhrases, isLoadingMore, loadMorePhrases]);

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
				{/* Phrase タイトルと言語選択を同じ行に配置 */}
				<div className="flex justify-between items-center mb-[18px]">
					<h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
						Phrase
					</h1>

					<LanguageSelector
						learningLanguage={learningLanguage}
						onLanguageChange={handleLearningLanguageChange}
						languages={languages}
						nativeLanguage={nativeLanguage}
					/>
				</div>

				{/* タブメニュー */}
				<PhraseTabNavigation
					activeTab="List"
					onSpeakModalOpen={openSpeakModal}
					onQuizModalOpen={openQuizModal}
					onPracticeModalOpen={openPracticeModal}
					phraseMode={phraseMode}
				/>

				{/* コンテンツエリア */}
				<FadeIn>
					<PhraseList
						savedPhrases={savedPhrases}
						isLoadingPhrases={isLoadingPhrases}
						isLoadingMore={isLoadingMore}
						languages={languages}
						nativeLanguage={nativeLanguage}
						learningLanguage={learningLanguage}
						onRefreshPhrases={refreshPhrases}
						phraseMode={phraseMode}
					/>
				</FadeIn>
			</div>

			{/* Speak Mode モーダル */}
			<SpeakModeModal
				isOpen={showSpeakModal}
				onClose={closeSpeakModal}
				onStart={handleSpeakStart}
				languages={languages}
				defaultLearningLanguage={learningLanguage}
			/>

			{/* Quiz Mode モーダル */}
			<QuizModeModal
				isOpen={showQuizModal}
				onClose={closeQuizModal}
				onStart={handleQuizStart}
				languages={languages}
				defaultLearningLanguage={learningLanguage}
			/>

			{/* Practice Mode モーダル */}
			<PracticeModeModal
				isOpen={showPracticeModal}
				onClose={closePracticeModal}
				onStart={handlePracticeStart}
				languages={languages}
				defaultLanguageId={learningLanguageId}
			/>
		</div>
	);
}
