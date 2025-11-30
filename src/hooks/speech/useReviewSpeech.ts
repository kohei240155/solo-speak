import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { SpeechReviewResponseData } from "@/types/speech";

interface UseReviewSpeechParams {
	languageCode: string | null;
	speakCountFilter?: "lessPractice" | "lowStatus" | null;
	excludeTodayPracticed?: boolean;
	enabled?: boolean;
}

export function useReviewSpeech({
	languageCode,
	speakCountFilter = null,
	excludeTodayPracticed = true,
	enabled = true,
}: UseReviewSpeechParams) {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: [
			"reviewSpeech",
			languageCode,
			speakCountFilter,
			excludeTodayPracticed,
		],
		queryFn: async () => {
			if (!languageCode) {
				return null;
			}

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
		},
		enabled: enabled && !!languageCode,
		staleTime: 0,
		refetchOnMount: true,
	});

	return {
		speech: data ?? null,
		isLoading,
		error: error instanceof Error ? error.message : null,
		refetch,
	};
}
