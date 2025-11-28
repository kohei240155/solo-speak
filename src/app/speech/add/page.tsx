"use client";

import { useState } from "react";
import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import { useLanguages } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import LanguageSelector from "@/components/common/LanguageSelector";
import SpeechTabNavigation from "@/components/navigation/SpeechTabNavigation";
import SpeechAdd from "@/components/speech/SpeechAdd";

export default function SpeechAddPage() {
	const { loading: authLoading } = useAuthGuard();
	const { languages } = useLanguages();
	const { userSettings } = useAuth();

	// 言語選択の状態管理
	const [learningLanguage, setLearningLanguage] = useState<string>(
		userSettings?.defaultLearningLanguage?.code || "",
	);

	const nativeLanguage = userSettings?.nativeLanguage?.code || "";

	const handleLearningLanguageChange = (languageCode: string) => {
		setLearningLanguage(languageCode);
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
				<SpeechTabNavigation activeTab="Add" />

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					<SpeechAdd />
				</div>
			</div>
		</div>
	);
}
