import { useState, useEffect } from 'react'
import Modal from './Modal'
import { Language } from '@/types/phrase'
import toast from 'react-hot-toast'

interface SpeakModeModalProps {
  isOpen: boolean
  onClose: () => void
  onStart: (config: SpeakConfig) => void
  languages: Language[]
  defaultLearningLanguage: string
}

export interface SpeakConfig {
  order: 'new-to-old' | 'old-to-new'
  prioritizeLowPractice: boolean
}

export default function SpeakModeModal({ isOpen, onClose, onStart, languages, defaultLearningLanguage }: SpeakModeModalProps) {
  const [order, setOrder] = useState<'new-to-old' | 'old-to-new'>('new-to-old')
  const [prioritizeLowPractice, setPrioritizeLowPractice] = useState(true)
  const [selectedLanguage, setSelectedLanguage] = useState(defaultLearningLanguage)
  const [isLoading, setIsLoading] = useState(false)

  // モーダルが開かれた時に選択言語を更新
  useEffect(() => {
    if (isOpen) {
      setSelectedLanguage(defaultLearningLanguage)
      setIsLoading(false) // ローディング状態をリセット
    }
  }, [isOpen, defaultLearningLanguage])

  const handleStart = async () => {
    if (isLoading) return // 既に処理中の場合は何もしない
    
    setIsLoading(true)
    try {
      // モード設定をクエリパラメータとして含めてGET APIを呼び出し
      const params = new URLSearchParams({
        language: selectedLanguage,
        order: order.replace('-', '_'), // new-to-old → new_to_old
        prioritizeLowReadCount: prioritizeLowPractice.toString()
      })

      const response = await fetch(`/api/phrase/speak?${params.toString()}`)
      const data = await response.json()

      console.log('SpeakModeModal - API Response:', { success: data.success, hasPhrase: !!data.phrase, message: data.message })

      if (data.success && data.phrase) {
        // 設定オブジェクトを作成して渡す
        const config: SpeakConfig = {
          order: order as 'new-to-old' | 'old-to-new',
          prioritizeLowPractice: prioritizeLowPractice
        }
        console.log('SpeakModeModal - Starting practice with config:', config)
        // onStartの呼び出し前にモーダルを閉じる
        onClose()
        onStart(config)
      } else {
        // フレーズが見つからない場合はユーザーに通知してモーダルは開いたままにする
        const errorMessage = data.message || 'フレーズが見つかりませんでした'
        console.warn('SpeakModeModal - No phrases found:', data.message)
        toast.error(errorMessage)
      }
    } catch (error) {
      console.error('SpeakModeModal - Error fetching phrase:', error)
      toast.error('フレーズの取得中にエラーが発生しました')
    } finally {
      console.log('SpeakModeModal - Setting loading to false')
      setIsLoading(false)
    }
  }

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <div className="p-6">
        {/* ヘッダー部分 */}
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl md:text-2xl font-bold text-gray-900">          Speak Mode
        </h2>
      </div>

      {/* Language セクション */}
      <div className="mb-6">
        <h3 className="text-base font-semibold text-gray-900 mb-3">
          Language
        </h3>
        <div className="relative">
          <select
            value={selectedLanguage}
            onChange={(e) => setSelectedLanguage(e.target.value)}
            className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white"
            style={{
              backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
              backgroundRepeat: 'no-repeat',
              backgroundPosition: 'right 12px center',
              backgroundSize: '20px'
            }}
          >
            {languages.map((language) => (
              <option key={language.id} value={language.code}>
                {language.name}
              </option>
            ))}
          </select>
        </div>
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
          disabled={isLoading}
          className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity"
          style={{ 
            backgroundColor: isLoading ? '#9CA3AF' : '#616161'
          }}
        >
          {isLoading ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Loading...
            </div>
          ) : (
            'Start'
          )}
        </button>
      </div>
    </Modal>
  )
}
