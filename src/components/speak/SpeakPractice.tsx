import { RiSpeakLine } from 'react-icons/ri'
import { CiCirclePlus } from 'react-icons/ci'
import { HiMiniSpeakerWave } from 'react-icons/hi2'
import { BiCommentDetail } from 'react-icons/bi'
import { useState, useEffect } from 'react'
import { useTextToSpeech } from '@/hooks/ui/useTextToSpeech'
import AnimatedButton from '../common/AnimatedButton'
import LoadingSpinner from '../common/LoadingSpinner'

interface SpeakPhrase {
  id: string
  original: string
  translation: string
  totalSpeakCount: number
  dailySpeakCount: number
  explanation?: string
}

interface SpeakPracticeProps {
  phrase: SpeakPhrase | null
  onCount: () => void
  onNext: () => void
  onFinish: () => void
  todayCount: number
  totalCount: number
  isLoading?: boolean
  isNextLoading?: boolean
  isHideNext?: boolean // Nextボタンを非表示にするかどうか
  isFinishing?: boolean // Finish処理中かどうか
  isCountDisabled?: boolean // Countボタンを無効にするかどうか
  learningLanguage?: string // 学習言語コード（TTS用）
  onExplanation?: () => void // Explanationボタンのコールバック
}

export default function SpeakPractice({
  phrase,
  onCount,
  onNext,
  onFinish,
  todayCount,
  totalCount,
  isLoading = false,
  isNextLoading = false,
  isHideNext = false,
  isFinishing = false,
  isCountDisabled = false,
  learningLanguage = 'en',
  onExplanation
}: SpeakPracticeProps) {
  const [countCooldown, setCountCooldown] = useState(0)
  
  // TTS機能の初期化
  const { isPlaying, error: ttsError, playText } = useTextToSpeech({
    languageCode: learningLanguage
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

  // カウントボタンのハンドラー
  const handleCount = () => {
    if (countCooldown > 0 || isCountDisabled) return
    
    setCountCooldown(1)
    onCount()
  }

  // Soundボタンのハンドラー
  const handleSound = async () => {
    if (!phrase?.original) return
    
    // 既に再生中の場合は何もしない
    if (isPlaying) return
    
    try {
      await playText(phrase.original)
    } catch (error) {
      console.error('Failed to play sound:', error)
    }
  }

  // カウントボタンの無効状態判定
  const isCountButtonDisabled = isCountDisabled || countCooldown > 0

  // ローディング中の表示
  if (isLoading) {
    return (
      <LoadingSpinner message="Loading..." className="py-8" minHeight="280px" />
    )
  }

  // フレーズが見つからない場合の表示
  if (!phrase) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">フレーズが見つかりませんでした</p>
        <button
          onClick={onFinish}
          className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <>
      {/* TTS エラー表示 */}
      {ttsError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-red-600 text-sm">{ttsError}</p>
        </div>
      )}
      
      {/* フレーズ表示エリア - Phrase Listと同じレイアウト */}
      <div className="mb-6 relative">
        {/* Explanationアイコン */}
        {phrase?.explanation && onExplanation && (
          <button
            onClick={onExplanation}
            className="absolute top-0 right-0 p-1 text-gray-500 hover:text-gray-700 transition-colors"
            title="Explanation"
          >
            <BiCommentDetail className="w-5 h-5" />
          </button>
        )}
        
        {/* 学習言語のフレーズ（メイン表示） */}
        <div className="mb-2">
          <div className={`text-base sm:text-lg md:text-xl font-medium text-gray-900 break-words leading-relaxed ${
            phrase?.explanation && onExplanation ? 'pr-8' : ''
          }`}>
            {phrase.original}
          </div>
        </div>
        
        {/* 母国語の翻訳 */}
        <div className="mb-3">
          <div className="text-sm sm:text-base md:text-lg text-gray-600 break-words leading-relaxed">
            {phrase.translation}
          </div>
        </div>
        
        {/* Speak回数表示 */}
        <div className="flex items-center text-sm text-gray-600 min-w-0">
          <RiSpeakLine className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className={`break-words ${todayCount >= 10 ? 'font-bold' : ''}`}>Today: {todayCount}</span>
          <span className={`break-words ml-4 ${totalCount >= 50 ? 'font-bold' : ''}`}>Total: {totalCount}</span>
        </div>
      </div>

      {/* Sound と Count ボタン */}
      <div>
        <div className="flex justify-between items-start">
          {/* Count ボタン + Finish ボタン */}
          <div className="flex flex-col items-center" style={{ width: '45%' }}>
            <button
              onClick={handleCount}
              disabled={isCountButtonDisabled}
              className={`flex flex-col items-center focus:outline-none mb-4 transition-colors rounded-lg p-6 w-full min-h-[120px] ${
                isCountButtonDisabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              <div className={`w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center mb-2 ${
                isCountButtonDisabled ? 'opacity-50' : ''
              }`}>
                <CiCirclePlus className={`w-10 h-10 ${
                  isCountButtonDisabled ? 'text-gray-400' : 'text-gray-600'
                }`} />
              </div>
              <span className={`font-medium text-base ${
                isCountButtonDisabled ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {countCooldown > 0 ? 'Wait...' : 'Count'}
              </span>
            </button>
            {!isHideNext && (
              <AnimatedButton
                onClick={onFinish}
                disabled={isFinishing}
                variant="secondary"
                isLoading={isFinishing}
                loadingText="Finishing..."
                className="px-6"
              >
                Finish
              </AnimatedButton>
            )}
          </div>

          {/* 区切り線 - 上部に配置 */}
          <div className="w-px h-20 bg-gray-300 mx-4"></div>

          {/* Sound ボタン + Next ボタン */}
          <div className="flex flex-col items-center" style={{ width: '45%' }}>
            <button
              onClick={handleSound}
              disabled={isPlaying || !phrase?.original}
              className={`flex flex-col items-center focus:outline-none mb-4 transition-colors rounded-lg p-6 w-full min-h-[120px] ${
                isPlaying || !phrase?.original ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'
              }`}
            >
              <div className={`w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center mb-2 ${
                isPlaying ? 'animate-pulse' : ''
              }`}>
                <HiMiniSpeakerWave className={`w-10 h-10 ${
                  isPlaying || !phrase?.original ? 'text-gray-400' : 'text-gray-900'
                }`} />
              </div>
              <span className={`font-medium text-base ${
                isPlaying || !phrase?.original ? 'text-gray-400' : 'text-gray-900'
              }`}>
                {isPlaying ? 'Playing...' : 'Sound'}
              </span>
            </button>
            {!isHideNext && (
              <AnimatedButton
                onClick={onNext}
                disabled={isNextLoading}
                variant="primary"
                isLoading={isNextLoading}
                loadingText="Loading..."
                className="px-6"
              >
                Next
              </AnimatedButton>
            )}
          </div>
        </div>
        
        {/* 単一フレーズモード時のFinishボタン（横いっぱい） */}
        {isHideNext && (
          <div className="mt-4">
            <AnimatedButton
              onClick={onFinish}
              disabled={isFinishing}
              variant="secondary"
              isLoading={isFinishing}
              loadingText="Finishing..."
              className="px-6"
            >
              Finish
            </AnimatedButton>
          </div>
        )}
      </div>
    </>
  )
}
