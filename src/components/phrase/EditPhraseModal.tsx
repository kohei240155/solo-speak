import { SavedPhrase, Language } from '@/types/phrase'
import { useState, useCallback, useEffect } from 'react'
import BaseModal from '../common/BaseModal'
import { useScrollPreservation } from '@/hooks/useScrollPreservation'
import { api } from '@/utils/api'
import { useAuth } from '@/contexts/AuthContext'
import toast from 'react-hot-toast'

interface EditPhraseModalProps {
  isOpen: boolean
  phrase: SavedPhrase | null
  languages: Language[]
  nativeLanguage: string
  onClose: () => void
  onUpdate: (phrase: SavedPhrase) => void
  onRefresh?: () => void
}

export default function EditPhraseModal({
  isOpen,
  phrase,
  languages,
  nativeLanguage,
  onClose,
  onUpdate,
  onRefresh
}: EditPhraseModalProps) {
  const { session } = useAuth()
  const [editedText, setEditedText] = useState('')
  const [editedTranslation, setEditedTranslation] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [selectedAction, setSelectedAction] = useState<'save' | 'cancel' | null>(null)
  
  // スクロール位置保持機能
  const scrollPreservation = useScrollPreservation()

  // モーダルが開かれた時に初期値を設定
  const handleModalOpen = useCallback(() => {
    if (phrase) {
      setEditedText(phrase.original)
      setEditedTranslation(phrase.translation)
    }
  }, [phrase])

  // モーダルが開かれた時の処理
  useEffect(() => {
    if (isOpen && phrase) {
      handleModalOpen()
    }
  }, [isOpen, phrase, handleModalOpen])

  const handleUpdatePhrase = async () => {
    if (!phrase || !session) return

    setIsUpdating(true)
    setSelectedAction('save')
    try {
      const updatedPhrase = await api.put<SavedPhrase>(`/api/phrase/${phrase.id}`, {
        original: editedText.trim(),
        translation: editedTranslation.trim()
      })
      
      // フレーズを更新してモーダルを閉じる
      onUpdate(updatedPhrase)
      onClose()
      
      // リストを更新
      if (onRefresh) {
        onRefresh()
      }

      // 成功トースト表示
      toast.success('Phrase updated successfully!')
      
    } catch (error) {
      console.error('Error updating phrase:', error)
      toast.error('Failed to update phrase')
    } finally {
      setIsUpdating(false)
      setSelectedAction(null)
    }
  }

  const handleCancel = () => {
    setSelectedAction('cancel')
    setEditedText('')
    setEditedTranslation('')
    onClose()
    setSelectedAction(null)
  }

  if (!phrase) return null

  return (
    <BaseModal isOpen={isOpen} onClose={handleCancel} title="Edit">
      {/* 母国語 section (上のフォーム) */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}
        </h3>
        <textarea
          value={editedTranslation}
          onChange={(e) => setEditedTranslation(e.target.value)}
          onFocus={scrollPreservation.onFocus}
          onBlur={scrollPreservation.onBlur}
          placeholder="例：この料理はなんですか？"
          className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none text-gray-900 placeholder-gray-300 ${
            editedTranslation.length > 200
              ? 'border-gray-400' 
              : 'border-gray-300'
          }`}
          rows={3}
          disabled={isUpdating}
        />
        
        {/* 200文字を超えた場合のバリデーションメッセージ */}
        {editedTranslation.length > 200 && (
          <div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm text-gray-600">
              200文字以内で入力してください（現在: {editedTranslation.length}文字）
            </p>
          </div>
        )}
      </div>

      {/* 学習言語 section (下のフォーム) */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">
          {phrase.language?.name || 'English'}
        </h3>
        <textarea
          value={editedText}
          onChange={(e) => setEditedText(e.target.value)}
          onFocus={scrollPreservation.onFocus}
          onBlur={scrollPreservation.onBlur}
          placeholder="Enter phrase"
          className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none text-gray-900 placeholder-gray-300 ${
            editedText.length > 200
              ? 'border-gray-400' 
              : 'border-gray-300'
          }`}
          rows={3}
          disabled={isUpdating}
        />
        
        {/* 200文字を超えた場合のバリデーションメッセージ */}
        {editedText.length > 200 && (
          <div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm text-gray-600">
              200文字以内で入力してください（現在: {editedText.length}文字）
            </p>
          </div>
        )}
      </div>

      {/* ボタン */}
      <div className="flex gap-3">
        <button
          onClick={(e) => {
            if (isUpdating || !e.currentTarget) return
            
            // スケール効果
            e.currentTarget.style.transform = 'scale(0.98)'
            setTimeout(() => {
              if (e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }, 150)
            
            handleCancel()
          }}
          disabled={isUpdating}
          className={`flex-1 bg-white border py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:cursor-not-allowed ${
            isUpdating && selectedAction === 'cancel'
              ? 'opacity-50 animate-pulse'
              : isUpdating && selectedAction === 'save'
              ? 'opacity-50'
              : 'hover:bg-gray-50'
          }`}
          style={{ 
            borderColor: '#616161',
            color: '#616161',
            boxShadow: isUpdating && selectedAction === 'cancel' ? '0 0 15px rgba(97, 97, 97, 0.4)' : undefined
          }}
          onMouseEnter={(e) => {
            if (!isUpdating && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#f9fafb'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpdating && e.currentTarget) {
              e.currentTarget.style.backgroundColor = 'white'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {isUpdating && selectedAction === 'cancel' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-600 mr-2"></div>
              Cancel
            </div>
          ) : (
            'Cancel'
          )}
        </button>
        <button
          onClick={(e) => {
            if (isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 200 || editedTranslation.length > 200 || !e.currentTarget) return
            
            // スケール効果
            e.currentTarget.style.transform = 'scale(0.98)'
            setTimeout(() => {
              if (e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }, 150)
            
            handleUpdatePhrase()
          }}
          disabled={isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 200 || editedTranslation.length > 200}
          className={`flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 disabled:cursor-not-allowed ${
            isUpdating && selectedAction === 'save'
              ? 'opacity-50 animate-pulse'
              : isUpdating && selectedAction === 'cancel'
              ? 'opacity-50'
              : ''
          }`}
          style={{ 
            backgroundColor: (isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 200 || editedTranslation.length > 200) ? '#9CA3AF' : '#616161',
            boxShadow: isUpdating && selectedAction === 'save' ? '0 0 15px rgba(97, 97, 97, 0.4)' : undefined
          }}
          onMouseEnter={(e) => {
            if (!isUpdating && editedText.trim() && editedTranslation.trim() && editedText.length <= 200 && editedTranslation.length <= 200 && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#525252'
              e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
            }
          }}
          onMouseLeave={(e) => {
            if (!isUpdating && editedText.trim() && editedTranslation.trim() && editedText.length <= 200 && editedTranslation.length <= 200 && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#616161'
              e.currentTarget.style.boxShadow = 'none'
            }
          }}
        >
          {isUpdating && selectedAction === 'save' ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </BaseModal>
  )
}
