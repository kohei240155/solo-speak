'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthGuard } from '@/hooks/useAuthGuard'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import SpeakPractice from '@/components/speak/SpeakPractice'
import AllDoneScreen from '@/components/common/AllDoneScreen'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useSpeakPhrase } from '@/hooks/useSpeakPhrase'
import { useSpeakMode } from '@/hooks/useSpeakMode'
import { useSinglePhraseSpeak } from '@/hooks/useSinglePhraseSpeak'
import { usePageLeaveWarning } from '@/hooks/usePageLeaveWarning'
import { useModalManager } from '@/hooks/useModalManager'
import { useMultiPhraseSpeak } from '@/hooks/useMultiPhraseSpeak'
import { useAllDoneScreen } from '@/hooks/useAllDoneScreen'
import { Toaster } from 'react-hot-toast'

function PhraseSpeakPage() {
  const { loading: authLoading } = useAuthGuard()
  const searchParams = useSearchParams()
  const { learningLanguage, languages } = usePhraseSettings()
  const { savedPhrases, fetchSavedPhrases } = usePhraseList()
  
  const {
    currentPhrase,
    isLoadingPhrase,
    todayCount,
    totalCount,
    pendingCount,
    isCountDisabled,
    fetchSpeakPhrase,
    sendPendingCount,
    handleCount,
    handleNext,
    handleFinish
  } = useSpeakPhrase()

  const { speakMode, handleSpeakStart } = useSpeakMode({
    learningLanguage,
    fetchSpeakPhrase,
    currentPhraseId: currentPhrase?.id || null,
    pendingCount,
    sendPendingCount
  })

  const [isSpeakCompleted, setIsSpeakCompleted] = useState(false)

  // URLパラメータからphraseIdを取得
  const phraseId = searchParams.get('phraseId')
  const isSinglePhraseMode = !!phraseId

  // 単一フレーズ練習用のフック
  const singlePhraseSpeak = useSinglePhraseSpeak({
    phraseId,
    sendPendingCount
  })

  // 複数フレーズ練習用のフック
  const multiPhraseSpeak = useMultiPhraseSpeak({
    speakMode,
    handleCount,
    handleNext: async (config) => {
      const result = await handleNext(config)
      if (result === 'allDone') {
        setIsSpeakCompleted(true)
      }
      return result
    },
    handleFinish
  })

  // モーダル管理
  const modalManager = useModalManager({
    handleSpeakStart,
    setIsSpeakCompleted
  })

  // All Done画面管理
  const allDoneScreen = useAllDoneScreen({
    setIsSpeakCompleted,
    openSpeakModal: modalManager.openSpeakModal
  })

  // ページ離脱警告
  const hasPendingCount = isSinglePhraseMode 
    ? singlePhraseSpeak.singlePhrasePendingCount > 0 
    : pendingCount > 0
  
  usePageLeaveWarning({ hasPendingChanges: hasPendingCount })

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage && !isSinglePhraseMode) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases, isSinglePhraseMode])

  // 未保存の変更チェック関数
  const checkUnsavedChanges = () => {
    return hasPendingCount
  }

  // 認証ローディング中は何も表示しない
  if (authLoading) {
    return <LoadingSpinner />
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
            checkUnsavedChanges={checkUnsavedChanges}
            onSpeakModalOpen={speakMode.active ? undefined : modalManager.openSpeakModal}
            onQuizModalOpen={modalManager.openQuizModal}
          />

          {/* コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {isSpeakCompleted ? (
              // All Done画面
              <AllDoneScreen 
                onFinish={allDoneScreen.handleAllDoneFinish}
                onRetry={allDoneScreen.handleAllDoneRetry}
              />
            ) : isSinglePhraseMode ? (
              // 単一フレーズ練習モード
              singlePhraseSpeak.singlePhrase ? (
                <SpeakPractice
                  phrase={singlePhraseSpeak.singlePhrase}
                  onCount={singlePhraseSpeak.handleCount}
                  onNext={() => {}} // 単一フレーズモードでは何もしない
                  onFinish={singlePhraseSpeak.handleFinish}
                  todayCount={singlePhraseSpeak.singlePhraseTodayCount}
                  totalCount={singlePhraseSpeak.singlePhraseTotalCount}
                  isLoading={singlePhraseSpeak.isLoadingSinglePhrase}
                  isNextLoading={false}
                  isHideNext={true}
                  isFinishing={singlePhraseSpeak.isFinishing}
                  isCountDisabled={singlePhraseSpeak.singlePhraseCountDisabled}
                  learningLanguage={learningLanguage}
                />
              ) : (
                <div className="flex items-center justify-center" style={{ minHeight: '240px' }}>
                  <LoadingSpinner 
                    size="md" 
                    message="Loading..." 
                    className="text-center"
                  />
                </div>
              )
            ) : (
              // 通常の複数フレーズ練習モード
              speakMode.active && speakMode.config ? (
                // Finish処理中またはフレーズがある場合は練習画面を表示
                (currentPhrase || multiPhraseSpeak.isFinishing) ? (
                  <SpeakPractice
                    phrase={currentPhrase}
                    onCount={multiPhraseSpeak.handleCount}
                    onNext={multiPhraseSpeak.handleNextWithConfig}
                    onFinish={multiPhraseSpeak.handleSpeakFinishComplete}
                    todayCount={todayCount}
                    totalCount={totalCount}
                    isLoading={isLoadingPhrase}
                    isNextLoading={multiPhraseSpeak.isNextLoading}
                    isHideNext={false}
                    isFinishing={multiPhraseSpeak.isFinishing}
                    isCountDisabled={isCountDisabled}
                    learningLanguage={learningLanguage}
                  />
                ) : (
                  <div className="flex items-center justify-center" style={{ minHeight: '240px' }}>
                    <LoadingSpinner 
                      size="md" 
                      message="Loading..." 
                      className="text-center"
                    />
                  </div>
                )
              ) : null
            )
          }
          </div>

          {/* Speak Mode モーダル */}
          <SpeakModeModal
            isOpen={modalManager.showSpeakModal}
            onClose={modalManager.closeSpeakModal}
            onStart={modalManager.handleSpeakStartWithModal}
            languages={languages}
            defaultLearningLanguage={learningLanguage}
          />

          {/* Quiz Mode モーダル */}
          <QuizModeModal
            isOpen={modalManager.showQuizModal}
            onClose={modalManager.closeQuizModal}
            onStart={modalManager.handleQuizStartWithModal}
            languages={languages}
            defaultLearningLanguage={learningLanguage}
            availablePhraseCount={savedPhrases.length}
        />
      </div>
      
      <Toaster />
    </div>
  )
}

export default dynamic(() => Promise.resolve(PhraseSpeakPage), { ssr: false })

