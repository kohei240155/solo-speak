import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { SpeakConfig } from '@/types/speak'

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
      language: config.language,
      excludeTodayPracticed: (config.excludeTodayPracticed ?? true).toString()
    })
    
    // excludeIfSpeakCountGTEパラメータを追加（undefinedでない場合のみ）
    if (config.excludeIfSpeakCountGTE !== undefined) {
      queryParams.set('excludeIfSpeakCountGTE', config.excludeIfSpeakCountGTE.toString())
    }
    
    router.push(`/phrase/speak?${queryParams.toString()}`)
  }

  return {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  }
}
