import { useState, useCallback, useEffect } from 'react'
import { QuizPhrase, QuizSession } from '@/types/quiz'
import { PiHandTapLight } from 'react-icons/pi'
import { IoCheckboxOutline } from 'react-icons/io5'
import { RiSpeakLine } from 'react-icons/ri'
import { HiMiniSpeakerWave, HiPlus } from 'react-icons/hi2'
import { useTextToSpeech } from '@/hooks/ui/useTextToSpeech'
import AnimatedButton from '../common/AnimatedButton'

interface QuizPracticeProps {
  session: QuizSession
  currentPhrase: QuizPhrase
  showTranslation: boolean
  onShowTranslation: () => void
  onHideTranslation: () => void
  onAnswer: (isCorrect: boolean) => void
  onNext: () => void
  onFinish: () => void
  onSpeakCount?: (phraseId: string, count: number) => void
}

export default function QuizPractice({
  session,
  currentPhrase,
  showTranslation,
  onShowTranslation,
  onHideTranslation,
  onAnswer,
  onNext,
  onFinish,
  onSpeakCount
}: QuizPracticeProps) {
  const [hasAnswered, setHasAnswered] = useState(false)
  const [selectedAnswer, setSelectedAnswer] = useState<boolean | null>(null)
  const [pendingSpeakCount, setPendingSpeakCount] = useState(0)
  const [countCooldown, setCountCooldown] = useState(0)

  // TTS機能の初期化
  const { isPlaying, error: ttsError, playText } = useTextToSpeech({
    languageCode: currentPhrase?.languageCode || 'en'
  })

  // カウントダウンの管理
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countCooldown > 0) {
      timer = setTimeout(() => {
        setCountCooldown(countCooldown - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [countCooldown])

  const handleAnswer = (isCorrect: boolean) => {
    if (hasAnswered) return
    
    // Got It/No Ideaボタンを押した瞬間に翻訳を隠す
    onHideTranslation()
    
    setHasAnswered(true)
    setSelectedAnswer(isCorrect)
    
    // ペンディング中の音読回数がある場合は送信
    if (pendingSpeakCount > 0 && onSpeakCount) {
      onSpeakCount(currentPhrase.id, pendingSpeakCount)
      setPendingSpeakCount(0)
    }
    
    onAnswer(isCorrect)
    
    // 1秒後に次の問題に進むか、最後の問題の場合は終了
    setTimeout(() => {
      handleNext()
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

  // 音読回数加算ハンドラー
  const handleSpeakCount = () => {
    if (!showTranslation || countCooldown > 0) return // 翻訳が表示されていない場合やクールダウン中は加算しない
    
    setCountCooldown(1) // 1秒のクールダウンを設定
    setPendingSpeakCount(prev => prev + 1)
  }

  const isLastQuestion = session.currentIndex >= session.totalCount - 1

  const handleNext = useCallback(() => {
    if (isLastQuestion) {
      onFinish()
    } else {
      // ローカル状態をリセットしてから次の問題に進む
      setHasAnswered(false)
      setSelectedAnswer(null)
      setPendingSpeakCount(0) // ペンディングカウントもリセット
      setCountCooldown(0) // クールダウンもリセット
      // onNextが呼ばれることで、useQuizPhraseのhandleNextが実行され、showTranslationがfalseになる
      onNext()
    }
  }, [isLastQuestion, onFinish, onNext])

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
      {/* Total数と正解数表示 */}
      <div className="flex items-center justify-end mb-2 text-xs text-gray-500">
        <RiSpeakLine className="w-4 h-4 mr-1" />
        <span>Total: {currentPhrase.totalSpeakCount + pendingSpeakCount}</span>
        <IoCheckboxOutline className="w-4 h-4 ml-4 mr-1" />
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
        {/* 学習言語のフレーズ - 表示のみ */}
        <div className="min-h-[2.5rem] sm:min-h-[3rem] md:min-h-[4rem] flex items-start">
          <div 
            className={`text-base sm:text-base md:text-xl text-gray-600 break-words w-full leading-relaxed font-medium transition-all duration-500 ease-out ${
              showTranslation 
                ? 'opacity-100 translate-y-0' 
                : 'opacity-0 translate-y-2'
            }`}
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          >
            {currentPhrase.original}
          </div>
        </div>
      </div>

      {/* 中央のアイコン表示エリア */}
      <div className="flex justify-center items-center mb-12 sm:mb-16">
        <div 
          className="cursor-pointer rounded-full p-4 transition-colors"
          onClick={onShowTranslation}
        >
          <PiHandTapLight className="w-12 h-12 text-gray-400" />
        </div>
      </div>

      {/* Got It / No Idea ボタン */}
      <div>
        <div className="flex justify-between items-end">
          {/* No Idea ボタン */}
          <div className="flex flex-col items-center" style={{ width: '48%' }}>
            {/* スペーサー（音声再生ボタンと同じ高さ） */}
            <div className="mb-3">
              <div className="w-12 h-12"></div>
            </div>
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
          <div className="flex flex-col items-end" style={{ width: '48%' }}>
            {/* プラスボタンとスピーカーボタン */}
            <div className="flex items-center gap-2 mb-3">
              {/* プラスボタン */}
              <button
                onClick={handleSpeakCount}
                disabled={!showTranslation || hasAnswered || countCooldown > 0}
                className={`p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${
                  !showTranslation || hasAnswered || countCooldown > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                title="Add speak count"
              >
                <HiPlus className={`w-6 h-6 ${
                  !showTranslation || hasAnswered || countCooldown > 0 ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </button>
              
              {/* スピーカーボタン */}
              <button
                onClick={handlePlayAudio}
                disabled={isPlaying || !currentPhrase?.original || !showTranslation}
                className={`p-3 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors ${
                  isPlaying || !currentPhrase?.original || !showTranslation ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
                }`}
                title="Play audio"
              >
                <HiMiniSpeakerWave className={`w-6 h-6 ${
                  isPlaying || !currentPhrase?.original || !showTranslation ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </button>
            </div>
            
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
