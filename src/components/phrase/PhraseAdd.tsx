import { PhraseVariation } from '@/types/phrase'
import { SituationResponse } from '@/types/situation'
import dynamic from 'next/dynamic'
import { BsPlusSquare } from 'react-icons/bs'
import { AiOutlineClose } from 'react-icons/ai'
import { useState } from 'react'
import AddContextModal from '@/components/modals/AddContextModal'
import Modal from '@/components/common/Modal'
import { useScrollPreservation } from '@/hooks/useScrollPreservation'
import Checkbox from '@/components/common/Checkbox'
import ScrollableContainer from '@/components/common/ScrollableContainer'

// GeneratedVariationsコンポーネントを動的インポート
const GeneratedVariations = dynamic(() => import('./GeneratedVariations'), {
  ssr: false
})

interface PhraseAddProps {
  remainingGenerations: number
  desiredPhrase: string
  phraseValidationError: string
  isLoading: boolean
  isSaving: boolean
  generatedVariations: PhraseVariation[]
  editingVariations: {[key: number]: string}
  variationValidationErrors: {[key: number]: string}
  savingVariationIndex: number | null
  error: string
  useChatGptApi: boolean
  selectedContext: 'friend' | 'sns' | string | null
  situations: SituationResponse[]
  onPhraseChange: (value: string) => void
  onGeneratePhrase: () => void
  onEditVariation: (index: number, newText: string) => void
  onSelectVariation: (variation: PhraseVariation, index: number) => void
  onResetVariations: () => void
  onUseChatGptApiChange: (value: boolean) => void
  onContextChange?: (context: string | null) => void
  addSituation: (name: string) => Promise<void>
  deleteSituation: (id: string) => Promise<void>
}

