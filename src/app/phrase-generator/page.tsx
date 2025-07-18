'use client'

import { useState, useEffect } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Header from '@/components/Header'

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

export default function PhraseGeneratorPage() {
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

  useEffect(() => {
    // 言語一覧を取得
    fetchLanguages()
    
    // ユーザーの残り生成回数を取得
    if (user) {
      fetchUserRemainingGenerations()
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

  const fetchUserRemainingGenerations = async () => {
    // ユーザー設定APIから残り生成回数を取得
    // 暫定的に100に設定
    setRemainingGenerations(100)
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

  const handleSelectVariation = async (variation: PhraseVariation) => {
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

      const response = await fetch('/api/phrase', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          languageId: learningLang.id,
          text: desiredPhrase,
          translation: variation.text,
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
    <div className="min-h-screen bg-gray-50">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-2xl">
        {/* ページタイトル */}
        <div className="text-center mb-8">
          <h1 className="text-2xl font-bold text-gray-900 mb-2">AI Suggest</h1>
          <p className="text-gray-600">AIがあなたの話したいフレーズを提案します</p>
        </div>

        {/* 残り生成回数 */}
        <div className="bg-white p-4 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between">
            <span className="text-gray-700">残り生成回数</span>
            <span className="text-lg font-semibold text-blue-600">
              {remainingGenerations} / 100
            </span>
          </div>
        </div>

        {/* 言語選択 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <div className="flex items-center justify-between mb-4">
            <label className="text-sm font-medium text-gray-700">
              母国語
            </label>
            <select
              value={nativeLanguage}
              onChange={(e) => setNativeLanguage(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="ja">日本語</option>
              <option value="en">English</option>
            </select>
          </div>
          
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">
              学習言語
            </label>
            <select
              value={learningLanguage}
              onChange={(e) => setLearningLanguage(e.target.value)}
              className="border border-gray-300 rounded-md px-3 py-2 text-sm"
            >
              <option value="en">English</option>
              <option value="ja">日本語</option>
            </select>
          </div>
        </div>

        {/* フレーズ入力 */}
        <div className="bg-white p-6 rounded-lg shadow-sm mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            {nativeLanguage === 'ja' ? '知りたいフレーズを日本語で入力してください' : 'Enter the phrase you want to learn in English'}
          </label>
          
          <textarea
            value={desiredPhrase}
            onChange={(e) => setDesiredPhrase(e.target.value)}
            placeholder={nativeLanguage === 'ja' ? '例：トイレはどこにありますか？' : 'Example: Where is the restroom?'}
            className="w-full border border-gray-300 rounded-md px-3 py-2 text-sm resize-none"
            rows={3}
            maxLength={maxLength}
          />
          
          <div className="flex justify-between items-center mt-2">
            <span className="text-xs text-gray-500">
              {maxLength}文字以内で入力してください
            </span>
            <span className="text-xs text-gray-500">
              {desiredPhrase.length} / {maxLength}
            </span>
          </div>
        </div>

        {/* エラーメッセージ */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-md mb-6">
            {error}
          </div>
        )}

        {/* 生成ボタン */}
        <button
          onClick={handleGeneratePhrase}
          disabled={isLoading || !desiredPhrase.trim() || remainingGenerations <= 0}
          className="w-full bg-gray-700 text-white py-3 rounded-md font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-800 transition-colors duration-200 mb-8"
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
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              AI Suggested Phrases
            </h2>
            
            {generatedVariations.map((variation, index) => (
              <div key={index} className="bg-white p-6 rounded-lg shadow-sm border">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center">
                    <span className="text-lg mr-2">{typeIcons[variation.type]}</span>
                    <span className="font-medium text-gray-900">
                      {typeLabels[variation.type]}
                    </span>
                  </div>
                </div>
                
                <p className="text-gray-800 text-lg mb-4 leading-relaxed">
                  {variation.text}
                </p>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-gray-500">
                    {nativeLanguage === 'ja' ? '100文字以内で入力してください' : '120 / 100'}
                  </span>
                  
                  <button
                    onClick={() => handleSelectVariation(variation)}
                    disabled={isSaving}
                    className="bg-gray-700 text-white px-6 py-2 rounded-md text-sm font-medium hover:bg-gray-800 transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSaving ? '登録中...' : 'Select'}
                  </button>
                </div>
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
      </main>
    </div>
  )
}
