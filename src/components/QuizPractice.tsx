import { useState } from 'react'
import { QuizPhrase, QuizSession } from '@/types/quiz'
import { PiHandTapLight } from 'react-icons/pi'
import { IoCheckboxOutline } from 'react-icons/io5'

interface QuizPracticeProps {
  session: QuizSession
  currentPhrase: QuizPhrase
  showTranslation: boolean
  onShowTranslation: () => void
  onAnswer: (isCorrect: boolean) => void
  onNext: () => void
  onFinish: () => void
}

export default function QuizPractice({
  session,
  currentPhrase,
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
      {/* フレーズ表示エリア - SpeakPracticeと同じレイアウト */}
      <div className="mb-10">
        {/* 母国語の翻訳（メイン表示） */}
        <div className="mb-2">
          <div 
            className="text-base font-medium text-gray-900 break-words"
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          >
            {currentPhrase.translation}
          </div>
        </div>
        
        {/* 学習言語のフレーズ - タップで表示 */}
        {showTranslation ? (
          <div className="mb-3">
            <div 
              className="text-sm text-gray-600 break-words"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {currentPhrase.text}
            </div>
          </div>
        ) : (
          <div 
            className="mb-3 cursor-pointer hover:bg-gray-50 rounded p-2 transition-colors"
            onClick={onShowTranslation}
          >
            <div className="flex items-center justify-center text-gray-400">
              <PiHandTapLight className="w-6 h-6 mr-2" />
              <span className="text-sm">Tap to see translation</span>
            </div>
          </div>
        )}
        
        {/* Quiz統計表示 */}
        <div className="flex items-center text-sm text-gray-600 min-w-0">
          <IoCheckboxOutline className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="break-words">Question: {session.currentIndex + 1} / {session.totalCount}</span>
          <span className="break-words ml-4">Correct: {session.correctCount}</span>
        </div>
      </div>

      {/* Got It / No Idea ボタン - SpeakPracticeのレイアウトに合わせて */}
      {showTranslation && (
        <div>
          <div className="flex justify-between items-start">
            {/* No Idea ボタン + Finish ボタン */}
            <div className="flex flex-col items-center" style={{ width: '45%' }}>
              <button
                onClick={() => handleAnswer(false)}
                disabled={hasAnswered}
                className="w-full bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
                style={{ 
                  borderColor: '#616161',
                  color: '#616161'
                }}
              >
                No Idea
              </button>
              <button
                onClick={onFinish}
                className="w-full bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                style={{ 
                  borderColor: '#616161',
                  color: '#616161'
                }}
              >
                Finish
              </button>
            </div>

            {/* 区切り線 - 上部に配置 */}
            <div className="w-px h-20 bg-gray-300 mx-4"></div>

            {/* Got It ボタン + Next ボタン */}
            <div className="flex flex-col items-center" style={{ width: '45%' }}>
              <button
                onClick={() => handleAnswer(true)}
                disabled={hasAnswered}
                className="w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed mb-8"
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
              
              {hasAnswered && (
                <button
                  onClick={isLastQuestion ? onFinish : handleNext}
                  className="w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
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
              )}
            </div>
          </div>
        </div>
      )}
    </>
  )
}
