import { useMutation } from "@tanstack/react-query";
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
	return useMutation({
		mutationFn: async ({ speechId }: RecordSpeechPracticeParams) => {
			return await api.post<RecordPracticeResponse>(
				`/api/speech/${speechId}/practice`,
				{},
			);
		},
		onError: (error) => {
			console.error("Failed to record practice:", error);
		},
	});
}
