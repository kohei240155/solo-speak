"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";
import SpeakModeModal from "@/components/modals/SpeakModeModal";
import QuizModeModal from "@/components/modals/QuizModeModal";
import QuizPractice from "@/components/quiz/QuizPractice";
import AllDoneScreen from "@/components/common/AllDoneScreen";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { usePhraseSettings } from "@/hooks/phrase/usePhraseSettings";
import { useSpeakModal } from "@/hooks/speak/useSpeakModal";
import { useQuizPhrase } from "@/hooks/quiz/useQuizPhrase";
import { usePageLeaveWarning } from "@/hooks/ui/usePageLeaveWarning";
import { useInfinitePhrases } from "@/hooks/api";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { QuizConfig, QuizModeState } from "@/types/quiz";
import { Toaster } from "react-hot-toast";

export default function PhraseQuizPage() {
	const { loading: authLoading } = useAuthGuard();
	const { learningLanguage, languages } = usePhraseSettings();
	const router = useRouter();
	const { t } = useTranslation("app");

	// Phrase Listのキャッシュ無効化用
	const { refetch: refetchPhraseList } = useInfinitePhrases(learningLanguage);

	// クイズ完了状態
	const [isQuizCompleted, setIsQuizCompleted] = useState(false);

	// Quiz functionality
	const {
		session,
		currentPhrase,
		showTranslation,
		fetchQuizSession,
		handleShowTranslation,
		handleHideTranslation,
		handleAnswer,
		handleNext,
		handleSpeakCount,
		resetQuiz,
	} = useQuizPhrase();

	// pendingSpeakCountの状態を管理（QuizPracticeコンポーネントとの互換性のため）
	const [pendingSpeakCount, setPendingSpeakCount] = useState(0);

	// Quiz mode state
	const [quizMode, setQuizMode] = useState<QuizModeState>({
		active: false,
		config: null,
		session: null,
	});

	// ページ離脱警告（カウントボタンが1回以上押された状態かつクイズがアクティブな時、ただしAll Done状態を除く）
	usePageLeaveWarning({
		hasPendingChanges:
			quizMode.active &&
			!!currentPhrase &&
			!isQuizCompleted &&
			pendingSpeakCount > 0,
		warningMessage:
			pendingSpeakCount > 0 ? t("confirm.unsavedCount") : undefined,
	});

	// Quiz開始処理
	const handleQuizStart = async (config: QuizConfig): Promise<boolean> => {
		const success = await fetchQuizSession(config);

		if (success) {
			setQuizMode({
				active: true,
				config,
				session: null,
			});
			return true;
		}

		return false;
	};

	// Speak modal functionality
	const { showSpeakModal, openSpeakModal, closeSpeakModal, handleSpeakStart } =
		useSpeakModal();

	const [showQuizModal, setShowQuizModal] = useState(false);

	// APIを1回だけコールするためのフラグ
	const hasStartedQuizRef = useRef(false);

	// ページ読み込み時に自動的にクイズを開始
	useEffect(() => {
		if (
			!quizMode.active &&
			!isQuizCompleted &&
			learningLanguage &&
			!hasStartedQuizRef.current
		) {
			hasStartedQuizRef.current = true;

			// URLパラメータから設定を読み取り
			const params = new URLSearchParams(window.location.search);

			// URLパラメータがない場合（直接アクセス）はPhrase Listに遷移
			if (!params.toString()) {
				router.push("/phrase/list");
				return;
			}

			const language = params.get("language") || learningLanguage;
			const mode = (params.get("mode") as "normal" | "random") || "normal";
			const questionCount = params.get("count")
				? parseInt(params.get("count")!, 10)
				: 10;
			const speakCountFilter = params.get("speakCountFilter")
				? parseInt(params.get("speakCountFilter")!, 10)
				: null;
			const excludeTodayQuizzed = params.get("excludeTodayQuizzed") === "true";

			const config: QuizConfig = {
				language,
				mode,
				questionCount,
				speakCountFilter,
				excludeTodayQuizzed,
			};
			handleQuizStart(config);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [quizMode.active, isQuizCompleted, learningLanguage]);

	// All Done状態になったときにPhrase Listのキャッシュを無効化
	useEffect(() => {
		if (isQuizCompleted) {
			refetchPhraseList();
		}
	}, [isQuizCompleted, refetchPhraseList]);

	// Quiz開始処理（モーダルから呼ばれる）
	const handleQuizStartWithModal = async (config: QuizConfig) => {
		// クイズを実際に開始する時に状態をリセット
		setIsQuizCompleted(false);
		setPendingSpeakCount(0); // pendingSpeakCountもリセット
		resetQuiz();
		setQuizMode({
			active: false,
			config: null,
			session: null,
		});

		const success = await handleQuizStart(config);
		setShowQuizModal(false);

		if (!success) {
			// 失敗した場合は少し待ってからモーダルを再度開く
			setTimeout(() => {
				setShowQuizModal(true);
			}, 100);
		}
	};

	// クイズ終了処理
	const handleQuizFinishComplete = () => {
		setPendingSpeakCount(0); // クイズ完了時にpendingSpeakCountをリセット
		setIsQuizCompleted(true);
	};

	// 完了画面からのFinish処理
	const handleFinish = () => {
		router.push("/phrase/list");
	};

	// 完了画面からのRetry処理
	const handleRetry = () => {
		// モーダルを開くだけで、All Done画面の状態は維持
		setShowQuizModal(true);
	};

	// クイズモーダルを閉じる処理
	const handleQuizModalClose = () => {
		setShowQuizModal(false);
		// もしクイズが完了していて、かつクイズが非アクティブな場合は、All Done画面に戻る
		if (isQuizCompleted && !quizMode.active) {
			// All Done画面の状態を維持するため、何もしない
		}
	};

	// Quizタブからの離脱時の未保存変更チェック
	const checkUnsavedChanges = () => {
		// All Done状態では離脱警告を表示しない
		if (isQuizCompleted) {
			return false;
		}
		return quizMode.active && !!currentPhrase && pendingSpeakCount > 0;
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
					activeTab="Quiz"
					onSpeakModalOpen={openSpeakModal}
					onQuizModalOpen={
						quizMode.active ? undefined : () => setShowQuizModal(true)
					}
					checkUnsavedChanges={checkUnsavedChanges}
					onCacheInvalidate={refetchPhraseList}
				/>

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					{isQuizCompleted ? (
						<AllDoneScreen onFinish={handleFinish} onRetry={handleRetry} />
					) : quizMode.active && session && currentPhrase ? (
						<QuizPractice
							session={session}
							currentPhrase={currentPhrase}
							showTranslation={showTranslation}
							onShowTranslation={handleShowTranslation}
							onHideTranslation={handleHideTranslation}
							onAnswer={handleAnswer}
							onNext={handleNext}
							onFinish={handleQuizFinishComplete}
							onSpeakCount={handleSpeakCount}
							onPendingCountChange={setPendingSpeakCount}
						/>
					) : (
						// セッション読み込み中の表示
						<LoadingSpinner
							size="md"
							message="Starting Quiz..."
							className="text-center"
							minHeight="400px"
						/>
					)}
				</div>
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
				onClose={handleQuizModalClose}
				onStart={handleQuizStartWithModal}
				languages={languages}
				defaultLearningLanguage={learningLanguage}
			/>

			<Toaster />
		</div>
	);
}
