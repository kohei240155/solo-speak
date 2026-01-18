import { useState, useCallback } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { IoSparkles, IoPlay } from "react-icons/io5";

// バウンスドットアニメーション（PracticeButtonと同じ）
function BounceDots() {
	return (
		<span className="flex gap-1">
			<span
				className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
				style={{ animationDelay: "0ms" }}
			/>
			<span
				className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
				style={{ animationDelay: "150ms" }}
			/>
			<span
				className="w-1.5 h-1.5 bg-white rounded-full animate-bounce"
				style={{ animationDelay: "300ms" }}
			/>
		</span>
	);
}

interface AIDemoProps {
	visibleSections: Set<string>;
}

export default function AIDemo({ visibleSections }: AIDemoProps) {
	const { t } = useTranslation("landing");
	const [isDemoActive, setIsDemoActive] = useState(false);
	const [showTranslation, setShowTranslation] = useState(false);

	const handleAISuggestClick = useCallback(() => {
		if (isDemoActive) return; // 既に実行中なら何もしない

		setIsDemoActive(true);
		setShowTranslation(false);

		// 1.5秒後にローディング停止、翻訳表示
		setTimeout(() => {
			setIsDemoActive(false);
			setShowTranslation(true);
		}, 1500);
	}, [isDemoActive]);

	return (
		<div
			id="feature-1"
			data-scroll-animation
			className={`flex flex-col lg:flex-row items-center gap-8 transition-all duration-1000 ease-out mx-0 lg:mx-auto max-w-none lg:max-w-7xl ${
				visibleSections.has("feature-1")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
			style={{
				opacity: visibleSections.has("feature-1") ? 1 : 0,
				transform: visibleSections.has("feature-1")
					? "translateY(0)"
					: "translateY(32px)",
			}}
		>
			<div className="lg:w-1/2 space-y-8">
				<div
					className="inline-flex items-center justify-center w-16 h-16 text-white rounded-2xl text-2xl font-bold mb-6 bg-gray-900"
				>
					{t("home.solutions.feature1.number")}
				</div>
				<h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
					{t("home.solutions.feature1.title")}
					<br />
				</h3>
				<p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
					{t("home.solutions.feature1.description")}
				</p>
			</div>
			<div className="lg:w-1/2">
				<div className="bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 md:p-8 rounded-2xl shadow-2xl border border-gray-200 mx-0">
					<div className="w-full max-w-none lg:max-w-xl mx-auto space-y-3">
						{/* 入力フィールド */}
						<div className="relative">
							<div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
								<span className="text-gray-900 font-semibold text-lg">
									{t("home.solutions.feature1.demo.input")}
								</span>
							</div>
							{/* 下向き矢印 */}
							<div className="flex justify-center mt-4">
								<svg
									className="w-5 h-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 14l-7 7m0 0l-7-7m7 7V3"
									/>
								</svg>
							</div>
						</div>

						{/* 生成ボタン */}
						<div className="flex justify-center py-1">
							<button
								className={`text-white h-12 w-full rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed bg-gray-900 hover:bg-gray-800 shadow-[0_2px_6px_rgba(0,0,0,0.2)]`}
								onClick={handleAISuggestClick}
								disabled={isDemoActive || showTranslation}
							>
								{isDemoActive ? (
									<div className="flex items-center justify-center gap-3">
										<span>{t("home.solutions.feature1.demo.generating")}</span>
										<BounceDots />
									</div>
								) : (
									t("home.solutions.feature1.demo.button")
								)}
							</button>
						</div>
						{/* 下向き矢印 - 翻訳表示完了時に表示 */}
						{showTranslation && (
							<div className="flex justify-center">
								<svg
									className="w-5 h-5 text-gray-400"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M19 14l-7 7m0 0l-7-7m7 7V3"
									/>
								</svg>
							</div>
						)}

						{/* 結果表示 - 3つの翻訳 */}
						<div
							className={`relative transition-all duration-500 ${showTranslation ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"}`}
						>
							{/* ヘッダー */}
							<div className="mb-4">
								<div className="flex items-center gap-2">
									<IoSparkles className="w-5 h-5 text-gray-600" />
									<span className="text-lg font-semibold text-gray-900">
										{t("home.solutions.feature1.demo.resultsTitle")}
									</span>
								</div>
							</div>

							<div className="space-y-4">
								{(() => {
									const output1 = t("home.solutions.feature1.demo.outputs.0");
									const output2 = t("home.solutions.feature1.demo.outputs.1");
									const output3 = t("home.solutions.feature1.demo.outputs.2");

									const outputs = [output1, output2, output3];

									return outputs.map((output: string, index: number) => (
										<div
											key={index}
											className={`rounded-xl p-4 shadow-md transition-all duration-200 cursor-pointer hover:shadow-lg hover:scale-[1.02] ${
												index === 0
													? "bg-gray-100 border-2 border-gray-400"
													: "bg-white border border-gray-100 hover:bg-gray-50"
											}`}
										>
											{/* フレーズ番号 */}
											<div className="mb-2 flex items-center gap-2">
												<IoPlay className="w-4 h-4 text-gray-600" />
												<span className="text-base font-bold text-gray-800">
													Phrase {index + 1}
												</span>
											</div>
											{/* フレーズテキスト */}
											<p className="font-medium leading-relaxed text-gray-900">
												{output}
											</p>
										</div>
									));
								})()}
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
