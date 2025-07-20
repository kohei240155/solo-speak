import { SavedPhrase, Language } from '@/types/phrase'
import { getPhraseLevelColorByCorrectAnswers } from '@/utils/phrase-level-utils'
import { RiSpeakLine, RiDeleteBin6Line } from 'react-icons/ri'
import { IoCheckboxOutline } from 'react-icons/io5'
import { BiCalendarAlt } from 'react-icons/bi'
import { HiOutlineEllipsisHorizontalCircle } from 'react-icons/hi2'
import { BsPencil } from 'react-icons/bs'
import { useState } from 'react'
import Modal from './Modal'

interface PhraseListProps {
  savedPhrases: SavedPhrase[]
  isLoadingPhrases: boolean
  languages?: Language[]
  nativeLanguage?: string
  onUpdatePhrase?: (phrase: SavedPhrase) => void
  onDeletePhrase?: (phraseId: string) => void
  onSpeakPhrase?: (phrase: SavedPhrase) => void
}

export default function PhraseList({ 
  savedPhrases, 
  isLoadingPhrases,
  languages = [],
  nativeLanguage = 'ja',
  onUpdatePhrase,
  onDeletePhrase,
  onSpeakPhrase
}: PhraseListProps) {
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingPhrase, setEditingPhrase] = useState<SavedPhrase | null>(null)
  const [editedText, setEditedText] = useState('')
  const [editedTranslation, setEditedTranslation] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)

  const handleMenuToggle = (phraseId: string) => {
    setOpenMenuId(openMenuId === phraseId ? null : phraseId)
  }

  const handleEdit = (phrase: SavedPhrase) => {
    setEditingPhrase(phrase)
    setEditedText(phrase.text)
    setEditedTranslation(phrase.translation)
    setOpenMenuId(null)
  }

  const handleSpeak = (phrase: SavedPhrase) => {
    if (onSpeakPhrase) {
      onSpeakPhrase(phrase)
    }
    setOpenMenuId(null)
  }

  const handleDelete = (phraseId: string) => {
    if (onDeletePhrase) {
      onDeletePhrase(phraseId)
    }
    setOpenMenuId(null)
  }

  const handleUpdatePhrase = async () => {
    if (!editingPhrase || !onUpdatePhrase) return

    setIsUpdating(true)
    try {
      const updatedPhrase = {
        ...editingPhrase,
        text: editedText,
        translation: editedTranslation
      }
      await onUpdatePhrase(updatedPhrase)
      setEditingPhrase(null)
    } catch (error) {
      console.error('Error updating phrase:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  const handleCancelEdit = () => {
    setEditingPhrase(null)
    setEditedText('')
    setEditedTranslation('')
  }
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
    <>
      <div className="space-y-4">
        {savedPhrases.map((phrase, index) => (
          <div 
            key={`${phrase.id}-${index}`} 
            className="pl-4 pr-6 py-6 bg-white shadow-md relative"
            style={{ 
              borderLeft: `4px solid ${getPhraseLevelColorByCorrectAnswers(phrase.correctAnswers || 0)}`,
              borderRadius: '5px'
            }}
          >
            <div className="flex justify-between mb-2">
              <div className="text-base font-medium text-gray-900 flex-1 pr-2">
                {phrase.translation}
              </div>
              <div className="relative">
                <button 
                  onClick={() => handleMenuToggle(phrase.id)}
                  className="text-gray-900 hover:text-gray-700 flex-shrink-0 self-start"
                >
                  <HiOutlineEllipsisHorizontalCircle className="w-5 h-5" />
                </button>
                
                {/* ドロップダウンメニュー */}
                {openMenuId === phrase.id && (
                  <div className="absolute right-0 top-8 bg-white border border-gray-200 rounded-md shadow-lg z-10 w-28">
                    <button
                      onClick={() => handleEdit(phrase)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <BsPencil className="w-3 h-3" />
                      Edit
                    </button>
                    <button
                      onClick={() => handleSpeak(phrase)}
                      className="w-full px-3 py-2 text-left text-sm text-gray-700 hover:bg-gray-50 flex items-center gap-2"
                    >
                      <RiSpeakLine className="w-3 h-3" />
                      Speak
                    </button>
                    <button
                      onClick={() => handleDelete(phrase.id)}
                      className="w-full px-3 py-2 text-left text-sm text-red-600 hover:bg-red-50 flex items-center gap-2"
                    >
                      <RiDeleteBin6Line className="w-3 h-3" />
                      Delete
                    </button>
                  </div>
                )}
              </div>
            </div>
            <div className="text-sm text-gray-900 mb-3">
              {phrase.text}
            </div>
            <div className="flex items-center justify-between text-xs text-gray-900">
              <div className="flex items-center space-x-6">
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

      {/* 編集モーダル */}
      <Modal isOpen={!!editingPhrase} onClose={handleCancelEdit}>
        <div className="p-6">
          {/* ヘッダー部分 - PhraseAddと同じスタイル */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              {languages.length > 0 
                ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
                : 'Japanese'
              }
            </h2>
          </div>

          {/* English section */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">English</h3>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              placeholder="Enter English phrase"
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                100文字以内で入力してください
              </span>
              <span className={`text-xs ${
                editedText.length > 100 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {editedText.length} / 100
              </span>
            </div>
          </div>

          {/* Japanese section */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}
            </h3>
            <textarea
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              placeholder={`${languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}で入力してください`}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-1">
              <span className="text-xs text-gray-500">
                100文字以内で入力してください
              </span>
              <span className={`text-xs ${
                editedTranslation.length > 100 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {editedTranslation.length} / 100
              </span>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="flex-1 bg-gray-100 text-gray-700 py-2 px-4 rounded-md font-medium hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePhrase}
              disabled={isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 100 || editedTranslation.length > 100}
              className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: (isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 100 || editedTranslation.length > 100) ? '#9CA3AF' : '#616161'
              }}
            >
              {isUpdating ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </div>
              ) : (
                'Save'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* メニューが開いている時のオーバーレイ */}
      {openMenuId && (
        <div 
          className="fixed inset-0 z-0"
          onClick={() => setOpenMenuId(null)}
        />
      )}
    </>
  )
}
