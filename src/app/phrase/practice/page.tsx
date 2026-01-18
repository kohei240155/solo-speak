"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useAuth } from "@/contexts/AuthContext";
import PhraseTabNavigation from "@/components/navigation/PhraseTabNavigation";
import SpeakModeModal from "@/components/modals/SpeakModeModal";
import QuizModeModal from "@/components/modals/QuizModeModal";
import PracticeModeModal from "@/components/practice/PracticeModeModal";
import PracticePractice from "@/components/practice/PracticePractice";
import AllDoneScreen from "@/components/common/AllDoneScreen";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import FadeIn from "@/components/common/FadeIn";
import { usePhraseSettings } from "@/hooks/phrase/usePhraseSettings";
import { useSpeakModal } from "@/hooks/speak/useSpeakModal";
import { usePracticeSession } from "@/hooks/practice/usePracticeSession";
import { useInfinitePhrases } from "@/hooks/api";
import { api } from "@/utils/api";
import type { PracticeConfig } from "@/types/practice";
import { Toaster } from "react-hot-toast";

// Practice stats API response type
interface PracticeStatsResponse {
	success: boolean;
	dailyCorrectCount: number;
	totalCorrectCount: number;
	weeklyRank: number;
	totalRank: number;
}

export default function PhrasePracticePage() {
	const { loading: authLoading } = useAuthGuard();
	const { userSettings } = useAuth();
	const { learningLanguage, languages } = usePhraseSettings();
	const router = useRouter();

	// ユーザー設定からphraseModeを取得（デフォルトはpractice）
	const phraseMode = (userSettings?.phraseMode as "speak" | "quiz" | "practice") || "practice";

	// 学習言語IDを取得
	const learningLanguageId = languages.find(
		(l) => l.code === learningLanguage
	)?.id;

	// Phrase Listのキャッシュ無効化用
	const { refetch: refetchPhraseList } = useInfinitePhrases(learningLanguage);

	// Practice完了状態
	const [isPracticeCompleted, setIsPracticeCompleted] = useState(false);

	// 完了画面用の統計情報
	const [completionStats, setCompletionStats] = useState<{
		correctCount: number;
		weeklyRank: number;
		totalRank: number;
	} | null>(null);

	// Practice機能
	const {
		session,
		currentPhrase,
		isAllDone,
		sessionStats,
		fetchSession,
		handleNext,
		resetSession,
		recordResult,
	} = usePracticeSession();

	// Practice mode state
	const [practiceActive, setPracticeActive] = useState(false);

	// Modals
	const { showSpeakModal, openSpeakModal, closeSpeakModal, handleSpeakStart } =
		useSpeakModal();
	const [showQuizModal, setShowQuizModal] = useState(false);
	const [showPracticeModal, setShowPracticeModal] = useState(false);

	// APIを1回だけコールするためのフラグ
	const hasStartedPracticeRef = useRef(false);

	// セッションの言語IDから言語コードを取得
	const languageCode = languages.find((l) => l.id === session?.languageId)?.code || learningLanguage || "en";

	// ページ読み込み時に自動的にモーダルを表示、またはURLパラメータから開始
	useEffect(() => {
		if (
			!practiceActive &&
			!isPracticeCompleted &&
			learningLanguageId &&
			!hasStartedPracticeRef.current
		) {
			hasStartedPracticeRef.current = true;

			// URLパラメータから設定を読み取り
			const params = new URLSearchParams(window.location.search);

			// URLパラメータがない場合（直接アクセス）はPhrase Listに遷移
			if (!params.toString()) {
				router.push("/phrase/list");
				return;
			}

			// セッショントークンの検証
			const urlSessionToken = params.get("sessionToken");
			const storedSessionToken = sessionStorage.getItem("practiceSessionToken");

			// セッショントークンがない、または一致しない場合はPhrase Listに遷移
			if (!urlSessionToken || urlSessionToken !== storedSessionToken) {
				router.push("/phrase/list");
				return;
			}

			// トークンを消費（単一使用）：URLコピーによる再アクセスを防止
			sessionStorage.removeItem("practiceSessionToken");

			const languageId = params.get("languageId") || learningLanguageId;
			const mode = (params.get("mode") as "normal" | "review") || "normal";
			const questionCountParam = params.get("questionCount");

			const config: PracticeConfig = {
				languageId,
				mode,
				...(questionCountParam && { questionCount: parseInt(questionCountParam, 10) }),
			};
			handlePracticeStart(config);
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [practiceActive, isPracticeCompleted, learningLanguageId]);

	// Practice統計情報を取得（Promiseを返す）
	const fetchPracticeStats = useCallback(async (): Promise<{
		correctCount: number;
		weeklyRank: number;
		totalRank: number;
	}> => {
		// sessionのlanguageIdを使用
		const languageId = session?.languageId;
		if (!languageId) {
			return {
				correctCount: sessionStats.correctCount,
				weeklyRank: 0,
				totalRank: 0,
			};
		}

		try {
			const response = await api.get<PracticeStatsResponse>(
				`/api/phrase/practice/stats?languageId=${languageId}`,
				{ showErrorToast: false, cache: "no-store" }
			);
			if (response.success) {
				return {
					correctCount: sessionStats.correctCount,
					weeklyRank: response.weeklyRank,
					totalRank: response.totalRank,
				};
			}
		} catch {
			// エラー時はデフォルト値を使用
		}
		return {
			correctCount: sessionStats.correctCount,
			weeklyRank: 0,
			totalRank: 0,
		};
	}, [sessionStats.correctCount, session?.languageId]);

	// isAllDoneの監視
	useEffect(() => {
		if (isAllDone) {
			// APIから統計を取得してからComplete画面を表示
			(async () => {
				const stats = await fetchPracticeStats();
				setCompletionStats(stats);
				setIsPracticeCompleted(true);
				refetchPhraseList();
			})();
		}
	}, [isAllDone, fetchPracticeStats, refetchPhraseList]);

	// Practice開始処理
	const handlePracticeStart = async (config: PracticeConfig) => {
		const success = await fetchSession(config);

		if (success) {
			setPracticeActive(true);
			setShowPracticeModal(false);
		}
	};

	// Practice開始処理（モーダルから呼ばれる）
	const handlePracticeStartWithModal = async (config: PracticeConfig) => {
		// Practiceを実際に開始する時に状態をリセット
		setIsPracticeCompleted(false);
		setCompletionStats(null);
		resetSession();
		setPracticeActive(false);

		await handlePracticeStart(config);
	};

	// Practice終了処理
	const handlePracticeFinishComplete = async () => {
		// セッショントークンをクリア（URLコピー対策）
		sessionStorage.removeItem("practiceSessionToken");
		// APIから統計を取得してからComplete画面を表示
		const stats = await fetchPracticeStats();
		setCompletionStats(stats);
		setIsPracticeCompleted(true);
		refetchPhraseList();
	};

	// 完了画面からのFinish処理
	const handleFinish = () => {
		// セッショントークンをクリア
		sessionStorage.removeItem("practiceSessionToken");
		router.push("/phrase/list");
	};

	// 完了画面からのRetry処理
	const handleRetry = () => {
		setShowPracticeModal(true);
	};

	// Practiceモーダルを閉じる処理
	const handlePracticeModalClose = () => {
		setShowPracticeModal(false);
		// Practiceが非アクティブでモーダルを閉じた場合は、リストに戻る
		if (!practiceActive && !isPracticeCompleted) {
			// セッショントークンをクリア
			sessionStorage.removeItem("practiceSessionToken");
			router.push("/phrase/list");
		}
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
					activeTab="Practice"
					onSpeakModalOpen={openSpeakModal}
					onQuizModalOpen={() => setShowQuizModal(true)}
					onPracticeModalOpen={
						practiceActive ? undefined : () => setShowPracticeModal(true)
					}
					onCacheInvalidate={refetchPhraseList}
					phraseMode={phraseMode}
				/>

				{/* コンテンツエリア */}
				<FadeIn className="bg-white rounded-2xl shadow-md p-4 sm:p-6">
					{isPracticeCompleted ? (
						<AllDoneScreen
							onFinish={handleFinish}
							onRetry={handleRetry}
							stats={completionStats || undefined}
						/>
					) : practiceActive && session && currentPhrase ? (
						<PracticePractice
							session={session}
							currentPhrase={currentPhrase}
							languageCode={languageCode}
							onNext={handleNext}
							onFinish={handlePracticeFinishComplete}
							onRecordResult={recordResult}
						/>
					) : (
						// セッション読み込み中またはリダイレクト待ちの表示
						<LoadingSpinner
							size="md"
							message="Starting Practice..."
							className="text-center"
							minHeight="400px"
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
				onClose={() => setShowQuizModal(false)}
				onStart={async () => {}}
				languages={languages}
				defaultLearningLanguage={learningLanguage}
			/>

			{/* Practice Mode モーダル */}
			<PracticeModeModal
				isOpen={showPracticeModal}
				onClose={handlePracticeModalClose}
				onStart={handlePracticeStartWithModal}
				languages={languages}
				defaultLanguageId={learningLanguageId}
			/>

			<Toaster />
		</div>
	);
}
