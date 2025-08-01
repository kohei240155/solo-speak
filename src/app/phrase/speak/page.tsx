'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import dynamic from 'next/dynamic'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import QuizModeModal from '@/components/modals/QuizModeModal'
import SpeakPractice from '@/components/speak/SpeakPractice'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SpeakComplete from '@/components/speak/SpeakComplete'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useSpeakPhrase } from '@/hooks/useSpeakPhrase'
import { useSpeakMode } from '@/hooks/useSpeakMode'
import { speakText, preloadVoices } from '@/utils/speechSynthesis'
import { SpeakConfig, SpeakPhrase } from '@/types/speak'
import { QuizConfig } from '@/types/quiz'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import { useSpeakPhraseById } from '@/hooks/useSWRApi'

function PhraseSpeakPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
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
    checkSpeakCompletion,
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
  const [isFinishing, setIsFinishing] = useState(false) // Finish処理中の状態を追加
  const [isCompleted, setIsCompleted] = useState(false) // 全フレーズ完了状態を追加
  const [isStartingSpeak, setIsStartingSpeak] = useState(false) // Speak開始処理中の状態を追加
  
  // 単一フレーズ練習用の状態
  const [singlePhrase, setSinglePhrase] = useState<SpeakPhrase | null>(null)
  const [isSinglePhraseMode, setIsSinglePhraseMode] = useState(false)
  const [isLoadingSinglePhrase, setIsLoadingSinglePhrase] = useState(false)
  const [singlePhraseTodayCount, setSinglePhraseTodayCount] = useState(0)
  const [singlePhraseTotalCount, setSinglePhraseTotalCount] = useState(0)
  const [singlePhrasePendingCount, setSinglePhrasePendingCount] = useState(0) // ペンディングカウント追加

  // URLパラメータからphraseIdを取得
  const phraseId = searchParams.get('phraseId')
  
  // SWRフックを使用して単一フレーズを取得
  const { data: singlePhraseData, phrase: singlePhraseFromSWR, isLoading: isLoadingSinglePhraseSWR } = useSpeakPhraseById(phraseId || undefined)

  // 音声リストの初期化
  useEffect(() => {
    preloadVoices()
  }, [])

  // SWRから取得したデータを状態に反映
  useEffect(() => {
    if (!phraseId) {
      return
    }
    
    if (singlePhraseFromSWR) {
      setSinglePhrase(singlePhraseFromSWR)
      setSinglePhraseTodayCount(singlePhraseFromSWR.dailySpeakCount || 0)
      setSinglePhraseTotalCount(singlePhraseFromSWR.totalSpeakCount || 0)
      setSinglePhrasePendingCount(0)
      setIsLoadingSinglePhrase(false)
      return
    }
    
    if (singlePhraseData && !singlePhraseData.success) {
      toast.error('フレーズが見つかりませんでした')
      router.push('/phrase/list')
    }
  }, [singlePhraseFromSWR, singlePhraseData, phraseId, router])

  // ローディング状態の管理
  useEffect(() => {
    if (phraseId) {
      setIsLoadingSinglePhrase(isLoadingSinglePhraseSWR)
    }
  }, [phraseId, isLoadingSinglePhraseSWR])

  // 単一フレーズモードのチェック
  useEffect(() => {
    if (phraseId) {
      setIsSinglePhraseMode(true)
    } else {
      setIsSinglePhraseMode(false)
    }
  }, [phraseId])

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
      dailySpeakCount: prev.dailySpeakCount + 1,
      totalSpeakCount: prev.totalSpeakCount + 1
    } : null)
  }

  // 単一フレーズの音声再生
  const handleSinglePhraseSound = async () => {
    if (!singlePhrase) return
    await speakText(singlePhrase.original, learningLanguage)
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
    await speakText(currentPhrase.original, languageToUse)
  }

  // 次のフレーズを取得（設定付き）
  const handleNextWithConfig = async () => {
    if (speakMode.config && currentPhrase) {
      // カウントを送信してから次のフレーズを取得
      const result = await handleNext(speakMode.config)
      
      if (result === 'allCompleted') {
        // 全てのフレーズが完了した場合、All Done画面を表示
        setIsCompleted(true)
      } else if (!result) {
        // エラーが発生した場合、完了チェックを実行
        const isAllCompleted = await checkSpeakCompletion(speakMode.config.language)
        
        if (isAllCompleted) {
          // 全てのフレーズを完了した場合、All Done画面を表示
          setIsCompleted(true)
        } else {
          // まだ未完了のフレーズがある場合、練習を終了
          toast.success('すべてのフレーズをSpeakしました！')
          await handleSpeakFinishComplete()
        }
      }
    }
  }

  // 練習終了処理
  const handleSpeakFinishComplete = async () => {
    setIsFinishing(true)
    try {
      await handleFinish()
      handleSpeakFinish() // Speak済みフレーズIDをリセット
      // 練習準備画面ではなく、直接Listページに遷移
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing speak practice:', error)
      toast.error('終了処理中にエラーが発生しました')
    } finally {
      setIsFinishing(false)
    }
  }

  // All Done画面からの終了処理
  const handleCompleteFinish = async () => {
    // 直接リストページに遷移（setIsCompleted(false)は実行しない）
    try {
      await handleFinish()
      handleSpeakFinish() // Speak済みフレーズIDをリセット
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing speak practice:', error)
      toast.error('終了処理中にエラーが発生しました')
    }
  }

  // All Done画面からの再開処理
  const handleCompleteRestart = async () => {
    setIsCompleted(false)
    setIsStartingSpeak(true) // ローディング開始
    try {
      if (speakMode.config) {
        // スピークしたフレーズIDをリセットして再開
        const result = await handleSpeakStart(speakMode.config)
        if (result === 'allCompleted') {
          // 再度全て完了の場合
          setIsCompleted(true)
        }
      }
    } catch (error) {
      console.error('Error restarting speak practice:', error)
      toast.error('再開処理中にエラーが発生しました')
    } finally {
      setIsStartingSpeak(false) // ローディング終了
    }
  }

  // モーダル開始処理
  const handleSpeakStartWithModal = async (config: SpeakConfig) => {
    setIsStartingSpeak(true) // ローディング開始
    setShowSpeakModal(false) // まずモーダルを閉じる
    try {
      const result = await handleSpeakStart(config)
      if (result === false) {
        // 失敗した場合はspeakModeをリセットし、適切なエラーメッセージを表示
        handleSpeakFinish() // speakModeを無効にする
        setShowSpeakModal(true)
        if (config.excludeSpeakCountThreshold && config.excludeSpeakCountThreshold > 0) {
          toast.error(`${config.excludeSpeakCountThreshold}回以上音読したフレーズを除外すると、練習できるフレーズがありません。設定を変更してください。`)
        } else {
          toast.error('フレーズの取得に失敗しました。設定を確認してください。')
        }
      } else if (result === 'allCompleted') {
        // 全て完了の場合はAll Done画面を表示
        setIsCompleted(true)
      }
      // 成功した場合は何もしない（SpeakPractice画面が自動的に表示される）
    } catch (error) {
      console.error('Error starting speak practice:', error)
      // エラーが発生した場合もspeakModeをリセットしてモーダルを再度開く
      handleSpeakFinish() // speakModeを無効にする
      setShowSpeakModal(true)
      toast.error('練習の開始中にエラーが発生しました')
    } finally {
      setIsStartingSpeak(false) // ローディング終了
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

    // Speakモーダルを開く処理（適切な条件チェック付き）
  const handleSpeakModalOpen = () => {
    // 単一フレーズモードでない場合のみ処理
    if (!isSinglePhraseMode) {
      // ローディング中の場合は何もしない
      if (isLoadingPhrases) {
        return
      }
      
      // 常にモーダルを開く（リスト画面への遷移は削除）
      setShowSpeakModal(true)
    }
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
            onSpeakModalOpen={speakMode.active ? undefined : handleSpeakModalOpen}
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
                <LoadingSpinner 
                  size="lg"
                  message="フレーズを読み込み中..." 
                  className="py-12" 
                />
              )
            ) : (
              // 通常の複数フレーズ練習モード
              speakMode.active && speakMode.config ? (
                // 完了状態の場合はSpeakCompleteを表示
                isCompleted ? (
                  <SpeakComplete
                    onFinish={handleCompleteFinish}
                    onRestart={handleCompleteRestart}
                  />
                ) : (
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
                    <LoadingSpinner 
                      size="lg"
                      message="フレーズを読み込み中..." 
                      className="py-12" 
                    />
                  )
                )
              ) : isStartingSpeak ? (
                // Speak開始処理中のローディング表示（タブの下、コンテンツエリア内）
                <LoadingSpinner 
                  size="lg"
                  message="練習を開始しています..."
                  className="py-12"
                />
              ) : (
                isLoadingPhrases ? (
                  <LoadingSpinner 
                    message="フレーズを読み込み中..." 
                    className="py-8" 
                  />
                ) : savedPhrases.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">練習できるフレーズがありません</p>
                    <p className="text-gray-500 text-sm mt-2">まずはフレーズを追加してください</p>
                  </div>
                ) : (
                  // フレーズが存在する場合の初期画面（モーダルを開くまでの待機画面）
                  <div className="text-center py-8">
                    <p className="text-gray-600">上のSpeakタブをクリックして練習を開始してください</p>
                  </div>
                )
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
  )
}

export default dynamic(() => Promise.resolve(PhraseSpeakPage), { ssr: false })

