import { useState, useEffect } from 'react'
import ModeModal, { ModeModalConfig } from './ModeModal'
import { Language } from '@/types/phrase'
import { QuizConfig } from '@/types/quiz'
import toast from 'react-hot-toast'

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
  const [mode, setMode] = useState<'normal' | 'random'>('normal')
  const [questionCount, setQuestionCount] = useState<number>(10)
  const [isLoading, setIsLoading] = useState(false)

  // フレーズ数が変わった時に問題数を調整
  useEffect(() => {
    // デフォルトは10、フレーズ数が10未満の場合はフレーズ数に調整
    setQuestionCount(Math.min(10, availablePhraseCount))
  }, [availablePhraseCount])

  // 問題数選択のオプションを生成
  const generateQuestionCountOptions = () => {
    const baseOptions = [5, 10, 15, 20, 25, 30]
    
    // 常に全ての固定オプションを表示
    return baseOptions.map(count => ({
      value: count.toString(),
      label: `${count} questions`
    }))
  }

  const handleStart = async (selectedLanguage: string) => {
    if (isLoading) return
    
    setIsLoading(true)
    
    try {
      // 設定オブジェクトを作成
      const config: QuizConfig = {
        mode: mode,
        language: selectedLanguage,
        questionCount: questionCount
      }
      console.log('QuizModeModal - Starting quiz with config:', config)
      
      // onStartを呼び出し、成功した場合のみモーダルを閉じる
      await onStart(config)
      onClose()
    } catch (error) {
      console.error('QuizModeModal - Error starting quiz:', error)
      toast.error('クイズの開始に失敗しました')
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
        label: 'Mode',
        type: 'select',
        value: mode,
        options: [
          { value: 'normal', label: 'Normal' },
          { value: 'random', label: 'Random' }
        ],
        onChange: (value: string) => setMode(value as 'normal' | 'random')
      },
      {
        id: 'questionCount',
        label: 'Quiz Length',
        type: 'select',
        value: questionCount.toString(),
        options: generateQuestionCountOptions(),
        onChange: (value: string) => setQuestionCount(parseInt(value, 10))
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
