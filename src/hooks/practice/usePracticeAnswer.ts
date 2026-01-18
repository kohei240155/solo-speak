"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/ui/useTranslation";
import type {
	PostPracticeAnswerRequest,
	PostPracticeAnswerResponse,
	PracticeResultState,
	PracticeMode,
} from "@/types/practice";

export interface UsePracticeAnswerReturn {
	result: PracticeResultState | null;
	isSubmitting: boolean;
	submitAnswer: (
		phraseId: string,
		transcript: string,
		mode: PracticeMode
	) => Promise<PracticeResultState | null>;
	clearResult: () => void;
}

/**
 * Practice回答送信フック
 */
export function usePracticeAnswer(): UsePracticeAnswerReturn {
	const { t } = useTranslation("app");
	const [result, setResult] = useState<PracticeResultState | null>(null);
	const [isSubmitting, setIsSubmitting] = useState(false);

	const submitAnswer = useCallback(
		async (
			phraseId: string,
			transcript: string,
			mode: PracticeMode
		): Promise<PracticeResultState | null> => {
			setIsSubmitting(true);

			try {
				const requestBody: PostPracticeAnswerRequest = {
					phraseId,
					transcript,
					mode,
				};

				const data = await api.post<PostPracticeAnswerResponse>(
					"/api/phrase/practice/answer",
					requestBody
				);

				if (data.success) {
					const resultState: PracticeResultState = {
						correct: data.correct,
						similarity: data.similarity,
						transcript,
						diffResult: data.diffResult,
						newCorrectCount: data.newCorrectCount,
						isMastered: data.isMastered,
					};
					setResult(resultState);
					return resultState;
				} else {
					toast.error(t("practice.messages.submitError"));
					return null;
				}
			} catch {
				toast.error(t("practice.messages.submitError"));
				return null;
			} finally {
				setIsSubmitting(false);
			}
		},
		[t]
	);

	const clearResult = useCallback(() => {
		setResult(null);
	}, []);

	return {
		result,
		isSubmitting,
		submitAnswer,
		clearResult,
	};
}
