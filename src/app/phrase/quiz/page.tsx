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
import { useSpeakModal } from '@/hooks/speak/useSpeakModal'
import { useQuizPhrase } from '@/hooks/quiz/useQuizPhrase'
import { useQuizMode } from '@/hooks/quiz/useQuizMode'
import { QuizConfig } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'

export default function PhraseQuizPage() {
  const { loading: authLoading } = useAuthGuard()
  const { learningLanguage, languages } = usePhraseSettings()
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

  // ページ読み込み時に自動的にクイズを開始
  useEffect(() => {
    if (!quizMode.active && !isQuizCompleted && learningLanguage) {
      // デフォルト設定でクイズを自動開始
      const defaultConfig: QuizConfig = {
        language: learningLanguage,
        mode: 'normal',
        questionCount: 10,
        speakCountFilter: null
      }
      handleQuizStart(defaultConfig)
    }
  }, [quizMode.active, isQuizCompleted, learningLanguage, handleQuizStart])

  // Quiz開始処理（モーダルから呼ばれる）
  const handleQuizStartWithModal = async (config: QuizConfig) => {
    const success = await handleQuizStart(config)
    setShowQuizModal(false)
    
    if (!success) {
      // 失敗した場合は少し待ってからモーダルを再度開く
      setTimeout(() => {
        setShowQuizModal(true)
      }, 100)
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
          ) : (
            // セッション読み込み中の表示
            <LoadingSpinner 
              size="md" 
              message="Starting Quiz..." 
              className="text-center"
              minHeight="400px"
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
        onClose={() => setShowQuizModal(false)}
        onStart={handleQuizStartWithModal}
        languages={languages}
        defaultLearningLanguage={learningLanguage}
        availablePhraseCount={0}
      />
      
      <Toaster />
    </div>
  )
}
