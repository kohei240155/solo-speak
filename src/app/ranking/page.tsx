'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/utils/spabase'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Image from 'next/image'
import LanguageSelector from '@/components/LanguageSelector'
import LoadingSpinner from '@/components/LoadingSpinner'

interface RankingUser {
  userId: string
  username: string
  iconUrl: string | null
  totalCount: number
  rank: number
}

interface Language {
  id: string
  name: string
  code: string
}

interface SpeakUser {
  rank: number
  userId: string
  username: string
  iconUrl: string | null
  count: number
}

export default function RankingPage() {
  const { user, loading } = useAuth()
  const [rankingData, setRankingData] = useState<RankingUser[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Daily')
  const [activeRankingType, setActiveRankingType] = useState('Phrase') // デフォルトをPhraseに変更
  const [languages, setLanguages] = useState<Language[]>([])
  const [selectedLanguage, setSelectedLanguage] = useState('en')

  // 言語データの取得
  useEffect(() => {
    const fetchLanguages = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        
        if (!session) return

        const response = await fetch('/api/languages', {
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })

        if (response.ok) {
          const data = await response.json()
          // APIは直接言語配列を返すか、フォールバックデータを返す
          if (Array.isArray(data)) {
            setLanguages(data)
          } else if (data.success && data.languages) {
            setLanguages(data.languages)
          }
        }
      } catch (error) {
        console.error('Error fetching languages:', error)
      }
    }

    if (user) {
      fetchLanguages()
    }
  }, [user])

  const fetchRanking = useCallback(async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。')
        return
      }

      let endpoint = ''
      if (activeRankingType === 'Phrase') {
        // Phraseランキングは期間指定なし（総合のみ）
        endpoint = `/api/ranking/phrase?language=${selectedLanguage}`
      } else if (activeRankingType === 'Speak') {
        const period = activeTab.toLowerCase() // daily, weekly, total
        endpoint = `/api/ranking/speak?language=${selectedLanguage}&period=${period}`
      } else if (activeRankingType === 'Quiz') {
        const period = activeTab.toLowerCase() // daily, weekly, total
        endpoint = `/api/ranking/quiz?language=${selectedLanguage}&period=${period}`
      }

      if (!endpoint) {
        toast.error(`${activeRankingType}のランキングはまだ実装されていません`)
        return
      }

      console.log('Fetching ranking:', { activeRankingType, activeTab, endpoint })

      const response = await fetch(endpoint, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      console.log('Response status:', response.status, response.statusText)

      if (!response.ok) {
        // エラーレスポンスの詳細を取得
        let errorMessage = `Failed to fetch ranking: ${response.status} ${response.statusText}`
        try {
          const errorData = await response.json()
          console.error('Error response:', errorData)
          errorMessage = errorData.message || errorData.error || errorMessage
        } catch {
          console.error('Failed to parse error response')
        }

        if (response.status === 404) {
          toast.error(`${activeRankingType}ランキングのAPIが見つかりません`)
        } else {
          toast.error(`エラー: ${errorMessage}`)
        }
        return
      }

      const data = await response.json()
      console.log('API Response:', data)
      
      if (data.success) {
        if (activeRankingType === 'Speak') {
          // Speak APIの形式に合わせてデータを変換
          if (data.topUsers && Array.isArray(data.topUsers)) {
            const transformedData = data.topUsers.map((user: SpeakUser) => ({
              userId: user.userId,
              username: user.username,
              iconUrl: user.iconUrl,
              totalCount: user.count,
              rank: user.rank
            }))
            setRankingData(transformedData)
          } else {
            setRankingData([])
            toast.error('Speakランキングデータの形式が正しくありません')
          }
        } else if (activeRankingType === 'Phrase') {
          // Phrase APIの形式に合わせてデータを変換
          if (data.topUsers && Array.isArray(data.topUsers)) {
            const transformedData = data.topUsers.map((user: SpeakUser) => ({
              userId: user.userId,
              username: user.username,
              iconUrl: user.iconUrl,
              totalCount: user.count,
              rank: user.rank
            }))
            setRankingData(transformedData)
          } else {
            setRankingData([])
            toast.error('Phraseランキングデータの形式が正しくありません')
          }
        } else if (activeRankingType === 'Quiz') {
          // Quiz APIの形式に合わせてデータを変換
          if (data.topUsers && Array.isArray(data.topUsers)) {
            const transformedData = data.topUsers.map((user: SpeakUser) => ({
              userId: user.userId,
              username: user.username,
              iconUrl: user.iconUrl,
              totalCount: user.count,
              rank: user.rank
            }))
            setRankingData(transformedData)
          } else {
            setRankingData([])
            toast.error('Quizランキングデータの形式が正しくありません')
          }
        }
      } else {
        toast.error(data.message || 'ランキングデータの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching ranking:', error)
      toast.error('ランキングデータの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [user, activeRankingType, activeTab, selectedLanguage])

  useEffect(() => {
    if (user) {
      fetchRanking()
    }
  }, [user, fetchRanking, activeRankingType, activeTab, selectedLanguage])

  // Phraseタブに切り替えた時は自動的にTotalタブにする
  // SpeakタブとQuizタブに切り替えた時は自動的にDailyタブにする
  useEffect(() => {
    if (activeRankingType === 'Phrase') {
      setActiveTab('Total')
    } else if (activeRankingType === 'Speak' || activeRankingType === 'Quiz') {
      setActiveTab('Daily')
    }
  }, [activeRankingType])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  return (
    <AuthGuard user={user} loading={loading}>
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
          <Toaster />
          
          {/* Ranking タイトルと言語選択を同じ行に配置 */}
          <div className="flex justify-between items-center mb-[18px]">
            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Ranking
            </h1>
            
            <LanguageSelector
              learningLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              languages={languages}
              nativeLanguage="ja"
            />
          </div>
          
          {/* Phrase、Speak、Quizタブメニュー */}
          <div className="flex mb-[18px]">
            {[
              { key: 'Phrase', label: 'Phrase' },
              { key: 'Speak', label: 'Speak' },
              { key: 'Quiz', label: 'Quiz' }
            ].map((tab, index) => (
              <button 
                key={tab.key}
                onClick={() => {
                  setActiveRankingType(tab.key)
                }}
                className={`flex-1 py-2 text-sm md:text-base border border-gray-300 ${
                  index === 0 ? 'rounded-l-[20px]' : ''
                } ${
                  index === 2 ? 'rounded-r-[20px]' : ''
                } ${
                  index > 0 ? 'border-l-0' : ''
                } ${
                  tab.key === activeRankingType 
                    ? 'bg-gray-200 text-gray-700 font-bold cursor-default' 
                    : 'bg-white text-gray-700 font-normal cursor-pointer hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md pt-4 pb-8 px-8 sm:pt-4 sm:pb-10 sm:px-10">
            {/* Daily/Weekly/Totalタブメニュー（Phraseの場合はTotalのみ表示） */}
            {activeRankingType === 'Phrase' ? (
              <div className="mb-4 border-b border-gray-200">
                <nav className="flex space-x-0">
                  <button
                    className="px-6 py-2 text-base md:text-lg font-bold border-b-2 border-gray-900 text-gray-900"
                  >
                    Total
                  </button>
                </nav>
              </div>
            ) : (
              <div className="mb-4 border-b border-gray-200">
                <nav className="flex space-x-0">
                  {['Daily', 'Weekly', 'Total'].map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveTab(tab)}
                      className={`px-6 py-2 text-base md:text-lg font-bold border-b-2 transition-colors duration-200 ${
                        activeTab === tab
                          ? 'border-gray-900 text-gray-900'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </nav>
              </div>
            )}

            {/* ランキングテーブル */}
            <div className="overflow-hidden px-8">
              <div className="mb-2">
                <div className="grid grid-cols-[50px_1fr_50px] gap-2 text-base md:text-lg font-bold text-gray-900 pb-2">
                  <div className="text-left">Rank</div>
                  <div className="text-left ml-12">User</div>
                  <div className="text-right">Count</div>
                </div>
              </div>

              {isLoading ? (
                <LoadingSpinner message="Loading..." className="py-8" />
              ) : rankingData.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  表示対象のデータがありません
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingData.map((rankUser) => (
                    <div
                      key={rankUser.userId}
                      className={`grid grid-cols-[50px_1fr_50px] gap-2 py-3 px-2 rounded-lg ${
                        rankUser.userId === user?.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* 順位 */}
                      <div className="flex items-center justify-start">
                        {rankUser.rank <= 3 ? (
                          <div
                            className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold text-sm ${
                              rankUser.rank === 1
                                ? 'bg-yellow-500'
                                : rankUser.rank === 2
                                ? 'bg-gray-400'
                                : 'bg-orange-600'
                            }`}
                          >
                            {rankUser.rank}
                          </div>
                        ) : (
                          <span className="text-gray-600 font-medium">{rankUser.rank}</span>
                        )}
                      </div>

                      {/* ユーザー */}
                      <div className="flex items-center gap-2 ml-10">
                        <div className="w-8 h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                          {rankUser.iconUrl ? (
                            <Image
                              src={rankUser.iconUrl}
                              alt={rankUser.username}
                              width={32}
                              height={32}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                              <span className="text-gray-600 text-xs">
                                {rankUser.username.charAt(0).toUpperCase()}
                              </span>
                            </div>
                          )}
                        </div>
                        <p className="font-medium text-gray-900 truncate">{rankUser.username}</p>
                      </div>

                      {/* 回数 */}
                      <div className="flex items-center justify-end">
                        <p className="font-bold text-lg text-gray-900">{rankUser.totalCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
