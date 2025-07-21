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
    
    // 1秒後に次の問題に進むか、最後の問題の場合は終了
    setTimeout(() => {
      if (isLastQuestion) {
        onFinish()
      } else {
        setHasAnswered(false)
        onNext()
      }
    }, 1000)
  }

  const isLastQuestion = session.currentIndex >= session.totalCount - 1

  return (
    <>
      {/* フレーズ表示エリア - SpeakPracticeと同じレイアウト */}
      <div className="mb-16">
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

      {/* Got It / No Idea ボタン */}
      <div>
        <div className="flex justify-center items-start">
          {/* No Idea ボタン */}
          <div className="flex flex-col items-center mr-4" style={{ width: '45%' }}>
            <button
              onClick={() => handleAnswer(false)}
              disabled={hasAnswered}
              className="w-full bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              No Idea
            </button>
          </div>

          {/* Got It ボタン */}
          <div className="flex flex-col items-center" style={{ width: '45%' }}>
            <button
              onClick={() => handleAnswer(true)}
              disabled={hasAnswered}
              className="w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
      </div>
    </>
  )
}
