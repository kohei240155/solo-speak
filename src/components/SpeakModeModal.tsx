import { useState } from 'react'
import Modal from './Modal'

interface SpeakModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: SpeakConfig) => void
}

export interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
}

export default function SpeakModeModal({ isOpen, onClose, onStart }: SpeakModeModalProps) {
  const [order, setOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [prioritizeLowPractice, setPrioritizeLowPractice] = useState(true)

  const handleStart = () => {
    onStart({
      order,
      prioritizeLowPractice
    })
    onClose()
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">
            Speak Mode
          </h2>
        </div>

        {/* Order セクション */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Order
          </h3>
          <div className="relative">
            <select
              value={order}
              onChange={(e) => setOrder(e.target.value as 'new-to-old' | 'old-to-new')}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
              style={{
                backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
                backgroundRepeat: 'no-repeat',
                backgroundPosition: 'right 12px center',
                backgroundSize: '20px'
              }}
            >
              <option value="new-to-old">New → Old</option>
              <option value="old-to-new">Old → New</option>
            </select>
          </div>
        </div>

        {/* Option セクション */}
        <div className="mb-6">
          <h3 className="text-base font-semibold text-gray-900 mb-3">
            Option
          </h3>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={prioritizeLowPractice}
                onChange={(e) => setPrioritizeLowPractice(e.target.checked)}
                className="sr-only"
              />
              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center mr-3 ${
                prioritizeLowPractice 
                  ? 'bg-blue-500 border-blue-500' 
                  : 'bg-white border-gray-300'
              }`}>
                {prioritizeLowPractice && (
                  <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                )}
              </div>
              <span className="text-sm text-gray-700">
                音読回数が少ないフレーズを優先する
              </span>
            </label>
          </div>
        </div>

        {/* Start ボタン */}
        <button
          onClick={handleStart}
          className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
          style={{ 
            backgroundColor: '#616161'
          }}
        >
          Start
        </button>
      </div>
    </Modal>
  )
}
