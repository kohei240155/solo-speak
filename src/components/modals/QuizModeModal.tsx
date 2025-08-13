import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { QuizConfig } from '@/types/quiz'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface QuizModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: QuizConfig, phrases: unknown[]) => Promise<void>
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
  }, [isOpen, defaultLearningLanguage])

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
      { value: 'null', label: t('quiz.modal.speakCountOptions.noLimit') },
      { value: '50', label: t('quiz.modal.speakCountOptions.over50') },
      { value: '60', label: t('quiz.modal.speakCountOptions.over60') },
      { value: '70', label: t('quiz.modal.speakCountOptions.over70') },
      { value: '80', label: t('quiz.modal.speakCountOptions.over80') },
      { value: '90', label: t('quiz.modal.speakCountOptions.over90') },
      { value: '100', label: t('quiz.modal.speakCountOptions.over100') }
    ]
  }

  const handleStart = async (language: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      // 設定オブジェクトを作成
      const config: QuizConfig = {
        mode: mode,
        language: language,
        questionCount: questionCount,
        speakCountFilter: speakCountFilter
      }
      
      // SWRのmutateを使用してAPIを実行
      const { mutate } = await import('swr')
      
      // パラメータを構築
      const params = new URLSearchParams()
      params.append('language', language)
      params.append('mode', mode)
      params.append('count', questionCount.toString())
      if (speakCountFilter !== null && speakCountFilter !== undefined) {
        params.append('speakCountFilter', speakCountFilter.toString())
      }
      
      const queryString = params.toString()
      const quizKey = [`/api/phrase/quiz?${queryString}`] as const
      
      // SWRのmutateを使用してAPIを実行し、結果を取得
      const response = await mutate(quizKey, async () => {
        const { api } = await import('@/utils/api')
        const result = await api.get<{ success: boolean, phrases?: unknown[], message?: string }>(`/api/phrase/quiz?${queryString}`)
        return result
      })
      
      if (response?.success && response.phrases && response.phrases.length > 0) {
        // フレーズが見つかった場合は、モーダルを閉じてクイズを開始
        onClose()
        await onStart(config, response.phrases)
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        const errorMessage = response?.message || t('phrase.messages.notFound')
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
        label: t('quiz.modal.speakCountFilter'),
        type: 'select',
        value: speakCountFilter === null ? 'null' : speakCountFilter.toString(),
        options: generateSpeakCountFilterOptions(),
        onChange: (value: string | boolean) => {
          const stringValue = value as string
          setSpeakCountFilter(stringValue === 'null' ? null : parseInt(stringValue, 10))
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
