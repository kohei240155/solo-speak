'use client'

import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal from '@/components/SpeakModeModal'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { useSpeakModal } from '@/hooks/useSpeakModal'

export default function PhraseQuizPage() {
  const {
    learningLanguage,
    handleLearningLanguageChange,
    languages,
    nativeLanguage,
  } = usePhraseSettings()

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Phrase タイトルと言語選択を同じ行に配置 */}
        <div className="flex justify-between items-center mb-[18px]">
          <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Phrase
          </h1>
          
          <LanguageSelector
            learningLanguage={learningLanguage}
            onLanguageChange={handleLearningLanguageChange}
            languages={languages}
            nativeLanguage={nativeLanguage}
          />
        </div>
        
        {/* タブメニュー */}
        <PhraseTabNavigation 
          activeTab="Quiz" 
          onSpeakModalOpen={openSpeakModal}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Quiz機能は準備中です</p>
          </div>
        </div>
      </div>
      
      {/* Speak Mode モーダル */}
      <SpeakModeModal
        isOpen={showSpeakModal}
        onClose={closeSpeakModal}
        onStart={handleSpeakStart}
        languages={languages}
        defaultLearningLanguage={learningLanguage}
      />
    </div>
  )
}
