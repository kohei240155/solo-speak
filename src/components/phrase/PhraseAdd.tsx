import { Language, PhraseVariation } from '@/types/phrase'
import dynamic from 'next/dynamic'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { BsPlusSquare } from 'react-icons/bs'
import { AiOutlineClose } from 'react-icons/ai'
import { useState } from 'react'
import AddContextModal from '@/components/modals/AddContextModal'
import { useSituations } from '@/hooks/useSituations'

// GeneratedVariationsコンポーネントを動的インポート
const GeneratedVariations = dynamic(() => import('./GeneratedVariations'), {
  ssr: false,
  loading: () => <LoadingSpinner size="md" message="Loading variations..." />
})

interface PhraseAddProps {
  languages: Language[]
  nativeLanguage: string
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
  selectedType: 'common' | 'business' | 'casual'
  useChatGptApi: boolean
  selectedContext: 'friend' | 'sns' | string | null
  onPhraseChange: (value: string) => void
  onGeneratePhrase: () => void
  onEditVariation: (index: number, newText: string) => void
  onSelectVariation: (variation: PhraseVariation, index: number) => void
  onResetVariations: () => void
  onTypeChange: (type: 'common' | 'business' | 'casual') => void
  onUseChatGptApiChange: (value: boolean) => void
  onContextChange?: (context: string | null) => void
}

export default function PhraseAdd({
  languages,
  nativeLanguage,
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
  selectedType,
  useChatGptApi,
  selectedContext,
  onPhraseChange,
  onGeneratePhrase,
  onEditVariation,
  onSelectVariation,
  onResetVariations,
  onTypeChange,
  onUseChatGptApiChange,
  onContextChange
}: PhraseAddProps) {
  // モーダルの状態管理
  const [isAddContextModalOpen, setIsAddContextModalOpen] = useState(false)
  
  // Situationsを取得
  const { situations, addSituation } = useSituations()
  
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
      console.log('新しいシチュエーション追加:', contextName)
    } catch (error) {
      console.error('Error adding situation:', error)
    }
  }
  return (
    <>
      {/* Native Language表示とLeft情報 */}
      <div className="flex justify-between items-center mb-2">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600">
          Left: {remainingGenerations} / 5
        </div>
      </div>

      {/* Expression Type section */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <h3 className="text-base font-semibold text-gray-900">Expression Type</h3>
          <div className="flex gap-2">
            <button 
              onClick={() => generatedVariations.length === 0 && onTypeChange('common')}
              disabled={generatedVariations.length > 0}
              className={`px-3 py-1 rounded-full text-sm font-medium min-w-[70px] text-center transition-colors ${
                selectedType === 'common' 
                  ? 'text-white' 
                  : generatedVariations.length > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedType === 'common' ? '#616161' : undefined
              }}
            >
              Common
            </button>
            <button 
              onClick={() => generatedVariations.length === 0 && onTypeChange('business')}
              disabled={generatedVariations.length > 0}
              className={`px-3 py-1 rounded-full text-sm font-medium min-w-[70px] text-center transition-colors ${
                selectedType === 'business' 
                  ? 'text-white' 
                  : generatedVariations.length > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedType === 'business' ? '#616161' : undefined
              }}
            >
              Business
            </button>
            <button 
              onClick={() => generatedVariations.length === 0 && onTypeChange('casual')}
              disabled={generatedVariations.length > 0}
              className={`px-3 py-1 rounded-full text-sm font-medium min-w-[70px] text-center transition-colors ${
                selectedType === 'casual' 
                  ? 'text-white' 
                  : generatedVariations.length > 0
                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
              style={{ 
                backgroundColor: selectedType === 'casual' ? '#616161' : undefined
              }}
            >
              Casual
            </button>
          </div>
        </div>
      </div>

      {/* Options section */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:justify-between md:items-center gap-2">
          <div className="flex items-center gap-2">
            <button 
              onClick={() => setIsAddContextModalOpen(true)}
              disabled={generatedVariations.length > 0}
              className={`p-1 rounded transition-colors ${
                generatedVariations.length > 0
                  ? 'text-gray-400 cursor-not-allowed'
                  : 'text-gray-600 hover:text-gray-800 hover:bg-gray-100'
              }`}
              title="新しいシチュエーションを追加"
            >
              <BsPlusSquare size={18} />
            </button>
          </div>
          <div className="flex gap-2 flex-wrap">
            {situations.map((situation) => (
              <button 
                key={situation.id}
                onClick={() => {
                  if (generatedVariations.length === 0 && onContextChange) {
                    onContextChange(selectedContext === situation.name ? null : situation.name)
                  }
                }}
                disabled={generatedVariations.length > 0}
                className={`px-3 py-1 rounded-full text-sm font-medium min-w-[90px] text-center transition-colors flex items-center gap-1 ${
                  selectedContext === situation.name
                    ? 'text-white' 
                    : generatedVariations.length > 0
                      ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
                style={{ 
                  backgroundColor: selectedContext === situation.name ? '#616161' : undefined
                }}
              >
                {situation.name}
                <AiOutlineClose size={14} />
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* フレーズ入力エリア */}
      <div className="mb-3">
        <textarea
          value={desiredPhrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          placeholder={`知りたいフレーズを${languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}で入力してください`}
          className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 text-gray-900 placeholder-gray-300 ${
            phraseValidationError && desiredPhrase.trim().length > 0
              ? 'border-red-300 focus:ring-red-500' 
              : 'border-gray-300 focus:ring-blue-500'
          }`}
          rows={3}
          disabled={isSaving}
        />
        
        {/* 100文字以内で入力するよう促す文言とリアルタイム文字数 */}
        <div className="flex justify-between items-center mt-1">
          <span className={`text-xs ${
            desiredPhrase.length > 100 ? 'text-red-500' : 'text-gray-500'
          }`}>
            100文字以内で入力してください
          </span>
          <span className={`text-xs ${
            desiredPhrase.length > 100 ? 'text-red-500' : 'text-gray-500'
          }`}>
            {desiredPhrase.length} / 100
          </span>
        </div>
      </div>

      {/* ChatGPT API使用チェックボックス */}
      <div className="mb-4 flex items-center space-x-2">
        <input
          type="checkbox"
          id="useChatGptApi"
          checked={useChatGptApi}
          onChange={(e) => onUseChatGptApiChange(e.target.checked)}
          disabled={generatedVariations.length > 0}
          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded disabled:opacity-50"
        />
        <label 
          htmlFor="useChatGptApi" 
          className={`text-sm ${generatedVariations.length > 0 ? 'text-gray-400' : 'text-gray-700'}`}
        >
          ChatGPT APIを使用する
        </label>
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
    </>
  )
}
