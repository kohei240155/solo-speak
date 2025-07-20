import { useState } from 'react'
import { useRouter } from 'next/navigation'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
  languageCode?: string
}

export function useSpeakModal() {
  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const router = useRouter()

  const openSpeakModal = () => {
    setShowSpeakModal(true)
  }

  const closeSpeakModal = () => {
    setShowSpeakModal(false)
  }

  const handleSpeakStart = (phrase: SpeakPhrase | null) => {
    if (phrase) {
      // フレーズデータと共にSpeak画面に遷移
      const languageId = phrase.languageCode || 'en'
      router.push(`/phrase/${languageId}/speak?phraseId=${phrase.id}`)
    } else {
      // エラー時はエラーメッセージを表示
      console.error('Failed to get phrase data')
    }
  }

  return {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  }
}
