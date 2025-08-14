import { useState } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import SpeakModeExplanationModal from './SpeakModeExplanationModal'
import { Language } from '@/types/phrase'
import { SpeakConfig } from '@/types/speak'
import { getSpeakPhraseCount } from '@/utils/api-client'
import { resetSessionSpoken, resetDailySpeakCount } from '@/hooks/api/useApi'
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
  const [excludeThreshold, setExcludeThreshold] = useState<string>('50') // 初期値を50回以上に設定
  const [excludeTodayPracticed, setExcludeTodayPracticed] = useState<boolean>(true) // 今日練習済みのフレーズを除外するかどうか（デフォルトはtrue）
  const [isLoading, setIsLoading] = useState(false)
  const [showExplanationModal, setShowExplanationModal] = useState(false)


  const handleStart = async (selectedLanguage: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    try {
      // 1. セッション状態をリセット
      try {
        await resetSessionSpoken()
      } catch (error) {
        console.error('SpeakModeModal - Failed to reset session_spoken:', error)
        toast.error('セッション状態のリセットに失敗しました')
        return
      }
      
      // 2. 日次カウントをリセット
      try {
        await resetDailySpeakCount()
      } catch (error) {
        console.error('SpeakModeModal - Failed to reset daily speak count:', error)
        toast.error('日次カウントのリセットに失敗しました')
        return
      }

      // 3. フレーズ数をチェック
      const countResult = await getSpeakPhraseCount(selectedLanguage, {
        excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined,
        excludeTodayPracticed: excludeTodayPracticed
      })

      // countResultがundefinedまたはnullの場合のチェック
      if (!countResult) {
        const errorMessage = 'フレーズ数の取得に失敗しました（レスポンスが空です）'
        toast.error(errorMessage)
        return
      }

      if ('error' in countResult) {
        // エラーの場合
        const errorMessage = countResult.error || 'フレーズ数の取得に失敗しました'
        toast.error(errorMessage)
        return
      }

      if (countResult.count === 0) {
        // フレーズが0件の場合はトーストを表示してモーダルを開いたままにする
        const errorMessage = 'このモードでは練習できるフレーズがありません'
        toast.error(errorMessage)
        return
      }

      // 設定オブジェクトを作成してSpeak画面に遷移
      const config: SpeakConfig = {
        language: selectedLanguage,
        excludeIfSpeakCountGTE: excludeThreshold ? parseInt(excludeThreshold, 10) : undefined,
        excludeTodayPracticed: excludeTodayPracticed
      }
      
      // onStartの呼び出し前にモーダルを閉じる
      onClose()
      onStart(config)
    } catch (error) {
      console.error('SpeakModeModal - Error checking phrase count:', error)
      toast.error('フレーズ数の確認中にエラーが発生しました')
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
