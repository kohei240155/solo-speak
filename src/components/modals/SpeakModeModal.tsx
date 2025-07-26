import { useState } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { getSpeakPhrase } from '@/hooks/useApi'
import toast from 'react-hot-toast'

interface SpeakModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: SpeakConfig) => void
  languages: Language[]
  defaultLearningLanguage: string
}

export type { SpeakConfig } from '@/types/speak'

export default function SpeakModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage }: SpeakModeModalProps) {
  const [order, setOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [isLoading, setIsLoading] = useState(false)

  const handleStart = async (selectedLanguage: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // モード設定でAPI呼び出し
      const params = {
        language: selectedLanguage,
        order: order.replace('-', '_'), // new-to-old → new_to_old
        prioritizeLowPractice: 'true', // 常に少ない練習回数から表示
      }

      const data = await getSpeakPhrase(params)

      console.log('SpeakModeModal - API Response:', { success: data.success, hasPhrase: !!data.phrase, message: data.message })

      if (data.success && data.phrase) {
        // 設定オブジェクトを作成して渡す
        const config: SpeakConfig = {
          order: order as 'new-to-old' | 'old-to-new',
          language: selectedLanguage,
          prioritizeLowPractice: true // 常に少ない練習回数から表示
        }
        console.log('SpeakModeModal - Starting practice with config:', config)
        // onStartの呼び出し前にモーダルを閉じる
        onClose()
        onStart(config)
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        const errorMessage = data.message || 'フレーズが見つかりませんでした'
        console.warn('SpeakModeModal - No phrases found:', data.message)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('SpeakModeModal - Error fetching phrase:', error)
      // エラーは既にAPIクライアント内でハンドリングされているため、ここでは追加でトーストを表示しない
    } finally {
      console.log('SpeakModeModal - Setting loading to false')
      setIsLoading(false)
    }
  }

  // モーダル設定を定義
  const modalConfig: ModeModalConfig = {
    title: 'Speak Mode',
    configItems: [
      {
        id: 'order',
        label: 'Order',
        type: 'select',
        value: order,
        options: [
          { value: 'new-to-old', label: 'NEW → OLD' },
          { value: 'old-to-new', label: 'OLD → NEW' }
        ],
        onChange: (value: string) => setOrder(value as 'new-to-old' | 'old-to-new')
      }
    ],
    onStart: handleStart,
    startButtonText: 'Start'
  }

  return (
    <ModeModal
      isOpen={isOpen}
      onClose={onClose}
      config={modalConfig}
      languages={languages}
      defaultLearningLanguage={defaultLearningLanguage}
      isLoading={isLoading}
    />
  )
}
