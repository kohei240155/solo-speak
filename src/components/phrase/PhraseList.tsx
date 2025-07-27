import { SavedPhrase, Language } from '@/types/phrase'
import { getPhraseLevelColorByCorrectAnswers } from '@/utils/phrase-level-utils'
import { RiSpeakLine, RiDeleteBin6Line } from 'react-icons/ri'
import { IoCheckboxOutline } from 'react-icons/io5'
import { BiCalendarAlt } from 'react-icons/bi'
import { BsPencil } from 'react-icons/bs'
import { useState, useCallback, useMemo, memo } from 'react'
import { useRouter } from 'next/navigation'
import Modal from '../common/Modal'
import SpeakModeModal from '../modals/SpeakModeModal'
import DropdownMenu from '../common/DropdownMenu'
import toast from 'react-hot-toast'
import { useAuth } from '@/contexts/AuthContext'
import LoadingSpinner from '../common/LoadingSpinner'
import { api } from '@/utils/api'
import { useScrollPreservation } from '@/hooks/useScrollPreservation'

interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
  language: string
}

interface PhraseItemProps {
  phrase: SavedPhrase
  isMenuOpen: boolean
  onMenuToggle: (phraseId: string) => void
  onEdit: (phrase: SavedPhrase) => void
  onSpeak: (phraseId: string) => void
  onDelete: (phraseId: string) => void
  isShowingNuance: boolean
  onCardClick: (phraseId: string) => void
}

const PhraseItem = memo(({ 
  phrase, 
  isMenuOpen, 
  onMenuToggle, 
  onEdit, 
  onSpeak, 
  onDelete,
  isShowingNuance,
  onCardClick
}: PhraseItemProps) => {
  const borderColor = useMemo(() => 
    getPhraseLevelColorByCorrectAnswers(phrase.correctAnswers || 0),
    [phrase.correctAnswers]
  )

  const formattedDate = useMemo(() => 
    new Date(phrase.createdAt).toLocaleDateString('ja-JP', { 
      year: 'numeric', 
      month: 'numeric', 
      day: 'numeric' 
    }),
    [phrase.createdAt]
  )

  return (
    <div 
      className="pl-4 pr-6 py-4 bg-white shadow-md relative cursor-pointer"
      style={{ 
        borderLeft: `4px solid ${borderColor}`,
        borderRadius: '5px',
        minHeight: '120px' // パディング減少に合わせて最小高さも調整
      }}
      onClick={() => onCardClick(phrase.id)}
    >
      <div className="flex justify-between mb-2">
        <div 
          className="text-base font-medium text-gray-900 flex-1 pr-2 break-words"
          style={{ 
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minHeight: '24px' // テキスト行の最小高さを確保
          }}
        >
          {isShowingNuance ? (phrase.nuance || 'ニュアンス情報がありません') : phrase.text}
        </div>
        <div className="relative flex-shrink-0">
          <DropdownMenu
            isOpen={isMenuOpen}
            onToggle={() => onMenuToggle(phrase.id)}
            onClose={() => onMenuToggle('')}
            items={[
              {
                id: 'edit',
                label: 'Edit',
                icon: BsPencil,
                onClick: () => onEdit(phrase)
              },
              {
                id: 'speak',
                label: 'Speak',
                icon: RiSpeakLine,
                onClick: () => onSpeak(phrase.id)
              },
              {
                id: 'delete',
                label: 'Delete',
                icon: RiDeleteBin6Line,
                onClick: () => onDelete(phrase.id),
                variant: 'danger'
              }
            ]}
          />
        </div>
      </div>
      <div className="flex justify-between mb-3">
        <div 
          className="text-sm text-gray-600 break-words flex-1 pr-2"
          style={{ 
            wordWrap: 'break-word',
            overflowWrap: 'anywhere',
            wordBreak: 'break-word',
            minHeight: '20px' // 翻訳行の最小高さを確保
          }}
        >
          {isShowingNuance ? '\u00A0' : phrase.translation} {/* ニュアンス表示時は非破壊スペースで高さを保持 */}
        </div>
        <div className="relative flex-shrink-0 w-5">
          {/* 三点リーダーと同じ幅のスペースを確保 */}
        </div>
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
          {formattedDate}
        </div>
      </div>
    </div>
  )
})

