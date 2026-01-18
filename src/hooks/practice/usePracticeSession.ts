"use client";

import { useState, useCallback } from "react";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { useTranslation } from "@/hooks/ui/useTranslation";
import type {
	PracticeConfig,
	PracticePhrase,
	PracticeMode,
	GetPracticePhrasesResponse,
} from "@/types/practice";

export interface PracticeSession {
	phrases: PracticePhrase[];
	currentIndex: number;
	totalCount: number;
	mode: PracticeMode;
	languageId: string;
}

// セッション統計情報
export interface PracticeSessionStats {
	totalPhrases: number;
	correctCount: number;
	masteredCount: number;
}

export interface UsePracticeSessionReturn {
	session: PracticeSession | null;
	currentPhrase: PracticePhrase | null;
	isLoading: boolean;
	isAllDone: boolean;
	sessionStats: PracticeSessionStats;
	fetchSession: (config: PracticeConfig) => Promise<boolean>;
	handleNext: () => void;
	resetSession: () => void;
	recordResult: (correct: boolean, mastered: boolean) => void;
}

/**
 * Practiceセッション管理フック
 */
export function usePracticeSession(): UsePracticeSessionReturn {
	const { t } = useTranslation("app");
	const [session, setSession] = useState<PracticeSession | null>(null);
	const [isLoading, setIsLoading] = useState(false);
	const [sessionStats, setSessionStats] = useState<PracticeSessionStats>({
		totalPhrases: 0,
		correctCount: 0,
		masteredCount: 0,
	});

	const currentPhrase = session ? session.phrases[session.currentIndex] : null;
	const isAllDone = session
		? session.currentIndex >= session.phrases.length
		: false;

	const fetchSession = useCallback(
		async (config: PracticeConfig): Promise<boolean> => {
			setIsLoading(true);

			try {
				const params = new URLSearchParams({
					languageId: config.languageId,
					mode: config.mode,
				});
				if (config.questionCount !== undefined) {
					params.set("questionCount", config.questionCount.toString());
				}

				const data = await api.get<GetPracticePhrasesResponse>(
					`/api/phrase/practice?${params.toString()}`
				);

				if (data.success && data.phrases.length > 0) {
					const newSession: PracticeSession = {
						phrases: data.phrases,
						currentIndex: 0,
						totalCount: data.totalCount,
						mode: config.mode,
						languageId: config.languageId,
					};
					setSession(newSession);
					return true;
				} else {
					toast.error(t("practice.messages.noPhrasesAvailable"));
					return false;
				}
			} catch {
				toast.error(t("practice.messages.fetchError"));
				return false;
			} finally {
				setIsLoading(false);
			}
		},
		[t]
	);

	const handleNext = useCallback(() => {
		setSession((prev) => {
			if (!prev) return null;

			const nextIndex = prev.currentIndex + 1;
			return {
				...prev,
				currentIndex: nextIndex,
			};
		});
	}, []);

	const resetSession = useCallback(() => {
		setSession(null);
		setSessionStats({
			totalPhrases: 0,
			correctCount: 0,
			masteredCount: 0,
		});
	}, []);

	// 結果を記録
	const recordResult = useCallback((correct: boolean, mastered: boolean) => {
		setSessionStats((prev) => ({
			totalPhrases: prev.totalPhrases + 1,
			correctCount: prev.correctCount + (correct ? 1 : 0),
			masteredCount: prev.masteredCount + (mastered ? 1 : 0),
		}));
	}, []);

	return {
		session,
		currentPhrase,
		isLoading,
		isAllDone,
		sessionStats,
		fetchSession,
		handleNext,
		resetSession,
		recordResult,
	};
}
