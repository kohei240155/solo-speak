import { Language, PhraseVariation } from '@/types/phrase'
import GeneratedVariations from './GeneratedVariations'

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
  learningLanguage: string
  error: string
  onPhraseChange: (value: string) => void
  onGeneratePhrase: () => void
  onEditVariation: (index: number, newText: string) => void
  onSelectVariation: (variation: PhraseVariation, index: number) => void
  onResetVariations: () => void
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
  learningLanguage,
  error,
  onPhraseChange,
  onGeneratePhrase,
  onEditVariation,
  onSelectVariation,
  onResetVariations
}: PhraseAddProps) {
  return (
    <>
      {/* Native Language表示とLeft情報 */}
      <div className="flex justify-between items-center mb-3">
        <h2 className="text-lg md:text-xl font-bold text-gray-900">
          {languages.length > 0 
            ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
            : 'Loading...'
          }
        </h2>
        <div className="text-sm text-gray-600">
          Left: {remainingGenerations} / 5
        </div>
      </div>

      {/* フレーズ入力エリア */}
      <div className="mb-3">
        <textarea
          value={desiredPhrase}
          onChange={(e) => onPhraseChange(e.target.value)}
          placeholder={`知りたいフレーズを${languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}で入力してください`}
          className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 ${
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

      {/* AI Suggest ボタン */}
      <button
        disabled={isLoading || !desiredPhrase.trim() || remainingGenerations <= 0 || desiredPhrase.length > 100 || (generatedVariations.length > 0 && !isSaving) || isSaving}
        className={`w-full text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-300 mb-6 relative ${
          isLoading ? 'animate-pulse' : ''
        }`}
        style={{ 
          backgroundColor: (!desiredPhrase.trim() || remainingGenerations <= 0 || desiredPhrase.length > 100 || (generatedVariations.length > 0 && !isSaving)) ? '#9CA3AF' : '#616161',
          boxShadow: isLoading ? '0 0 15px rgba(97, 97, 97, 0.4)' : undefined
        }}
        onMouseEnter={(e) => {
          if (!isLoading && desiredPhrase.trim() && remainingGenerations > 0 && desiredPhrase.length <= 100 && !(generatedVariations.length > 0 && !isSaving) && !isSaving && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#525252'
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && desiredPhrase.trim() && remainingGenerations > 0 && desiredPhrase.length <= 100 && !(generatedVariations.length > 0 && !isSaving) && !isSaving && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#616161'
            e.currentTarget.style.boxShadow = 'none'
          }
        }}
        onClick={(e) => {
          if (!isLoading && desiredPhrase.trim() && remainingGenerations > 0 && desiredPhrase.length <= 100 && !(generatedVariations.length > 0 && !isSaving) && !isSaving && e.currentTarget) {
            // より控えめなクリック効果
            e.currentTarget.style.transform = 'scale(0.98)'
            setTimeout(() => {
              if (e.currentTarget) {
                e.currentTarget.style.transform = 'scale(1)'
              }
            }, 150)
          }
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

      {/* 生成結果 */}
      <GeneratedVariations
        generatedVariations={generatedVariations}
        editingVariations={editingVariations}
        variationValidationErrors={variationValidationErrors}
        isSaving={isSaving}
        savingVariationIndex={savingVariationIndex}
        desiredPhrase={desiredPhrase}
        learningLanguage={learningLanguage}
        onEditVariation={onEditVariation}
        onSelectVariation={onSelectVariation}
        onReset={onResetVariations}
        error={error}
      />
    </>
  )
}
