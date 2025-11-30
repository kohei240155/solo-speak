"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useLanguages } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import ReviewModeModal from "@/components/modals/ReviewModeModal";
import SpeechReview from "@/components/speech/SpeechReview";
import { useReviewSpeech } from "@/hooks/speech/useReviewSpeech";
import { Toaster } from "react-hot-toast";

function SpeechReviewPage() {
	const { loading: authLoading } = useAuthGuard();
	const { languages } = useLanguages();
	const { userSettings } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();

	// URLパラメータを取得
	const language = searchParams.get("language");
	const speakCountFilter = searchParams.get("speakCountFilter");
	const excludeTodayPracticed = searchParams.get("excludeTodayPracticed");

	// React Queryでスピーチを取得
	const { speech } = useReviewSpeech({
		languageCode: language,
		speakCountFilter: (speakCountFilter || null) as
			| "lessPractice"
			| "lowStatus"
			| null,
		excludeTodayPracticed: excludeTodayPracticed === "true",
		enabled: !authLoading && !!language,
	});

	// 言語選択の状態管理
	const [learningLanguage, setLearningLanguage] = useState<string>(
		userSettings?.defaultLearningLanguage?.code || "",
	);

	// モーダルの状態管理
	const [showReviewModal, setShowReviewModal] = useState(false);

	const nativeLanguage = userSettings?.nativeLanguage?.code || "";

	// userSettingsが更新されたら学習言語を同期
	useEffect(() => {
		if (userSettings?.defaultLearningLanguage?.code && !learningLanguage) {
			setLearningLanguage(userSettings.defaultLearningLanguage.code);
		}
	}, [userSettings, learningLanguage]);

	// 直接アクセスチェック: URLパラメータがない場合はSpeech Listに遷移
	useEffect(() => {
		if (learningLanguage) {
			const params = new URLSearchParams(window.location.search);
			// URLパラメータがない場合（直接アクセス）はSpeech Listに遷移
			if (!params.toString()) {
				router.push("/speech/list");
				return;
			}
		}
	}, [learningLanguage, router]);

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
					{speech ? (
						<SpeechReview speech={speech} />
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

export default dynamic(() => Promise.resolve(SpeechReviewPage), { ssr: false });
