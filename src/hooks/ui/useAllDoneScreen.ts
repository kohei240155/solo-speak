import { useRouter } from "next/navigation";

interface UseAllDoneScreenProps {
  openSpeakModal: () => void;
  resetSavedConfig: () => void;
}

export function useAllDoneScreen({
  openSpeakModal,
  resetSavedConfig,
}: UseAllDoneScreenProps) {
  const router = useRouter();

  // All Done完了処理
  const handleAllDoneFinish = () => {
    router.push("/phrase/list");
  };

  // All Done リトライ処理
  const handleAllDoneRetry = () => {
    // 保存された設定をリセットして、新しい設定を選択できるようにする
    resetSavedConfig();
    // All Done画面はそのままにして、モーダルだけ開く
    openSpeakModal();
  };

  return {
    handleAllDoneFinish,
    handleAllDoneRetry,
  };
}
