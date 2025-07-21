'use client'

import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import AuthGuard from '@/components/AuthGuard'
import { supabase } from '@/utils/spabase'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Image from 'next/image'

interface RankingUser {
  userId: string
  username: string
  iconUrl: string | null
  totalCount: number
  rank: number
}

export default function RankingPage() {
  const { user, loading } = useAuth()
  const [rankingData, setRankingData] = useState<RankingUser[]>([])
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0])
  const [isLoading, setIsLoading] = useState(false)
  const [currentUserRank, setCurrentUserRank] = useState<RankingUser | null>(null)

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

  const handleDateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDate(event.target.value)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="flex items-center justify-center h-screen">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      </div>
    )
  }

  return (
    <AuthGuard user={user} loading={loading}>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Toaster position="top-center" />
        
        {/* Header */}
        <div className="bg-white shadow-sm border-b">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <h1 className="text-2xl font-bold text-gray-900">音読ランキング</h1>
              
              {/* 日付選択 */}
              <div className="flex items-center gap-2">
                <label htmlFor="date" className="text-sm font-medium text-gray-700">
                  日付:
                </label>
                <input
                  type="date"
                  id="date"
                  value={selectedDate}
                  onChange={handleDateChange}
                  className="px-3 py-2 border border-gray-300 rounded-md focus:ring-blue-500 focus:border-blue-500"
                  max={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto px-4 py-8">
          {/* 自分の順位表示 */}
          {currentUserRank && (
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
              <h2 className="text-lg font-semibold text-blue-800 mb-2">あなたの順位</h2>
              <div className="flex items-center gap-3">
                <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                  <span className="text-blue-800 font-bold">{currentUserRank.rank}</span>
                </div>
                <div>
                  <p className="font-medium text-blue-900">{currentUserRank.username}</p>
                  <p className="text-sm text-blue-700">{currentUserRank.totalCount}回音読</p>
                </div>
              </div>
            </div>
          )}

          {/* ランキングリスト */}
          <div className="bg-white rounded-lg shadow-md overflow-hidden">
            <div className="bg-gray-50 px-6 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">
                {selectedDate}のランキング
              </h2>
            </div>

            {isLoading ? (
              <div className="px-6 py-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                <p className="mt-2 text-gray-600">読み込み中...</p>
              </div>
            ) : rankingData.length === 0 ? (
              <div className="px-6 py-8 text-center text-gray-500">
                この日のデータがありません
              </div>
            ) : (
              <div className="divide-y divide-gray-200">
                {rankingData.map((rankUser) => (
                  <div
                    key={rankUser.userId}
                    className={`px-6 py-4 flex items-center gap-4 ${
                      rankUser.userId === user?.id ? 'bg-blue-50' : 'hover:bg-gray-50'
                    }`}
                  >
                    {/* 順位 */}
                    <div className="flex items-center justify-center w-10 h-10">
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

                    {/* アイコン */}
                    <div className="w-10 h-10 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                      {rankUser.iconUrl ? (
                        <Image
                          src={rankUser.iconUrl}
                          alt={rankUser.username}
                          width={40}
                          height={40}
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

                    {/* ユーザー名 */}
                    <div className="flex-grow">
                      <p className="font-medium text-gray-900">{rankUser.username}</p>
                    </div>

                    {/* 回数 */}
                    <div className="text-right">
                      <p className="font-bold text-lg text-blue-600">{rankUser.totalCount}</p>
                      <p className="text-sm text-gray-500">回</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  )
}
