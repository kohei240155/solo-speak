import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { getSpeakPhrase, resetSessionSpoken } from '@/hooks/useApi'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/useTranslation'

interface SpeakModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: SpeakConfig) => void
  languages: Language[]
  defaultLearningLanguage: string
}

export type { SpeakConfig } from '@/types/speak'

export default function SpeakModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage }: SpeakModeModalProps) {
  const { t } = useTranslation('common')
  const [order, setOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [excludeThreshold, setExcludeThreshold] = useState<string>('') // 空文字列は未選択を表す
  const [isLoading, setIsLoading] = useState(false)

  // モーダルが開かれたときにsession_spokenをリセット
  useEffect(() => {
    if (isOpen) {
      const resetSession = async () => {
        try {
          await resetSessionSpoken()
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

      if (data.success && data.phrase) {
        // 設定オブジェクトを作成して渡す
        const config: SpeakConfig = {
          order: order as 'new-to-old' | 'old-to-new',
          language: selectedLanguage,
          prioritizeLowPractice: true, // 常に少ない練習回数から表示
          excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined // 未選択の場合はundefined
        }
        // onStartの呼び出し前にモーダルを閉じる
        onClose()
        onStart(config)
      } else if (data.success && data.allDone) {
        // All Done状態の場合（成功レスポンスでallDoneフラグがある）
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
        const errorMessage = data.message || 'フレーズが見つかりませんでした'
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('SpeakModeModal - Error fetching phrase:', error)
      // エラーは既にAPIクライアント内でハンドリングされているため、ここでは追加でトーストを表示しない
    } finally {
      setIsLoading(false)
    }
  }

  // モーダル設定を定義
  const modalConfig: ModeModalConfig = {
    title: t('speak.modal.title'),
    configItems: [
      {
        id: 'order',
        label: t('speak.modal.startFrom'),
        type: 'select',
        value: order,
        options: [
          { value: 'new-to-old', label: t('speak.modal.options.newest') },
          { value: 'old-to-new', label: t('speak.modal.options.oldest') }
        ],
        onChange: (value: string) => setOrder(value as 'new-to-old' | 'old-to-new')
      },
      {
        id: 'excludeThreshold',
        label: t('speak.modal.excludeHighPracticeCount'),
        type: 'select',
        value: excludeThreshold,
        options: [
          { value: '', label: t('speak.modal.options.noLimit') },
          { value: '10', label: t('speak.modal.options.exclude10') },
          { value: '20', label: t('speak.modal.options.exclude20') },
          { value: '30', label: t('speak.modal.options.exclude30') },
          { value: '40', label: t('speak.modal.options.exclude40') },
          { value: '50', label: t('speak.modal.options.exclude50') },
          { value: '60', label: t('speak.modal.options.exclude60') },
          { value: '70', label: t('speak.modal.options.exclude70') },
          { value: '80', label: t('speak.modal.options.exclude80') },
          { value: '90', label: t('speak.modal.options.exclude90') },
        ],
        onChange: (value: string) => setExcludeThreshold(value)
      }
    ],
    onStart: handleStart,
    startButtonText: t('speak.modal.start')
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
