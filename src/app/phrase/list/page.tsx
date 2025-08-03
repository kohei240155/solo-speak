'use client'

import { useEffect } from 'react'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { useQuizModal } from '@/hooks/useQuizModal'
import LanguageSelector from '@/components/common/LanguageSelector'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import PhraseList from '@/components/phrase/PhraseList'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { Toaster } from 'react-hot-toast'

export default function PhraseListPage() {
  const { loading: authLoading } = useAuthGuard()
  
  const {
    // State
    learningLanguage,
    languages,
    savedPhrases,
    isLoadingPhrases,
    isLoadingMore,
    hasMorePhrases,
    phrasePage,
    nativeLanguage,
    totalPhrases,
    
    // Handlers
    handleLearningLanguageChange,
    fetchSavedPhrases,
  } = usePhraseList()

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

  // 無限スクロール機能（スロットリング付き）
  useEffect(() => {
    let timeoutId: NodeJS.Timeout

    const handleScroll = () => {
      // スロットリング: 100ms間隔でのみ実行
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      timeoutId = setTimeout(() => {
        // スクロール位置が下部に達していない場合は何もしない
        if (window.innerHeight + document.documentElement.scrollTop < document.documentElement.offsetHeight - 100) {
          return
        }
        
        // 追加読み込みの条件を満たしていない場合は何もしない
        if (!hasMorePhrases || isLoadingPhrases) {
          return
        }
        
        fetchSavedPhrases(phrasePage + 1, true)
      }, 100)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => {
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      window.removeEventListener('scroll', handleScroll)
    }
  }, [hasMorePhrases, isLoadingPhrases, phrasePage, fetchSavedPhrases])

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
          activeTab="List" 
          onSpeakModalOpen={openSpeakModal}
          onQuizModalOpen={openQuizModal}
        />

        {/* コンテンツエリア */}
        <PhraseList
          savedPhrases={savedPhrases}
          isLoadingPhrases={isLoadingPhrases}
          isLoadingMore={isLoadingMore}
          languages={languages}
          nativeLanguage={nativeLanguage}
          learningLanguage={learningLanguage}
          showSpeakModal={showSpeakModal}
          onSpeakModalStateChange={(state: boolean) => {
            if (state) {
              openSpeakModal()
            } else {
              closeSpeakModal()
            }
          }}
          onRefreshPhrases={() => {
            // リストを最初のページから再取得
            fetchSavedPhrases(1, false)
          }}
        />
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
        availablePhraseCount={totalPhrases}
      />
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
