'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'

interface PhraseVariation {
  type: 'common' | 'polite' | 'casual'
  text: string
  explanation?: string
}

interface Language {
  id: string
  name: string
  code: string
}

const typeLabels = {
  common: '一般的',
  polite: '丁寧',
  casual: 'カジュアル'
}

const typeIcons = {
  common: '✓',
  polite: '📝',
  casual: '😊'
}

export default function PhraseAddPage() {
  const { user } = useAuth()
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [desiredPhrase, setDesiredPhrase] = useState('')
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState(0)
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedVariation, setSelectedVariation] = useState<PhraseVariation | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingVariations, setEditingVariations] = useState<{[key: number]: string}>({})

  useEffect(() => {
    // 言語一覧を取得
    fetchLanguages()
  }, [])

  useEffect(() => {
    // ユーザーの残り生成回数を取得
    if (user) {
      fetchUserRemainingGenerations()
      fetchUserSettings()
    }
  }, [user])

  const fetchLanguages = async () => {
    try {
      const response = await fetch('/api/languages')
      if (response.ok) {
        const data = await response.json()
        setLanguages(data)
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const userData = await response.json()
        if (userData.nativeLanguage?.code) {
          setNativeLanguage(userData.nativeLanguage.code)
        }
        if (userData.defaultLearningLanguage?.code) {
          setLearningLanguage(userData.defaultLearningLanguage.code)
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }

  const fetchUserRemainingGenerations = async () => {
    // ユーザー設定APIから残り生成回数を取得
    // 画像に合わせて2に設定
    setRemainingGenerations(2)
  }

  const handleEditVariation = (index: number, newText: string) => {
    setEditingVariations(prev => ({ ...prev, [index]: newText }))
  }

  const handleGeneratePhrase = async () => {
    if (!desiredPhrase.trim()) {
      setError('フレーズを入力してください')
      return
    }

    if (remainingGenerations <= 0) {
      setError('本日の生成回数上限に達しました')
      return
    }

    setIsLoading(true)
    setError('')
    setGeneratedVariations([])
    setEditingVariations({}) // 編集状態をリセット

    try {
      const response = await fetch('/api/phrase/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          nativeLanguage,
          learningLanguage,
          desiredPhrase,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'フレーズの生成に失敗しました')
      }

      const data = await response.json()
      setGeneratedVariations(data.variations)
      setRemainingGenerations(prev => Math.max(0, prev - 1))

    } catch (error) {
      console.error('Error generating phrase:', error)
      setError(error instanceof Error ? error.message : 'フレーズの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectVariation = async (variation: PhraseVariation, index: number) => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    setIsSaving(true)
    setError('')

    try {
      // 学習言語のIDを取得
      const learningLang = languages.find(lang => lang.code === learningLanguage)
      if (!learningLang) {
        throw new Error('学習言語が見つかりません')
      }

      // 編集されたテキストがあれば使用、なければ元のテキストを使用
      const finalText = editingVariations[index] || variation.text

      const response = await fetch('/api/phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          languageId: learningLang.id,
          text: desiredPhrase,
          translation: finalText,
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'フレーズの登録に失敗しました')
      }

      setSelectedVariation(variation)
      // 成功メッセージを表示するか、ページ遷移する

    } catch (error) {
      console.error('Error saving phrase:', error)
      setError(error instanceof Error ? error.message : 'フレーズの登録に失敗しました')
    } finally {
      setIsSaving(false)
    }
  }

  const maxLength = nativeLanguage === 'ja' ? 80 : 200

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
        {/* Phrase タイトルと言語選択を同じ行に配置 */}
        <div className="flex justify-between items-center mb-[18px]">
          <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
            Phrase
          </h1>
          
          {/* 言語選択ドロップダウン */}
          <div className="relative">
            <select
              value={learningLanguage}
              onChange={(e) => setLearningLanguage(e.target.value)}
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-2 pr-10 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] md:min-w-[160px]"
            >
              {languages
                .filter(lang => lang.code !== nativeLanguage)
                .map(lang => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name}
                  </option>
                ))}
            </select>
            <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-700">
              <svg className="fill-current h-5 w-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            </div>
          </div>
        </div>
        
        {/* タブメニュー */}
        <div className="flex mb-[18px]">
          <button className="flex-1 py-2 text-sm md:text-base rounded-l-[20px] bg-white text-gray-700 border border-gray-300 font-normal">
            List
          </button>
          <button className="flex-1 py-2 text-sm md:text-base bg-gray-200 text-gray-700 font-bold border border-l-0 border-gray-300">
            Add
          </button>
          <button className="flex-1 py-2 text-sm md:text-base bg-white text-gray-700 border border-l-0 border-gray-300 font-normal">
            Speak
          </button>
          <button className="flex-1 py-2 text-sm md:text-base rounded-r-[20px] bg-white text-gray-700 border border-l-0 border-gray-300 font-normal">
            Quiz
          </button>
        </div>

        {/* コンテンツエリア */}
        <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
          {/* Native Language表示とLeft情報 */}
          <div className="flex justify-between items-center mb-6">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">
              {languages.length > 0 
                ? (languages.find(lang => lang.code === nativeLanguage)?.name || 'Japanese')
                : 'Loading...'
              }
            </h2>
            <div className="text-sm text-gray-600">
              Left: {remainingGenerations} / 5
            </div>
          </div>

          {/* フレーズ入力エリア */}
          <div className="mb-6">
            <textarea
              value={desiredPhrase}
              onChange={(e) => setDesiredPhrase(e.target.value)}
              placeholder={`知りたいフレーズを${languages.find(lang => lang.code === nativeLanguage)?.name || '日本語'}で入力してください`}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={maxLength}
            />
            
            <div className="flex justify-between items-center mt-2">
              <span className="text-xs text-gray-500">
                100文字以内で入力してください
              </span>
              <span className="text-xs text-gray-500">
                {desiredPhrase.length} / 100
              </span>
            </div>
          </div>

          {/* エラーメッセージ */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
              {error}
            </div>
          )}

          {/* AI Suggest ボタン */}
          <button
            onClick={handleGeneratePhrase}
            disabled={isLoading || !desiredPhrase.trim() || remainingGenerations <= 0}
            className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200 mb-8"
            style={{ backgroundColor: '#616161' }}
            onMouseEnter={(e) => {
              if (!isLoading && desiredPhrase.trim() && remainingGenerations > 0) {
                e.currentTarget.style.backgroundColor = '#525252'
              }
            }}
            onMouseLeave={(e) => {
              if (!isLoading && desiredPhrase.trim() && remainingGenerations > 0) {
                e.currentTarget.style.backgroundColor = '#616161'
              }
            }}
          >
            {isLoading ? (
              <div className="flex items-center justify-center">
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3"></div>
                AI Suggest
              </div>
            ) : (
              'AI Suggest'
            )}
          </button>

          {/* 生成結果 */}
          {generatedVariations.length > 0 && (
            <div className="space-y-4">
              <h3 className="text-lg md:text-xl font-bold text-gray-900 mb-4">
                AI Suggested Phrases
              </h3>
              
              {generatedVariations.map((variation, index) => (
                <div key={index} className="p-0">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center">
                      <span className="text-lg mr-2">{typeIcons[variation.type]}</span>
                      <span className="font-medium text-gray-900">
                        {typeLabels[variation.type]}
                      </span>
                    </div>
                  </div>
                  
                  {/* 編集可能なテキストエリア */}
                  <textarea
                    value={editingVariations[index] || variation.text}
                    onChange={(e) => handleEditVariation(index, e.target.value)}
                    className="w-full border border-gray-300 rounded-md px-3 py-2 text-base leading-relaxed resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                    rows={3}
                  />
                  
                  <button
                    onClick={() => handleSelectVariation(variation, index)}
                    disabled={isSaving}
                    className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
                    style={{ backgroundColor: '#616161' }}
                    onMouseEnter={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.backgroundColor = '#525252'
                      }
                    }}
                    onMouseLeave={(e) => {
                      if (!isSaving) {
                        e.currentTarget.style.backgroundColor = '#616161'
                      }
                    }}
                  >
                    {isSaving ? 'Saving...' : 'Select'}
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* 成功メッセージ */}
          {selectedVariation && (
            <div className="mt-6 bg-green-50 border border-green-200 text-green-700 px-4 py-3 rounded-md">
              フレーズを登録しました！
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
