import { useState, useCallback } from "react";
import { QuizConfig } from "@/types/quiz";
import { useRouter } from "next/navigation";

interface UseQuizModalReturn {
	showQuizModal: boolean;
	openQuizModal: () => void;
	closeQuizModal: () => void;
	handleQuizStart: (config: QuizConfig) => Promise<void>;
}

export function useQuizModal(): UseQuizModalReturn {
	const [showQuizModal, setShowQuizModal] = useState(false);
	const router = useRouter();

	const openQuizModal = useCallback(() => {
		setShowQuizModal(true);
	}, []);

	const closeQuizModal = useCallback(() => {
		setShowQuizModal(false);
	}, []);

	const handleQuizStart = useCallback(
		async (config: QuizConfig) => {
			// 設定に基づいてQuiz画面に遷移
			const queryParams = new URLSearchParams({
				language: config.language,
				mode: config.mode,
				count: (config.questionCount || 10).toString(),
			});

			// 音読回数フィルターがある場合は追加
			if (
				config.speakCountFilter !== null &&
				config.speakCountFilter !== undefined
			) {
				queryParams.append(
					"speakCountFilter",
					config.speakCountFilter.toString(),
				);
			}

			// 今日出題済み除外オプションを必ず追加（true/falseに関わらず）
			queryParams.append(
				"excludeTodayQuizzed",
				config.excludeTodayQuizzed ? "true" : "false",
			);

			router.push(`/phrase/quiz?${queryParams.toString()}`);
		},
		[router],
	);

	return {
		showQuizModal,
		openQuizModal,
		closeQuizModal,
		handleQuizStart,
	};
}
