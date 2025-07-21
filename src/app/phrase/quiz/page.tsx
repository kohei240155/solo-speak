'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal from '@/components/SpeakModeModal'
import QuizModeModal from '@/components/QuizModeModal'
import QuizPractice from '@/components/QuizPractice'
import AuthGuard from '@/components/AuthGuard'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { useQuizPhrase } from '@/hooks/useQuizPhrase'
import { useQuizMode } from '@/hooks/useQuizMode'
import { useAuth } from '@/contexts/AuthContext'
import { QuizConfig } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'

export default function PhraseQuizPage() {
  const { user, loading } = useAuth()
  const { learningLanguage, languages } = usePhraseSettings()
  const { savedPhrases, isLoadingPhrases, fetchSavedPhrases } = usePhraseList()
  const searchParams = useSearchParams()

  // Quiz functionality
  const {
    session,
    currentPhrase,
    showTranslation,
    fetchQuizSession,
    handleShowTranslation,
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
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases])

  // フレーズが読み込まれた後、クイズがアクティブでない場合は自動的にモーダルを開く
  useEffect(() => {
    if (!isLoadingPhrases && savedPhrases.length > 0 && !quizMode.active && !showQuizModal) {
      setShowQuizModal(true)
    }
  }, [isLoadingPhrases, savedPhrases.length, quizMode.active, showQuizModal])

  // URLパラメータからの自動開始処理
  useEffect(() => {
    const autostart = searchParams.get('autostart')
    const language = searchParams.get('language')
    const mode = searchParams.get('mode')

    if (autostart === 'true' && language && mode && (mode === 'normal' || mode === 'random')) {
      const config: QuizConfig = {
        language,
        mode
      }
      handleQuizStart(config)
    }
  }, [searchParams, handleQuizStart])

  // Quiz開始処理
  const handleQuizStartWithModal = async (config: QuizConfig): Promise<void> => {
    console.log('Quiz modal start requested with config:', config)
    const success = await handleQuizStart(config)
    console.log('Quiz start result:', success)
    console.log('Quiz mode after start:', quizMode)
    console.log('Current session:', session)
    console.log('Current phrase:', currentPhrase)
    
    if (!success) {
      throw new Error('Failed to start quiz')
    }
  }

  // クイズ終了処理
  const handleQuizFinishComplete = () => {
    resetQuiz()
    handleQuizFinish()
  }

  // デバッグログ
  console.log('Render conditions:', {
    'quizMode.active': quizMode.active,
    'quizMode.config': quizMode.config,
    'currentPhrase': currentPhrase,
    'session': session,
    'all conditions met': quizMode.active && quizMode.config && currentPhrase && session
  })

  return (
    <AuthGuard user={user} loading={loading}>
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
          {quizMode.active && quizMode.config && currentPhrase && session ? (
            <QuizPractice
              session={session}
              currentPhrase={currentPhrase}
              showTranslation={showTranslation}
              onShowTranslation={handleShowTranslation}
              onAnswer={handleAnswer}
              onNext={handleNext}
              onFinish={handleQuizFinishComplete}
            />
          ) : quizMode.active && quizMode.config ? (
            // クイズがアクティブだが、セッションまたはフレーズがまだ読み込み中
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
              <p className="text-gray-600">Starting quiz...</p>
            </div>
          ) : (
            // クイズがアクティブでない場合は何も表示しない（モーダルで操作）
            <div className="text-center py-8">
              {isLoadingPhrases ? (
                <>
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading phrases...</p>
                </>
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
      />
      
      <Toaster />
      </div>
    </AuthGuard>
  )
}