export default function PhraseAdd({
  remainingGenerations,
  desiredPhrase,
  phraseValidationError,
  isLoading,
  isSaving,
  generatedVariations,
  editingVariations,
  variationValidationErrors,
  savingVariationIndex,
  error,
  useChatGptApi,
  selectedContext,
  situations,
  onPhraseChange,
  onGeneratePhrase,
  onEditVariation,
  onSelectVariation,
  onResetVariations,
  onUseChatGptApiChange,
  onContextChange,
  addSituation,
  deleteSituation
}: PhraseAddProps) {
  // モーダルの状態管理
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false)
  const [deletingSituationId, setDeletingSituationId] = useState<string | null>(null)
  const [isDeleting, setIsDeleting] = useState(false)
  
  // スクロール位置保持機能
  const scrollPreservation = useScrollPreservation()
  
  // ボタンが有効かどうかを判定する関数
  const isGenerateButtonEnabled = () => {
    return !isLoading && 
           !isSaving && 
           desiredPhrase.trim() && 
           remainingGenerations > 0 && 
           desiredPhrase.length <= 100 && 
           generatedVariations.length === 0
  }

  // シチュエーション追加のハンドラー
  const handleAddContext = async (contextName: string) => {
    try {
      await addSituation(contextName)
    } catch (error) {
      console.error('Error adding situation:', error)
    }
  }

  // シチュエーション削除のハンドラー
  const handleDeleteSituation = (situationId: string) => {
    setDeletingSituationId(situationId)
  }

  const handleConfirmDelete = async () => {
    if (!deletingSituationId) return

    setIsDeleting(true)
    try {
      await deleteSituation(deletingSituationId)
      setDeletingSituationId(null)
      
      // 削除したシチュエーションが選択されていた場合、選択を解除
      if (selectedContext && situations.find((s: SituationResponse) => s.id === deletingSituationId)?.name === selectedContext) {
        onContextChange?.(null)
      }
    } catch (error) {
      console.error('Error deleting situation:', error)
    } finally {
      setIsDeleting(false)
    }
  }

  const handleCancelDelete = () => {
    setDeletingSituationId(null)
  }
  return (
    <>
      {/* Add Phrase見出しとLeft情報 */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          Add Phrase
        </h2>
        <div className="text-sm text-gray-600">
          Left: {remainingGenerations} / 5
        </div>
      </div>

      {/* Options section */}
      <div className="mb-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-lg font-semibold text-gray-900">Situation</h3>
          
          {/* シチュエーション表示エリア全体を囲む */}
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddContextModalOpen(true)}
              disabled={generatedVariations.length > 0}
              className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center transition-all ${
                generatedVariations.length > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="新しいシチュエーションを追加"
            >
              <BsPlusSquare size={16} />
            </button>
            
            <ScrollableContainer className="flex gap-1.5 overflow-x-auto min-w-0 flex-1">
              {situations.map((situation: SituationResponse) => (
                <button 
                  key={situation.id}
                  onClick={() => {
                    if (generatedVariations.length === 0 && onContextChange) {
                      onContextChange(selectedContext === situation.name ? null : situation.name)
                    }
                  }}
                  disabled={generatedVariations.length > 0}
                  className={`px-3 py-1 rounded-full text-sm font-medium transition-all border flex items-center gap-1.5 flex-shrink-0 ${
                    selectedContext === situation.name
                      ? 'text-white border-transparent shadow-sm' 
                      : generatedVariations.length > 0
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border-gray-200 hover:border-gray-300'
                  }`}
                  style={{ 
                    backgroundColor: selectedContext === situation.name ? '#616161' : undefined
                  }}
                >
                  <span className="whitespace-nowrap">{situation.name}</span>
                  <AiOutlineClose 
                    size={14} 
                    className="flex-shrink-0 hover:text-red-500 transition-colors" 
                    onClick={(e) => {
                      e.stopPropagation()
                      if (generatedVariations.length === 0) {
                        handleDeleteSituation(situation.id)
                      }
                    }}
                  />
                </button>
              ))}
            </ScrollableContainer>
          </div>
        </div>
      </div>

      {/* フレーズ入力エリア */}
      <div className="mb-3">
        <h3 className="text-lg font-semibold text-gray-900 mb-2">Phrase</h3>
        <textarea
          value={desiredPhrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          onFocus={scrollPreservation.onFocus}
          onBlur={scrollPreservation.onBlur}
          placeholder="例：この料理はなんですか？"
          className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none text-gray-900 placeholder-gray-300 ${
            phraseValidationError && desiredPhrase.trim().length > 0
              ? 'border-gray-400' 
              : 'border-gray-300'
          }`}
          rows={3}
          disabled={isSaving}
        />
        
        {/* 100文字を超えた場合のバリデーションメッセージ */}
        {desiredPhrase.length > 100 && (
          <div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
            <p className="text-sm text-gray-600">
              100文字以内で入力してください（現在: {desiredPhrase.length}文字）
            </p>
          </div>
        )}
      </div>

      {/* ChatGPT API使用チェックボックス */}
      <div className="mb-4">
        <Checkbox
          id="useChatGptApi"
          checked={useChatGptApi}
          onChange={onUseChatGptApiChange}
          disabled={generatedVariations.length > 0}
          className="space-x-2"
        >
          <span className={`text-sm ${generatedVariations.length > 0 ? 'text-gray-400' : 'text-gray-700'}`}>
            ChatGPT APIを使用する
          </span>
        </Checkbox>
      </div>

      {/* AI Suggest ボタン */}
      <button
        disabled={isLoading || isSaving || !desiredPhrase.trim() || remainingGenerations <= 0 || desiredPhrase.length > 100 || generatedVariations.length > 0}
        className={`w-full text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-300 mb-4 relative ${
          isLoading ? 'animate-pulse' : ''
        }`}
        style={{ 
          backgroundColor: (isLoading || isSaving || !desiredPhrase.trim() || remainingGenerations <= 0 || desiredPhrase.length > 100 || generatedVariations.length > 0) ? '#9CA3AF' : '#616161',
          boxShadow: isLoading ? '0 0 15px rgba(97, 97, 97, 0.4)' : undefined
        }}
        onMouseEnter={(e) => {
          if (isGenerateButtonEnabled() && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#525252'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (isGenerateButtonEnabled() && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#616161'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        onClick={(e) => {
          if (!isGenerateButtonEnabled() || !e.currentTarget) {
            return
          }
          
          // より控えめなクリック効果
          e.currentTarget.style.transform = 'scale(0.98)'
          setTimeout(() => {
            if (e.currentTarget) {
              e.currentTarget.style.transform = 'scale(1)'
            }
          }, 150)
          
          onGeneratePhrase()
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
            AI Suggest
          </div>
        ) : (
          'AI Suggest'
        )}
      </button>

      {/* エラー表示 */}
      {error && !isLoading && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md">
          <p className="text-sm text-red-600">{error}</p>
        </div>
      )}

      {/* 生成結果 */}
      <GeneratedVariations
        generatedVariations={generatedVariations}
        editingVariations={editingVariations}
        variationValidationErrors={variationValidationErrors}
        isSaving={isSaving}
        savingVariationIndex={savingVariationIndex}
        desiredPhrase={desiredPhrase}
        onEditVariation={onEditVariation}
        onSelectVariation={onSelectVariation}
        onReset={onResetVariations}
        error={error}
      />

      {/* シチュエーション追加モーダル */}
      <AddContextModal
        isOpen={isAddContextModalOpen}
        onClose={() => setIsAddContextModalOpen(false)}
        onAdd={handleAddContext}
      />

      {/* シチュエーション削除確認モーダル */}
      <Modal isOpen={!!deletingSituationId} onClose={handleCancelDelete}>
        <div className="p-6">
          {/* ヘッダー部分 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900">
              Delete Situation
            </h2>
          </div>

          {/* 確認メッセージ */}
          <div className="mb-6">
            <p className="text-gray-700">
              このシチュエーションを削除してもよろしいですか？<br />
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
    </>
  )
}
