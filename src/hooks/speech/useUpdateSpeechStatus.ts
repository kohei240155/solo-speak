import { useMutation, useQueryClient } from "@tanstack/react-query";
import { api } from "@/utils/api";
import toast from "react-hot-toast";
import { UpdateSpeechStatusResponse } from "@/types/speech";

interface UpdateSpeechStatusParams {
	speechId: string;
	statusId: string;
}

export function useUpdateSpeechStatus() {
	const queryClient = useQueryClient();

	return useMutation({
		mutationFn: async ({ speechId, statusId }: UpdateSpeechStatusParams) => {
			return await api.put<UpdateSpeechStatusResponse>(
				`/api/speech/${speechId}/status`,
				{ statusId },
			);
		},
		onSuccess: (data) => {
			// reviewSpeechのキャッシュを無効化して再取得
			queryClient.invalidateQueries({
				queryKey: ["reviewSpeech"],
			});
			toast.success("Status updated successfully");
			return data.speech.status;
		},
		onError: (error) => {
			console.error("Failed to update status:", error);
			toast.error("Failed to update status");
		},
	});
}
