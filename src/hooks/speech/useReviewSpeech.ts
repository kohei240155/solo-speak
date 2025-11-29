import { useState } from "react";
import { api } from "@/utils/api";
import { SpeechReviewResponseData } from "@/types/speech";

interface UseReviewSpeechParams {
	languageCode: string;
	speakCountFilter?: "lessPractice" | "lowStatus" | null;
	excludeTodayPracticed?: boolean;
}

export function useReviewSpeech() {
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const fetchReviewSpeech = async ({
		languageCode,
		speakCountFilter = null,
		excludeTodayPracticed = true,
	}: UseReviewSpeechParams): Promise<SpeechReviewResponseData["speech"]> => {
		setLoading(true);
		setError(null);

		try {
			const params = new URLSearchParams({
				languageCode,
				excludeTodayPracticed: excludeTodayPracticed.toString(),
			});

			if (speakCountFilter) {
				params.append("speakCountFilter", speakCountFilter);
			}

			const response = await api.get<SpeechReviewResponseData>(
				`/api/speech/review?${params.toString()}`,
			);

			return response.speech;
		} catch (err) {
			const errorMessage =
				err instanceof Error ? err.message : "Failed to fetch review speech";
			setError(errorMessage);
			throw err;
		} finally {
			setLoading(false);
		}
	};

	return {
		fetchReviewSpeech,
		loading,
		error,
	};
}
