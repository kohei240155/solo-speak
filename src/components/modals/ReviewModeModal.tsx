import { useState } from "react";
import { useRouter } from "next/navigation";
import ModeModal, { ModeModalConfig } from "./ModeModal";
import { Language } from "@/types/phrase";
import { useTranslation } from "@/hooks/ui/useTranslation";

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
		// モーダルを閉じる
		onClose();

		// URLパラメータを使用してReview画面に遷移
		const params = new URLSearchParams({
			language: selectedLanguage,
			speakCountFilter: speakCountFilter || "",
			excludeTodayPracticed: excludeTodayPracticed.toString(),
		});

		// Review画面に遷移
		router.push(`/speech/review?${params.toString()}`);
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
