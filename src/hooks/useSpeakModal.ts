import { useState } from 'react'
import { useRouter } from 'next/navigation'

export interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
  language: string
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

  const handleSpeakStart = (config: SpeakConfig) => {
    // 設定に基づいてSpeak画面に遷移
    const queryParams = new URLSearchParams({
      order: config.order,
      prioritizeLowPractice: config.prioritizeLowPractice.toString()
    })
    router.push(`/phrase/speak?${queryParams.toString()}`)
  }

  return {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  }
}
