import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import toast from "react-hot-toast";

interface UpdatePhraseCountParams {
	phraseId: string;
	count: number;
}

interface PhraseCountResponse {
	success: boolean;
	phrase: {
		id: string;
		original: string;
		translation: string;
		totalSpeakCount: number;
		dailySpeakCount: number;
	};
}

export function useUpdatePhraseCount() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ phraseId, count }: UpdatePhraseCountParams) => {
			const response = await api.post<PhraseCountResponse>(
				`/api/phrase/${phraseId}/count`,
				{ count },
			);
			return response;
		},
		onSuccess: () => {
			// センテンスのキャッシュを更新
			queryClient.invalidateQueries({ queryKey: ["speechSentences"] });
		},
		onError: () => {
			toast.error("Failed to update count");
		},
	});
}
