'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import PhraseTabNavigation from '@/components/navigation/PhraseTabNavigation'
import SpeakModeModal from '@/components/modals/SpeakModeModal'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { CiCirclePlus } from 'react-icons/ci'
import { HiMiniSpeakerWave } from 'react-icons/hi2'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useLanguages, useUserSettings } from '@/hooks/useSWRApi'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalSpeakCount: number
  dailySpeakCount: number
}

export default function SpeakPage() {
  const { user, loading: authLoading } = useAuth()
  const params = useParams()
  const router = useRouter()
  const [phrase, setPhrase] = useState<SpeakPhrase | null>(null)
  const [pendingCount, setPendingCount] = useState(0) // ペンディング中のカウント数
  const [learningLanguage, setLearningLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useUserSettings()

  // URLパラメータから取得
  const languageId = params.id as string

  // 認証チェック: ログインしていない場合はホームページにリダイレクト
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/')
    }
  }, [user, authLoading, router])

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  useEffect(() => {
    setLearningLanguage(languageId)
  }, [languageId])

  useEffect(() => {
    if (!user) return // ユーザーがログインしていない場合は何もしない

    // URLパラメータからphraseIdを取得
    const searchParams = new URLSearchParams(window.location.search)
    const phraseId = searchParams.get('phraseId')

    // フレーズを取得
    const fetchPhrase = async () => {
      try {
        if (phraseId) {
          // phraseIdが指定されている場合は特定のフレーズを取得
          const data = await api.get(`/api/phrase/${phraseId}`) as {
            id: string
            text: string
            translation: string
            totalSpeakCount?: number
            dailySpeakCount?: number
          }
          setPhrase({
            id: data.id,
            text: data.text,
            translation: data.translation,
            totalSpeakCount: data.totalSpeakCount || 0,
            dailySpeakCount: data.dailySpeakCount || 0
          })
        } else {
          // phraseIdがない場合は従来通りのAPIを呼び出し
          const data = await api.get(`/api/phrase/speak?language=${languageId}`) as {
            success: boolean
            phrase?: SpeakPhrase
            message?: string
          }
          if (data.success) {
            setPhrase(data.phrase!)
          } else {
            setError(data.message || 'フレーズが見つかりませんでした')
          }
        }
      } catch (error) {
        console.error('Error fetching phrase:', error)
        if (phraseId) {
          setError('フレーズが見つかりませんでした')
        } else {
          setError('フレーズの取得に失敗しました')
        }
      } finally {
        setLoading(false)
      }
    }

    fetchPhrase()
  }, [languageId, user])

  const handleCount = async () => {
    if (!phrase) return

    // 制限チェック: 現在の日次カウント + ペンディングカウント が 100 以上の場合
    const currentDailyCount = (phrase.dailySpeakCount || 0) + pendingCount
    if (currentDailyCount >= 100) {
      toast.error('このフレーズは1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
        duration: 4000
      })
      return
    }

    // ローカル状態のみを更新（APIは呼ばない）
    setPendingCount(prev => prev + 1)
    setPhrase(prev => prev ? {
      ...prev,
      totalSpeakCount: prev.totalSpeakCount + 1,
      dailySpeakCount: prev.dailySpeakCount + 1
    } : null)
  }

  const handleSound = async () => {
    if (!phrase) return

    try {
      // 音声再生APIを呼び出し
      const response = await fetch('/api/speech', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: phrase.text,
          language: languageId
        })
      })

      if (response.ok) {
        const data = await response.json()
        
        // Web Speech API を使用して音声再生
        if ('speechSynthesis' in window) {
          const utterance = new SpeechSynthesisUtterance(phrase.text)
          utterance.lang = data.language
          speechSynthesis.speak(utterance)
        } else {
          toast.error('音声再生がサポートされていません')
        }
      } else {
        toast.error('音声データの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error playing sound:', error)
      toast.error('音声再生に失敗しました')
    }
  }

  const handleNext = async () => {
    // ペンディングカウントがある場合は送信（session_spokenも自動的にtrueに設定される）
    if (pendingCount > 0 && phrase) {
      try {
        await api.post(`/api/phrase/${phrase.id}/count`, { count: pendingCount })
        setPendingCount(0) // 送信成功時はペンディングカウントをリセット
      } catch (error: unknown) {
        console.error('Error sending pending count:', error)
        toast.error('カウントの送信に失敗しました')
        return // エラーの場合は次のフレーズ取得を中止
      }
    } else if (phrase) {
      // カウントが0でもsession_spokenをtrueに設定
      try {
        await api.post(`/api/phrase/${phrase.id}/session-spoken`)
      } catch (error) {
        console.error('Error setting session spoken:', error)
        // session_spoken設定エラーは次のフレーズ取得を阻害しない
      }
    }

    // 次のフレーズを取得
    try {
      const data = await api.get(`/api/phrase/speak?language=${languageId}`) as {
        success: boolean
        phrase?: SpeakPhrase
      }
      
      if (data.success) {
        setPhrase(data.phrase!)
      } else {
        toast.error('次のフレーズが見つかりませんでした')
      }
    } catch (error) {
      console.error('Error fetching next phrase:', error)
      toast.error('次のフレーズの取得に失敗しました')
    }
  }

  const handleFinish = async () => {
    // ペンディングカウントがある場合は送信（session_spokenも自動的にtrueに設定される）
    if (pendingCount > 0 && phrase) {
      try {
        await api.post(`/api/phrase/${phrase.id}/count`, { count: pendingCount })
        setPendingCount(0) // 送信成功時はペンディングカウントをリセット
      } catch (error: unknown) {
        console.error('Error sending pending count:', error)
        toast.error('カウントの送信に失敗しました')
        // Finishの場合はエラーがあってもページ遷移を実行
      }
    } else if (phrase) {
      // カウントが0でもsession_spokenをtrueに設定
      try {
        await api.post(`/api/phrase/${phrase.id}/session-spoken`)
      } catch (error) {
        console.error('Error setting session spoken:', error)
        // session_spoken設定エラーはページ遷移を阻害しない
      }
    }

    router.push('/phrase/list')
  }

  // 認証チェック
  if (authLoading) {
    return <LoadingSpinner fullScreen message="Authenticating..." />
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

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
          {/* Phrase タイトル（言語選択なし） */}
          <div className="flex justify-between items-center mb-[18px]">
            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Phrase
            </h1>
          </div>
          
          {/* タブメニュー */}
          <PhraseTabNavigation 
            activeTab="Speak" 
            onSpeakModalOpen={openSpeakModal}
          />

          {/* ローディング表示エリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
              <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !phrase) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
          {/* Phrase タイトル（言語選択なし） */}
          <div className="flex justify-between items-center mb-[18px]">
            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Phrase
            </h1>
          </div>
          
          {/* タブメニュー */}
          <PhraseTabNavigation 
            activeTab="Speak" 
            onSpeakModalOpen={openSpeakModal}
          />

          {/* エラー表示エリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            <div className="text-center py-8">
              <p className="text-gray-600 mb-4">{error || 'フレーズが見つかりませんでした'}</p>
              <button
                onClick={() => router.push('/phrase/list')}
                className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
              >
                戻る
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Phrase タイトル（言語選択なし） */}
        <div className="flex justify-between items-center mb-[18px]">
          <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Phrase
          </h1>
        </div>
        
        {/* タブメニュー */}
        <PhraseTabNavigation 
          activeTab="Speak" 
          onSpeakModalOpen={openSpeakModal}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* フレーズ表示 */}
          <div className="mb-6">
            <div 
              className="text-base font-medium text-gray-900 mb-2 break-words"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {phrase.text}
            </div>
            <div 
              className="text-sm text-gray-600 break-words"
              style={{ 
                wordWrap: 'break-word',
                overflowWrap: 'anywhere',
                wordBreak: 'break-word'
              }}
            >
              {phrase.translation}
            </div>
          </div>

          {/* 音読回数表示 */}
          <div className="mb-4 flex items-center text-sm text-gray-600 md:mb-6 md:text-base">
            <HiMiniSpeakerWave className="w-4 h-4 mr-1 md:w-5 md:h-5 md:mr-2" />
            Today: {phrase.dailySpeakCount}  Total: {phrase.totalSpeakCount}
          </div>

          {/* Count と Sound ボタン */}
          <div className="mb-3 md:mb-4">
            <div className="flex gap-3 relative md:gap-6 items-start">
              {/* Count ボタンエリア */}
              <div className="flex-1 flex flex-col items-center">
                <button
                  onClick={handleCount}
                  disabled={(phrase.dailySpeakCount + pendingCount) >= 100}
                  className={`w-16 h-16 rounded-full flex items-center justify-center transition-colors md:w-24 md:h-24 ${
                    (phrase.dailySpeakCount + pendingCount) >= 100 
                      ? 'opacity-50 cursor-not-allowed bg-gray-100' 
                      : 'hover:bg-gray-50'
                  }`}
                >
                  <CiCirclePlus className={`w-12 h-12 md:w-16 md:h-16 ${
                    (phrase.dailySpeakCount + pendingCount) >= 100 ? 'text-gray-400' : 'text-gray-600'
                  }`} />
                </button>
                <span className={`font-medium text-base mt-1 md:text-lg md:mt-2 text-center ${
                  (phrase.dailySpeakCount + pendingCount) >= 100 ? 'text-gray-400' : 'text-gray-900'
                }`}>Count</span>
              </div>

              {/* 中央の区切り線 */}
              <div className="absolute left-1/2 top-0 transform -translate-x-1/2 w-px h-18 bg-gray-300 md:h-24"></div>

              {/* Sound ボタンエリア */}
              <div className="flex-1 flex flex-col items-center">
                <button
                  onClick={handleSound}
                  className="w-16 h-16 rounded-full flex items-center justify-center hover:bg-gray-50 transition-colors md:w-24 md:h-24"
                >
                  <HiMiniSpeakerWave className="w-12 h-12 text-gray-900 md:w-16 md:h-16" />
                </button>
                <span className="text-gray-900 font-medium text-base mt-1 md:text-lg md:mt-2 text-center">Sound</span>
              </div>
            </div>
          </div>

          {/* Finish と Next ボタン */}
          <div className="flex gap-3">
            <button
              onClick={handleFinish}
              className="flex-1 bg-white border py-2 px-4 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              style={{ 
                borderColor: '#616161',
                color: '#616161'
              }}
            >
              Finish
            </button>
            <button
              onClick={handleNext}
              className="flex-1 text-white py-2 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
              style={{ 
                backgroundColor: '#616161'
              }}
            >
              Next
            </button>
          </div>
        </div>
      </div>
      
      {/* Speak Mode モーダル */}
      <SpeakModeModal
        isOpen={showSpeakModal}
        onClose={closeSpeakModal}
        onStart={handleSpeakStart}
        languages={languages || []}
        defaultLearningLanguage={userSettings?.defaultLearningLanguage?.code || learningLanguage}
      />
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
