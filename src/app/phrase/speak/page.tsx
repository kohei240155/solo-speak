'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal, { SpeakConfig } from '@/components/SpeakModeModal'
import SpeakPractice from '@/components/SpeakPractice'
import { usePhraseSettings } from '@/hooks/usePhraseSettings'
import { usePhraseList } from '@/hooks/usePhraseList'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

// 練習用フレーズの型定義
interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
}

export default function PhraseSpeakPage() {
  const { user, loading } = useAuth()
  const router = useRouter()
  const {
    learningLanguage,
    languages,
  } = usePhraseSettings()

  const {
    savedPhrases,
    isLoadingPhrases,
    fetchSavedPhrases,
  } = usePhraseList()

  // 認証チェック: ログインしていない場合はホームページにリダイレクト
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])

  const [showSpeakModal, setShowSpeakModal] = useState(false) // モーダルの表示状態
  const [speakMode, setSpeakMode] = useState<{ active: boolean; config: SpeakConfig | null }>({
    active: false,
    config: null
  })
  
  // 動的フレーズ取得用の状態
  const [currentPhrase, setCurrentPhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingPhrase, setIsLoadingPhrase] = useState(false)
  const [todayCount, setTodayCount] = useState(0) // 今日の音読回数
  const [totalCount, setTotalCount] = useState(0) // 総音読回数

  // フレーズを取得する関数
  const fetchSpeakPhrase = useCallback(async (config: SpeakConfig) => {
    setIsLoadingPhrase(true)
    try {
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。再度ログインしてください。')
        setSpeakMode({ active: false, config: null })
        return
      }

      const params = new URLSearchParams({
        language: config.language, // configから言語を取得
        order: config.order.replace('-', '_'), // new-to-old → new_to_old
        prioritizeLowReadCount: config.prioritizeLowPractice.toString()
      })

      const response = await fetch(`/api/phrase/speak?${params.toString()}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      const data = await response.json()

      if (data.success && data.phrase) {
        setCurrentPhrase(data.phrase)
        setTodayCount(data.phrase.dailyReadCount || 0)
        setTotalCount(data.phrase.totalReadCount || 0)
      } else {
        toast.error(data.message || 'フレーズが見つかりませんでした')
        setSpeakMode({ active: false, config: null })
      }
    } catch (error) {
      console.error('Error fetching speak phrase:', error)
      toast.error('フレーズの取得中にエラーが発生しました')
      setSpeakMode({ active: false, config: null })
    } finally {
      setIsLoadingPhrase(false)
    }
  }, [])

  // カウント機能
  const handleCount = async () => {
    if (!currentPhrase) return

    try {
      // 認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。再度ログインしてください。')
        return
      }

      const response = await fetch(`/api/phrase/${currentPhrase.id}/count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (response.ok) {
        // ローカル状態を更新
        setCurrentPhrase(prev => prev ? {
          ...prev,
          totalReadCount: prev.totalReadCount + 1,
          dailyReadCount: prev.dailyReadCount + 1
        } : null)
        setTodayCount(prev => prev + 1)
        setTotalCount(prev => prev + 1)
      }
    } catch (error) {
      console.error('Error updating count:', error)
      toast.error('カウントの更新に失敗しました')
    }
  }

  // 音声再生機能
  const handleSound = async () => {
    if (!currentPhrase) return

    try {
      // SpeakMode設定から言語を取得、フォールバックとしてlearningLanguageを使用
      const languageToUse = speakMode.config?.language || learningLanguage
      
      // Web Speech API を使用して音声再生
      if ('speechSynthesis' in window) {
        speechSynthesis.cancel() // 既存の音声を停止
        const utterance = new SpeechSynthesisUtterance(currentPhrase.text)
        
        // 言語設定
        const voices = speechSynthesis.getVoices()
        const voice = voices.find(v => v.lang.startsWith(languageToUse))
        if (voice) {
          utterance.voice = voice
        }
        
        speechSynthesis.speak(utterance)
      } else {
        toast.error('音声再生がサポートされていません')
      }
    } catch (error) {
      console.error('Error playing sound:', error)
      toast.error('音声再生に失敗しました')
    }
  }

  // 次のフレーズを取得
  const handleNext = async () => {
    if (speakMode.config) {
      await fetchSpeakPhrase(speakMode.config)
    }
  }

  // ページ読み込み時にフレーズを取得
  useEffect(() => {
    if (learningLanguage) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, fetchSavedPhrases])

  // ページ読み込み時にURLパラメータから設定を復元
  useEffect(() => {
    const params = new URLSearchParams(window.location.search)
    const order = params.get('order') as 'new-to-old' | 'old-to-new' | null
    const prioritizeLowPractice = params.get('prioritizeLowPractice') === 'true'
    const urlLanguage = params.get('language')
    
    // URLパラメータに設定がある場合、自動的に練習モードを開始
    if (order && (order === 'new-to-old' || order === 'old-to-new') && learningLanguage) {
      const config: SpeakConfig = {
        order,
        prioritizeLowPractice,
        language: urlLanguage || learningLanguage
      }
      setSpeakMode({ active: true, config })
      fetchSpeakPhrase(config)
    }
  }, [learningLanguage, fetchSpeakPhrase]) // learningLanguageが設定されてから実行

  const handleSpeakStart = async (config: SpeakConfig) => {
    setSpeakMode({ active: true, config })
    
    // URLパラメータに選択した設定を反映
    const params = new URLSearchParams(window.location.search)
    params.set('order', config.order)
    params.set('prioritizeLowPractice', config.prioritizeLowPractice.toString())
    params.set('language', config.language)
    
    // URLを更新（ページリロードは発生しない）
    const newUrl = `${window.location.pathname}?${params.toString()}`
    window.history.replaceState({}, '', newUrl)
    
    // フレーズを取得
    await fetchSpeakPhrase(config)
  }

  const handleSpeakFinish = () => {
    setSpeakMode({ active: false, config: null })
    setCurrentPhrase(null)
    setTodayCount(0)
    setTotalCount(0)
    
    // URLパラメータをクリア
    const newUrl = window.location.pathname
    window.history.replaceState({}, '', newUrl)
    
    // Finish後はモーダルを再表示しない
  }

  const handleSpeakModalClose = () => {
    setShowSpeakModal(false)
  }

  // Speak練習モードが有効な場合はSpeakPracticeコンポーネントを表示
  if (speakMode.active && speakMode.config) {
    // 認証チェック
    if (loading) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
            <p className="mt-2 text-gray-600">認証情報を確認中...</p>
          </div>
        </div>
      )
    }

    if (!user) {
      return (
        <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
          <div className="text-center">
            <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
            <button
              onClick={() => router.push('/')}
              className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
            >
              ホームに戻る
            </button>
          </div>
        </div>
      )
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
            onSpeakModalOpen={undefined} // 練習モード中はモーダルを無効化
          />

          {/* Speak練習コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {isLoadingPhrase ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
              </div>
            ) : currentPhrase ? (
              <SpeakPractice
                phrase={currentPhrase}
                onCount={handleCount}
                onSound={handleSound}
                onNext={handleNext}
                onFinish={handleSpeakFinish}
                todayCount={todayCount}
                totalCount={totalCount}
              />
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">フレーズが見つかりませんでした</p>
                <button
                  onClick={handleSpeakFinish}
                  className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
                >
                  戻る
                </button>
              </div>
            )}
          </div>
        </div>
        <Toaster />
      </div>
    )
  }

  // 認証チェック
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">認証情報を確認中...</p>
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <p className="text-gray-600 mb-4">この機能を利用するにはログインが必要です</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
          >
            ホームに戻る
          </button>
        </div>
      </div>
    )
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
          onSpeakModalOpen={() => setShowSpeakModal(true)}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {isLoadingPhrases ? (
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading phrases...</p>
            </div>
          ) : savedPhrases.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-600">練習できるフレーズがありません</p>
              <p className="text-gray-500 text-sm mt-2">まずはフレーズを追加してください</p>
            </div>
          ) : (
            <div className="text-center py-8">
              <p className="text-gray-600">Speak練習を開始する準備ができています</p>
              <button
                onClick={() => setShowSpeakModal(true)}
                className="mt-4 px-6 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700"
              >
                設定を開く
              </button>
            </div>
          )}
        </div>

        {/* Speak Mode モーダル */}
        <SpeakModeModal
          isOpen={showSpeakModal}
          onClose={handleSpeakModalClose}
          onStart={handleSpeakStart}
          languages={languages}
          defaultLearningLanguage={learningLanguage}
        />
      </div>
      
      <Toaster />
    </div>
  )
}
