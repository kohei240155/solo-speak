import { useState } from "react";
import { useRouter } from "next/navigation";
import ModeModal, { ModeModalConfig } from "./ModeModal";
import { Language } from "@/types/phrase";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { SpeechReviewCountResponse } from "@/types/speech";
import toast from "react-hot-toast";
import { api } from "@/utils/api";

export interface ReviewConfig {
	language: string;
	speakCountFilter: string | null;
	excludeTodayPracticed: boolean;
}

interface ReviewModeModalProps {
	isOpen: boolean;
	onClose: () => void;
	languages: Language[];
	defaultLearningLanguage: string | undefined;
}

export default function ReviewModeModal({
	isOpen,
	onClose,
	languages,
	defaultLearningLanguage,
}: ReviewModeModalProps) {
	const { t } = useTranslation("common");
	const router = useRouter();
	const [speakCountFilter, setSpeakCountFilter] = useState<string | null>(
		"lessPractice",
	);
	const [excludeTodayPracticed, setExcludeTodayPracticed] =
		useState<boolean>(true);

	const handleStart = async (selectedLanguage: string) => {
		try {
			// APIを呼び出して対象のスピーチ数を確認
			const params = new URLSearchParams({
				languageCode: selectedLanguage,
				speakCountFilter: speakCountFilter || "",
				excludeTodayPracticed: excludeTodayPracticed.toString(),
			});

			const data = await api.get<SpeechReviewCountResponse>(
				`/api/speech/review/count?${params.toString()}`,
			);

			// 対象のスピーチが0件の場合
			if (data.count === 0) {
				toast.error(t("review.messages.noSpeechesAvailable"));
				return;
			}

			// モーダルを閉じる
			onClose();

			// URLパラメータを使用してReview画面に遷移
			const reviewParams = new URLSearchParams({
				language: selectedLanguage,
				speakCountFilter: speakCountFilter || "",
				excludeTodayPracticed: excludeTodayPracticed.toString(),
			});

			// Review画面に遷移
			router.push(`/speech/review?${reviewParams.toString()}`);
		} catch (error) {
			console.error("Error checking speech count:", error);
			toast.error(t("review.messages.countError"));
		}
	};

	// 出題対象のオプションを生成
	const generateSpeakCountFilterOptions = () => {
		return [
			{ value: "lessPractice", label: t("review.modal.options.lessPractice") },
			{ value: "lowStatus", label: t("review.modal.options.lowStatus") },
		];
	};

	// モーダル設定を定義
	const modalConfig: ModeModalConfig = {
		title: "Review Mode",
		configItems: [
			{
				id: "speakCountFilter",
				label: t("review.modal.targetPhrases"),
				type: "select",
				value: speakCountFilter?.toString() || "",
				options: generateSpeakCountFilterOptions(),
				onChange: (value: string | boolean) => {
					const stringValue = value as string;
					setSpeakCountFilter(stringValue === "" ? null : stringValue);
				},
			},
			{
				id: "excludeTodayPracticed",
				label: t("review.modal.optionsTitle"),
				type: "checkbox",
				value: excludeTodayPracticed,
				checkboxLabel: t("review.modal.excludeTodayPracticedLabel"),
				onChange: (value: string | boolean) =>
					setExcludeTodayPracticed(value as boolean),
			},
		],
		onStart: handleStart,
		startButtonText: "Start",
	};

	return (
		<ModeModal
			isOpen={isOpen}
			onClose={onClose}
			config={modalConfig}
			languages={languages}
			defaultLearningLanguage={defaultLearningLanguage}
		/>
	);
}
