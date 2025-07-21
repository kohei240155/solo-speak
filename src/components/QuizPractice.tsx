import { useState } from 'react'
import { Language } from '@/types/phrase'
import { QuizPhrase, QuizSession } from '@/types/quiz'
import { PiHandTapLight } from 'react-icons/pi'

interface QuizPracticeProps {
  session: QuizSession
  currentPhrase: QuizPhrase
  languages: Language[]
  nativeLanguage: string
  showTranslation: boolean
  onShowTranslation: () => void
  onAnswer: (isCorrect: boolean) => void
  onNext: () => void
  onFinish: () => void
}

export default function QuizPractice({
  session,
  currentPhrase,
  languages,
  nativeLanguage,
  showTranslation,
  onShowTranslation,
  onAnswer,
  onNext,
  onFinish
}: QuizPracticeProps) {
  const [hasAnswered, setHasAnswered] = useState(false)

  const handleAnswer = (isCorrect: boolean) => {
    if (hasAnswered) return
    setHasAnswered(true)
    onAnswer(isCorrect)
  }

  const handleNext = () => {
    setHasAnswered(false)
    onNext()
  }

  const isLastQuestion = session.currentIndex >= session.totalCount - 1

  return (
    <>
      {/* Native Language表示とProgress情報 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600">
          {session.currentIndex + 1} / {session.totalCount}
        </div>
      </div>

      {/* フレーズ表示エリア */}
      <div className="mb-8">
        <div 
          className={`bg-white rounded-lg p-6 min-h-[140px] flex flex-col justify-center text-center ${
            !showTranslation ? 'cursor-pointer hover:bg-gray-50' : ''
          } transition-colors`}
          onClick={!showTranslation ? onShowTranslation : undefined}
        >
          {/* 母国語のフレーズ（翻訳）- 常に表示 */}
          <div className="text-lg md:text-xl font-medium text-gray-900 mb-4 leading-relaxed">
            {currentPhrase.translation}
          </div>
          
          {/* 学習言語のフレーズ - クリック後に表示 */}
          {showTranslation ? (
            <div className="text-sm md:text-base text-gray-600 leading-relaxed">
              {currentPhrase.text}
            </div>
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <PiHandTapLight className="w-8 h-8 mb-2" />
              <span className="text-sm">Tap to see translation</span>
            </div>
          )}
        </div>
      </div>

      {/* Got It / No Idea ボタン */}
      {showTranslation && (
        <div className="mb-8">
          <div className="flex gap-4">
            <button
              onClick={() => handleAnswer(false)}
              disabled={hasAnswered}
              className="flex-1 bg-white border-2 py-3 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              No Idea
            </button>
            <button
              onClick={() => handleAnswer(true)}
              disabled={hasAnswered}
              className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: hasAnswered ? '#9CA3AF' : '#616161'
              }}
              onMouseEnter={(e) => {
                if (!hasAnswered && e.currentTarget) {
                  e.currentTarget.style.backgroundColor = '#525252'
                }
              }}
              onMouseLeave={(e) => {
                if (!hasAnswered && e.currentTarget) {
                  e.currentTarget.style.backgroundColor = '#616161'
                }
              }}
            >
              Got It
            </button>
          </div>
        </div>
      )}

      {/* Next / Finish ボタン */}
      {hasAnswered && (
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
            onClick={isLastQuestion ? onFinish : handleNext}
            className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            style={{ 
              backgroundColor: '#616161'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = '#525252'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = '#616161'
            }}
          >
            {isLastQuestion ? 'Finish' : 'Next'}
          </button>
        </div>
      )}
    </>
  )
}
