import { SavedPhrase } from '@/types/phrase'
import { getBorderColor } from '@/utils/phrase-utils'
import { RiSpeakLine } from 'react-icons/ri'
import { IoCheckboxOutline } from 'react-icons/io5'
import { BiCalendarAlt } from 'react-icons/bi'
import { HiOutlineEllipsisHorizontalCircle } from 'react-icons/hi2'

interface PhraseListProps {
  savedPhrases: SavedPhrase[]
  isLoadingPhrases: boolean
}

export default function PhraseList({ 
  savedPhrases, 
  isLoadingPhrases
}: PhraseListProps) {
  if (isLoadingPhrases && savedPhrases.length === 0) {
    return (
      <div className="text-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading phrases...</p>
      </div>
    )
  }

  if (!Array.isArray(savedPhrases) || savedPhrases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">まだフレーズが登録されていません</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {savedPhrases.map((phrase) => (
        <div 
          key={phrase.id} 
          className="pl-4 pr-6 py-6 bg-white shadow-md"
          style={{ 
            borderLeft: `4px solid ${getBorderColor(phrase.correctAnswers || 0)}`,
            borderRadius: '5px'
          }}
        >
          <div className="flex justify-between mb-2">
            <div className="text-base font-medium text-gray-900 flex-1 pr-2">
              {phrase.translation}
            </div>
            <button className="text-gray-900 hover:text-gray-700 flex-shrink-0 self-start">
              <HiOutlineEllipsisHorizontalCircle className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-gray-900 mb-3">
            {phrase.text}
          </div>
          <div className="flex items-center justify-between text-xs text-gray-900">
            <div className="flex items-center space-x-4">
              <span className="flex items-center">
                <RiSpeakLine className="w-4 h-4 mr-1" />
                {phrase.practiceCount || 0}
              </span>
              <span className="flex items-center">
                <IoCheckboxOutline className="w-4 h-4 mr-1" />
                {phrase.correctAnswers || 0}
              </span>
            </div>
            <div className="flex items-center">
              <BiCalendarAlt className="w-4 h-4 mr-1" />
              {new Date(phrase.createdAt).toLocaleDateString('ja-JP', { 
                year: 'numeric', 
                month: 'numeric', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>
      ))}
      
      {/* 無限スクロール用のローディング */}
      {isLoadingPhrases && savedPhrases.length > 0 && (
        <div className="text-center py-4">
          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
        </div>
      )}
    </div>
  )
}
