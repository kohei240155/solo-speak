import { SavedPhrase, Language } from '@/types/phrase'
import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useTranslation } from '@/hooks/useTranslation'
import SpeakModeModal from '../modals/SpeakModeModal'
import LoadingSpinner from '../common/LoadingSpinner'
import PhraseItem from './PhraseItem'
import EditPhraseModal from './EditPhraseModal'
import DeleteConfirmationModal from './DeleteConfirmationModal'
import ExplanationModal from './ExplanationModal'

interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
  language: string
}

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
  const { t } = useTranslation('common')
  const router = useRouter()
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [editingPhrase, setEditingPhrase] = useState<SavedPhrase | null>(null)
  const [deletingPhraseId, setDeletingPhraseId] = useState<string | null>(null)
  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [explanationPhrase, setExplanationPhrase] = useState<SavedPhrase | null>(null)

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

  const handleExplanation = useCallback((phrase: SavedPhrase) => {
    setExplanationPhrase(phrase)
    setOpenMenuId(null)
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

  const handleEditClose = () => {
    setEditingPhrase(null)
  }

  const handleDeleteClose = () => {
    setDeletingPhraseId(null)
  }

  const handleExplanationClose = () => {
    setExplanationPhrase(null)
  }

  const handlePhraseUpdate = useCallback((updatedPhrase: SavedPhrase) => {
    if (onUpdatePhrase) {
      onUpdatePhrase(updatedPhrase)
    }
  }, [onUpdatePhrase])

  if (isLoadingPhrases && savedPhrases.length === 0) {
    return <LoadingSpinner message="Loading phrases..." className="py-8" />
  }

  if (!Array.isArray(savedPhrases) || savedPhrases.length === 0) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-600">{t('phrase.noPhrasesYet')}</p>
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
            onExplanation={handleExplanation}
          />
        ))}
        
        {/* 無限スクロール用のローディング */}
        {isLoadingMore && (
          <div className="flex justify-center py-6">
            <LoadingSpinner size="sm" message="Loading more..." className="" />
          </div>
        )}
      </div>

      {/* 編集モーダル */}
      <EditPhraseModal
        isOpen={!!editingPhrase}
        phrase={editingPhrase}
        languages={languages}
        nativeLanguage={nativeLanguage}
        onClose={handleEditClose}
        onUpdate={handlePhraseUpdate}
        onRefresh={onRefreshPhrases}
      />

      {/* 削除確認モーダル */}
      <DeleteConfirmationModal
        isOpen={!!deletingPhraseId}
        phraseId={deletingPhraseId}
        onClose={handleDeleteClose}
        onRefresh={onRefreshPhrases}
      />

      {/* Explanation モーダル */}
      <ExplanationModal
        isOpen={!!explanationPhrase}
        phrase={explanationPhrase}
        onClose={handleExplanationClose}
      />

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
