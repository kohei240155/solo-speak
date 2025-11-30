import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { SpeechReviewResponseData } from "@/types/speech";

interface UseReviewSpeechParams {
	speechId?: string | null;
	languageCode?: string | null;
	speakCountFilter?: "lessPractice" | "lowStatus" | null;
	excludeTodayPracticed?: boolean;
	enabled?: boolean;
}

export function useReviewSpeech({
	speechId = null,
	languageCode = null,
	speakCountFilter = null,
	excludeTodayPracticed = true,
	enabled = true,
}: UseReviewSpeechParams) {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: [
			"reviewSpeech",
			speechId,
			languageCode,
			speakCountFilter,
			excludeTodayPracticed,
		],
		queryFn: async () => {
			// speechIdが指定されている場合は、そのスピーチを直接取得
			if (speechId) {
				const params = new URLSearchParams({
					speechId,
				});

				const response = await api.get<SpeechReviewResponseData>(
					`/api/speech/review?${params.toString()}`,
				);

				return response.speech;
			}

			// speechIdがない場合は従来通りの条件検索
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
		enabled: enabled && (!!speechId || !!languageCode),
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
