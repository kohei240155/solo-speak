'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/utils/spabase'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Image from 'next/image'
import LanguageSelector from '@/components/LanguageSelector'

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

export default function RankingPage() {
  const { user, loading } = useAuth()
  const [rankingData, setRankingData] = useState<RankingUser[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [activeTab, setActiveTab] = useState('Daily')
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

  const fetchRanking = useCallback(async (date: string) => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        toast.error('認証情報が見つかりません。')
        return
      }

      const response = await fetch(`/api/ranking/daily?date=${date}`, {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })

      if (!response.ok) {
        throw new Error('Failed to fetch ranking')
      }

      const data = await response.json()
      
      if (data.success) {
        setRankingData(data.data)
        
        // 現在のユーザーのランクを検索
        const userRank = data.data.find((rankUser: RankingUser) => rankUser.userId === user.id)
        setCurrentUserRank(userRank || null)
      } else {
        toast.error('ランキングデータの取得に失敗しました')
      }
    } catch (error) {
      console.error('Error fetching ranking:', error)
      toast.error('ランキングデータの取得中にエラーが発生しました')
    } finally {
      setIsLoading(false)
    }
  }, [user])

  useEffect(() => {
    if (user) {
      fetchRanking(selectedDate)
    }
  }, [user, selectedDate, fetchRanking])

  const handleLanguageChange = (languageCode: string) => {
    setSelectedLanguage(languageCode)
  }

  if (loading) {
    return (
      <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
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
                  // タブのクリック処理（将来的に実装）
                  console.log(`${tab.key} tab clicked`)
                }}
                className={`flex-1 py-2 text-sm md:text-base border border-gray-300 ${
                  index === 0 ? 'rounded-l-[20px]' : ''
                } ${
                  index === 2 ? 'rounded-r-[20px]' : ''
                } ${
                  index > 0 ? 'border-l-0' : ''
                } ${
                  tab.key === 'Phrase' 
                    ? 'bg-gray-200 text-gray-700 font-bold cursor-default' 
                    : 'bg-white text-gray-700 font-normal cursor-pointer hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* コンテンツエリア */}
          <div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
            {/* Daily/Weekly/Totalタブメニュー */}
            <div className="mb-6 border-b border-gray-200">
              <nav className="flex space-x-0">
                {['Daily', 'Weekly', 'Total'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-3 text-base md:text-lg font-bold border-b-2 transition-colors duration-200 ${
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

            {/* ランキングテーブル */}
            <div className="overflow-hidden">
              <div className="mb-4">
                <div className="grid grid-cols-3 gap-4 text-base md:text-lg font-bold text-gray-900 pb-2">
                  <div>Rank</div>
                  <div>User</div>
                  <div className="text-right">Count</div>
                </div>
              </div>

              {isLoading ? (
                <div className="py-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">読み込み中...</p>
                </div>
              ) : rankingData.length === 0 ? (
                <div className="py-8 text-center text-gray-500">
                  この日のデータがありません
                </div>
              ) : (
                <div className="space-y-3">
                  {rankingData.map((rankUser) => (
                    <div
                      key={rankUser.userId}
                      className={`grid grid-cols-3 gap-4 py-3 px-2 rounded-lg ${
                        rankUser.userId === user?.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* 順位 */}
                      <div className="flex items-center">
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
                      <div className="flex items-center gap-2 -ml-4">
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
                      <div className="text-right">
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
