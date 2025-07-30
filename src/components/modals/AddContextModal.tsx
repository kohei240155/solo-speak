'use client'

import { useState } from 'react'
import Modal from '../common/Modal'

interface AddContextModalProps {
  isOpen: boolean
  onClose: () => void
  onAdd: (contextName: string) => void
}

export default function AddContextModal({ isOpen, onClose, onAdd }: AddContextModalProps) {
  const [contextName, setContextName] = useState('')

  const handleSubmit = () => {
    if (contextName.trim()) {
      onAdd(contextName.trim())
      setContextName('')
      onClose()
    }
  }

  const handleCancel = () => {
    setContextName('')
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={handleCancel}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Add Situation
          </h2>
        </div>

        {/* シチュエーション名入力 */}
        <div className="mb-4">
          <h3 className="text-lg font-semibold text-gray-900 mb-3">
            Situation
          </h3>
          <input
            type="text"
            value={contextName}
            onChange={(e) => setContextName(e.target.value)}
            placeholder="例: カフェで注文する時"
            className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none"
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
          />
          
          {/* バリデーション表示エリア（常に高さを確保） */}
          <div className="mt-2 h-12">
            {contextName.length > 50 && (
              <div className="p-3 border border-gray-300 rounded-md bg-gray-50">
                <p className="text-sm text-gray-600">
                  50文字以内で入力してください（現在: {contextName.length}文字）
                </p>
              </div>
            )}
          </div>
        </div>

        {/* ボタン */}
        <div className="flex gap-3">
          <button
            onClick={handleCancel}
            className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            style={{ 
              borderColor: '#616161',
              color: '#616161'
            }}
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!contextName.trim() || contextName.length > 50}
            className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: (!contextName.trim() || contextName.length > 50) ? '#9CA3AF' : '#616161'
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}
