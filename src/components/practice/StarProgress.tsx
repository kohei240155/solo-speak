"use client";

import { FaStar, FaRegStar } from "react-icons/fa";
import type { PracticeMode } from "@/types/practice";

interface StarProgressProps {
	current: number;
	total: number;
	mode: PracticeMode;
	className?: string;
}

export default function StarProgress({
	current,
	total,
	mode,
	className = "",
}: StarProgressProps) {
	// レビューモード: ★×数字 形式
	if (mode === "review") {
		return (
			<div className={`flex items-center gap-1 ${className}`}>
				<FaStar className="w-3.5 h-3.5 text-yellow-400" />
				<span className="text-sm text-gray-500">×{current}</span>
			</div>
		);
	}

	// 通常モード: 星を並べて表示
	return (
		<div className={`flex items-center gap-0.5 ${className}`}>
			{Array.from({ length: total }, (_, i) => (
				<span key={i}>
					{i < current ? (
						<FaStar className="w-3.5 h-3.5 text-yellow-400" />
					) : (
						<FaRegStar className="w-3.5 h-3.5 text-gray-300" />
					)}
				</span>
			))}
		</div>
	);
}
