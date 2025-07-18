'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { RiSpeakLine } from 'react-icons/ri'
import { IoCheckboxOutline } from 'react-icons/io5'
import { BiCalendarAlt } from 'react-icons/bi'
import { HiOutlineEllipsisHorizontalCircle } from 'react-icons/hi2'

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

interface SavedPhrase {
  id: string
  text: string
  translation: string
  createdAt: string
  practiceCount: number
  correctAnswers: number
  language: {
    name: string
    code: string
  }
}

export default function PhraseAddPage() {
  const { user } = useAuth()
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [desiredPhrase, setDesiredPhrase] = useState('明日花火に行きたい')
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState(0)
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedVariation, setSelectedVariation] = useState<PhraseVariation | null>(null)
  const [isSaving, setIsSaving] = useState(false)
  const [editingVariations, setEditingVariations] = useState<{[key: number]: string}>({})
  const [activeTab, setActiveTab] = useState<'List' | 'Add' | 'Speak' | 'Quiz'>('List')
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([])
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true)
  const [hasMorePhrases, setHasMorePhrases] = useState(true)
  const [phrasePage, setPhrasePage] = useState(1)

  // 正解数に応じて縦線の色を決定する関数
  const getBorderColor = (correctAnswers: number) => {
    if (correctAnswers === 0) return '#D9D9D9'
    if (correctAnswers <= 1) return '#BFBFBF'
    if (correctAnswers <= 3) return '#A6A6A6'
    if (correctAnswers <= 5) return '#8C8C8C'
    if (correctAnswers <= 10) return '#737373'
    if (correctAnswers <= 20) return '#595959'
    if (correctAnswers <= 30) return '#404040'
    return '#404040' // 30以上の場合
  }

  useEffect(() => {
    // 言語一覧を取得
    fetchLanguages()
  }, [])

  const fetchLanguages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('認証情報が見つかりません')
        return
      }

      const response = await fetch('/api/languages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
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

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const response = await fetch(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const phrases = Array.isArray(data.phrases) ? data.phrases : []
        
        if (append) {
          setSavedPhrases(prev => [...prev, ...phrases])
        } else {
          setSavedPhrases(phrases)
        }
        
        setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
        setPhrasePage(page)
      }
    } catch (error) {
      console.error('Error fetching saved phrases:', error)
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage])

  useEffect(() => {
    // ユーザーの残り生成回数を取得
    if (user) {
      fetchUserRemainingGenerations()
      fetchUserSettings()
      fetchSavedPhrases(1, false)
    }
  }, [user, fetchSavedPhrases])

  // 学習言語が変更されたときにフレーズを再取得
  useEffect(() => {
    if (user && activeTab === 'List') {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, activeTab, user, fetchSavedPhrases])

  // 無限スクロール機能
  useEffect(() => {
    if (activeTab !== 'List') return

    const handleScroll = () => {
      if (window.innerHeight + document.documentElement.scrollTop >= document.documentElement.offsetHeight - 100) {
        if (hasMorePhrases && !isLoadingPhrases && user) {
          fetchSavedPhrases(phrasePage + 1, true)
        }
      }
    }

    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [activeTab, hasMorePhrases, isLoadingPhrases, phrasePage, user, fetchSavedPhrases])

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
      // 固定のフレーズを返す（テスト用）
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機でAPIっぽく見せる
      
      const mockVariations = [
        {
          type: 'common' as const,
          text: 'I want to go see the fireworks tomorrow.',
          explanation: '一般的な表現'
        },
        {
          type: 'polite' as const,
          text: "I would like to go see the fireworks tomorrow, if that's alright.",
          explanation: '丁寧な表現'
        },
        {
          type: 'casual' as const,
          text: 'I wanna hit up the fireworks tomorrow!',
          explanation: 'カジュアルな表現'
        }
      ]
      
      setGeneratedVariations(mockVariations)
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
          level: variation.type, // フレーズのレベル（common, polite, casual）を追加
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'フレーズの登録に失敗しました')
      }

      setSelectedVariation(variation)
      // フレーズ保存後、Listタブに移動
      setActiveTab('List')
      // 保存されたフレーズリストを再取得
      fetchSavedPhrases(1, false)

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
              className="appearance-none bg-white border border-gray-300 rounded-md px-4 py-1 pr-10 text-base md:text-lg focus:outline-none focus:ring-2 focus:ring-blue-500 min-w-[140px] md:min-w-[160px]"
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
          <button 
            onClick={() => setActiveTab('List')}
            className={`flex-1 py-2 text-sm md:text-base rounded-l-[20px] border border-gray-300 ${
              activeTab === 'List' ? 'bg-gray-200 text-gray-700 font-bold' : 'bg-white text-gray-700 font-normal'
            }`}
          >
            List
          </button>
          <button 
            onClick={() => setActiveTab('Add')}
            className={`flex-1 py-2 text-sm md:text-base border border-l-0 border-gray-300 ${
              activeTab === 'Add' ? 'bg-gray-200 text-gray-700 font-bold' : 'bg-white text-gray-700 font-normal'
            }`}
          >
            Add
          </button>
          <button 
            onClick={() => setActiveTab('Speak')}
            className={`flex-1 py-2 text-sm md:text-base border border-l-0 border-gray-300 ${
              activeTab === 'Speak' ? 'bg-gray-200 text-gray-700 font-bold' : 'bg-white text-gray-700 font-normal'
            }`}
          >
            Speak
          </button>
          <button 
            onClick={() => setActiveTab('Quiz')}
            className={`flex-1 py-2 text-sm md:text-base rounded-r-[20px] border border-l-0 border-gray-300 ${
              activeTab === 'Quiz' ? 'bg-gray-200 text-gray-700 font-bold' : 'bg-white text-gray-700 font-normal'
            }`}
          >
            Quiz
          </button>
        </div>

        {/* コンテンツエリア */}
        {activeTab === 'List' ? (
          <div>
            {isLoadingPhrases ? (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="mt-2 text-gray-600">Loading phrases...</p>
              </div>
            ) : !Array.isArray(savedPhrases) || savedPhrases.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">まだフレーズが登録されていません</p>
              </div>
            ) : (
              <div className="space-y-4">
                {savedPhrases.map((phrase) => (
                  <div 
                    key={phrase.id} 
                    className="pl-4 pr-6 py-6 bg-white shadow-md"
                    style={{ 
                      borderLeft: `4px solid ${getBorderColor(phrase.correctAnswers || 0)}`,
                      borderRadius: '5px'
                    }}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="text-base font-medium text-gray-900">
                        {phrase.translation}
                      </div>
                      <button className="text-gray-900 hover:text-gray-700">
                        <HiOutlineEllipsisHorizontalCircle className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="text-sm text-gray-900 mb-3">
                      {phrase.text}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-900">
                      <div className="flex items-center space-x-4">
                        <span className="flex items-center">
                          <RiSpeakLine className="w-4 h-4 mr-1" />
                          {phrase.practiceCount || 0}
                        </span>
                        <span className="flex items-center">
                          <IoCheckboxOutline className="w-4 h-4 mr-1" />
                          {phrase.correctAnswers || 0}
                        </span>
                      </div>
                      <div className="flex items-center">
                        <BiCalendarAlt className="w-4 h-4 mr-1" />
                        {new Date(phrase.createdAt).toLocaleDateString('ja-JP', { 
                          year: 'numeric', 
                          month: 'numeric', 
                          day: 'numeric' 
                        })}
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* 無限スクロール用のローディング */}
                {isLoadingPhrases && savedPhrases.length > 0 && (
                  <div className="text-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-gray-900 mx-auto"></div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {activeTab === 'Add' && (
              <>
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
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg md:text-xl font-bold text-gray-900">
                        AI Suggested Phrases
                      </h3>
                      <button
                        onClick={() => setEditingVariations({})}
                        className="text-sm text-blue-600 hover:text-blue-800 font-medium px-3 py-1 rounded-md hover:bg-blue-50 transition-colors duration-200"
                      >
                        Reset
                      </button>
                    </div>
                    
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
              </>
            )}

            {activeTab === 'Speak' && (
              <div className="text-center py-8">
                <p className="text-gray-600">Speak機能は準備中です</p>
              </div>
            )}

            {activeTab === 'Quiz' && (
              <div className="text-center py-8">
                <p className="text-gray-600">Quiz機能は準備中です</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
