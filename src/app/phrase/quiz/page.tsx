'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import QuizPractice from '@/components/quiz/QuizPractice'
import AllDoneScreen from '@/components/common/AllDoneScreen'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { usePhraseSettings } from '@/hooks/phrase/usePhraseSettings'
import { usePhraseList } from '@/hooks/phrase/usePhraseList'
import { useSpeakModal } from '@/hooks/speak/useSpeakModal'
import { useQuizPhrase } from '@/hooks/quiz/useQuizPhrase'
import { useQuizMode } from '@/hooks/quiz/useQuizMode'
import { QuizConfig } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'

export default function PhraseQuizPage() {
  const { loading: authLoading } = useAuthGuard()
  const { learningLanguage, languages } = usePhraseSettings()
  const { savedPhrases, isLoadingPhrases, refreshPhrases } = usePhraseList()
  const router = useRouter()

  // クイズ完了状態
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)

  // Quiz functionality
  const {
    session,
    currentPhrase,
    showTranslation,
    fetchQuizSession,
    handleShowTranslation,
    handleHideTranslation,
    handleAnswer,
    handleNext,
    resetQuiz
  } = useQuizPhrase()

  const { quizMode, handleQuizStart, handleQuizFinish } = useQuizMode({
    fetchQuizSession
  })

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  const [showQuizModal, setShowQuizModal] = useState(false)

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage) {
      refreshPhrases()
    }
  }, [learningLanguage, refreshPhrases])

  // フレーズが読み込まれた後、クイズがアクティブでない場合の処理
  useEffect(() => {
    // 前提条件をチェック
    if (isLoadingPhrases || savedPhrases.length === 0 || quizMode.active || isQuizCompleted) {
      return
    }
    
    // URLパラメータがある場合は自動開始（モーダルは開かない）
    const params = new URLSearchParams(window.location.search)
    const language = params.get('language')
    const mode = params.get('mode')
    
    if (language && mode && (mode === 'normal' || mode === 'random')) {
      // URLパラメータから自動開始（useQuizModeで処理される）
      return
    }
    
    // URLパラメータがない場合はモーダルを開く
    if (!showQuizModal) {
      setShowQuizModal(true)
    }
  }, [isLoadingPhrases, savedPhrases.length, quizMode.active, showQuizModal, isQuizCompleted])

  // Quiz開始処理（モーダルから呼ばれる）
  const handleQuizStartWithModal = async (config: QuizConfig) => {
    try {
      const success = await handleQuizStart(config)
      if (success) {
        setShowQuizModal(false)
      }
    } catch {
      // Handle error silently
    }
  }

  // クイズ終了処理
  const handleQuizFinishComplete = () => {
    setIsQuizCompleted(true)
  }

  // 完了画面からのFinish処理
  const handleFinish = () => {
    router.push('/phrase/list')
  }

  // 完了画面からのRetry処理
  const handleRetry = () => {
    setIsQuizCompleted(false)
    resetQuiz()
    handleQuizFinish()
    setShowQuizModal(true)
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
          activeTab="Quiz" 
          onSpeakModalOpen={openSpeakModal}
          onQuizModalOpen={quizMode.active ? undefined : () => setShowQuizModal(true)}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
                    {isQuizCompleted ? (
            <AllDoneScreen 
              onFinish={handleFinish}
              onRetry={handleRetry}
            />
            ) : quizMode.active && session && currentPhrase ? (
            <QuizPractice
              session={session}
              currentPhrase={currentPhrase}
              showTranslation={showTranslation}
              onShowTranslation={handleShowTranslation}
              onHideTranslation={handleHideTranslation}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onFinish={handleQuizFinishComplete}
            />
          ) : quizMode.active && !session ? (
            // セッション読み込み中の表示
            <LoadingSpinner 
              size="md" 
              message="Starting Quiz..." 
              className="text-center"
              minHeight="400px"
            />
          ) : (
            // クイズがアクティブでない場合は何も表示しない（モーダルで操作）
            <div className="text-center py-8">
              {isLoadingPhrases ? (
                <LoadingSpinner 
                  size="md" 
                  message="Loading phrases..." 
                  className="text-center"
                  minHeight="400px"
                />
              ) : savedPhrases.length === 0 ? (
                <>
                  <p className="text-gray-600 mb-4">No phrases found for quiz.</p>
                  <p className="text-sm text-gray-500">Add some phrases first to start practicing.</p>
                </>
              ) : (
                // フレーズが存在する場合は空の状態（モーダルが自動的に開く）
                <div></div>
              )}
            </div>
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
        onClose={() => setShowQuizModal(false)}
        onStart={handleQuizStartWithModal}
        languages={languages}
        defaultLearningLanguage={learningLanguage}
        availablePhraseCount={savedPhrases.length}
      />
      
      <Toaster />
    </div>
  )
}
