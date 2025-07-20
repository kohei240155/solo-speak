'use client'

import { useState, useEffect } from 'react'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal, { SpeakConfig } from '@/components/SpeakModeModal'
import SpeakPracticeNew from '@/components/SpeakPracticeNew'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { Toaster } from 'react-hot-toast'

export default function PhraseSpeakPage() {
  const {
    learningLanguage,
    handleLearningLanguageChange,
    languages,
    nativeLanguage,
  } = usePhraseSettings()

  const {
    savedPhrases,
    isLoadingPhrases,
    fetchSavedPhrases,
  } = usePhraseList()

  const [showSpeakModal, setShowSpeakModal] = useState(false) // モーダルの表示状態
  const [speakMode, setSpeakMode] = useState<{ active: boolean; config: SpeakConfig | null }>({
    active: false,
    config: null
  })

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases])

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const order = params.get('order') as 'new-to-old' | 'old-to-new' | null
    const prioritizeLowPractice = params.get('prioritizeLowPractice') === 'true'
    
    // URLパラメータに設定がある場合、自動的に練習モードを開始
    if (order && (order === 'new-to-old' || order === 'old-to-new')) {
      const config: SpeakConfig = {
        order,
        prioritizeLowPractice
      }
      setSpeakMode({ active: true, config })
    }
  }, [])

  const handleSpeakStart = (config: SpeakConfig) => {
    setSpeakMode({ active: true, config })
    
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('order', config.order)
    params.set('prioritizeLowPractice', config.prioritizeLowPractice.toString())
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    // モーダルは既にSpeakModeModal内で閉じられているため、ここでは状態のみ更新
  }

  const handleSpeakFinish = () => {
    setSpeakMode({ active: false, config: null })
    
    // URLパラメータをクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
    
    // Finish後はモーダルを再表示しない
  }

  const handleSpeakModalClose = () => {
    setShowSpeakModal(false)
  }

  // Speak練習モードが有効な場合はSpeakPracticeコンポーネントを表示
  if (speakMode.active && speakMode.config) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
          {/* Phrase タイトル */}
          <div className="flex justify-between items-center mb-[18px]">
            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Phrase
            </h1>
          </div>
          
          {/* タブメニュー */}
          <PhraseTabNavigation 
            activeTab="Speak" 
            onSpeakModalOpen={undefined} // 練習モード中はモーダルを無効化
          />

          {/* Speak練習コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {savedPhrases[0] && (
              <SpeakPracticeNew
                phrase={{
                  id: savedPhrases[0].id,
                  text: savedPhrases[0].text,
                  translation: savedPhrases[0].translation,
                  totalReadCount: savedPhrases[0].practiceCount || 0,
                  dailyReadCount: 0
                }}
                languages={languages}
                nativeLanguage={nativeLanguage}
                onCount={() => {}}
                onSound={() => {}}
                onNext={() => {}}
                onFinish={handleSpeakFinish}
                todayCount={0}
                totalCount={0}
              />
            )}
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Phrase タイトル */}
        <div className="flex justify-between items-center mb-[18px]">
          <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Phrase
          </h1>
        </div>
        
        {/* タブメニュー */}
        <PhraseTabNavigation 
          activeTab="Speak" 
          onSpeakModalOpen={() => setShowSpeakModal(true)}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {isLoadingPhrases ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading phrases...</p>
            </div>
          ) : savedPhrases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">練習できるフレーズがありません</p>
              <p className="text-gray-500 text-sm mt-2">まずはフレーズを追加してください</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Speak練習を開始する準備ができています</p>
              <button
                onClick={() => setShowSpeakModal(true)}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                設定を開く
              </button>
            </div>
          )}
        </div>

        {/* Speak Mode モーダル */}
        <SpeakModeModal
          isOpen={showSpeakModal}
          onClose={handleSpeakModalClose}
          onStart={handleSpeakStart}
          languages={languages}
          defaultLearningLanguage={learningLanguage}
        />
      </div>
      
      <Toaster />
    </div>
  )
}
