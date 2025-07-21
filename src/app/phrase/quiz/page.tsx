'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal from '@/components/SpeakModeModal'
import QuizModeModal from '@/components/QuizModeModal'
import QuizPractice from '@/components/QuizPractice'
import AuthGuard from '@/components/AuthGuard'
import QuizPhraseList from '@/components/QuizPhraseList'
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
  const { learningLanguage, languages, nativeLanguage } = usePhraseSettings()
  const { savedPhrases, isLoadingPhrases, fetchSavedPhrases } = usePhraseList()
  const searchParams = useSearchParams()

  // Quiz functionality
  const {
    currentPhrase,
    fetchQuizPhrase,
    showResult,
    isCorrect,
    selectedAnswer,
    handleAnswer,
    handleNext,
    resetQuiz
  } = useQuizPhrase()

  const { quizMode, handleQuizStart, handleQuizFinish } = useQuizMode({
    fetchQuizPhrase
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
  const handleQuizStartWithModal = async (config: QuizConfig) => {
    const success = await handleQuizStart(config)
    if (success) {
      setShowQuizModal(false)
    }
  }

  // 次のクイズを取得（設定付き）
  const handleNextWithConfig = async () => {
    if (quizMode.config) {
      await handleNext(quizMode.config)
    }
  }

  // クイズ終了処理
  const handleQuizFinishComplete = () => {
    resetQuiz()
    handleQuizFinish()
  }

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
          {quizMode.active && quizMode.config && currentPhrase ? (
            <QuizPractice
              phrase={currentPhrase}
              languages={languages}
              nativeLanguage={nativeLanguage}
              onAnswer={handleAnswer}
              onNext={handleNextWithConfig}
              onFinish={handleQuizFinishComplete}
              showResult={showResult}
              isCorrect={isCorrect}
              selectedAnswer={selectedAnswer}
            />
          ) : (
            <QuizPhraseList
              isLoadingPhrases={isLoadingPhrases}
              phraseCount={savedPhrases.length}
              onStartClick={() => setShowQuizModal(true)}
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
      />
      
      <Toaster />
      </div>
    </AuthGuard>
  )
}
