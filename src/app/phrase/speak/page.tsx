'use client'

import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'

export default function PhraseSpeakPage() {
  const {
    learningLanguage,
    handleLearningLanguageChange,
    languages,
    nativeLanguage,
  } = usePhraseSettings()

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
        <PhraseTabNavigation activeTab="Speak" />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          <div className="text-center py-8">
            <p className="text-gray-600">Speak機能は準備中です</p>
          </div>
        </div>
      </div>
    </div>
  )
}