PhraseItem.displayName = 'PhraseItem'

interface PhraseListProps {
  savedPhrases: SavedPhrase[]
  isLoadingPhrases: boolean
  isLoadingMore?: boolean
  languages?: Language[]
  nativeLanguage?: string
  learningLanguage?: string
  onUpdatePhrase?: (phrase: SavedPhrase) => void
  onRefreshPhrases?: () => void
  showSpeakModal?: boolean
  onSpeakModalStateChange?: (isOpen: boolean) => void
}

export default function PhraseList({ 
  savedPhrases, 
  isLoadingPhrases,
  isLoadingMore = false,
  languages = [],
  nativeLanguage = 'ja',
  learningLanguage = 'en',
  onUpdatePhrase,
  onRefreshPhrases,
  showSpeakModal: externalShowSpeakModal = false,
  onSpeakModalStateChange
}: PhraseListProps) {
  const router = useRouter()
  const { session } = useAuth()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingPhrase, setEditingPhrase] = useState<SavedPhrase | null>(null)
  const [editedText, setEditedText] = useState('')
  const [editedTranslation, setEditedTranslation] = useState('')
  const [isUpdating, setIsUpdating] = useState(false)
  const [deletingPhraseId, setDeletingPhraseId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [nuanceViewingIds, setNuanceViewingIds] = useState<Set<string>>(new Set())

  // スクロール位置保持機能
  const scrollPreservation = useScrollPreservation()

  // 外部からのSpeakモーダル制御
  const actualShowSpeakModal = externalShowSpeakModal || showSpeakModal

  const handleMenuToggle = useCallback((phraseId: string) => {
    if (phraseId === '') {
      setOpenMenuId(null)
    } else {
      setOpenMenuId(openMenuId === phraseId ? null : phraseId)
    }
  }, [openMenuId])

  const handleEdit = useCallback((phrase: SavedPhrase) => {
    setEditingPhrase(phrase)
    setEditedText(phrase.text)               // 学習言語（下のフォーム）
    setEditedTranslation(phrase.translation) // 母国語（上のフォーム）
    setOpenMenuId(null)
  }, [])

  const handleSpeak = useCallback((phraseId: string) => {
    // 特定のフレーズを練習するために、そのフレーズIDをパラメータとして遷移
    router.push(`/phrase/speak?phraseId=${phraseId}`)
    setOpenMenuId(null)
  }, [router])

  const handleDelete = useCallback((phraseId: string) => {
    setDeletingPhraseId(phraseId)
    setOpenMenuId(null)
  }, [])

  const handleCardClick = useCallback((phraseId: string) => {
    setNuanceViewingIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(phraseId)) {
        newSet.delete(phraseId)
      } else {
        newSet.add(phraseId)
      }
      return newSet
    })
  }, [])

  const handleSpeakStart = (config: SpeakConfig) => {
    // 設定に基づいてSpeak画面に遷移
    const queryParams = new URLSearchParams({
      order: config.order,
      prioritizeLowPractice: config.prioritizeLowPractice.toString(),
      language: config.language
    })
    router.push(`/phrase/speak?${queryParams.toString()}`)
  }

  const handleSpeakModalClose = () => {
    setShowSpeakModal(false)
    if (onSpeakModalStateChange) {
      onSpeakModalStateChange(false)
    }
  }

  const handleConfirmDelete = async () => {
    if (!deletingPhraseId || !session) return

    setIsDeleting(true)
    try {
      await api.delete(`/api/phrase/${deletingPhraseId}`)

      setDeletingPhraseId(null)
      
      // リストを更新
      if (onRefreshPhrases) {
        onRefreshPhrases()
      }

      // 成功トースト表示
      toast.success('Phrase deleted successfully!')
      
    } catch (error) {
      console.error('Error deleting phrase:', error)
      toast.error('Failed to delete phrase')
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingPhraseId(null)
    setIsDeleting(false)
  }

  const handleUpdatePhrase = async () => {
    if (!editingPhrase || !session) return

    setIsUpdating(true)
    try {
      const updatedPhrase = await api.put<SavedPhrase>(`/api/phrase/${editingPhrase.id}`, {
        text: editedText.trim(),            // 学習言語（下のフォーム）
        translation: editedTranslation.trim() // 母国語（上のフォーム）
      })
      
      // フレーズを更新してモーダルを閉じる
      if (onUpdatePhrase) {
        await onUpdatePhrase(updatedPhrase)
      }
      
      setEditingPhrase(null)
      
      // リストを更新
      if (onRefreshPhrases) {
        onRefreshPhrases()
      }

      // 成功トースト表示
      toast.success('Phrase updated successfully!')
      
    } catch (error) {
      console.error('Error updating phrase:', error)
      toast.error('Failed to update phrase')
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
    return <LoadingSpinner message="Loading phrases..." className="py-8" />
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
          <PhraseItem
            key={`${phrase.id}-${index}`}
            phrase={phrase}
            isMenuOpen={openMenuId === phrase.id}
            onMenuToggle={handleMenuToggle}
            onEdit={handleEdit}
            onSpeak={handleSpeak}
            onDelete={handleDelete}
            isShowingNuance={nuanceViewingIds.has(phrase.id)}
            onCardClick={handleCardClick}
          />
        ))}
        
        {/* 無限スクロール用のローディング */}
        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="sm" message="Loading phrases..." className="" />
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <Modal isOpen={!!editingPhrase} onClose={handleCancelEdit}>
        <div className="p-6">
          {/* ヘッダー部分 - Editタイトル */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Edit
            </h2>
          </div>

          {/* 母国語 section (上のフォーム) */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}
            </h3>
            <textarea
              value={editedTranslation}
              onChange={(e) => setEditedTranslation(e.target.value)}
              onFocus={scrollPreservation.onFocus}
              onBlur={scrollPreservation.onBlur}
              placeholder={`${languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}で入力してください`}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${
                editedTranslation.length > 200 ? 'text-red-500' : 'text-gray-500'
              }`}>
                200文字以内で入力してください
              </span>
              <span className={`text-xs ${
                editedTranslation.length > 200 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {editedTranslation.length} / 200
              </span>
            </div>
          </div>

          {/* 学習言語 section (下のフォーム) */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {editingPhrase?.language?.name || 'English'}
            </h3>
            <textarea
              value={editedText}
              onChange={(e) => setEditedText(e.target.value)}
              onFocus={scrollPreservation.onFocus}
              onBlur={scrollPreservation.onBlur}
              placeholder="Enter phrase"
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              disabled={isUpdating}
            />
            <div className="flex justify-between items-center mt-1">
              <span className={`text-xs ${
                editedText.length > 200 ? 'text-red-500' : 'text-gray-500'
              }`}>
                200文字以内で入力してください
              </span>
              <span className={`text-xs ${
                editedText.length > 200 ? 'text-red-500' : 'text-gray-500'
              }`}>
                {editedText.length} / 200
              </span>
            </div>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleCancelEdit}
              disabled={isUpdating}
              className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpdatePhrase}
              disabled={isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 200 || editedTranslation.length > 200}
              className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: (isUpdating || !editedText.trim() || !editedTranslation.trim() || editedText.length > 200 || editedTranslation.length > 200) ? '#9CA3AF' : '#616161'
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

      {/* 削除確認モーダル */}
      <Modal isOpen={!!deletingPhraseId} onClose={handleCancelDelete}>
        <div className="p-6">
          {/* ヘッダー部分 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Delete Phrase
            </h2>
          </div>

          {/* 確認メッセージ */}
          <div className="mb-6">
            <p className="text-gray-700">
              このフレーズを削除してもよろしいですか？<br />
              この操作は取り消すことができません。
            </p>
          </div>

          {/* ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleCancelDelete}
              disabled={isDeleting}
              className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleConfirmDelete}
              disabled={isDeleting}
              className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed"
              style={{ 
                backgroundColor: isDeleting ? '#FCA5A5' : '#DC2626'
              }}
            >
              {isDeleting ? (
                <div className="flex items-center justify-center">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Deleting...
                </div>
              ) : (
                'Delete'
              )}
            </button>
          </div>
        </div>
      </Modal>

      {/* Speak Mode モーダル */}
      <SpeakModeModal
        isOpen={actualShowSpeakModal}
        onClose={handleSpeakModalClose}
        onStart={handleSpeakStart}
        languages={languages}
        defaultLearningLanguage={learningLanguage}
      />

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
