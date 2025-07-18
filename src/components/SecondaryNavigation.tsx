'use client'

import { usePathname } from 'next/navigation'
import Link from 'next/link'

export default function SecondaryNavigation() {
  const pathname = usePathname()

  // フレーズ関連のページでのみ表示
  const showSecondaryNav = pathname?.startsWith('/phrase/')

  if (!showSecondaryNav) {
    return null
  }

  return (
    <div className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex space-x-8">
          <span 
            className={`py-3 px-1 border-b-2 font-medium text-[15px] lg:text-[16px] ${
              pathname === '/phrase' || pathname?.startsWith('/phrase/')
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500'
            }`}
          >
            Phrase
          </span>
          <Link 
            href="/ranking"
            className={`py-3 px-1 border-b-2 font-medium text-[15px] lg:text-[16px] ${
              pathname === '/ranking'
                ? 'border-gray-900 text-gray-900'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Ranking
          </Link>
        </div>
      </div>
    </div>
  )
}
