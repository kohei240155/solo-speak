'use client'

import { useEffect } from 'react'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import { usePhraseManagerSWR } from '@/hooks/phrase/usePhraseManagerSWR'
import { useSpeakModal } from '@/hooks/speak/useSpeakModal'
import { useQuizModal } from '@/hooks/quiz/useQuizModal'
import { useTranslation } from '@/hooks/ui/useTranslation'
import LanguageSelector from '@/components/common/LanguageSelector'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import PhraseAdd from '@/components/phrase/PhraseAdd'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import AddToHomeScreenModal from '@/components/modals/AddToHomeScreenModal'

export default function PhraseAddPage() {
  const { t } = useTranslation('common')
  const { loading: authLoading } = useAuthGuard()
  
  const {
    // State
    nativeLanguage,
    learningLanguage,
    handleLearningLanguageChange,
    desiredPhrase,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
    languages,
    situations,
    isInitializing,
    isSaving,
    savingVariationIndex,
    editingVariations,
    phraseValidationError,
    selectedContext,
    availablePhraseCount,
    showAddToHomeScreenModal,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    checkUnsavedChanges,
    handleContextChange,
    addSituation,
    deleteSituation,
    closeAddToHomeScreenModal
  } = usePhraseManagerSWR()

  // Modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  const {
    showQuizModal,
    openQuizModal,
    closeQuizModal,
    handleQuizStart
  } = useQuizModal()

  // ページ離脱時の警告処理をオーバーライド
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (generatedVariations.length > 0) {
        e.preventDefault()
        e.returnValue = t('confirm.unsavedPhrase')
        return t('confirm.unsavedPhrase')
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [generatedVariations.length, t])

  // 認証ローディング中は何も表示しない
  if (authLoading) {
    return <LoadingSpinner withHeaderOffset />
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
          onQuizModalOpen={openQuizModal}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {isInitializing ? (
            <div className="flex items-center justify-center" style={{ minHeight: '240px' }}>
              <LoadingSpinner 
                size="md" 
                message="Loading..." 
                className="text-center"
              />
            </div>
          ) : (
            <PhraseAdd
              remainingGenerations={remainingGenerations}
              desiredPhrase={desiredPhrase}
              phraseValidationError={phraseValidationError}
              isLoading={isLoading}
              isSaving={isSaving}
                generatedVariations={generatedVariations}
                editingVariations={editingVariations}
                savingVariationIndex={savingVariationIndex}
                error={error}
                selectedContext={selectedContext}
                situations={situations}
                onPhraseChange={handlePhraseChange}
                onGeneratePhrase={handleGeneratePhrase}
                onEditVariation={handleEditVariation}
                onSelectVariation={handleSelectVariation}
                onContextChange={handleContextChange}
                addSituation={addSituation}
                deleteSituation={deleteSituation}
              />
          )}
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

      {/* Quiz Mode モーダル */}
      <QuizModeModal
        isOpen={showQuizModal}
        onClose={closeQuizModal}
        onStart={handleQuizStart}
        languages={languages}
        defaultLearningLanguage={learningLanguage}
        availablePhraseCount={availablePhraseCount}
      />

      {/* ホーム画面追加モーダル */}
      <AddToHomeScreenModal
        isOpen={showAddToHomeScreenModal}
        onClose={closeAddToHomeScreenModal}
      />

    </div>
  )
}
