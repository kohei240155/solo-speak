import { useRouter } from 'next/navigation'

interface UseAllDoneScreenProps {
  setIsSpeakCompleted: (completed: boolean) => void
  openSpeakModal: () => void
}

export function useAllDoneScreen({ setIsSpeakCompleted, openSpeakModal }: UseAllDoneScreenProps) {
  const router = useRouter()

  // All Done完了処理
  const handleAllDoneFinish = () => {
    router.push('/phrase/list')
  }

  // All Done リトライ処理
  const handleAllDoneRetry = () => {
    setIsSpeakCompleted(false)
    openSpeakModal()
  }

  return {
    handleAllDoneFinish,
    handleAllDoneRetry
  }
}
