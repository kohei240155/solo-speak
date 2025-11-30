import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";

interface RecordSpeechPracticeParams {
	speechId: string;
}

interface RecordPracticeResponse {
	message: string;
	speech: {
		id: string;
		practiceCount: number;
		lastPracticedAt: Date;
	};
}

export function useRecordSpeechPractice() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ speechId }: RecordSpeechPracticeParams) => {
			return await api.post<RecordPracticeResponse>(
				`/api/speech/${speechId}/practice`,
				{},
			);
		},
		onSuccess: () => {
			// reviewSpeechのキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: ["reviewSpeech"],
			});
		},
		onError: (error) => {
			console.error("Failed to record practice:", error);
		},
	});
}
