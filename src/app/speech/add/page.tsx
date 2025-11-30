"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useLanguages } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import SpeechAdd, { CorrectionResult } from "@/components/speech/SpeechAdd";
import SpeechResult from "@/components/speech/SpeechResult";
import PracticeConfirmModal from "@/components/modals/PracticeConfirmModal";
import ReviewModeModal from "@/components/modals/ReviewModeModal";
import { saveSpeech } from "@/hooks/speech/useSaveSpeech";
import toast, { Toaster } from "react-hot-toast";

export default function SpeechAddPage() {
	const router = useRouter();
	const { loading: authLoading } = useAuthGuard();
	const { languages } = useLanguages();
	const { userSettings } = useAuth();

	const nativeLanguage = userSettings?.nativeLanguage?.code || "";

	// 言語選択の状態管理
	const [learningLanguage, setLearningLanguage] = useState<string>(
		userSettings?.defaultLearningLanguage?.code || "",
	);

	// 未保存の変更を追跡
	const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

	// 添削結果の状態管理
	const [correctionResult, setCorrectionResult] =
		useState<CorrectionResult | null>(null);
	const [showResult, setShowResult] = useState(false);
	const [isSaving, setIsSaving] = useState(false);
	const [showPracticeModal, setShowPracticeModal] = useState(false);
	const [savedSpeechId, setSavedSpeechId] = useState<string | null>(null);

	// モーダルの状態管理
	const [showReviewModal, setShowReviewModal] = useState(false);

	const openReviewModal = () => {
		setShowReviewModal(true);
	};

	const closeReviewModal = () => {
		setShowReviewModal(false);
	};

	// 未保存の変更をチェックする関数
	const checkUnsavedChanges = () => {
		return hasUnsavedChanges;
	};

	// userSettingsが更新されたら学習言語を同期
	useEffect(() => {
		if (userSettings?.defaultLearningLanguage?.code && !learningLanguage) {
			setLearningLanguage(userSettings.defaultLearningLanguage.code);
		}
	}, [userSettings, learningLanguage]);

	const handleLearningLanguageChange = (languageCode: string) => {
		setLearningLanguage(languageCode);
	};

	// 添削完了時のハンドラー
	const handleCorrectionComplete = (result: CorrectionResult) => {
		setCorrectionResult(result);
		setShowResult(true);
		setHasUnsavedChanges(true); // 添削完了後は未保存状態にする（保存が必要）
	};

	// 保存処理
	const handleSave = async () => {
		if (!userSettings || !correctionResult) {
			toast.error("User settings not found");
			return;
		}

		if (
			!userSettings.defaultLearningLanguageId ||
			!userSettings.nativeLanguageId
		) {
			toast.error("Please set your languages in settings");
			return;
		}

		setIsSaving(true);
		try {
			const result = await saveSpeech(
				{
					title: correctionResult.title,
					learningLanguageId: userSettings.defaultLearningLanguageId,
					nativeLanguageId: userSettings.nativeLanguageId,
					firstSpeechText: correctionResult.yourSpeech,
					notes: correctionResult.note,
					speechPlans: correctionResult.speechPlan,
					sentences: correctionResult.sentences,
					feedback: correctionResult.feedback,
				},
				correctionResult.audioBlob,
			);

			toast.success("Speech saved successfully!");
			console.log("Saved speech:", result);

			// 保存したスピーチのIDを保存
			setSavedSpeechId(result.speech.id);

			// 保存成功したら未保存状態を解除
			setHasUnsavedChanges(false);

			// 保存成功後、モーダルを表示
			setShowPracticeModal(true);
		} catch (error) {
			console.error("Failed to save speech:", error);
			// エラーはapi.tsで自動的にトースト表示される
		} finally {
			setIsSaving(false);
		}
	};

	// 練習するを選択
	const handlePracticeConfirm = () => {
		setShowPracticeModal(false);
		// 状態をリセット
		setShowResult(false);
		setCorrectionResult(null);

		// 保存したスピーチのIDを使って復習ページに遷移
		if (savedSpeechId) {
			router.push(`/speech/review?speechId=${savedSpeechId}`);
		} else {
			// フォールバック: IDがない場合はSpeech Listへ
			router.push("/speech/list");
		}

		// IDをリセット
		setSavedSpeechId(null);
	};

	// 練習しないを選択
	const handlePracticeCancel = () => {
		setShowPracticeModal(false);
		// 状態をリセット
		setShowResult(false);
		setCorrectionResult(null);
		setSavedSpeechId(null);
		router.push("/speech/list");
	};

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
				<SpeechTabNavigation
					activeTab="Add"
					checkUnsavedChanges={checkUnsavedChanges}
					onReviewModalOpen={openReviewModal}
					isShowingResult={showResult}
				/>{" "}
				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					{showResult && correctionResult ? (
						<SpeechResult
							title={correctionResult.title}
							speechPlan={correctionResult.speechPlan}
							yourSpeech={correctionResult.yourSpeech}
							sentences={correctionResult.sentences}
							feedback={correctionResult.feedback}
							audioBlob={correctionResult.audioBlob}
							onSave={handleSave}
							isSaving={isSaving}
							note={correctionResult.note}
							onNoteChange={(note) => {
								if (correctionResult) {
									setCorrectionResult({ ...correctionResult, note });
									setHasUnsavedChanges(true);
								}
							}}
							onHasUnsavedChanges={setHasUnsavedChanges}
						/>
					) : (
						<SpeechAdd
							learningLanguage={learningLanguage}
							nativeLanguage={nativeLanguage}
							onHasUnsavedChanges={setHasUnsavedChanges}
							onCorrectionComplete={handleCorrectionComplete}
						/>
					)}
				</div>
			</div>

			{/* Practice Confirm Modal */}
			<PracticeConfirmModal
				isOpen={showPracticeModal}
				onConfirm={handlePracticeConfirm}
				onCancel={handlePracticeCancel}
			/>

			{/* Review Mode モーダル */}
			<ReviewModeModal
				isOpen={showReviewModal}
				onClose={closeReviewModal}
				languages={languages || []}
				defaultLearningLanguage={learningLanguage}
			/>

			<Toaster />
		</div>
	);
}
