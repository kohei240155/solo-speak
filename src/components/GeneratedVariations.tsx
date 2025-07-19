import { PhraseVariation, typeLabels } from '@/types/phrase'
import { playText } from '@/utils/phrase-utils'
import { HiSpeakerWave } from 'react-icons/hi2'
import { FiCheckCircle } from 'react-icons/fi'
import { MdOutlineBusinessCenter } from 'react-icons/md'
import { CiFaceSmile } from 'react-icons/ci'

// アイコンを直接定義
const typeIcons = {
  common: <FiCheckCircle className="w-5 h-5 text-black" />,
  business: <MdOutlineBusinessCenter className="w-6 h-6 text-black" />,
  casual: <CiFaceSmile className="w-6 h-6 text-black" />
}

interface GeneratedVariationsProps {
  generatedVariations: PhraseVariation[]
  editingVariations: {[key: number]: string}
  variationValidationErrors: {[key: number]: string}
  isSaving: boolean
  savingVariationIndex: number | null
  desiredPhrase: string
  learningLanguage: string
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
  learningLanguage,
  onEditVariation,
  onSelectVariation,
  onReset,
  error
}: GeneratedVariationsProps) {
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
          className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
        >
          Reset
        </button>
      </div>
      
      {generatedVariations.map((variation, index) => (
        <div key={index} className="mb-8">
          <div className="flex items-start justify-between mb-3">
            <div className="flex items-center">
              <span className="mr-2">{typeIcons[variation.type]}</span>
              <span className="font-medium text-gray-900 text-lg">
                {typeLabels[variation.type]}
              </span>
            </div>
            <button
              onClick={() => playText(editingVariations[index] || variation.text, learningLanguage)}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 transition-colors duration-200"
              title="音声を再生"
            >
              <HiSpeakerWave className="w-4 h-4 text-gray-600" />
            </button>
          </div>
          
          {/* 編集可能なテキストエリア */}
          <textarea
            value={editingVariations[index] || variation.text}
            onChange={(e) => onEditVariation(index, e.target.value)}
            className={`w-full border rounded-md px-3 py-2 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 ${
              variationValidationErrors[index]
                ? 'border-red-300 focus:ring-red-500'
                : 'border-gray-300 focus:ring-blue-500'
            }`}
            rows={3}
            disabled={isSaving}
          />
          
          {/* バリデーションメッセージと文字数カウンター - 100文字を超えた場合のみ表示 */}
          {variationValidationErrors[index] && (editingVariations[index] || variation.text).length > 100 && (
            <div className="flex justify-between items-center mt-1 mb-3">
              <span className="text-sm text-red-600">
                {variationValidationErrors[index]}
              </span>
              <span className="text-xs text-red-500">
                {(editingVariations[index] || variation.text).length} / 100
              </span>
            </div>
          )}
          
          {/* 通常時のマージン */}
          {(editingVariations[index] || variation.text).length <= 100 && (
            <div className="mb-3"></div>
          )}
          
          <button
            disabled={isSaving || !!variationValidationErrors[index] || desiredPhrase.length > 100}
            className={`w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-all duration-300 relative ${
              (isSaving && savingVariationIndex === index) ? 'animate-pulse' : ''
            }`}
            style={{ 
              backgroundColor: variationValidationErrors[index] || desiredPhrase.length > 100 ? '#9CA3AF' : '#616161',
              boxShadow: (isSaving && savingVariationIndex === index) ? '0 0 15px rgba(97, 97, 97, 0.4)' : undefined
            }}
            onMouseEnter={(e) => {
              if (!isSaving && !variationValidationErrors[index] && desiredPhrase.length <= 100 && e.currentTarget) {
                e.currentTarget.style.backgroundColor = '#525252'
                e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
              }
            }}
            onMouseLeave={(e) => {
              if (!isSaving && !variationValidationErrors[index] && desiredPhrase.length <= 100 && e.currentTarget) {
                e.currentTarget.style.backgroundColor = '#616161'
                e.currentTarget.style.boxShadow = (isSaving && savingVariationIndex === index) ? '0 0 15px rgba(97, 97, 97, 0.4)' : 'none'
              }
            }}
            onClick={(e) => {
              if (!isSaving && !variationValidationErrors[index] && desiredPhrase.length <= 100 && e.currentTarget) {
                // クリック効果
                e.currentTarget.style.transform = 'scale(0.98)'
                setTimeout(() => {
                  if (e.currentTarget) {
                    e.currentTarget.style.transform = 'scale(1)'
                  }
                }, 150)
              }
              onSelectVariation(variation, index)
            }}
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
