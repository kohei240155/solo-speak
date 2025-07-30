'use client'

import { useAuth } from '@/contexts/AuthContext'
import { Toaster } from 'react-hot-toast'
import toast from 'react-hot-toast'
import Image from 'next/image'
import LanguageSelector from '@/components/common/LanguageSelector'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useRankingData } from '@/hooks/useRankingData'
import { useEffect } from 'react'

export default function RankingPage() {
  const { user, loading } = useAuth()
  
  // カスタムフックを使用してランキングデータを管理
  const {
    selectedLanguage,
    activeTab,
    activeRankingType,
    languages,
    rankingData,
    currentUser,
    isLoading,
    error,
    message,
    handleLanguageChange,
    handleTabChange,
    handleRankingTypeChange,
  } = useRankingData()

  // エラーハンドリング
  useEffect(() => {
    if (error && message) {
      toast.error(message)
    }
  }, [error, message])

  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="max-w-2xl mx-auto pt-[18px] pb-8 px-2 sm:px-4 md:px-6">
          <Toaster />
          
          {/* Ranking タイトルと言語選択を同じ行に配置 */}
          <div className="flex justify-between items-center mb-[18px]">
            <h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
              Ranking
            </h1>
            
            <LanguageSelector
              learningLanguage={selectedLanguage}
              onLanguageChange={handleLanguageChange}
              languages={languages || []}
              nativeLanguage="ja"
            />
          </div>
          
          {/* Phrase、Speak、Quizタブメニュー */}
          <div className="flex mb-[18px]">
            {[
              { key: 'phrase' as const, label: 'Phrase' },
              { key: 'speak' as const, label: 'Speak' },
              { key: 'quiz' as const, label: 'Quiz' }
            ].map((tab, index) => (
              <button 
                key={tab.key}
                onClick={() => {
                  handleRankingTypeChange(tab.key)
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
          <div className="bg-white rounded-lg shadow-md pt-4 pb-8 px-3 sm:px-6 md:px-8">
            {/* Daily/Weekly/Totalタブメニュー（Phraseの場合はTotalのみ表示） */}
            {activeRankingType === 'phrase' ? (
              <div className="mb-4 border-b border-gray-200">
                <nav className="flex space-x-0">
                  <button
                    className="px-3 sm:px-6 py-2 text-sm sm:text-base md:text-lg font-bold border-b-2 border-gray-900 text-gray-900"
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
                      onClick={() => handleTabChange(tab)}
                      className={`px-3 sm:px-6 py-2 text-sm sm:text-base md:text-lg font-bold border-b-2 transition-colors duration-200 ${
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
            <div className="overflow-hidden px-2 sm:px-4 md:px-8">
              <div className="mb-2">
                <div className="grid grid-cols-[40px_1fr_60px] sm:grid-cols-[50px_1fr_70px] gap-2 text-sm sm:text-base md:text-lg font-bold text-gray-900 pb-2">
                  <div className="text-left pl-2">Rank</div>
                  <div className="text-left ml-8 sm:ml-12">User</div>
                  <div className="text-right pr-2">Count</div>
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
                      className={`grid grid-cols-[40px_1fr_60px] sm:grid-cols-[50px_1fr_70px] gap-2 py-2 sm:py-3 px-1 sm:px-2 rounded-lg ${
                        rankUser.userId === user?.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                      }`}
                    >
                      {/* 順位 */}
                      <div className="flex items-center justify-center">
                        {rankUser.rank <= 3 ? (
                          <div
                            className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm ${
                              rankUser.rank === 1
                                ? 'bg-yellow-500'
                                : rankUser.rank === 2
                                ? 'bg-gray-400'
                                : 'bg-orange-800'
                            }`}
                            style={rankUser.rank === 3 ? { backgroundColor: '#B87333' } : {}}
                          >
                            {rankUser.rank}
                          </div>
                        ) : (
                          <span className="text-gray-600 font-medium text-sm sm:text-base">{rankUser.rank}</span>
                        )}
                      </div>

                      {/* ユーザー */}
                      <div className="flex items-center gap-1 sm:gap-2 ml-6 sm:ml-10 min-w-0">
                        <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
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
                        <p className="font-medium text-gray-900 truncate text-sm sm:text-base min-w-0 flex-1">
                          {rankUser.username.length > 20 
                            ? `${rankUser.username.substring(0, 20)}...` 
                            : rankUser.username
                          }
                        </p>
                      </div>

                      {/* 回数 */}
                      <div className="flex items-center justify-end pr-2">
                        <p className="font-bold text-sm sm:text-lg text-gray-900">{rankUser.totalCount}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* 51位以降のユーザー表示 */}
              {!isLoading && currentUser && currentUser.rank > 50 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="mb-2">
                    <p className="text-sm text-gray-600 font-medium">Your Ranking</p>
                  </div>
                  <div
                    className="grid grid-cols-[40px_1fr_60px] sm:grid-cols-[50px_1fr_70px] gap-2 py-2 sm:py-3 px-1 sm:px-2 rounded-lg bg-blue-50 border border-blue-200"
                  >
                    {/* 順位 */}
                    <div className="flex items-center justify-center">
                      <span className="text-gray-600 font-medium text-sm sm:text-base">{currentUser.rank}</span>
                    </div>

                    {/* ユーザー */}
                    <div className="flex items-center gap-1 sm:gap-2 ml-6 sm:ml-10 min-w-0">
                      <div className="w-6 h-6 sm:w-8 sm:h-8 bg-gray-200 rounded-full overflow-hidden flex-shrink-0">
                        {currentUser.iconUrl ? (
                          <Image
                            src={currentUser.iconUrl}
                            alt={currentUser.username}
                            width={32}
                            height={32}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full bg-gray-300 flex items-center justify-center">
                            <span className="text-gray-600 text-xs">
                              {currentUser.username.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        )}
                      </div>
                      <p className="font-medium text-gray-900 truncate text-sm sm:text-base min-w-0 flex-1">
                        {currentUser.username.length > 20 
                          ? `${currentUser.username.substring(0, 20)}...` 
                          : currentUser.username
                        }
                      </p>
                    </div>

                    {/* 回数 */}
                    <div className="flex items-center justify-end pr-2">
                      <p className="font-bold text-sm sm:text-lg text-gray-900">{currentUser.totalCount}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
  )
}
