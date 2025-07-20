'use client'

import { useEffect, useState } from 'react'
import { usePhraseList } from '@/hooks/usePhraseList'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import PhraseList from '@/components/PhraseList'
import { Toaster } from 'react-hot-toast'
import { TabType } from '@/types/phrase'

export default function PhraseListPage() {
  const {
    // State
    learningLanguage,
    languages,
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    nativeLanguage,
    
    // Handlers
    handleLearningLanguageChange,
    fetchSavedPhrases,
  } = usePhraseList()

  const [showSpeakModal, setShowSpeakModal] = useState(false)

  // タブの変更ハンドリング
  const handleTabChange = (tab: TabType) => {
    if (tab === 'Speak') {
      // Speakタブがクリックされた場合はモーダルを表示するだけ
      setShowSpeakModal(true)
    } else {
      // 他のタブの場合は通常の遷移
      switch (tab) {
        case 'Add':
          window.location.href = '/phrase/add'
          break
        case 'Quiz':
          window.location.href = '/phrase/quiz'
          break
        default:
          break
      }
    }
  }

  // 無限スクロール機能
  useEffect(() => {
    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (hasMorePhrases && !isLoadingPhrases) {
          fetchSavedPhrases(phrasePage + 1, true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [hasMorePhrases, isLoadingPhrases, phrasePage, fetchSavedPhrases])

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
        />

        {/* コンテンツエリア */}
        <PhraseList
          savedPhrases={savedPhrases}
          isLoadingPhrases={isLoadingPhrases}
          languages={languages}
          nativeLanguage={nativeLanguage}
          showSpeakModal={showSpeakModal}
          onSpeakModalStateChange={setShowSpeakModal}
          onUpdatePhrase={(phrase) => {
            // TODO: フレーズ更新の実装
            console.log('Update phrase:', phrase)
          }}
          onRefreshPhrases={() => {
            // リストを最初のページから再取得
            fetchSavedPhrases(1, false)
          }}
        />
      </div>
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
