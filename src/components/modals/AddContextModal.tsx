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
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Add Context
          </h2>
        </div>

        {/* シチュエーション名入力 */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Context Name
          </h3>
          <input
            type="text"
            value={contextName}
            onChange={(e) => setContextName(e.target.value)}
            placeholder="例: カフェで注文する時"
            className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            maxLength={20}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleSubmit()
              }
            }}
          />
          <div className="flex justify-between items-center mt-1">
            <span className={`text-xs ${
              contextName.length > 20 ? 'text-red-500' : 'text-gray-500'
            }`}>
              20文字以内で入力してください
            </span>
            <span className={`text-xs ${
              contextName.length > 20 ? 'text-red-500' : 'text-gray-500'
            }`}>
              {contextName.length} / 20
            </span>
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
            disabled={!contextName.trim() || contextName.length > 20}
            className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed"
            style={{ 
              backgroundColor: (!contextName.trim() || contextName.length > 20) ? '#9CA3AF' : '#616161'
            }}
          >
            Add
          </button>
        </div>
      </div>
    </Modal>
  )
}
