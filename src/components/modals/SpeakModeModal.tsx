import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { api } from '@/utils/api'
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
  const [excludeSpeakCountThreshold, setExcludeSpeakCountThreshold] = useState<number>(0)

  // モーダルが開かれたときにセッション設定をリセット
  useEffect(() => {
    if (isOpen && defaultLearningLanguage) {
      const resetSessionSpoken = async () => {
        try {
          await api.post('/api/speak/reset', {
            language: defaultLearningLanguage
          })
          console.log('Session spoken flags reset successfully')
        } catch (error) {
          console.error('Failed to reset session spoken flags:', error)
          toast.error('Failed to reset session settings')
        }
      }
      
      resetSessionSpoken()
    }
  }, [isOpen, defaultLearningLanguage])

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
      },
      {
        id: 'excludeSpeakCountThreshold',
        label: 'Exclude phrases with more than',
        type: 'select',
        value: excludeSpeakCountThreshold.toString(),
        options: Array.from({ length: 11 }, (_, i) => ({
          value: (i * 10).toString(),
          label: i === 0 ? 'No exclusion' : `${i * 10} times`
        })),
        onChange: (value: string) => setExcludeSpeakCountThreshold(parseInt(value))
      }
    ],
    onStart: async (selectedLanguage: string) => {
      // 設定オブジェクトを作成して渡す
      const config: SpeakConfig = {
        order: order as 'new-to-old' | 'old-to-new',
        language: selectedLanguage,
        prioritizeLowPractice: true, // 常に少ない練習回数から表示
        excludeSpoken: false, // 初回は除外しない
        spokenPhraseIds: [], // 初回は空
        excludeSpeakCountThreshold: excludeSpeakCountThreshold // 除外する音読回数の閾値
      }
      console.log('SpeakModeModal - Starting practice with config:', config)
      console.log('excludeSpeakCountThreshold value:', excludeSpeakCountThreshold)
      
      // 実際の処理を開始
      await onStart(config)
      // モーダルのクローズ処理は呼び出し元で処理される
    },
    startButtonText: 'Start'
  }

  return (
    <ModeModal
      isOpen={isOpen}
      onClose={onClose}
      config={modalConfig}
      languages={languages}
      defaultLearningLanguage={defaultLearningLanguage}
    />
  )
}
