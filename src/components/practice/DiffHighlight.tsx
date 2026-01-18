"use client";

import { useTranslation } from "@/hooks/ui/useTranslation";
import type { DiffResult } from "@/types/practice";

interface DiffHighlightProps {
	diffResult: DiffResult[];
	className?: string;
}

export default function DiffHighlight({
	diffResult,
	className = "",
}: DiffHighlightProps) {
	const { t } = useTranslation("app");

	if (!diffResult || diffResult.length === 0) {
		return null;
	}

	// 上の行（正解テキスト）: equal + delete
	const expectedParts = diffResult.filter(
		(item) => item.type === "equal" || item.type === "delete"
	);

	// 下の行（話した文）: equal + insert
	const transcriptParts = diffResult.filter(
		(item) => item.type === "equal" || item.type === "insert"
	);

	return (
		<div className={`space-y-3 ${className}`}>
			{/* 正解テキスト */}
			<div className="bg-gray-50 rounded-2xl p-4">
				<p className="text-xs text-gray-400 mb-2 font-medium">
					{t("speech.practice.correctAnswer")}
				</p>
				<p className="leading-relaxed font-medium">
					{expectedParts.map((item, index) => (
						<span
							key={index}
							className={
								item.type === "equal" ? "text-green-600" : "text-red-500"
							}
						>
							{item.value}
						</span>
					))}
				</p>
			</div>

			{/* 話した文 */}
			<div className="bg-gray-50 rounded-2xl p-4">
				<p className="text-xs text-gray-400 mb-2 font-medium">
					{t("speech.practice.youSaid")}
				</p>
				<p className="leading-relaxed font-medium">
					{transcriptParts.map((item, index) => (
						<span
							key={index}
							className={
								item.type === "equal" ? "text-green-600" : "text-red-500"
							}
						>
							{item.value}
						</span>
					))}
				</p>
			</div>
		</div>
	);
}
