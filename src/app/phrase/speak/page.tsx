"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";
import SpeakModeModal from "@/components/modals/SpeakModeModal";
import QuizModeModal from "@/components/modals/QuizModeModal";
import ExplanationModal from "@/components/phrase/ExplanationModal";
import SpeakPractice from "@/components/speak/SpeakPractice";
import AllDoneScreen from "@/components/common/AllDoneScreen";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePhraseSettings } from "@/hooks/phrase/usePhraseSettings";
import { useSpeakSession } from "@/hooks/speak/useSpeakSession";
import { useSinglePhraseSpeak } from "@/hooks/speak/useSinglePhraseSpeak";
import { usePageLeaveWarning } from "@/hooks/ui/usePageLeaveWarning";
import { useModalManager } from "@/hooks/ui/useModalManager";
import { useMultiPhraseSpeak } from "@/hooks/speak/useMultiPhraseSpeak";
import { useAllDoneScreen } from "@/hooks/ui/useAllDoneScreen";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { Toaster } from "react-hot-toast";

function PhraseSpeakPage() {
	const { loading: authLoading } = useAuthGuard();
	const searchParams = useSearchParams();
	const router = useRouter();
	const { learningLanguage, languages } = usePhraseSettings();
	const { t } = useTranslation("common");

	const {
		sessionState,
		currentPhrase,
		isLoadingPhrase,
		todayCount,
		totalCount,
		pendingCount,
		isCountDisabled,
		handleStart,
		handleCount,
		handleNext,
		handleFinish,
		resetSession,
		sendPendingCount,
		refetchPhraseList,
		// fetchSpeakPhrase // 他のフックで使用される場合があるのでコメントアウト
	} = useSpeakSession(learningLanguage);

	const [showExplanation, setShowExplanation] = useState(false);

	// Explanationモーダルのハンドラー
	const handleExplanation = () => {
		setShowExplanation(true);
	};

	const handleExplanationClose = () => {
		setShowExplanation(false);
	};

	// 現在のフレーズを取得
	const getCurrentPhrase = () => {
		if (isSinglePhraseMode) {
			return singlePhrase;
		}
		return currentPhrase;
	};

	// URLパラメータからphraseIdを取得
	const phraseId = searchParams.get("phraseId");
	const isSinglePhraseMode = !!phraseId;

	// 単一フレーズ練習用のフック
	const {
		singlePhrase,
		isLoadingSinglePhrase,
		singlePhraseTodayCount,
		singlePhraseTotalCount,
		singlePhrasePendingCount,
		singlePhraseCountDisabled,
		isFinishing: isSinglePhraseFinishing,
		handleCount: handleSinglePhraseCount,
		handleFinish: handleSinglePhraseFinish,
	} = useSinglePhraseSpeak({
		phraseId,
		learningLanguage,
		sendPendingCount,
	});

	// 複数フレーズ練習用のフック
	const {
		isFinishing: isMultiPhraseFinishing,
		isNextLoading,
		isAllDone,
		handleNextWithConfig,
		handleSpeakFinishComplete,
		handleCount: handleMultiPhraseCount,
	} = useMultiPhraseSpeak({
		speakMode: sessionState,
		handleCount,
		handleNext,
		handleFinish,
	});

	// モーダル管理
	const modalManager = useModalManager({
		handleSpeakStart: handleStart,
	});

	// All Done画面管理
	const allDoneScreen = useAllDoneScreen({
		openSpeakModal: modalManager.openSpeakModal,
		resetSavedConfig: resetSession,
	});

	// ページ離脱警告（カウントボタンが1回以上押された状態の場合のみ）
	const hasPendingCount = isSinglePhraseMode
		? singlePhrasePendingCount > 0 // 単一フレーズモードでペンディングカウントがある場合
		: pendingCount > 0; // 複数フレーズモードでペンディングカウントがある場合

	// All Done状態では離脱警告を表示しない
	usePageLeaveWarning({
		hasPendingChanges: hasPendingCount && !isAllDone,
		warningMessage: hasPendingCount ? t("confirm.unsavedCount") : undefined,
	});

	// 直接アクセスチェック: URLパラメータがない場合はPhrase Listに遷移
	useEffect(() => {
		if (learningLanguage) {
			const params = new URLSearchParams(window.location.search);
			// URLパラメータがない場合（直接アクセス）はPhrase Listに遷移
			if (!params.toString()) {
				router.push("/phrase/list");
				return;
			}
		}
	}, [learningLanguage, router]);

	// All Done状態になったときにPhrase Listのキャッシュを無効化
	useEffect(() => {
		if (isAllDone) {
			refetchPhraseList();
		}
	}, [isAllDone, refetchPhraseList]);

	// 未保存の変更チェック関数
	const checkUnsavedChanges = () => {
		// All Done状態では離脱警告を表示しない
		if (isAllDone) {
			return false;
		}
		return hasPendingCount;
	};

	// 認証ローディング中は何も表示しない
	if (authLoading) {
		return <LoadingSpinner withHeaderOffset />;
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
				{/* Phrase タイトル */}
				<div className="flex justify-between items-center mb-[18px]">
					<h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
						Phrase
					</h1>
				</div>

				{/* タブメニュー */}
				<PhraseTabNavigation
					activeTab="Speak"
					checkUnsavedChanges={checkUnsavedChanges}
					onSpeakModalOpen={
						sessionState.active ? undefined : modalManager.openSpeakModal
					}
					onQuizModalOpen={modalManager.openQuizModal}
					onCacheInvalidate={refetchPhraseList}
				/>

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					{isAllDone ? (
						// All Done画面
						<AllDoneScreen
							onFinish={allDoneScreen.handleAllDoneFinish}
							onRetry={allDoneScreen.handleAllDoneRetry}
						/>
					) : isSinglePhraseMode ? (
						// 単一フレーズ練習モード
						singlePhrase ? (
							<SpeakPractice
								phrase={singlePhrase}
								onCount={handleSinglePhraseCount}
								onNext={() => {}} // 単一フレーズモードでは何もしない
								onFinish={handleSinglePhraseFinish}
								todayCount={singlePhraseTodayCount}
								totalCount={singlePhraseTotalCount}
								isLoading={isLoadingSinglePhrase}
								isNextLoading={false}
								isHideNext={true}
								isFinishing={isSinglePhraseFinishing}
								isCountDisabled={singlePhraseCountDisabled}
								learningLanguage={learningLanguage}
								onExplanation={handleExplanation}
							/>
						) : (
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
						)
					) : // 通常の複数フレーズ練習モード
					// Finish処理中またはフレーズがある場合は練習画面を表示
					currentPhrase || isMultiPhraseFinishing ? (
						<SpeakPractice
							phrase={currentPhrase}
							onCount={handleMultiPhraseCount}
							onNext={handleNextWithConfig}
							onFinish={handleSpeakFinishComplete}
							todayCount={todayCount}
							totalCount={totalCount}
							isLoading={isLoadingPhrase}
							isNextLoading={isNextLoading}
							isHideNext={false}
							isFinishing={isMultiPhraseFinishing}
							isCountDisabled={isCountDisabled}
							learningLanguage={learningLanguage}
							onExplanation={handleExplanation}
						/>
					) : (
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
					)}
				</div>

				{/* Speak Mode モーダル */}
				<SpeakModeModal
					isOpen={modalManager.showSpeakModal}
					onClose={modalManager.closeSpeakModal}
					onStart={modalManager.handleSpeakStartWithModal}
					languages={languages}
					defaultLearningLanguage={learningLanguage}
				/>

				{/* Quiz Mode モーダル */}
				<QuizModeModal
					isOpen={modalManager.showQuizModal}
					onClose={modalManager.closeQuizModal}
					onStart={modalManager.handleQuizStartWithModal}
					languages={languages}
					defaultLearningLanguage={learningLanguage}
				/>

				{/* Explanation モーダル */}
				<ExplanationModal
					isOpen={showExplanation}
					phrase={getCurrentPhrase() as { explanation?: string } | null}
					onClose={handleExplanationClose}
				/>
			</div>

			<Toaster
				position="top-center"
				reverseOrder={false}
				gutter={8}
				containerClassName=""
				containerStyle={{}}
				toastOptions={{
					duration: 4000,
					style: {
						background: "#363636",
						color: "#fff",
					},
					success: {
						duration: 3000,
						iconTheme: {
							primary: "#4aed88",
							secondary: "#fff",
						},
					},
					error: {
						duration: 4000,
						iconTheme: {
							primary: "#f56565",
							secondary: "#fff",
						},
					},
				}}
			/>
		</div>
	);
}

export default dynamic(() => Promise.resolve(PhraseSpeakPage), { ssr: false });
