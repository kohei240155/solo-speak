import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { getSpeakPhrase, resetSessionSpoken } from '@/hooks/useApi'
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
  const [excludeThreshold, setExcludeThreshold] = useState<string>('') // 空文字列は未選択を表す
  const [isLoading, setIsLoading] = useState(false)

  // モーダルが開かれたときにsession_spokenをリセット
  useEffect(() => {
    if (isOpen) {
      const resetSession = async () => {
        try {
          console.log('SpeakModeModal - Resetting session_spoken for all user phrases')
          await resetSessionSpoken()
          console.log('SpeakModeModal - Successfully reset session_spoken')
        } catch (error) {
          console.error('SpeakModeModal - Failed to reset session_spoken:', error)
          // エラーが発生してもモーダルの表示は継続する
        }
      }
      resetSession()
    }
  }, [isOpen])

  const handleStart = async (selectedLanguage: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // モード設定でAPI呼び出し
      const params = {
        language: selectedLanguage,
        order: order.replace('-', '_'), // new-to-old → new_to_old
        prioritizeLowPractice: 'true', // 常に少ない練習回数から表示
        excludeIfSpeakCountGTE: excludeThreshold || undefined // 未選択の場合はundefined
      }

      const data = await getSpeakPhrase(params)

      console.log('SpeakModeModal - API Response:', { 
        success: data.success, 
        hasPhrase: !!data.phrase, 
        allDone: data.allDone,
        message: data.message,
        fullResponse: data
      })

      if (data.success && data.phrase) {
        // 設定オブジェクトを作成して渡す
        console.log('SpeakModeModal - Branch: Normal phrase found')
        const config: SpeakConfig = {
          order: order as 'new-to-old' | 'old-to-new',
          language: selectedLanguage,
          prioritizeLowPractice: true, // 常に少ない練習回数から表示
          excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined // 未選択の場合はundefined
        }
        console.log('SpeakModeModal - Starting practice with config:', config)
        // onStartの呼び出し前にモーダルを閉じる
        onClose()
        onStart(config)
      } else if (data.success && data.allDone) {
        // All Done状態の場合（成功レスポンスでallDoneフラグがある）
        console.log('SpeakModeModal - Branch: All Done detected')
        // モーダルを閉じてAll Done画面を表示させる（トーストは表示しない）
        onClose()
        // onStartにall doneフラグを付けて呼び出し
        onStart({ 
          order: order as 'new-to-old' | 'old-to-new',
          language: selectedLanguage,
          prioritizeLowPractice: true,
          excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined,
          allDone: true 
        } as SpeakConfig & { allDone: boolean })
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        console.log('SpeakModeModal - Branch: Error case')
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
      },
      {
        id: 'excludeThreshold',
        label: 'Exclude High Practice Count',
        type: 'select',
        value: excludeThreshold,
        options: [
          { value: '', label: 'No limit' },
          { value: '10', label: 'Exclude 10+ times' },
          { value: '20', label: 'Exclude 20+ times' },
          { value: '30', label: 'Exclude 30+ times' },
          { value: '40', label: 'Exclude 40+ times' },
          { value: '50', label: 'Exclude 50+ times' },
          { value: '60', label: 'Exclude 60+ times' },
          { value: '70', label: 'Exclude 70+ times' },
          { value: '80', label: 'Exclude 80+ times' },
          { value: '90', label: 'Exclude 90+ times' },
          { value: '100', label: 'Exclude 100+ times' }
        ],
        onChange: (value: string) => setExcludeThreshold(value)
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
