import { SavedPhrase } from '@/types/phrase'
import BaseModal from '../common/BaseModal'

interface ExplanationModalProps {
  isOpen: boolean
  phrase?: SavedPhrase | { explanation?: string } | null
  explanationText?: string  // 直接説明文を指定する場合
  onClose: () => void
}

export default function ExplanationModal({
  isOpen,
  phrase,
  explanationText,
  onClose
}: ExplanationModalProps) {
  // 説明文の優先順位: explanationText > phrase.explanation > デフォルト
  const displayText = explanationText || phrase?.explanation || 'Explanation情報がありません'

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Explanation">
      <div className="mb-6">
        <div className="text-gray-700 leading-relaxed whitespace-pre-line">
          {displayText}
        </div>
      </div>
      
      <div className="flex justify-end">
        <button
          onClick={onClose}
          className="bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ 
            borderColor: '#616161',
            color: '#616161'
          }}
        >
          Close
        </button>
      </div>
    </BaseModal>
  )
}
