import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { UpdateSpeechNotesResponse } from "@/types/speech";

interface SaveSpeechNotesParams {
	speechId: string;
	notes: string;
}

export function useSaveSpeechNotes() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ speechId, notes }: SaveSpeechNotesParams) => {
			return await api.put<UpdateSpeechNotesResponse>(
				`/api/speech/${speechId}/notes`,
				{ notes },
			);
		},
		onSuccess: () => {
			// reviewSpeechのキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: ["reviewSpeech"],
			});
			toast.success("Notes saved successfully");
		},
		onError: (error) => {
			console.error("Failed to save notes:", error);
			toast.error("Failed to save notes");
		},
	});
}
