import { Language } from '@/types/phrase'
import { RiSpeakLine } from 'react-icons/ri'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
}

interface SpeakPracticeProps {
  phrase: SpeakPhrase
  languages: Language[]
  nativeLanguage: string
  onCount: () => void
  onSound: () => void
  onNext: () => void
  onFinish: () => void
  todayCount: number
  totalCount: number
}

export default function SpeakPractice({
  phrase,
  languages,
  nativeLanguage,
  onCount,
  onSound,
  onNext,
  onFinish,
  todayCount,
  totalCount
}: SpeakPracticeProps) {

  return (
    <>
      {/* Native Language表示とToday/Total情報 */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600 flex items-center">
          <RiSpeakLine className="w-4 h-4 mr-1" />
          Today: {todayCount}  Total: {totalCount}
        </div>
      </div>

      {/* フレーズ表示エリア */}
      <div className="mb-8">
        <div className="bg-white rounded-lg p-6 min-h-[140px] flex flex-col justify-center text-center">
          {/* 学習言語のフレーズ（大きく表示） */}
          <div className="text-base sm:text-lg md:text-xl font-medium text-gray-900 mb-4 leading-relaxed">
            {phrase.text}
          </div>
          
          {/* 母国語の翻訳（小さく表示） */}
          <div className="text-sm sm:text-base md:text-lg text-gray-600 leading-relaxed">
            {phrase.translation}
          </div>
        </div>
      </div>

      {/* Count と Sound ボタン */}
      <div className="mb-8">
        <div className="flex items-center justify-center">
          {/* Count ボタン */}
          <div className="flex flex-col items-center mr-8">
            <button
              onClick={onCount}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3 transition-colors"
            >
              <div className="w-8 h-8 border-2 border-gray-600 rounded-full flex items-center justify-center">
                <span className="text-gray-600 text-xl font-bold">+</span>
              </div>
            </button>
            <span className="text-gray-900 font-medium text-sm">Count</span>
          </div>

          {/* 区切り線 */}
          <div className="w-px h-20 bg-gray-300 mx-8"></div>

          {/* Sound ボタン */}
          <div className="flex flex-col items-center ml-8">
            <button
              onClick={onSound}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3 transition-colors"
            >
              <RiSpeakLine className="w-7 h-7 text-gray-900" />
            </button>
            <span className="text-gray-900 font-medium text-sm">Sound</span>
          </div>
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
          className="flex-1 text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          style={{ 
            backgroundColor: '#616161'
          }}
        >
          Next
        </button>
      </div>
    </>
  )
}
