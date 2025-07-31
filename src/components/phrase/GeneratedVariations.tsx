import { PhraseVariation } from '@/types/phrase'
import { GrPowerReset } from 'react-icons/gr'
import { AiOutlineCaretRight } from 'react-icons/ai'
import { useScrollPreservation } from '@/hooks/useScrollPreservation'

interface GeneratedVariationsProps {
  generatedVariations: PhraseVariation[]
  editingVariations: {[key: number]: string}
  variationValidationErrors: {[key: number]: string}
  isSaving: boolean
  savingVariationIndex: number | null
  desiredPhrase: string
  onEditVariation: (index: number, newText: string) => void
  onSelectVariation: (variation: PhraseVariation, index: number) => void
  onReset: () => void
  error: string
}

export default function GeneratedVariations({
  generatedVariations,
  editingVariations,
  variationValidationErrors,
  isSaving,
  savingVariationIndex,
  desiredPhrase,
  onEditVariation,
  onSelectVariation,
  onReset,
  error
}: GeneratedVariationsProps) {
  // スクロール位置保持機能
  const scrollPreservation = useScrollPreservation()
  
  if (generatedVariations.length === 0) {
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center mb-3">
        <h3 className="text-xl md:text-2xl font-bold text-gray-900">
          AI Suggested Phrases
        </h3>
        <button
          onClick={onReset}
          disabled={isSaving}
          className="flex items-center justify-center w-8 h-8 text-gray-800 hover:text-black rounded-md hover:bg-gray-100 transition-colors duration-200"
          title="Reset"
        >
          <GrPowerReset className="w-4 h-4" />
        </button>
      </div>
      
      {generatedVariations.map((variation, index) => (
        <div key={index} className="mb-8">
          <div className="mb-3">
            <div className="flex flex-col">
              {/* Phrase番号とキャレットアイコンを表示 */}
              <div className="flex items-center">
                <AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
                <span className="font-medium text-gray-900 text-lg">
                  Phrase {index + 1}
                </span>
              </div>
            </div>
          </div>
          
          {/* 編集可能なテキストエリア */}
          <textarea
            value={editingVariations[index] || variation.text}
            onChange={(e) => onEditVariation(index, e.target.value)}
            onFocus={scrollPreservation.onFocus}
            onBlur={scrollPreservation.onBlur}
            className={`w-full border rounded-md px-3 py-3 text-sm resize-none focus:outline-none text-gray-900 ${
              (editingVariations[index] || variation.text).length > 200
                ? 'border-gray-400' 
                : 'border-gray-300'
            }`}
            rows={3}
            disabled={isSaving}
          />

          
          {/* 200文字を超えた場合のバリデーションメッセージ */}
          {(editingVariations[index] || variation.text).length > 200 && (
            <div className="mt-2 p-3 border border-gray-300 rounded-md bg-gray-50">
              <p className="text-sm text-gray-600">
                200文字以内で入力してください（現在: {(editingVariations[index] || variation.text).length}文字）
              </p>
            </div>
          )}

          {/* ニュアンス・説明欄 */}
          {variation.explanation && (
            <div className="mt-2 p-3 bg-gray-50 border border-gray-200 rounded-md">
              <p className="text-sm text-gray-700 leading-relaxed">
                {variation.explanation}
              </p>
            </div>
          )}
          
          {/* バリデーションエラーメッセージ */}
          {variationValidationErrors[index] && (
            <div className="mt-1 mb-3">
              <span className="text-sm text-red-600">
                {variationValidationErrors[index]}
              </span>
            </div>
          )}
          
          {/* 通常時のマージン */}
          {!variationValidationErrors[index] && (
            <div className="mb-3"></div>
          )}
          
          <button
            disabled={isSaving || !!variationValidationErrors[index] || desiredPhrase.length > 100 || (editingVariations[index] || variation.text).length > 200}
            className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors duration-200"
            style={{ 
              backgroundColor: variationValidationErrors[index] || desiredPhrase.length > 100 || (editingVariations[index] || variation.text).length > 200 ? '#9CA3AF' : '#616161'
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !variationValidationErrors[index] && desiredPhrase.length <= 100 && (editingVariations[index] || variation.text).length <= 200 && e.currentTarget) {
                e.currentTarget.style.backgroundColor = '#525252'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && !variationValidationErrors[index] && desiredPhrase.length <= 100 && (editingVariations[index] || variation.text).length <= 200 && e.currentTarget) {
                e.currentTarget.style.backgroundColor = '#616161'
              }
            }}
            onClick={() => onSelectVariation(variation, index)}
          >
            {isSaving && savingVariationIndex === index ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                Saving...
              </div>
            ) : (
              'Select'
            )}
          </button>
        </div>
      ))}

      {/* エラーメッセージ */}
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mt-4">
          {error}
        </div>
      )}
    </div>
  )
}
