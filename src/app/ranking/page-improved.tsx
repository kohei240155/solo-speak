import { Metadata } from 'next'
import { Suspense } from 'react'
import RankingClient from './ranking-client'
import LoadingSpinner from '@/components/LoadingSpinner'

export const metadata: Metadata = {
  title: 'Ranking - Solo Speak',
  description: 'ユーザーランキング - Solo Speak語学学習アプリで他のユーザーと競い合おう',
  keywords: ['ランキング', '競争', '学習順位', 'Solo Speak'],
}

// 静的なランキングページレイアウト（Server Component）
function RankingLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Ranking</h1>
        
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">学習ランキング</h2>
          <p className="text-gray-600 mb-4">
            Solo Speakユーザー同士で学習成果を競い合いましょう。
            継続的な学習でランキング上位を目指そう！
          </p>
        </div>
        
        {/* クライアントサイドが必要な部分を Suspense でラップ */}
        <Suspense fallback={
          <div className="bg-white rounded-lg shadow-md p-8">
            <LoadingSpinner message="Loading ranking data..." />
          </div>
        }>
          <RankingClient />
        </Suspense>
      </main>
    </div>
  )
}

export default RankingLayout
