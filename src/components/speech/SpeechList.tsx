import { SpeechListItem } from "@/types/speech";
import { useCallback } from "react";
import LoadingSpinner from "../common/LoadingSpinner";
import SpeechItem from "./SpeechItem";

interface SpeechListProps {
	speeches?: SpeechListItem[];
	isLoadingSpeeches?: boolean;
	isLoadingMore?: boolean;
	learningLanguage?: string;
}

export default function SpeechList({
	speeches = [],
	isLoadingSpeeches = false,
	isLoadingMore = false,
	learningLanguage,
}: SpeechListProps) {
	const handleSpeechClick = useCallback((speechId: string) => {
		// スピーチ詳細ページへ遷移 (実装予定)
		console.log("Speech clicked:", speechId);
		// router.push(`/speech/${speechId}`);
	}, []);

	if (!learningLanguage || isLoadingSpeeches) {
		return (
			<div className="pt-20">
				<LoadingSpinner message="Loading speeches..." />
			</div>
		);
	}

	if (speeches.length === 0) {
		return (
			<div className="text-center py-8">
				<p className="text-gray-600">No speeches yet.</p>
			</div>
		);
	}

	return (
		<>
			<div className="space-y-4 pb-32">
				{speeches.map((speech, index) => (
					<SpeechItem
						key={`${speech.id}-${index}`}
						speech={speech}
						onSpeechClick={handleSpeechClick}
					/>
				))}

				{/* 無限スクロール用のローディング */}
				{isLoadingMore && (
					<div className="py-4">
						<LoadingSpinner />
					</div>
				)}
			</div>
		</>
	);
}
