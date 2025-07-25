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
      {/* プログレスバー */}
      <div className="w-full mb-6">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-600 transition-all duration-300"
            style={{ width: `${(session.currentIndex / session.totalCount) * 100}%` }}
          />
        </div>
      </div>
      {/* フレーズ表示エリア */}
      <div className="mb-2">
        {/* 母国語の翻訳（メイン表示） */}
        <div className="mb-3">
          <div className="flex items-start justify-between">
            <div 
              className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words leading-relaxed flex-1"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {currentPhrase.translation}
            </div>
            {/* 正解数表示 */}
            <div className="flex items-center ml-3 text-xs text-gray-500 flex-shrink-0">
              <IoCheckboxOutline className="w-4 h-4 mr-1" />
              <span>Correct: {currentPhrase.correctQuizCount}</span>
            </div>
          </div>
        </div>
        {/* 学習言語のフレーズ - タップで表示 */}
        <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] flex items-start">
          {showTranslation ? (
            <div 
              className="text-sm sm:text-base md:text-lg text-gray-600 break-words w-full leading-relaxed font-medium"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {currentPhrase.text}
            </div>
          ) : (
            <div className="w-full">
              {/* 翻訳が表示されていない時は空のスペース */}
            </div>
          )}
        </div>
      </div>

      {/* 中央のアイコン表示エリア */}
      <div className="flex justify-center items-center mb-26">
        <div 
          className="cursor-pointer rounded-full p-4 transition-colors"
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
              className={`w-full bg-white border py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed ${
                hasAnswered 
                  ? 'opacity-50' 
                  : 'hover:bg-gray-50'
              }`}
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
              className={`w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors duration-200 disabled:cursor-not-allowed ${
                hasAnswered 
                  ? 'opacity-50' 
                  : ''
              }`}
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
