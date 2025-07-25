import { useState } from 'react'
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
  defaultQuizCount?: number
}

export type { QuizConfig } from '@/types/quiz'

export default function QuizModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage, availablePhraseCount, defaultQuizCount = 10 }: QuizModeModalProps) {
  const [mode, setMode] = useState<'normal' | 'random'>('normal')
  const [isLoading, setIsLoading] = useState(false)

  // 問題数の計算（デフォルト値とフレーズ数の少ない方）
  const questionCount = Math.min(defaultQuizCount, availablePhraseCount)

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
        id: 'question-count',
        label: 'Question Count',
        type: 'info',
        value: `${questionCount} questions (max: ${availablePhraseCount})`
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
