import { useRouter } from "next/navigation";

interface UseAllDoneScreenProps {
	openSpeakModal: () => void;
	resetSavedConfig: () => void;
	resetAllDone: () => void;
	refetchPhraseList: () => void;
}

export function useAllDoneScreen({
	openSpeakModal,
	resetSavedConfig,
	resetAllDone,
	refetchPhraseList,
}: UseAllDoneScreenProps) {
	const router = useRouter();

	// All Done完了処理
	const handleAllDoneFinish = () => {
		refetchPhraseList();
		router.push("/phrase/list");
	};

	// All Done リトライ処理
	const handleAllDoneRetry = () => {
		// 保存された設定をリセットして、新しい設定を選択できるようにする
		resetSavedConfig();
		// All Done状態をリセット
		resetAllDone();
		// All Done画面はそのままにして、モーダルだけ開く
		openSpeakModal();
	};

	return {
		handleAllDoneFinish,
		handleAllDoneRetry,
	};
}
