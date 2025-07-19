'use client'

import { useState, useEffect } from 'react'
import { TabType } from '@/types/phrase'
import { usePhraseManager } from '@/hooks/usePhraseManager'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import PhraseList from '@/components/PhraseList'
import PhraseAdd from '@/components/PhraseAdd'
import { Toaster } from 'react-hot-toast'

export default function PhraseAddPage() {
  const [activeTab, setActiveTab] = useState<TabType>('List')
  
  const {
    // State
    nativeLanguage,
    learningLanguage,
    setLearningLanguage,
    desiredPhrase,
    selectedType,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
    languages,
    isSaving,
    savingVariationIndex,
    editingVariations,
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    phraseValidationError,
    variationValidationErrors,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    fetchSavedPhrases,
    checkUnsavedChanges,
    handleTypeChange
  } = usePhraseManager()

  // タブ変更時の警告処理
  const handleTabChange = (newTab: TabType) => {
    // Addタブから他のタブに移動する際に、未保存の生成結果があるかチェック
    if (activeTab === 'Add' && newTab !== 'Add' && generatedVariations.length > 0) {
      if (!checkUnsavedChanges()) {
        return // ユーザーがキャンセルした場合は何もしない
      }
    }
    setActiveTab(newTab)
  }

  // 無限スクロール機能
  useEffect(() => {
    if (activeTab !== 'List') return

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (hasMorePhrases && !isLoadingPhrases) {
          fetchSavedPhrases(phrasePage + 1, true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, hasMorePhrases, isLoadingPhrases, phrasePage, fetchSavedPhrases])

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
            onLanguageChange={setLearningLanguage}
            languages={languages}
            nativeLanguage={nativeLanguage}
          />
        </div>
        
        {/* タブメニュー */}
        <PhraseTabNavigation
          activeTab={activeTab}
          onTabChange={handleTabChange}
        />

        {/* コンテンツエリア */}
        {activeTab === 'List' ? (
          <PhraseList
            savedPhrases={savedPhrases}
            isLoadingPhrases={isLoadingPhrases}
          />
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {activeTab === 'Add' && (
              <PhraseAdd
                languages={languages}
                nativeLanguage={nativeLanguage}
                remainingGenerations={remainingGenerations}
                desiredPhrase={desiredPhrase}
                phraseValidationError={phraseValidationError}
                isLoading={isLoading}
                isSaving={isSaving}
                generatedVariations={generatedVariations}
                editingVariations={editingVariations}
                variationValidationErrors={variationValidationErrors}
                savingVariationIndex={savingVariationIndex}
                learningLanguage={learningLanguage}
                error={error}
                selectedType={selectedType}
                onPhraseChange={handlePhraseChange}
                onGeneratePhrase={handleGeneratePhrase}
                onEditVariation={handleEditVariation}
                onSelectVariation={handleSelectVariation}
                onResetVariations={handleResetVariations}
                onTypeChange={handleTypeChange}
              />
            )}

            {activeTab === 'Speak' && (
              <div className="text-center py-8">
                <p className="text-gray-600">Speak機能は準備中です</p>
              </div>
            )}

            {activeTab === 'Quiz' && (
              <div className="text-center py-8">
                <p className="text-gray-600">Quiz機能は準備中です</p>
              </div>
            )}
          </div>
        )}
      </div>
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
