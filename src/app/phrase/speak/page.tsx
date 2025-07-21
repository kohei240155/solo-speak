'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
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
import toast from 'react-hot-toast'
import { supabase } from '@/utils/spabase'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
}

function PhraseSpeakPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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

  const { speakMode, handleSpeakStart } = useSpeakMode({
    learningLanguage,
    fetchSpeakPhrase,
    currentPhraseId: currentPhrase?.id || null,
    pendingCount,
    sendPendingCount
  })

  const [showSpeakModal, setShowSpeakModal] = useState(false)
  const [showQuizModal, setShowQuizModal] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false) // Finish処理中の状態を追加
  
  // 単一フレーズ練習用の状態
  const [singlePhrase, setSinglePhrase] = useState<SpeakPhrase | null>(null)
  const [isSinglePhraseMode, setIsSinglePhraseMode] = useState(false)
  const [isLoadingSinglePhrase, setIsLoadingSinglePhrase] = useState(false)
  const [singlePhraseTodayCount, setSinglePhraseTodayCount] = useState(0)
  const [singlePhraseTotalCount, setSinglePhraseTotalCount] = useState(0)
  const [singlePhrasePendingCount, setSinglePhrasePendingCount] = useState(0) // ペンディングカウント追加

  // 音声リストの初期化
  useEffect(() => {
    preloadVoices()
  }, [])

  // 単一フレーズを取得する関数
  const fetchSinglePhrase = useCallback(async (phraseId: string) => {
    if (!user) return
    
    setIsLoadingSinglePhrase(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。')
        return
      }

      const response = await fetch(`/api/phrase/${phraseId}/speak`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch phrase')
      }

      const data = await response.json()
      
      if (data.success) {
        setSinglePhrase(data.phrase)
        setSinglePhraseTodayCount(data.phrase.dailyReadCount || 0)
        setSinglePhraseTotalCount(data.phrase.totalReadCount || 0)
        setSinglePhrasePendingCount(0) // ペンディングカウントを初期化
      } else {
        toast.error('フレーズが見つかりませんでした')
        router.push('/phrase/list')
      }
    } catch (error) {
      console.error('Error fetching single phrase:', error)
      toast.error('フレーズの取得に失敗しました')
      router.push('/phrase/list')
    } finally {
      setIsLoadingSinglePhrase(false)
    }
  }, [user, router])

  // 単一フレーズモードのチェック
  useEffect(() => {
    const phraseId = searchParams.get('phraseId')
    if (phraseId) {
      setIsSinglePhraseMode(true)
      fetchSinglePhrase(phraseId)
    } else {
      setIsSinglePhraseMode(false)
    }
  }, [searchParams, fetchSinglePhrase])

  // 単一フレーズの音読回数を更新（ローカルのみ）
  const handleSinglePhraseCount = async () => {
    if (!singlePhrase) return

    // ローカル状態を即座に更新（既存のuseSpeakPhraseと同じロジック）
    setSinglePhrasePendingCount(prev => prev + 1)
    setSinglePhraseTodayCount(prev => prev + 1)
    setSinglePhraseTotalCount(prev => prev + 1)
    
    // フレーズの表示カウントも更新
    setSinglePhrase(prev => prev ? {
      ...prev,
      dailyReadCount: prev.dailyReadCount + 1,
      totalReadCount: prev.totalReadCount + 1
    } : null)
  }

  // 単一フレーズの音声再生
  const handleSinglePhraseSound = async () => {
    if (!singlePhrase) return
    await speakText(singlePhrase.text, learningLanguage)
  }

  // 単一フレーズ練習終了処理
  const handleSinglePhraseFinish = async () => {
    setIsFinishing(true)
    try {
      // 保留中のカウントを送信（既存のuseSpeakPhraseと同じロジック）
      if (singlePhrase && singlePhrasePendingCount > 0) {
        const success = await sendPendingCount(singlePhrase.id, singlePhrasePendingCount)
        if (!success) {
          toast.error('カウントの送信に失敗しました')
        }
      }
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing single phrase practice:', error)
      toast.error('終了処理中にエラーが発生しました')
    } finally {
      setIsFinishing(false)
    }
  }

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage && !isSinglePhraseMode) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases, isSinglePhraseMode])

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
    setIsFinishing(true)
    try {
      await handleFinish()
      // 練習準備画面ではなく、直接Listページに遷移
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing speak practice:', error)
      toast.error('終了処理中にエラーが発生しました')
    } finally {
      setIsFinishing(false)
    }
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
            {isSinglePhraseMode ? (
              // 単一フレーズ練習モード
              singlePhrase ? (
                <SpeakPractice
                  phrase={singlePhrase}
                  onCount={handleSinglePhraseCount}
                  onSound={handleSinglePhraseSound}
                  onNext={() => {}} // 単一フレーズモードでは何もしない
                  onFinish={handleSinglePhraseFinish}
                  todayCount={singlePhraseTodayCount}
                  totalCount={singlePhraseTotalCount}
                  isLoading={isLoadingSinglePhrase}
                  isNextLoading={false}
                  isHideNext={true}
                  isFinishing={isFinishing}
                />
              ) : (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                  <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
                </div>
              )
            ) : (
              // 通常の複数フレーズ練習モード
              speakMode.active && speakMode.config ? (
                // Finish処理中またはフレーズがある場合は練習画面を表示
                (currentPhrase || isFinishing) ? (
                  <SpeakPractice
                    phrase={currentPhrase}
                    onCount={handleCount}
                    onSound={handleSound}
                    onNext={handleNextWithConfig}
                    onFinish={handleSpeakFinishComplete}
                    todayCount={todayCount}
                    totalCount={totalCount}
                    isLoading={isLoadingPhrase}
                    isHideNext={false}
                    isFinishing={isFinishing}
                  />
                ) : (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                    <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
                  </div>
                )
              ) : (
                <SpeakPhraseList
                  isLoadingPhrases={isLoadingPhrases}
                  phraseCount={savedPhrases.length}
                  onStartClick={() => setShowSpeakModal(true)}
                />
              )
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
            availablePhraseCount={savedPhrases.length}
          />
        </div>
        
        <Toaster />
      </div>
    </AuthGuard>
  )
}

export default dynamic(() => Promise.resolve(PhraseSpeakPage), { ssr: false })

