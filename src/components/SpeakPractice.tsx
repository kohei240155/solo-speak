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
  phrase: SpeakPhrase
  onCount: () => void
  onSound: () => void
  onNext: () => void
  onFinish: () => void
  todayCount: number
  totalCount: number
}

export default function SpeakPractice({
  phrase,
  onCount,
  onSound,
  onNext,
  onFinish,
  todayCount,
  totalCount
}: SpeakPracticeProps) {

  return (
    <>
      {/* フレーズ表示エリア - Phrase Listと同じレイアウト */}
      <div className="mb-6">
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
        <div className="flex items-center text-xs text-gray-600">
          <RiSpeakLine className="w-4 h-4 mr-1" />
          <span>Today: {todayCount} Total: {totalCount}</span>
        </div>
      </div>

      {/* Count と Sound ボタン */}
      <div className="mb-6">
        <div className="flex items-center justify-center">
          {/* Count ボタン */}
          <div className="flex flex-col items-center mr-6">
            <button
              onClick={onCount}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-2 transition-colors"
            >
              <CiCirclePlus className="w-8 h-8 text-gray-600" />
            </button>
            <span className="text-gray-900 font-medium text-sm">Count</span>
          </div>

          {/* 区切り線 */}
          <div className="w-px h-20 bg-gray-300 mx-6"></div>

          {/* Sound ボタン */}
          <div className="flex flex-col items-center ml-6">
            <button
              onClick={onSound}
              className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-2 transition-colors"
            >
              <HiMiniSpeakerWave className="w-8 h-8 text-gray-900" />
            </button>
            <span className="text-gray-900 font-medium text-sm">Sound</span>
          </div>
        </div>
      </div>

      {/* Finish と Next ボタン - Editと同じレイアウト */}
      <div className="flex gap-3">
        <button
          onClick={onFinish}
          className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Finish
        </button>
        <button
          onClick={onNext}
          className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
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
