"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import { usePhraseManager } from "@/hooks/phrase/usePhraseManager";
import { useSpeakModal } from "@/hooks/speak/useSpeakModal";
import { useQuizModal } from "@/hooks/quiz/useQuizModal";
import { useTranslation } from "@/hooks/ui/useTranslation";
import LanguageSelector from "@/components/common/LanguageSelector";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";
import PhraseAdd from "@/components/phrase/PhraseAdd";
import SpeakModeModal from "@/components/modals/SpeakModeModal";
import QuizModeModal from "@/components/modals/QuizModeModal";
import PracticeModeModal from "@/components/practice/PracticeModeModal";
import AddToHomeScreenModal from "@/components/modals/AddToHomeScreenModal";
import FadeIn from "@/components/common/FadeIn";
import type { PracticeConfig } from "@/types/practice";

export default function PhraseAddPage() {
	const { t } = useTranslation("app");
	const { loading: authLoading } = useAuthGuard();
	const { userSettings } = useAuth();
	const router = useRouter();

	// ユーザー設定からphraseModeを取得（デフォルトはpractice）
	const phraseMode = (userSettings?.phraseMode as "speak" | "quiz" | "practice") || "practice";

	const {
		// State - ページレベルで使用
		nativeLanguage,
		learningLanguage,
		handleLearningLanguageChange,
		languages,
		isInitializing,
		showAddToHomeScreenModal,
		checkUnsavedChanges,
		closeAddToHomeScreenModal,

		// State - PhraseAddコンポーネントで使用
		desiredPhrase,
		generatedVariations,
		isLoading,
		error,
		remainingGenerations,
		situations,
		isSaving,
		savingVariationIndex,
		editingVariations,
		editingTranslations,
		phraseValidationError,
		selectedContext,

		// Random Mode State
		isRandomMode,
		randomGeneratedVariations,
		isRandomSaving,

		// Handlers - PhraseAddコンポーネントで使用
		handleEditVariation,
		handleEditTranslation,
		handlePhraseChange,
		handleGeneratePhrase,
		handleSelectVariation,
		handleContextChange,
		addSituation,
		deleteSituation,
		refetchPhraseList,

		// Random Mode Handlers
		handleToggleRandomMode,
		handleRandomGenerate,
		handleSaveRandomPhrase,
	} = usePhraseManager();

	// Modal functionality
	const { showSpeakModal, openSpeakModal, closeSpeakModal, handleSpeakStart } =
		useSpeakModal();

	const { showQuizModal, openQuizModal, closeQuizModal, handleQuizStart } =
		useQuizModal();

	// Practice Modal
	const [showPracticeModal, setShowPracticeModal] = useState(false);

	// 学習言語IDを取得
	const learningLanguageId = languages.find(
		(l) => l.code === learningLanguage
	)?.id;

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
		router.push(`/phrase/practice?${params.toString()}`);
	};

	// ページ離脱時の警告処理をオーバーライド
	useEffect(() => {
		const handleBeforeUnload = (e: BeforeUnloadEvent) => {
			if (generatedVariations.length > 0 || randomGeneratedVariations.length > 0) {
				e.preventDefault();
				e.returnValue = t("confirm.unsavedPhrase");
				return t("confirm.unsavedPhrase");
			}
		};

		window.addEventListener("beforeunload", handleBeforeUnload);
		return () => {
			window.removeEventListener("beforeunload", handleBeforeUnload);
		};
	}, [generatedVariations.length, randomGeneratedVariations.length, t]);

	// 認証ローディング中は何も表示しない
	if (authLoading) {
		return (
			<LoadingSpinner message="Loading..." className="py-8" minHeight="280px" />
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
					activeTab="Add"
					checkUnsavedChanges={checkUnsavedChanges}
					onSpeakModalOpen={openSpeakModal}
					onQuizModalOpen={openQuizModal}
					onPracticeModalOpen={openPracticeModal}
					onCacheInvalidate={refetchPhraseList}
					phraseMode={phraseMode}
				/>

				{/* コンテンツエリア */}
				<FadeIn className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
					{isInitializing ? (
						<div
							className="flex items-center justify-center"
							style={{ minHeight: "240px" }}
						>
							<LoadingSpinner
								size="md"
								message="Loading..."
								className="text-center"
							/>
						</div>
					) : (
						<PhraseAdd
							remainingGenerations={remainingGenerations}
							desiredPhrase={desiredPhrase}
							phraseValidationError={phraseValidationError}
							isLoading={isLoading}
							isSaving={isSaving}
							generatedVariations={generatedVariations}
							editingVariations={editingVariations}
							editingTranslations={editingTranslations}
							savingVariationIndex={savingVariationIndex}
							error={error}
							selectedContext={selectedContext}
							situations={situations}
							onPhraseChange={handlePhraseChange}
							onGeneratePhrase={handleGeneratePhrase}
							onEditVariation={handleEditVariation}
							onEditTranslation={handleEditTranslation}
							onSelectVariation={handleSelectVariation}
							onContextChange={handleContextChange}
							addSituation={addSituation}
							deleteSituation={deleteSituation}
							// Random Mode
							isRandomMode={isRandomMode}
							randomGeneratedVariations={randomGeneratedVariations}
							isRandomSaving={isRandomSaving}
							onToggleRandomMode={handleToggleRandomMode}
							onRandomGenerate={handleRandomGenerate}
							onSaveRandomPhrase={handleSaveRandomPhrase}
						/>
					)}
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

			{/* ホーム画面追加モーダル */}
			<AddToHomeScreenModal
				isOpen={showAddToHomeScreenModal}
				onClose={closeAddToHomeScreenModal}
			/>
		</div>
	);
}
