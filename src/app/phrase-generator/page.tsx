'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'

export default function PhraseGeneratorRedirect() {
  const router = useRouter()

  useEffect(() => {
    // 新しいURLにリダイレクト
    router.replace('/phrase/add')
  }, [router])

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">リダイレクト中...</p>
      </div>
    </div>
  )
}
