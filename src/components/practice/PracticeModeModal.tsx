"use client";

import { useState, useEffect } from "react";
import BaseModal from "../common/BaseModal";
import PracticeButton from "../common/PracticeButton";
import CustomSelect, { SelectOption } from "../common/CustomSelect";
import { Language } from "@/types/phrase";
import type { PracticeConfig, PracticeMode } from "@/types/practice";
import { PRACTICE_DEFAULT_SESSION_SIZE, PRACTICE_SESSION_SIZE_OPTIONS } from "@/types/practice";
import { DEFAULT_LANGUAGE } from "@/constants/languages";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoGlobeOutline, IoSwapHorizontalOutline, IoListOutline } from "react-icons/io5";
import { IconType } from "react-icons";

interface ConfigItem {
	id: string;
	label: string;
	description: string;
	icon: IconType;
	value: string;
	options: SelectOption[];
	onChange: (value: string) => void;
}

interface PracticeModeModalProps {
	isOpen: boolean;
	onClose: () => void;
	onStart: (config: PracticeConfig) => void;
	languages: Language[];
	defaultLanguageId?: string;
}

/**
 * Practiceモード選択モーダル
 * - 学習言語選択
 * - 通常/復習モード選択
 */
export default function PracticeModeModal({
	isOpen,
	onClose,
	onStart,
	languages,
	defaultLanguageId,
}: PracticeModeModalProps) {
	const { t } = useTranslation("app");
	const [selectedLanguage, setSelectedLanguage] = useState("");
	const [selectedMode, setSelectedMode] = useState<PracticeMode>("normal");
	const [questionCount, setQuestionCount] = useState<number>(PRACTICE_DEFAULT_SESSION_SIZE);
	const [isLoading, setIsLoading] = useState(false);

	// デフォルト言語のコードを取得
	const defaultLanguageCode = languages.find(
		(l) => l.id === defaultLanguageId
	)?.code;

	// モーダルが開かれたときにモードをリセット
	useEffect(() => {
		if (isOpen) {
			const languageToSet =
				defaultLanguageCode ||
				(languages.length > 0 ? languages[0].code : DEFAULT_LANGUAGE);
			setSelectedLanguage(languageToSet);
			setSelectedMode("normal");
			setQuestionCount(PRACTICE_DEFAULT_SESSION_SIZE);
			setIsLoading(false);
		}
	}, [isOpen, defaultLanguageCode, languages]);

	// defaultLearningLanguageまたはlanguagesが変更された時も選択言語を更新
	useEffect(() => {
		if (defaultLanguageCode) {
			setSelectedLanguage(defaultLanguageCode);
		} else if (languages.length > 0 && !defaultLanguageCode) {
			setSelectedLanguage(languages[0].code);
		}
	}, [defaultLanguageCode, languages]);

	const handleStart = async () => {
		if (isLoading) return;

		setIsLoading(true);

		try {
			// 言語コードから言語IDを取得
			const selectedLang = languages.find(
				(l) => l.code === selectedLanguage
			);
			if (!selectedLang) {
				toast.error(t("practice.messages.languageNotFound"));
				return;
			}

			const languageId = selectedLang.id;

			// Practice APIを呼び出してフレーズの有無を確認
			const params = new URLSearchParams({
				languageId: languageId,
				mode: selectedMode,
			});

			const data = await api.get<{
				success: boolean;
				phrases?: unknown[];
				totalCount?: number;
				message?: string;
			}>(`/api/phrase/practice?${params.toString()}`);

			if (data.success && data.phrases && data.phrases.length > 0) {
				// フレーズが見つかった場合は、モーダルを閉じてPracticeを開始
				onClose();
				onStart({
					languageId: languageId,
					mode: selectedMode,
					questionCount: questionCount,
				});
			} else {
				// フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
				toast.error(t("practice.messages.noPhrasesAvailable"));
			}
		} catch {
			toast.error(t("practice.messages.startError"));
		} finally {
			setIsLoading(false);
		}
	};

	// 設定項目のデータ
	const configItems: ConfigItem[] = [
		{
			id: "language",
			label: t("speak.modal.language"),
			description: t("practice.modal.languageDescription"),
			icon: IoGlobeOutline,
			value: selectedLanguage,
			options: languages.map((lang) => ({
				value: lang.code,
				label: lang.name,
			})),
			onChange: (value: string) => setSelectedLanguage(value),
		},
		{
			id: "mode",
			label: t("practice.modal.selectMode"),
			description: t("practice.modal.modeDescription"),
			icon: IoSwapHorizontalOutline,
			value: selectedMode,
			options: [
				{ value: "normal", label: t("practice.modal.normalMode") },
				{ value: "review", label: t("practice.modal.reviewMode") },
			],
			onChange: (value: string) => setSelectedMode(value as PracticeMode),
		},
		{
			id: "questionCount",
			label: t("practice.modal.selectQuestionCount"),
			description: t("practice.modal.questionCountDescription"),
			icon: IoListOutline,
			value: questionCount.toString(),
			options: PRACTICE_SESSION_SIZE_OPTIONS.map((count) => ({
				value: count.toString(),
				label: count === 0 ? t("practice.modal.allQuestions") : t("practice.modal.questionCount", { count }),
			})),
			onChange: (value: string) => setQuestionCount(parseInt(value, 10)),
		},
	];

	return (
		<BaseModal
			isOpen={isOpen}
			onClose={onClose}
			title={t("practice.modal.title")}
			variant="gray"
		>
			{/* 設定項目 */}
			<div className="space-y-4 mb-8">
				{configItems.map((item) => {
					const Icon = item.icon;
					return (
						<div
							key={item.id}
							className="bg-white rounded-xl p-4"
						>
							{/* モバイル: タイトルとプルダウンを上段、説明を下段 */}
							{/* PC: タイトル+説明を左、プルダウンを右 */}
							<div className="flex items-center justify-between gap-4">
								<div className="flex-1 min-w-0">
									<h3 className="flex items-center gap-2 text-base font-semibold text-gray-900">
										<Icon className="w-5 h-5 text-gray-600 flex-shrink-0" />
										{item.label}
									</h3>
									{/* PC: 説明文をタイトル下に表示 */}
									<p className="hidden md:block text-sm text-gray-500 mt-0.5 ml-7">
										{item.description}
									</p>
								</div>
								<div className="flex-shrink-0">
									<CustomSelect
										value={item.value}
										options={item.options}
										onChange={item.onChange}
									/>
								</div>
							</div>
							{/* モバイル: 説明文を下段に表示 */}
							<p className="md:hidden text-sm text-gray-500 mt-2">
								{item.description}
							</p>
						</div>
					);
				})}
			</div>

			{/* Start ボタン */}
			<PracticeButton
				onClick={handleStart}
				disabled={isLoading}
				isLoading={isLoading}
				variant="primary"
			>
				{t("practice.modal.start")}
			</PracticeButton>
		</BaseModal>
	);
}
