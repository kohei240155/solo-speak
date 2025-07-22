import { Metadata } from 'next'
import { Suspense } from 'react'
import DashboardClient from './dashboard-client'
import LoadingSpinner from '@/components/LoadingSpinner'

export const metadata: Metadata = {
  title: 'Dashboard - Solo Speak',
  description: '学習進捗とダッシュボード - Solo Speak語学学習アプリ',
}

// 静的なダッシュボードレイアウト（Server Component）
function DashboardLayout() {
  return (
    <div className="min-h-screen bg-gray-50">
      <main className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Dashboard</h1>
        
        {/* クライアントサイドが必要な部分を Suspense でラップ */}
        <Suspense fallback={
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow-md p-8">
              <LoadingSpinner message="Loading dashboard data..." />
            </div>
          </div>
        }>
          <DashboardClient />
        </Suspense>
      </main>
    </div>
  )
}

export default DashboardLayout
