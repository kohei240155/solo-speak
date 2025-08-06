import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import SpeakModeExplanationModal from './SpeakModeExplanationModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { getSpeakPhrase, resetSessionSpoken } from '@/hooks/api/useApi'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'
import { AiOutlineQuestionCircle } from 'react-icons/ai'

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
  const [excludeThreshold, setExcludeThreshold] = useState<string>('50') // 初期値を50回以上に設定
  const [excludeTodayPracticed, setExcludeTodayPracticed] = useState<boolean>(false) // 今日練習済みのフレーズを除外するかどうか
  const [isLoading, setIsLoading] = useState(false)
  const [showExplanationModal, setShowExplanationModal] = useState(false)

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
        excludeIfSpeakCountGTE: excludeThreshold || undefined, // 未選択の場合はundefined
        excludeTodayPracticed: excludeTodayPracticed ? 'true' : 'false' // 明示的にfalseも送信
      }

      const data = await getSpeakPhrase(params)

      if (data.success && data.phrase) {
        // 設定オブジェクトを作成して渡す
        const config: SpeakConfig = {
          order: order as 'new-to-old' | 'old-to-new',
          language: selectedLanguage,
          prioritizeLowPractice: true, // 常に少ない練習回数から表示
          excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined, // 未選択の場合はundefined
          excludeTodayPracticed: excludeTodayPracticed // 今日練習済みを除外するかどうか
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
          excludeTodayPracticed: excludeTodayPracticed, // 今日練習済みを除外するかどうか
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
    title: 'Speak Mode',
    titleButton: {
      icon: AiOutlineQuestionCircle,
      onClick: () => setShowExplanationModal(true)
    },
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
        onChange: (value: string | boolean) => setOrder(value as 'new-to-old' | 'old-to-new')
      },
      {
        id: 'excludeThreshold',
        label: t('speak.modal.targetPhrases'),
        type: 'select',
        value: excludeThreshold,
        options: [
          { value: '', label: t('speak.modal.options.noLimit') },
          { value: '50', label: t('speak.modal.options.under50') },
          { value: '60', label: t('speak.modal.options.under60') },
          { value: '70', label: t('speak.modal.options.under70') },
          { value: '80', label: t('speak.modal.options.under80') },
          { value: '90', label: t('speak.modal.options.under90') },
          { value: '100', label: t('speak.modal.options.under100') }
        ],
        onChange: (value: string | boolean) => setExcludeThreshold(value as string)
      },
      {
        id: 'excludeTodayPracticed',
        label: t('speak.modal.optionsTitle'),
        type: 'checkbox',
        value: excludeTodayPracticed,
        checkboxLabel: t('speak.modal.excludeTodayPracticedLabel'), // チェックボックスの右側に表示するラベル
        onChange: (value: string | boolean) => setExcludeTodayPracticed(value as boolean)
      }
    ],
    onStart: handleStart,
    startButtonText: 'Start'
  }

  return (
    <>
      <ModeModal
        isOpen={isOpen}
        onClose={onClose}
        config={modalConfig}
        languages={languages}
        defaultLearningLanguage={defaultLearningLanguage}
        isLoading={isLoading}
      />
      
      <SpeakModeExplanationModal
        isOpen={showExplanationModal}
        onClose={() => setShowExplanationModal(false)}
      />
    </>
  )
}
