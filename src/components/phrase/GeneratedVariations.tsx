import { PhraseVariation } from "@/types/phrase";
import { useScrollPreservation } from "@/hooks/ui/useScrollPreservation";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { useState, useEffect } from "react";
import { IoSparkles, IoBulbOutline } from "react-icons/io5";

interface GeneratedVariationsProps {
	generatedVariations: PhraseVariation[];
	editingVariations: { [key: number]: string };
	editingTranslations: { [key: number]: string };
	isSaving: boolean;
	savingVariationIndex: number | null;
	desiredPhrase: string;
	onEditVariation: (index: number, newText: string) => void;
	onEditTranslation: (index: number, newText: string) => void;
	onSelectVariation: (variation: PhraseVariation, index: number) => void;
	error: string;
}

export default function GeneratedVariations({
	generatedVariations,
	editingVariations,
	editingTranslations,
	isSaving,
	savingVariationIndex,
	desiredPhrase,
	onEditVariation,
	onEditTranslation,
	onSelectVariation,
	error,
}: GeneratedVariationsProps) {
	const { t } = useTranslation("app");
	// スクロール位置保持機能
	const scrollPreservation = useScrollPreservation();
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		if (generatedVariations.length > 0) {
			setIsVisible(false);
			const timer = setTimeout(() => setIsVisible(true), 10);
			return () => clearTimeout(timer);
		}
	}, [generatedVariations]);

	if (generatedVariations.length === 0) {
		return null;
	}

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
						{t("phrase.generatedPhrases.title")}
					</h3>
				</div>
				<p className="text-sm text-gray-500 mt-1 ml-7">
					{t("phrase.generatedPhrases.description")}
				</p>
			</div>

			{generatedVariations.map((variation, index) => (
				<div key={index} className="mb-6">
					{/* フレーズカード */}
					<div
						className={`relative rounded-xl p-5 bg-white shadow-md border border-gray-100 ${
							isSaving && savingVariationIndex === index ? "opacity-60" : ""
						}`}
					>
						{/* フレーズ番号 */}
						<div className="mb-3 flex items-center gap-2">
							<IoBulbOutline className="w-5 h-5 text-gray-600" />
							<span className="text-xl font-bold text-gray-800">
								Phrase {index + 1}
							</span>
						</div>

						{/* 編集可能なテキストエリア */}
						<div className="mb-4">
							<textarea
								value={editingVariations[index] || variation.original}
								onChange={(e) => onEditVariation(index, e.target.value)}
								onFocus={scrollPreservation.onFocus}
								onBlur={scrollPreservation.onBlur}
								className={`w-full border rounded-lg px-4 py-3 text-lg font-medium resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 text-gray-900 leading-relaxed ${
									(editingVariations[index] || variation.original).length > 200
										? "border-gray-400"
										: "border-gray-200"
								}`}
								rows={2}
								disabled={isSaving}
							/>
						</div>

						{/* 200文字を超えた場合のバリデーションメッセージ */}
						{(editingVariations[index] || variation.original).length > 200 && (
							<div className="mb-4 p-3 border border-gray-300 rounded-lg bg-gray-50">
								<p className="text-sm text-gray-600">
									{t("phrase.validation.variationMaxLength")}
								</p>
							</div>
						)}

						{/* 翻訳 - 編集可能 */}
						{variation.translation && (
							<div className="mb-4">
								<textarea
									value={editingTranslations[index] || variation.translation}
									onChange={(e) => onEditTranslation(index, e.target.value)}
									onFocus={scrollPreservation.onFocus}
									onBlur={scrollPreservation.onBlur}
									className="w-full bg-gray-50 border border-gray-100 rounded-lg px-4 py-3 text-gray-700 resize-none focus:outline-none focus:ring-2 focus:ring-gray-400 focus:bg-white"
									rows={2}
									disabled={isSaving}
								/>
							</div>
						)}

						{/* 解説 */}
						{variation.explanation && (
							<div className="pt-3 border-t border-gray-100">
								<p className="text-sm text-gray-600 leading-relaxed">
									{variation.explanation}
								</p>
							</div>
						)}
					</div>

					{/* Selectボタン */}
					<div className="mt-4">
						<button
							disabled={
								isSaving ||
								desiredPhrase.length > 100 ||
								(editingVariations[index] || variation.original).length > 200
							}
							className={`w-full py-3 sm:py-4 px-6 rounded-xl font-medium transition-all duration-300 border ${
								isSaving && savingVariationIndex === index
									? "bg-[#8a8a8a] text-white border-transparent cursor-wait"
									: desiredPhrase.length > 100 ||
										  (editingVariations[index] || variation.original).length > 200
										? "bg-gray-50 text-gray-400 cursor-not-allowed border-gray-200"
										: "bg-[#616161] text-white border-transparent hover:bg-[#525252] hover:shadow-lg active:scale-[0.98]"
							}`}
							onClick={() => onSelectVariation(variation, index)}
						>
							{isSaving && savingVariationIndex === index ? (
								<div className="flex items-center justify-center gap-3">
									<span>{t("common.saving")}</span>
									<span className="flex gap-1">
										<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
										<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
										<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
									</span>
								</div>
							) : (
								t("phrase.generatedPhrases.select")
							)}
						</button>
					</div>
				</div>
			))}

			{/* エラーメッセージ */}
			{error && (
				<div className="mt-4 p-4 bg-red-50 border border-red-100 text-red-600 text-sm rounded-xl">
					{error}
				</div>
			)}
		</div>
	);
}
