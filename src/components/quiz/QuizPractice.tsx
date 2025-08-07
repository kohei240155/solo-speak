import { useState } from 'react'
import { QuizPhrase, QuizSession } from '@/types/quiz'
import { PiHandTapLight } from 'react-icons/pi'
import { IoCheckboxOutline } from 'react-icons/io5'
import { useTextToSpeech } from '@/hooks/ui/useTextToSpeech'
import AnimatedButton from '../common/AnimatedButton'

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
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)

  // TTS機能の初期化
  const { isPlaying, error: ttsError, playText } = useTextToSpeech({
    languageCode: currentPhrase?.languageCode || 'en'
  })

  const handleAnswer = (isCorrect: boolean) => {
    if (hasAnswered) return
    setHasAnswered(true)
    setSelectedAnswer(isCorrect)
    onAnswer(isCorrect)
    
    // 1秒後に次の問題に進むか、最後の問題の場合は終了
    setTimeout(() => {
      if (isLastQuestion) {
        onFinish()
      } else {
        setHasAnswered(false)
        setSelectedAnswer(null)
        onNext()
      }
    }, 1000)
  }

  // 音声再生ハンドラー
  const handlePlayAudio = async () => {
    if (!currentPhrase?.original || isPlaying) return
    
    try {
      await playText(currentPhrase.original)
    } catch (error) {
      console.error('Failed to play audio:', error)
    }
  }

  const isLastQuestion = session.currentIndex >= session.totalCount - 1


  return (
    <>
      {/* TTS エラー表示 */}
      {ttsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{ttsError}</p>
        </div>
      )}
      
      {/* プログレスバー */}
      <div className="w-full mb-2">
        <div className="h-1 bg-gray-200 rounded-full overflow-hidden">
          <div
            className="h-full bg-gray-600 transition-all duration-300"
            style={{ width: `${(session.currentIndex / session.totalCount) * 100}%` }}
          />
        </div>
      </div>
      {/* 正解数表示 */}
      <div className="flex items-center justify-end mb-2 text-xs text-gray-500">
        <IoCheckboxOutline className="w-4 h-4 mr-1" />
        <span>Correct: {currentPhrase.correctQuizCount}</span>
      </div>
      {/* フレーズ表示エリア */}
      <div className="mb-2">
        {/* 母国語の翻訳（メイン表示） */}
        <div className="mb-3">
          <div 
            className="text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words leading-relaxed"
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
        <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] flex items-start">
          {showTranslation ? (
            <div 
              className={`text-base sm:text-base md:text-xl text-gray-600 break-words w-full leading-relaxed font-medium cursor-pointer transition-colors ${
                isPlaying ? 'opacity-70' : 'hover:text-gray-800'
              }`}
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
              onClick={handlePlayAudio}
              title="Click to play audio"
            >
              {currentPhrase.original}
            </div>
          ) : (
            <div className="w-full">
              {/* 翻訳が表示されていない時は空のスペース */}
            </div>
          )}
        </div>
      </div>

      {/* 中央のアイコン表示エリア */}
      <div className="flex justify-center items-center mb-20 sm:mb-26">
        <div 
          className="cursor-pointer rounded-full p-4 transition-colors"
          onClick={onShowTranslation}
        >
          <PiHandTapLight className="w-12 h-12 text-gray-400" />
        </div>
      </div>

      {/* Got It / No Idea ボタン */}
      <div>
        <div className="flex justify-between items-start">
          {/* No Idea ボタン */}
          <div className="flex flex-col items-center" style={{ width: '48%' }}>
            <AnimatedButton
              onClick={() => handleAnswer(false)}
              disabled={hasAnswered}
              variant="secondary"
              isLoading={hasAnswered && selectedAnswer === false}
              className="px-6"
            >
              No Idea
            </AnimatedButton>
          </div>

          {/* Got It ボタン */}
          <div className="flex flex-col items-center" style={{ width: '48%' }}>
            <AnimatedButton
              onClick={() => handleAnswer(true)}
              disabled={hasAnswered}
              variant="primary"
              isLoading={hasAnswered && selectedAnswer === true}
              className="px-6"
            >
              Got It
            </AnimatedButton>
          </div>
        </div>
      </div>
    </>
  )
}
