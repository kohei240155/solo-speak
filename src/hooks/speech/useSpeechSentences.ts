import { useQuery } from "@tanstack/react-query";
import { api } from "@/utils/api";
import { SpeakPhrase } from "@/types/speak";

interface SpeechSentencesResponse {
	sentences: SpeakPhrase[];
}

interface UseSpeechSentencesParams {
	speechId: string;
	enabled?: boolean;
}

export function useSpeechSentences({
	speechId,
	enabled = true,
}: UseSpeechSentencesParams) {
	const { data, isLoading, error, refetch } = useQuery({
		queryKey: ["speechSentences", speechId],
		queryFn: async () => {
			const response = await api.get<SpeechSentencesResponse>(
				`/api/speech/${speechId}/sentences`,
			);
			return response.sentences;
		},
		enabled: enabled && !!speechId,
		staleTime: 0,
		refetchOnMount: true,
	});

	return {
		sentences: data ?? [],
		isLoading,
		error,
		refetch,
	};
}
