'use client'

import { useEffect } from 'react'
// import { useRouter } from 'next/navigation' // 現在未使用
import { usePhraseManager } from '@/hooks/usePhraseManager'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import PhraseAdd from '@/components/PhraseAdd'
import SpeakModeModal from '@/components/SpeakModeModal'
import { AuthLoading } from '@/components/AuthLoading'
import { Toaster } from 'react-hot-toast'

export default function PhraseAddPage() {
  // 認証ガード - ログインしていない場合はホームページにリダイレクト
  const { loading: authLoading, isAuthenticated } = useAuthGuard('/')
  
  // const router = useRouter() // 現在未使用
  
  const {
    // State
    nativeLanguage,
    learningLanguage,
    handleLearningLanguageChange,
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
    phraseValidationError,
    variationValidationErrors,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    handleTypeChange,
    checkUnsavedChanges
  } = usePhraseManager()

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  // ページ離脱時の警告処理をオーバーライド
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generatedVariations.length > 0) {
        e.preventDefault()
        e.returnValue = '生成されたフレーズが保存されていません。このページを離れますか？'
        return '生成されたフレーズが保存されていません。このページを離れますか？'
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [generatedVariations.length])

  // 認証チェック中またはログインしていない場合は早期リターン
  if (authLoading || !isAuthenticated) {
    return <AuthLoading />
  }

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
          activeTab="Add" 
          checkUnsavedChanges={checkUnsavedChanges}
          onSpeakModalOpen={openSpeakModal}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
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
            error={error}
            selectedType={selectedType}
            onPhraseChange={handlePhraseChange}
            onGeneratePhrase={handleGeneratePhrase}
            onEditVariation={handleEditVariation}
            onSelectVariation={handleSelectVariation}
            onResetVariations={handleResetVariations}
            onTypeChange={handleTypeChange}
          />
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
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
