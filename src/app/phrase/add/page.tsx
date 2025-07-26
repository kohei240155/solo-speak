'use client'

import dynamic from 'next/dynamic'

// メインコンポーネントを動的インポートでSSRを無効化
const PhraseAddClient = dynamic(() => import('./PhraseAddClient'), { 
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
        <p className="mt-2 text-gray-600">Loading...</p>
      </div>
    </div>
  )
})

export default function PhraseAddPage() {
  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      <PhraseAddClient />
    </div>
  )
}
