import { useState } from "react";
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
	onStart: (config: ReviewConfig) => void;
	languages: Language[];
	defaultLearningLanguage: string | undefined;
}

export default function ReviewModeModal({
	isOpen,
	onClose,
	onStart,
	languages,
	defaultLearningLanguage,
}: ReviewModeModalProps) {
	const { t } = useTranslation("common");
	const [speakCountFilter, setSpeakCountFilter] = useState<string | null>(
		"lessPractice",
	);
	const [excludeTodayPracticed, setExcludeTodayPracticed] =
		useState<boolean>(true);

	const handleStart = async (selectedLanguage: string) => {
		// 設定オブジェクトを作成
		const config: ReviewConfig = {
			language: selectedLanguage,
			speakCountFilter: speakCountFilter,
			excludeTodayPracticed: excludeTodayPracticed,
		};

		// onStartの呼び出し前にモーダルを閉じる
		onClose();
		onStart(config);
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
