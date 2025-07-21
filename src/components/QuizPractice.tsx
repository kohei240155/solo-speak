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
      {/* フレーズ表示エリアとQuiz進行状況の横並び */}
      <div className="flex justify-between items-start mb-4">
        {/* フレーズ表示エリア - 左側 */}
        <div className="flex-1 mr-4">
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
            <div className="mb-3">
              {/* 翻訳が表示されていない時は空のスペース */}
            </div>
          )}
          
          {/* Correct統計表示 - フレーズの下に配置 */}
          <div className="flex items-center text-sm text-gray-600">
            <IoCheckboxOutline className="w-4 h-4 mr-1 flex-shrink-0" />
            <span className="break-words">Correct: {session.correctCount}</span>
          </div>
        </div>

        {/* Quiz進行状況表示 - 右側 */}
        <div className="text-sm text-gray-600">
          <span className="break-words">Question: {session.currentIndex + 1} / {session.totalCount}</span>
        </div>
      </div>

      {/* 中央のアイコン表示エリア */}
      <div className="flex justify-center items-center mb-20">
        <div 
          className="cursor-pointer hover:bg-gray-50 rounded-full p-4 transition-colors"
          onClick={onShowTranslation}
        >
          <PiHandTapLight className="w-12 h-12 text-gray-400" />
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
