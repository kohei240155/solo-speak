'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useAuthGuard } from '@/hooks/auth/useAuthGuard'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import QuizPractice from '@/components/quiz/QuizPractice'
import AllDoneScreen from '@/components/common/AllDoneScreen'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useUserSettings, useLanguages, useQuizPhrases } from '@/hooks/api/useSWRApi'
import { useSpeakModal } from '@/hooks/speak/useSpeakModal'
import { useQuizPhrase } from '@/hooks/quiz/useQuizPhrase'
import { useQuizMode } from '@/hooks/quiz/useQuizMode'
import { QuizConfig, QuizPhrase } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'

export default function PhraseQuizPage() {
  const { loading: authLoading } = useAuthGuard()
  
  // SWRベースのフックを直接使用
  const { userSettings } = useUserSettings()
  const { languages } = useLanguages()
  
  // ユーザー設定から学習言語を取得
  const learningLanguage = userSettings?.defaultLearningLanguage?.code || 'en'
  
  const router = useRouter()

  // クイズ完了状態
  const [isQuizCompleted, setIsQuizCompleted] = useState(false)
  
  // クイズが一度でも開始されたかを追跡
  const [hasQuizStarted, setHasQuizStarted] = useState(false)
  
  // クイズ設定状態を追跡（キャッシュからフレーズを取得するため）
  const [quizConfig, setQuizConfig] = useState<QuizConfig | null>(null)

  // キャッシュからクイズフレーズを取得（最新データは取得しない）
  const { phrases: cachedPhrases } = useQuizPhrases(
    quizConfig?.language,
    quizConfig?.mode,
    quizConfig?.questionCount,
    quizConfig?.speakCountFilter
  )

  // Quiz functionality
  const {
    session,
    currentPhrase,
    showTranslation,
    createQuizSession,
    handleShowTranslation,
    handleHideTranslation,
    handleAnswer,
    handleNext,
    resetQuiz
  } = useQuizPhrase()

  // useQuizModeでは、キャッシュからフレーズを取得する関数を渡す
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const getQuizPhrases = useCallback((_config: QuizConfig): QuizPhrase[] | undefined => {
    // キャッシュから取得したフレーズを返す（最新データは取得しない）
    return cachedPhrases as QuizPhrase[] || undefined
  }, [cachedPhrases])

  const { quizMode, handleQuizStart, handleQuizFinish } = useQuizMode({
    createQuizSession,
    getQuizPhrases
  })

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  const [showQuizModal, setShowQuizModal] = useState(false)

  // フレーズが読み込まれた後、クイズがアクティブでない場合の処理
  useEffect(() => {
    // 前提条件をチェック：クイズがアクティブ、完了済み、または一度でも開始されている場合は何もしない
    if (quizMode.active || isQuizCompleted || hasQuizStarted) {
      return
    }
    
    // URLパラメータがない場合はモーダルを開く
    if (!showQuizModal) {
      setShowQuizModal(true)
    }
  }, [quizMode.active, showQuizModal, isQuizCompleted, hasQuizStarted])

  // Quiz開始処理（モーダルから呼ばれる）
  const handleQuizStartWithModal = async (config: QuizConfig, phrases: unknown[]) => {
    try {
      // クイズ設定を保存（キャッシュ取得用）
      setQuizConfig(config)
      
      // クイズが開始されたことを記録
      setHasQuizStarted(true)
        
      // QuizModeModalから直接渡されたphrasesを使用
      const success = await handleQuizStart(config, phrases as QuizPhrase[])
      if (success) {
        setShowQuizModal(false)
      }
    } catch {
      // Handle error silently
    }
  }  // クイズ終了処理
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
    setHasQuizStarted(false) // リトライ時はクイズ開始フラグをリセット
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
          ) : null}
        </div>
      </div>
      
      {/* Speak Mode モーダル */}
      <SpeakModeModal
        isOpen={showSpeakModal}
        onClose={closeSpeakModal}
        onStart={handleSpeakStart}
        languages={languages || []}
        defaultLearningLanguage={learningLanguage}
      />

      {/* Quiz Mode モーダル */}
      <QuizModeModal
        isOpen={showQuizModal}
        onClose={() => setShowQuizModal(false)}
        onStart={handleQuizStartWithModal}
        languages={languages || []}
        defaultLearningLanguage={learningLanguage}
        availablePhraseCount={0}
      />
      
      <Toaster />
    </div>
  )
}
