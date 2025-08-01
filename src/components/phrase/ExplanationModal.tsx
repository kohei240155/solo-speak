import { SavedPhrase } from '@/types/phrase'
import BaseModal from '../common/BaseModal'

interface ExplanationModalProps {
  isOpen: boolean
  phrase: SavedPhrase | null
  onClose: () => void
}

export default function ExplanationModal({
  isOpen,
  phrase,
  onClose
}: ExplanationModalProps) {
  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title="Explanation">
      <div className="mb-6">
        <p className="text-gray-700 leading-relaxed">
          {phrase?.explanation || 'Explanation情報がありません'}
        </p>
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
