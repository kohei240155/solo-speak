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
  availablePhraseCount: number
}

export type { QuizConfig } from '@/types/quiz'

export default function QuizModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage, availablePhraseCount }: QuizModeModalProps) {
  const { t } = useTranslation('common')
  const [mode, setMode] = useState<'normal' | 'random'>('normal')
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [speakCountFilter, setSpeakCountFilter] = useState<number | null>(50) // デフォルトは50回以上
  const [isLoading, setIsLoading] = useState(false)

  // フレーズ数が変わった時に問題数を調整
  useEffect(() => {
    // デフォルトは10、フレーズ数が10未満の場合でも10に設定
    setQuestionCount(10)
  }, [availablePhraseCount])

  // モーダルが開かれた時に問題数を10に初期化
  useEffect(() => {
    if (isOpen) {
      setQuestionCount(10)
      setSpeakCountFilter(50) // 音読回数フィルターも初期化
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
      { value: '', label: '指定なし' },
      { value: '50', label: '50回以上' },
      { value: '60', label: '60回以上' },
      { value: '70', label: '70回以上' },
      { value: '80', label: '80回以上' },
      { value: '90', label: '90回以上' },
      { value: '100', label: '100回以上' }
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
        speakCountFilter: speakCountFilter
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

      const data = await api.get<{ success: boolean, phrases?: unknown[], message?: string }>(`/api/phrase/quiz?${params.toString()}`)
      
      if (data.success && data.phrases && data.phrases.length > 0) {
        // フレーズが見つかった場合は、モーダルを閉じてクイズを開始
        onClose()
        await onStart(config)
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        const errorMessage = data.message || t('phrase.messages.notFound')
        toast.error(errorMessage)
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
        label: '音読回数',
        type: 'select',
        value: speakCountFilter?.toString() || '',
        options: generateSpeakCountFilterOptions(),
        onChange: (value: string | boolean) => {
          const stringValue = value as string
          setSpeakCountFilter(stringValue === '' ? null : parseInt(stringValue, 10))
        }
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
