import { useState, useEffect } from 'react'
import Modal from './Modal'
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
  
  // 初期言語の設定ロジック
  const initialLanguage = defaultLearningLanguage || (languages.length > 0 ? languages[0].code : 'en')
  const [selectedLanguage, setSelectedLanguage] = useState(initialLanguage)
  const [isLoading, setIsLoading] = useState(false)

  // 問題数の計算（デフォルト値とフレーズ数の少ない方）
  const questionCount = Math.min(defaultQuizCount, availablePhraseCount)

  // モーダルが開かれた時またはdefaultLearningLanguageが変更された時に選択言語を更新
  useEffect(() => {
    if (isOpen) {
      const languageToSet = defaultLearningLanguage || (languages.length > 0 ? languages[0].code : 'en')
      setSelectedLanguage(languageToSet)
      setIsLoading(false) // ローディング状態をリセット
    }
  }, [isOpen, defaultLearningLanguage, languages])

  // defaultLearningLanguageまたはlanguagesが変更された時も選択言語を更新
  useEffect(() => {
    if (defaultLearningLanguage) {
      setSelectedLanguage(defaultLearningLanguage)
    } else if (languages.length > 0 && !defaultLearningLanguage) {
      setSelectedLanguage(languages[0].code)
    }
  }, [defaultLearningLanguage, languages])

  const handleStart = async () => {
    if (isLoading) return // 既に処理中の場合は何もしない
    
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

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">Quiz Mode</h2>
        </div>

        {/* Language セクション */}
        <div className="mb-4">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Language
          </h3>
          <div className="relative">
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px'
              }}
            >
              {languages.map((language) => (
                <option key={language.id} value={language.code}>
                  {language.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Mode セクション */}
        <div className="mb-8">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Mode
          </h3>
          <div className="relative">
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value as 'normal' | 'random')}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px'
              }}
            >
              <option value="normal">Normal</option>
              <option value="random">Random</option>
            </select>
          </div>
        </div>

        {/* Start ボタン */}
        <button
          onClick={handleStart}
          disabled={isLoading}
          className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
          style={{ 
            backgroundColor: isLoading ? '#9CA3AF' : '#616161'
          }}
          onMouseEnter={(e) => {
            if (!isLoading && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#525252'
            }
          }}
          onMouseLeave={(e) => {
            if (!isLoading && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#616161'
            }
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Start'
          )}
        </button>
      </div>
    </Modal>
  )
}
