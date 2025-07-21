import { useState } from 'react'
import { Language } from '@/types/phrase'
import { QuizPhrase } from '@/types/quiz'

interface QuizPracticeProps {
  phrase: QuizPhrase
  languages: Language[]
  nativeLanguage: string
  onAnswer: (selectedAnswer: string, isCorrect: boolean) => void
  onNext: () => void
  onFinish: () => void
  showResult: boolean
  isCorrect: boolean | null
  selectedAnswer: string | null
}

export default function QuizPractice({
  phrase,
  languages,
  nativeLanguage,
  onAnswer,
  onNext,
  onFinish,
  showResult,
  isCorrect,
  selectedAnswer
}: QuizPracticeProps) {
  const [currentSelectedAnswer, setCurrentSelectedAnswer] = useState<string | null>(null)

  const handleAnswerSelect = (answer: string) => {
    if (showResult) return // 結果表示中は選択不可
    
    setCurrentSelectedAnswer(answer)
    const correct = answer === phrase.correctAnswer
    onAnswer(answer, correct)
  }

  const getOptionStyle = (option: string) => {
    if (!showResult) {
      // 結果表示前
      return currentSelectedAnswer === option 
        ? 'bg-blue-100 border-blue-500' 
        : 'bg-white border-gray-300 hover:bg-gray-50'
    }
    
    // 結果表示後
    if (option === phrase.correctAnswer) {
      return 'bg-green-100 border-green-500 text-green-800'
    } else if (option === selectedAnswer && option !== phrase.correctAnswer) {
      return 'bg-red-100 border-red-500 text-red-800'
    } else {
      return 'bg-gray-50 border-gray-300 text-gray-500'
    }
  }

  return (
    <>
      {/* Native Language表示 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600">
          Quiz Mode
        </div>
      </div>

      {/* フレーズ表示エリア */}
      <div className="mb-8">
        <div className="bg-white rounded-lg p-6 min-h-[140px] flex flex-col justify-center text-center">
          {/* 学習言語のフレーズ（大きく表示） */}
          <div className="text-lg md:text-xl font-medium text-gray-900 mb-4 leading-relaxed">
            {phrase.text}
          </div>
          
          {/* 結果表示 */}
          {showResult && (
            <div className={`text-sm md:text-base leading-relaxed font-medium ${
              isCorrect ? 'text-green-600' : 'text-red-600'
            }`}>
              {isCorrect ? '正解！' : `不正解。正解: ${phrase.correctAnswer}`}
            </div>
          )}
        </div>
      </div>

      {/* 選択肢エリア */}
      <div className="mb-8">
        <div className="space-y-3">
          {phrase.options.map((option, index) => (
            <button
              key={index}
              onClick={() => handleAnswerSelect(option)}
              disabled={showResult}
              className={`w-full p-4 text-left rounded-lg border-2 transition-colors ${
                getOptionStyle(option)
              } ${showResult ? 'cursor-not-allowed' : 'cursor-pointer'}`}
            >
              <div className="flex items-center">
                <span className="text-sm font-medium text-gray-500 mr-3">
                  {String.fromCharCode(65 + index)}. {/* A, B, C, D */}
                </span>
                <span className="text-base">
                  {option}
                </span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Finish と Next ボタン */}
      <div className="flex gap-3">
        <button
          onClick={onFinish}
          className="flex-1 bg-white border-2 py-3 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Finish
        </button>
        <button
          onClick={onNext}
          disabled={!showResult}
          className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: showResult ? '#616161' : '#9CA3AF'
          }}
        >
          Next
        </button>
      </div>
    </>
  )
}
