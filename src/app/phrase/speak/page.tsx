'use client'

import { useState, useEffect } from 'react'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal from '@/components/SpeakModeModal'
import QuizModeModal from '@/components/QuizModeModal'
import SpeakPractice from '@/components/SpeakPractice'
import AuthGuard from '@/components/AuthGuard'
import SpeakPhraseList from '@/components/SpeakPhraseList'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useSpeakPhrase } from '@/hooks/useSpeakPhrase'
import { useSpeakMode } from '@/hooks/useSpeakMode'
import { useAuth } from '@/contexts/AuthContext'
import { speakText, preloadVoices } from '@/utils/speechSynthesis'
import { SpeakConfig } from '@/types/speak'
import { QuizConfig } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'
import { useRouter } from 'next/navigation'

export default function PhraseSpeakPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const { learningLanguage, languages } = usePhraseSettings()
  const { savedPhrases, isLoadingPhrases, fetchSavedPhrases } = usePhraseList()
  
  const {
    currentPhrase,
    isLoadingPhrase,
    todayCount,
    totalCount,
    pendingCount,
    fetchSpeakPhrase,
    sendPendingCount,
    handleCount,
    handleNext,
    handleFinish
  } = useSpeakPhrase()

  const { speakMode, handleSpeakStart, handleSpeakFinish } = useSpeakMode({
    learningLanguage,
    fetchSpeakPhrase,
    currentPhraseId: currentPhrase?.id || null,
    pendingCount,
    sendPendingCount
  })

  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)

  // 音声リストの初期化
  useEffect(() => {
    preloadVoices()
  }, [])

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases])

  // 音声再生機能
  const handleSound = async () => {
    if (!currentPhrase) return
    
    const languageToUse = speakMode.config?.language || learningLanguage
    await speakText(currentPhrase.text, languageToUse)
  }

  // 次のフレーズを取得（設定付き）
  const handleNextWithConfig = async () => {
    if (speakMode.config) {
      await handleNext(speakMode.config)
    }
  }

  // 練習終了処理
  const handleSpeakFinishComplete = async () => {
    await handleFinish()
    handleSpeakFinish()
  }

  // モーダル開始処理
  const handleSpeakStartWithModal = async (config: SpeakConfig) => {
    const success = await handleSpeakStart(config)
    if (success) {
      setShowSpeakModal(false)
    }
  }

  // Quizモーダル開始処理
  const handleQuizStartWithModal = async (config: QuizConfig) => {
    setShowQuizModal(false)
    // 設定に基づいてQuiz画面に遷移
    const queryParams = new URLSearchParams({
      language: config.language,
      mode: config.mode,
      count: (config.questionCount || 10).toString()
    })
    router.push(`/phrase/quiz?${queryParams.toString()}`)
  }

  // Speakモーダルを開く
  const openSpeakModal = () => {
    setShowSpeakModal(true)
  }

  // Quizモーダルを開く  
  const openQuizModal = () => {
    setShowQuizModal(true)
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
            activeTab="Speak" 
            onSpeakModalOpen={speakMode.active ? undefined : () => setShowSpeakModal(true)}
            onQuizModalOpen={openQuizModal}
          />

          {/* コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {speakMode.active && speakMode.config ? (
              <SpeakPractice
                phrase={currentPhrase}
                onCount={handleCount}
                onSound={handleSound}
                onNext={handleNextWithConfig}
                onFinish={handleSpeakFinishComplete}
                todayCount={todayCount}
                totalCount={totalCount}
                isLoading={isLoadingPhrase}
              />
            ) : (
              <SpeakPhraseList
                isLoadingPhrases={isLoadingPhrases}
                phraseCount={savedPhrases.length}
                onStartClick={() => setShowSpeakModal(true)}
              />
            )}
          </div>

          {/* Speak Mode モーダル */}
          <SpeakModeModal
            isOpen={showSpeakModal}
            onClose={() => setShowSpeakModal(false)}
            onStart={handleSpeakStartWithModal}
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
        </div>
        
        <Toaster />
      </div>
    </AuthGuard>
  )
}

