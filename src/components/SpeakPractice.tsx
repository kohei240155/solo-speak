import { SavedPhrase, Language } from '@/types/phrase'
import { RiSpeakLine } from 'react-icons/ri'
import { useState, useEffect } from 'react'

interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
}

interface SpeakPracticeProps {
  phrases: SavedPhrase[]
  config: SpeakConfig
  languages: Language[]
  nativeLanguage: string
  onFinish: () => void
}

export default function SpeakPractice({
  phrases,
  config,
  languages,
  nativeLanguage,
  onFinish
}: SpeakPracticeProps) {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [todayCount, setTodayCount] = useState(0)
  const [totalCount, setTotalCount] = useState(0)
  const [sortedPhrases, setSortedPhrases] = useState<SavedPhrase[]>([])

  useEffect(() => {
    // フレーズをソートして配列を作成
    const sorted = [...phrases]
    
    // 優先度の設定に基づいてソート
    if (config.prioritizeLowPractice) {
      sorted.sort((a, b) => (a.practiceCount || 0) - (b.practiceCount || 0))
    }
    
    // 順序の設定に基づいてソート
    if (config.order === 'new-to-old') {
      sorted.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    } else {
      sorted.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime())
    }
    
    setSortedPhrases(sorted)
    setTotalCount(sorted.reduce((sum, phrase) => sum + (phrase.practiceCount || 0), 0))
  }, [phrases, config])

  const currentPhrase = sortedPhrases[currentIndex]

  const handleCount = () => {
    setTodayCount(prev => prev + 1)
    setTotalCount(prev => prev + 1)
    // TODO: APIを呼び出してpracticeCountを更新
  }

  const handleSound = () => {
    // TODO: Web Speech APIを使用して音声読み上げを実装
    if ('speechSynthesis' in window && currentPhrase) {
      const utterance = new SpeechSynthesisUtterance(currentPhrase.text)
      // 学習言語に応じて言語を設定
      if (currentPhrase.language?.code) {
        utterance.lang = currentPhrase.language.code === 'en' ? 'en-US' : currentPhrase.language.code
      }
      speechSynthesis.speak(utterance)
    }
  }

  const handleNext = () => {
    if (currentIndex < sortedPhrases.length - 1) {
      setCurrentIndex(prev => prev + 1)
    }
  }

  const handleFinish = () => {
    onFinish()
  }

  if (!currentPhrase) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px]">
        <p className="text-gray-600 mb-4">練習できるフレーズがありません</p>
        <button
          onClick={handleFinish}
          className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
        >
          戻る
        </button>
      </div>
    )
  }

  return (
    <>
      {/* Native Language表示とToday/Total情報 */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600">
          <RiSpeakLine className="inline w-4 h-4 mr-1" />
          Today: {todayCount} Total: {totalCount}
        </div>
      </div>

      {/* フレーズ表示エリア */}
      <div className="mb-6">
        <div className="bg-white border border-gray-300 rounded-md p-6 min-h-[120px] flex flex-col justify-center">
          {/* 学習言語のフレーズ（大きく表示） */}
          <div className="text-lg md:text-xl font-medium text-gray-900 mb-3 text-center">
            {currentPhrase.text}
          </div>
          
          {/* 母国語の翻訳（小さく表示） */}
          <div className="text-sm text-gray-600 text-center">
            {currentPhrase.translation}
          </div>
        </div>
      </div>

      {/* Count と Sound ボタン */}
      <div className="mb-6">
        <div className="flex gap-4">
          {/* Count ボタン */}
          <div className="flex-1 flex flex-col items-center">
            <button
              onClick={handleCount}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-2"
            >
              <div className="w-8 h-8 border-2 border-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-bold">+</span>
              </div>
            </button>
            <span className="text-gray-900 font-medium">Count</span>
          </div>

          {/* 区切り線 */}
          <div className="w-px bg-gray-300 mx-2"></div>

          {/* Sound ボタン */}
          <div className="flex-1 flex flex-col items-center">
            <button
              onClick={handleSound}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-2"
            >
              <RiSpeakLine className="w-8 h-8 text-gray-900" />
            </button>
            <span className="text-gray-900 font-medium">Sound</span>
          </div>
        </div>
      </div>

      {/* Finish と Next ボタン */}
      <div className="flex gap-3">
        <button
          onClick={handleFinish}
          className="flex-1 bg-white border py-3 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Finish
        </button>
        <button
          onClick={handleNext}
          disabled={currentIndex >= sortedPhrases.length - 1}
          className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
          style={{ 
            backgroundColor: currentIndex >= sortedPhrases.length - 1 ? '#9CA3AF' : '#616161'
          }}
        >
          Next
        </button>
      </div>
    </>
  )
}
