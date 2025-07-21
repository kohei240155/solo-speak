import { RiSpeakLine } from 'react-icons/ri'
import { CiCirclePlus } from 'react-icons/ci'
import { HiMiniSpeakerWave } from 'react-icons/hi2'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
}

interface SpeakPracticeProps {
  phrase: SpeakPhrase | null
  onCount: () => void
  onSound: () => void
  onNext: () => void
  onFinish: () => void
  todayCount: number
  totalCount: number
  isLoading?: boolean
}

export default function SpeakPractice({
  phrase,
  onCount,
  onSound,
  onNext,
  onFinish,
  todayCount,
  totalCount,
  isLoading = false
}: SpeakPracticeProps) {

  // ローディング中の表示
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
      </div>
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
      {/* フレーズ表示エリア - Phrase Listと同じレイアウト */}
      <div className="mb-10">
        {/* 学習言語のフレーズ（メイン表示） */}
        <div className="mb-2">
          <div 
            className="text-base font-medium text-gray-900 break-words"
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          >
            {phrase.text}
          </div>
        </div>
        
        {/* 母国語の翻訳 */}
        <div className="mb-3">
          <div 
            className="text-sm text-gray-600 break-words"
            style={{ 
              wordWrap: 'break-word',
              overflowWrap: 'anywhere',
              wordBreak: 'break-word'
            }}
          >
            {phrase.translation}
          </div>
        </div>
        
        {/* Speak回数表示 */}
        <div className="flex items-center text-sm text-gray-600 min-w-0">
          <RiSpeakLine className="w-4 h-4 mr-1 flex-shrink-0" />
          <span className="break-words">Today: {todayCount}</span>
          <span className="break-words ml-4">Total: {totalCount}</span>
        </div>
      </div>

      {/* Count と Sound ボタン */}
      <div>
        <div className="flex justify-between items-start">
          {/* Count ボタン + Finish ボタン */}
          <div className="flex flex-col items-center" style={{ width: '45%' }}>
            <button
              onClick={onCount}
              className="w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none mb-1 transition-colors"
            >
              <CiCirclePlus className="w-10 h-10 text-gray-600" />
            </button>
            <span className="text-gray-900 font-medium text-base mb-8">Count</span>
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

          {/* Sound ボタン + Next ボタン */}
          <div className="flex flex-col items-center" style={{ width: '45%' }}>
            <button
              onClick={onSound}
              className="w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none mb-1 transition-colors"
            >
              <HiMiniSpeakerWave className="w-10 h-10 text-gray-900" />
            </button>
            <span className="text-gray-900 font-medium text-base mb-8">Sound</span>
            <button
              onClick={onNext}
              className="w-full text-white py-2 px-6 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              style={{ 
                backgroundColor: '#616161'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
