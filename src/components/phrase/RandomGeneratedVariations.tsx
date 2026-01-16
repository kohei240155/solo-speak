import { RandomPhraseVariation } from "@/types/phrase";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoSparkles } from "react-icons/io5";
import { useState, useEffect } from "react";

interface RandomGeneratedVariationsProps {
	randomGeneratedVariations: RandomPhraseVariation[];
	isRandomSaving: boolean;
	error: string;
	onSave: () => void;
}

export default function RandomGeneratedVariations({
	randomGeneratedVariations,
	isRandomSaving,
	error,
	onSave,
}: RandomGeneratedVariationsProps) {
	const { t } = useTranslation("app");
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (randomGeneratedVariations.length > 0) {
			setIsVisible(false);
			const timer = setTimeout(() => setIsVisible(true), 10);
			return () => clearTimeout(timer);
		}
	}, [randomGeneratedVariations]);

	if (randomGeneratedVariations.length === 0) {
		return null;
	}

	const variation = randomGeneratedVariations[0];

	return (
		<div
			className={`mt-8 transition-all duration-500 ease-out ${
				isVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
			}`}
		>
			{/* ヘッダー */}
			<div className="mb-5">
				<div className="flex items-center gap-2">
					<IoSparkles className="w-5 h-5 text-gray-600" />
					<h3 className="text-lg font-semibold text-gray-900">
						{t("phrase.randomMode.title")}
					</h3>
				</div>
				<p className="text-sm text-gray-500 mt-1 ml-7">
					{t("phrase.randomMode.description")}
				</p>
			</div>

			{/* フレーズカード */}
			<div
				className={`relative rounded-xl p-5 bg-white shadow-md border border-gray-100 ${
					isRandomSaving ? "opacity-60" : ""
				}`}
			>
				{/* フレーズ本文 */}
				<div className="mb-4">
					<p className="text-gray-900 text-lg font-medium leading-relaxed">
						{variation.original}
					</p>
				</div>

				{/* 翻訳 - インナーカード */}
				<div className="bg-gray-50 rounded-lg p-4 mb-4 border border-gray-100">
					<p className="text-gray-700">{variation.translation}</p>
				</div>

				{/* 解説 */}
				{variation.explanation && (
					<div className="pt-3 border-t border-gray-100">
						<p className="text-sm text-gray-600 leading-relaxed">
							{variation.explanation}
						</p>
					</div>
				)}
			</div>

			{/* Saveボタン */}
			<div className="mt-6">
				<button
					disabled={isRandomSaving}
					className={`w-full py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300 border ${
						isRandomSaving
							? "bg-[#8a8a8a] text-white border-transparent cursor-wait"
							: "bg-[#616161] text-white border-transparent hover:bg-[#525252] hover:shadow-lg active:scale-[0.98]"
					}`}
					onClick={onSave}
				>
					{isRandomSaving ? (
						<div className="flex items-center justify-center gap-3">
							<span>{t("common.saving")}</span>
							<span className="flex gap-1">
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
								<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
							</span>
						</div>
					) : (
						t("phrase.randomMode.save")
					)}
				</button>
			</div>

			{/* エラーメッセージ */}
			{error && (
				<div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
					{error}
				</div>
			)}
		</div>
	);
}
