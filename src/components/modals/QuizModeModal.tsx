import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { QuizConfig } from '@/types/quiz'
import { api } from '@/utils/api'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface QuizModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: QuizConfig) => Promise<void>
  languages: Language[]
  defaultLearningLanguage: string
}

export type { QuizConfig } from '@/types/quiz'

export default function QuizModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage }: QuizModeModalProps) {
  const { t } = useTranslation('common')
  const [mode, setMode] = useState<'normal' | 'random'>('normal')
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [speakCountFilter, setSpeakCountFilter] = useState<number | null>(50) // デフォルトは50回以上
  const [excludeTodayQuizzed, setExcludeTodayQuizzed] = useState<boolean>(true) // 今日出題済みのフレーズを除外するかどうか（デフォルトはtrue）
  const [isLoading, setIsLoading] = useState(false)

  // フレーズ数が変わった時に問題数を調整
  useEffect(() => {
    // デフォルトは10、フレーズ数が10未満の場合でも10に設定
    setQuestionCount(10)
  }, [])

  // モーダルが開かれた時に問題数を10に初期化
  useEffect(() => {
    if (isOpen) {
      setQuestionCount(10)
      setSpeakCountFilter(50) // 音読回数フィルターも初期化
      setExcludeTodayQuizzed(true) // 今日出題済み除外オプションも初期化
    }
  }, [isOpen])

  // 問題数選択のオプションを生成
  const generateQuestionCountOptions = () => {
    const baseOptions = [5, 10, 15, 20, 25, 30]
    
    // 常に全ての固定オプションを表示
    return baseOptions.map(count => ({
      value: count.toString(),
      label: `${count} ${t('quiz.modal.questions')}`
    }))
  }

  // 音読回数フィルターのオプションを生成
  const generateSpeakCountFilterOptions = () => {
    return [
      { value: '', label: t('quiz.modal.speakCountOptions.noLimit') },
      { value: '50', label: t('quiz.modal.speakCountOptions.over50') },
      { value: '60', label: t('quiz.modal.speakCountOptions.over60') },
      { value: '70', label: t('quiz.modal.speakCountOptions.over70') },
      { value: '80', label: t('quiz.modal.speakCountOptions.over80') },
      { value: '90', label: t('quiz.modal.speakCountOptions.over90') },
      { value: '100', label: t('quiz.modal.speakCountOptions.over100') }
    ]
  }

  const handleStart = async (selectedLanguage: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      // 設定オブジェクトを作成
      const config: QuizConfig = {
        mode: mode,
        language: selectedLanguage,
        questionCount: questionCount,
        speakCountFilter: speakCountFilter,
        excludeTodayQuizzed: excludeTodayQuizzed
      }
      
      // Quiz APIを呼び出してフレーズの有無を確認
      const params = new URLSearchParams({
        language: config.language,
        mode: config.mode,
        count: (config.questionCount || 10).toString()
      })

      // 音読回数フィルターがある場合は追加
      if (config.speakCountFilter !== null && config.speakCountFilter !== undefined) {
        params.append('speakCountFilter', config.speakCountFilter.toString())
      }

      // 今日出題済み除外オプションを必ず追加（true/falseに関わらず）
      params.append('excludeTodayQuizzed', config.excludeTodayQuizzed ? 'true' : 'false')

      const data = await api.get<{ success: boolean, phrases?: unknown[], message?: string }>(`/api/phrase/quiz?${params.toString()}`)
      
      if (data.success && data.phrases && data.phrases.length > 0) {
        // フレーズが見つかった場合は、モーダルを閉じてクイズを開始
        onClose()
        await onStart(config)
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        // APIメッセージではなくi18n対応されたメッセージを表示
        toast.error(t('phrase.messages.noPhrasesForQuiz'))
      }
    } catch {
      toast.error(t('quiz.messages.startError'))
    } finally {
      setIsLoading(false)
    }
  }

  // モーダル設定を定義
  const modalConfig: ModeModalConfig = {
    title: 'Quiz Mode',
    configItems: [
      {
        id: 'mode',
        label: t('quiz.modal.mode'),
        type: 'select',
        value: mode,
        options: [
          { value: 'normal', label: t('quiz.modal.options.normal') },
          { value: 'random', label: t('quiz.modal.options.random') }
        ],
        onChange: (value: string | boolean) => setMode(value as 'normal' | 'random')
      },
      {
        id: 'questionCount',
        label: t('quiz.modal.quizLength'),
        type: 'select',
        value: questionCount.toString(),
        options: generateQuestionCountOptions(),
        onChange: (value: string | boolean) => setQuestionCount(parseInt(value as string, 10))
      },
      {
        id: 'speakCountFilter',
        label: t('quiz.modal.speakCountFilter'),
        type: 'select',
        value: speakCountFilter?.toString() || '',
        options: generateSpeakCountFilterOptions(),
        onChange: (value: string | boolean) => {
          const stringValue = value as string
          setSpeakCountFilter(stringValue === '' ? null : parseInt(stringValue, 10))
        }
      },
      {
        id: 'excludeTodayQuizzed',
        label: t('quiz.modal.optionsTitle'),
        type: 'checkbox',
        value: excludeTodayQuizzed,
        checkboxLabel: t('quiz.modal.excludeTodayQuizzedLabel'), // チェックボックスの右側に表示するラベル
        onChange: (value: string | boolean) => setExcludeTodayQuizzed(value as boolean)
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
