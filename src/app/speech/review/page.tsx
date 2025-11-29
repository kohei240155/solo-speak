"use client";

import { useState, useEffect } from "react";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useLanguages } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import ReviewModeModal from "@/components/modals/ReviewModeModal";
import { ReviewConfig } from "@/components/modals/ReviewModeModal";
import SpeechReview from "@/components/speech/SpeechReview";
import { useReviewSpeech } from "@/hooks/speech/useReviewSpeech";
import { SpeechReviewResponseData } from "@/types/speech";
import toast, { Toaster } from "react-hot-toast";

export default function SpeechReviewPage() {
	const { loading: authLoading } = useAuthGuard();
	const { languages } = useLanguages();
	const { userSettings } = useAuth();
	const { fetchReviewSpeech, loading: fetchingReview } = useReviewSpeech();

	// 言語選択の状態管理
	const [learningLanguage, setLearningLanguage] = useState<string>(
		userSettings?.defaultLearningLanguage?.code || "",
	);

	// モーダルの状態管理
	const [showReviewModal, setShowReviewModal] = useState(false);

	// スピーチデータの状態管理
	const [reviewSpeech, setReviewSpeech] =
		useState<SpeechReviewResponseData["speech"]>(null);

	const nativeLanguage = userSettings?.nativeLanguage?.code || "";

	// userSettingsが更新されたら学習言語を同期
	useEffect(() => {
		if (userSettings?.defaultLearningLanguage?.code && !learningLanguage) {
			setLearningLanguage(userSettings.defaultLearningLanguage.code);
		}
	}, [userSettings, learningLanguage]);

	// ページロード時にセッションストレージから設定を読み込んでAPIを呼び出す
	useEffect(() => {
		const loadReviewSpeech = async () => {
			const savedConfig = sessionStorage.getItem("reviewConfig");
			if (savedConfig) {
				try {
					const config: ReviewConfig = JSON.parse(savedConfig);

					// セッションストレージをクリア（1回だけ使用）
					sessionStorage.removeItem("reviewConfig");

					const speech = await fetchReviewSpeech({
						languageCode: config.language,
						speakCountFilter: config.speakCountFilter as
							| "lessPractice"
							| "lowStatus"
							| null,
						excludeTodayPracticed: config.excludeTodayPracticed,
					});

					if (!speech) {
						toast.error("No speech found matching the criteria");
						return;
					}

					setReviewSpeech(speech);
				} catch (error) {
					console.error("Failed to fetch review speech:", error);
				}
			}
		};

		if (!authLoading && userSettings) {
			loadReviewSpeech();
		}
	}, [authLoading, userSettings, fetchReviewSpeech]);

	const handleLearningLanguageChange = (languageCode: string) => {
		setLearningLanguage(languageCode);
	};

	const openReviewModal = () => {
		setShowReviewModal(true);
	};

	const closeReviewModal = () => {
		setShowReviewModal(false);
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
					activeTab="Review"
					onReviewModalOpen={openReviewModal}
				/>

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					{fetchingReview ? (
						<div className="flex justify-center items-center py-12">
							<LoadingSpinner message="Loading speech..." />
						</div>
					) : reviewSpeech ? (
						<SpeechReview speech={reviewSpeech} />
					) : (
						<div className="text-center py-12">
							<p className="text-gray-600 text-lg mb-4">
								Select review conditions to start practicing
							</p>
							<button
								type="button"
								onClick={openReviewModal}
								className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
							>
								Start Review
							</button>
						</div>
					)}
				</div>
			</div>

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
