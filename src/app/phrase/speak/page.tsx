'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import dynamic from 'next/dynamic'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import ExplanationModal from '@/components/phrase/ExplanationModal'
import SpeakPractice from '@/components/speak/SpeakPractice'
import AllDoneScreen from '@/components/common/AllDoneScreen'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePhraseSettings } from '@/hooks/phrase/usePhraseSettings'
import { useSpeakPhrase } from '@/hooks/speak/useSpeakPhrase'
import { useSpeakMode } from '@/hooks/speak/useSpeakMode'
import { useSinglePhraseSpeak } from '@/hooks/speak/useSinglePhraseSpeak'
import { usePageLeaveWarning } from '@/hooks/ui/usePageLeaveWarning'
import { useModalManager } from '@/hooks/ui/useModalManager'
import { useMultiPhraseSpeak } from '@/hooks/speak/useMultiPhraseSpeak'
import { useAllDoneScreen } from '@/hooks/ui/useAllDoneScreen'
import { Toaster } from 'react-hot-toast'

function PhraseSpeakPage() {
  const { loading: authLoading } = useAuthGuard()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { learningLanguage, languages } = usePhraseSettings()
  
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
    handleFinish,
    resetSavedConfig
  } = useSpeakPhrase()

  const { speakMode, handleSpeakStart } = useSpeakMode({
    learningLanguage,
    fetchSpeakPhrase,
    currentPhraseId: currentPhrase?.id || null,
    pendingCount,
    sendPendingCount
  })

  const [isSpeakCompleted, setIsSpeakCompleted] = useState(false)
  const [showExplanation, setShowExplanation] = useState(false)

  // Explanationモーダルのハンドラー
  const handleExplanation = () => {
    setShowExplanation(true)
  }

  const handleExplanationClose = () => {
    setShowExplanation(false)
  }

  // 現在のフレーズを取得
  const getCurrentPhrase = () => {
    if (isSinglePhraseMode) {
      return singlePhraseSpeak.singlePhrase
    }
    return currentPhrase
  }

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
    handleNext: useCallback(async (config: import('@/types/speak').SpeakConfig) => {
      const result = await handleNext(config)
      if (result === 'allDone') {
        setIsSpeakCompleted(true)
      }
      return result
    }, [handleNext]),
    handleFinish
  })

  // モーダル管理
  const modalManager = useModalManager({
    handleSpeakStart,
    setIsSpeakCompleted
  })

  // All Done画面管理
  const allDoneScreen = useAllDoneScreen({
    openSpeakModal: modalManager.openSpeakModal,
    resetSavedConfig
  })

  // ページ離脱警告
  const hasPendingCount = isSinglePhraseMode 
    ? singlePhraseSpeak.singlePhrasePendingCount > 0 
    : pendingCount > 0
  
  usePageLeaveWarning({ hasPendingChanges: hasPendingCount })

  // 直接アクセスチェック: URLパラメータがない場合はPhrase Listに遷移
  useEffect(() => {
    if (learningLanguage) {
      const params = new URLSearchParams(window.location.search)
      // URLパラメータがない場合（直接アクセス）はPhrase Listに遷移
      if (!params.toString()) {
        router.push('/phrase/list')
        return
      }
    }
  }, [learningLanguage, router])

  // 未保存の変更チェック関数
  const checkUnsavedChanges = () => {
    return hasPendingCount
  }

  // 認証ローディング中は何も表示しない
  if (authLoading) {
    return <LoadingSpinner withHeaderOffset />
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
                  onExplanation={handleExplanation}
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
                  onExplanation={handleExplanation}
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
            availablePhraseCount={0}
          />

          {/* Explanation モーダル */}
          <ExplanationModal
            isOpen={showExplanation}
            phrase={getCurrentPhrase() as { explanation?: string } | null}
            onClose={handleExplanationClose}
          />
      </div>
      
      <Toaster
        position="top-center"
        reverseOrder={false}
        gutter={8}
        containerClassName=""
        containerStyle={{}}
        toastOptions={{
          duration: 4000,
          style: {
            background: '#363636',
            color: '#fff',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#4aed88',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#f56565',
              secondary: '#fff',
            },
          },
        }}
      />
    </div>
  )
}

export default dynamic(() => Promise.resolve(PhraseSpeakPage), { ssr: false })

