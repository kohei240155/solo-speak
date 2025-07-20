'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import LanguageSelector from '@/components/LanguageSelector'
import PhraseTabNavigation from '@/components/PhraseTabNavigation'
import SpeakModeModal from '@/components/SpeakModeModal'
import { Language } from '@/types/phrase'
import { RiSpeakLine } from 'react-icons/ri'
import { useSpeakModal } from '@/hooks/useSpeakModal'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'

interface SpeakPhrase {
  id: string
  text: string
  translation: string
  totalReadCount: number
  dailyReadCount: number
}

export default function SpeakPage() {
  const params = useParams()
  const router = useRouter()
  const [phrase, setPhrase] = useState<SpeakPhrase | null>(null)
  const [languages, setLanguages] = useState<Language[]>([])
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Speak modal functionality
  const {
    showSpeakModal,
    openSpeakModal,
    closeSpeakModal,
    handleSpeakStart
  } = useSpeakModal()

  const languageId = params.id as string

  useEffect(() => {
    setLearningLanguage(languageId)
  }, [languageId])

  useEffect(() => {
    // URLパラメータからphraseIdを取得
    const searchParams = new URLSearchParams(window.location.search)
    const phraseId = searchParams.get('phraseId')

    // 言語情報を取得
    const fetchLanguages = async () => {
      try {
        const response = await fetch('/api/languages')
        if (response.ok) {
          const data = await response.json()
          setLanguages(data.languages || [])
        }
      } catch (error) {
        console.error('Error fetching languages:', error)
      }
    }

    // ユーザー設定を取得
    const fetchUserSettings = async () => {
      try {
        const response = await fetch('/api/user/settings')
        if (response.ok) {
          const data = await response.json()
          setNativeLanguage(data.nativeLanguage || 'ja')
        }
      } catch (error) {
        console.error('Error fetching user settings:', error)
      }
    }

    // フレーズを取得
    const fetchPhrase = async () => {
      try {
        let response
        if (phraseId) {
          // phraseIdが指定されている場合は特定のフレーズを取得
          response = await fetch(`/api/phrase/${phraseId}`)
        } else {
          // phraseIdがない場合は従来通りのAPIを呼び出し
          response = await fetch(`/api/phrase/speak?language=${languageId}`)
        }
        
        const data = await response.json()
        
        if (phraseId) {
          // 特定フレーズ取得の場合
          if (response.ok) {
            setPhrase({
              id: data.id,
              text: data.text,
              translation: data.translation,
              totalReadCount: data.totalReadCount || 0,
              dailyReadCount: data.dailyReadCount || 0
            })
          } else {
            setError('フレーズが見つかりませんでした')
          }
        } else {
          // 音読API経由の場合
          if (data.success) {
            setPhrase(data.phrase)
          } else {
            setError(data.message || 'フレーズが見つかりませんでした')
          }
        }
      } catch (error) {
        console.error('Error fetching phrase:', error)
        setError('フレーズの取得に失敗しました')
      } finally {
        setLoading(false)
      }
    }

    fetchLanguages()
    fetchUserSettings()
    fetchPhrase()
  }, [languageId])

  const handleCount = async () => {
    if (!phrase) return

    try {
      // 音読回数を更新
      const response = await fetch(`/api/phrase/${phrase.id}/count`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      })

      if (response.ok) {
        // カウント更新成功
        setPhrase(prev => prev ? {
          ...prev,
          totalReadCount: prev.totalReadCount + 1,
          dailyReadCount: prev.dailyReadCount + 1
        } : null)
        toast.success('音読回数を記録しました')
      } else {
        toast.error('音読回数の記録に失敗しました')
      }
    } catch (error) {
      console.error('Error updating count:', error)
      toast.error('音読回数の記録に失敗しました')
    }
  }

  const handleSound = () => {
    if (!phrase) return

    // Web Speech API を使用して音声再生
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(phrase.text)
      
      // 学習言語に合わせて言語設定
      const language = languages.find(lang => lang.id === languageId)
      if (language) {
        utterance.lang = language.code === 'en' ? 'en-US' : language.code
      }
      
      speechSynthesis.speak(utterance)
    } else {
      toast.error('音声再生がサポートされていません')
    }
  }

  const handleNext = async () => {
    // 次のフレーズを取得
    try {
      const response = await fetch(`/api/phrase/speak?language=${languageId}`)
      const data = await response.json()
      
      if (data.success) {
        setPhrase(data.phrase)
      } else {
        toast.error('次のフレーズが見つかりませんでした')
      }
    } catch (error) {
      console.error('Error fetching next phrase:', error)
      toast.error('次のフレーズの取得に失敗しました')
    }
  }

  const handleFinish = () => {
    router.push('/phrase/list')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2 text-gray-600">フレーズを読み込み中...</p>
        </div>
      </div>
    )
  }

  if (error || !phrase) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <p className="text-gray-600 mb-4">{error || 'フレーズが見つかりませんでした'}</p>
          <button
            onClick={() => router.push('/phrase/list')}
            className="bg-gray-600 text-white px-4 py-2 rounded-md hover:bg-gray-700"
          >
            戻る
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Phrase タイトルと言語選択を同じ行に配置 */}
        <div className="flex justify-between items-center mb-[18px]">
          <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Phrase
          </h1>
          
          <LanguageSelector
            learningLanguage={learningLanguage}
            onLanguageChange={(newLanguage) => {
              // 言語変更時は新しい言語でSpeak画面に遷移
              if (newLanguage !== languageId) {
                router.push(`/phrase/${newLanguage}/speak`)
              }
            }}
            languages={languages}
            nativeLanguage={nativeLanguage}
          />
        </div>
        
        {/* タブメニュー */}
        <PhraseTabNavigation 
          activeTab="Speak" 
          onSpeakModalOpen={openSpeakModal}
        />

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* 学習言語のフレーズ（上） */}
          <div className="mb-4">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {languages.find(lang => lang.code === languageId)?.name || 'English'}
            </h3>
            <div className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm bg-gray-50 min-h-[80px] flex items-center">
              <div className="text-gray-900">
                {phrase.text}
              </div>
            </div>
          </div>

          {/* 母国語の翻訳（下） */}
          <div className="mb-6">
            <h3 className="text-base font-semibold text-gray-900 mb-3">
              {languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}
            </h3>
            <div className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm bg-gray-50 min-h-[80px] flex items-center">
              <div className="text-gray-600">
                {phrase.translation}
              </div>
            </div>
          </div>

          {/* 音読回数表示 */}
          <div className="mb-6 flex items-center text-sm text-gray-600">
            <RiSpeakLine className="w-4 h-4 mr-1" />
            Today: {phrase.dailyReadCount}  Total: {phrase.totalReadCount}
          </div>

          {/* Count と Sound ボタン */}
          <div className="mb-8">
            <div className="flex items-center justify-center">
              {/* Count ボタン */}
              <div className="flex flex-col items-center mr-8">
                <button
                  onClick={handleCount}
                  className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3 transition-colors"
                >
                  <div className="w-8 h-8 border-2 border-gray-600 rounded-full flex items-center justify-center">
                    <span className="text-gray-600 text-xl font-bold">+</span>
                  </div>
                </button>
                <span className="text-gray-900 font-medium text-sm">Count</span>
              </div>

              {/* 区切り線 */}
              <div className="w-px h-20 bg-gray-300 mx-8"></div>

              {/* Sound ボタン */}
              <div className="flex flex-col items-center ml-8">
                <button
                  onClick={handleSound}
                  className="w-16 h-16 bg-white border-2 border-gray-300 rounded-full flex items-center justify-center hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 mb-3 transition-colors"
                >
                  <RiSpeakLine className="w-7 h-7 text-gray-900" />
                </button>
                <span className="text-gray-900 font-medium text-sm">Sound</span>
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
        languages={languages}
        defaultLearningLanguage={learningLanguage}
      />
      
      {/* Toaster for notifications */}
      <Toaster />
    </div>
  )
}
