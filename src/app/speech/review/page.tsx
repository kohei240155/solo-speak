"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import dynamic from "next/dynamic";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useLanguages } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import ReviewModeModal from "@/components/modals/ReviewModeModal";
import SpeechReview from "@/components/speech/SpeechReview";
import { useReviewSpeech } from "@/hooks/speech/useReviewSpeech";
import { usePageLeaveWarning } from "@/hooks/ui/usePageLeaveWarning";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { Toaster } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { SpeechReviewResponseData } from "@/types/speech";

function SpeechReviewPage() {
	const { loading: authLoading } = useAuthGuard();
	const { languages } = useLanguages();
	const { userSettings } = useAuth();
	const router = useRouter();
	const searchParams = useSearchParams();
	const { t } = useTranslation("app");
	const queryClient = useQueryClient();

	// pendingCountとviewModeの状態管理
	const [pendingCount, setPendingCount] = useState(0);
	const [viewMode, setViewMode] = useState<"review" | "practice">("review");

	// URLパラメータを取得
	const speechId = searchParams.get("speechId");
	const language = searchParams.get("language");
	const speakCountFilter = searchParams.get("speakCountFilter");
	const excludeTodayPracticed = searchParams.get("excludeTodayPracticed");

	// React Queryでスピーチを取得
	// language パラメータが存在する場合（SpeechModeモーダルからの遷移）は、speechIdベースの再取得は行わない
	const { speech } = useReviewSpeech({
		speechId: speechId,
		languageCode: language,
		speakCountFilter: (speakCountFilter || null) as
			| "lessPractice"
			| "lowStatus"
			| null,
		excludeTodayPracticed: excludeTodayPracticed === "true",
		enabled: !authLoading && (!!speechId || !!language),
	});

	// SpeechのIDを使って再取得し、キャッシュを更新する関数
	const refetchSpeechById = async () => {
		if (!speech?.id) return;

		try {
			const response = await api.get<SpeechReviewResponseData>(
				`/api/speech/${speech.id}`,
			);

			// 元のクエリキーを使ってキャッシュを更新
			queryClient.setQueryData(
				[
					"reviewSpeech",
					speechId,
					language,
					speakCountFilter,
					excludeTodayPracticed === "true",
				],
				response.speech,
			);
		} catch (error) {
			console.error("Failed to refetch speech:", error);
		}
	};

	// モーダルの状態管理
	const [showReviewModal, setShowReviewModal] = useState(false);

	// ページ離脱警告（プラクティスモードでペンディングカウントがある場合のみ）
	usePageLeaveWarning({
		hasPendingChanges: viewMode === "practice" && pendingCount > 0,
		warningMessage: t("confirm.unsavedCount"),
	});

	// 直接アクセスチェック: URLパラメータがない場合はSpeech Listに遷移
	useEffect(() => {
		const params = new URLSearchParams(window.location.search);
		// URLパラメータがない場合（直接アクセス）はSpeech Listに遷移
		// speechIdまたはlanguageのどちらかがあればOK
		if (!params.get("speechId") && !params.get("language")) {
			router.push("/speech/list");
			return;
		}
	}, [router]);

	// 未保存の変更チェック関数
	const checkUnsavedChanges = () => {
		return viewMode === "practice" && pendingCount > 0;
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
				{/* Speech タイトル */}
				<h1 className="text-gray-900 text-2xl md:text-3xl font-bold mb-[18px]">
					Speech
				</h1>

				{/* タブメニュー */}
				<SpeechTabNavigation
					activeTab="Review"
					checkUnsavedChanges={checkUnsavedChanges}
					onReviewModalOpen={openReviewModal}
				/>

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					{speech ? (
						<SpeechReview
							speech={speech}
							pendingCount={pendingCount}
							setPendingCount={setPendingCount}
							viewMode={viewMode}
							setViewMode={setViewMode}
							onRefetchSpeechById={refetchSpeechById}
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
			</div>

			{/* Review Mode モーダル */}
			<ReviewModeModal
				isOpen={showReviewModal}
				onClose={closeReviewModal}
				languages={languages || []}
				defaultLearningLanguage={
					userSettings?.defaultLearningLanguage?.code || ""
				}
			/>

			<Toaster />
		</div>
	);
}

export default dynamic(() => Promise.resolve(SpeechReviewPage), { ssr: false });
