'use client'

import { useEffect } from 'react'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { useQuizModal } from '@/hooks/useQuizModal'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import PhraseList from '@/components/PhraseList'
import SpeakModeModal from '@/components/SpeakModeModal'
import QuizModeModal from '@/components/QuizModeModal'
import { AuthLoading } from '@/components/AuthLoading'
import { Toaster } from 'react-hot-toast'
import { TabType } from '@/types/phrase'

export default function PhraseListPage() {
  // 認証ガード - ログインしていない場合はホームページにリダイレクト
  const { loading: authLoading, isAuthenticated } = useAuthGuard('/')
  
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

  // タブの変更ハンドリング
  const handleTabChange = (tab: TabType) => {
    if (tab === 'Speak') {
      // Speakタブがクリックされた場合はモーダルを表示するだけ
      openSpeakModal()
    } else if (tab === 'Quiz') {
      // Quizタブがクリックされた場合はモーダルを表示するだけ
      openQuizModal()
    } else {
      // 他のタブの場合は通常の遷移
      switch (tab) {
        case 'Add':
          window.location.href = '/phrase/add'
          break
        default:
          break
      }
    }
  }

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
          activeTab="List" 
          onTabChange={handleTabChange}
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
