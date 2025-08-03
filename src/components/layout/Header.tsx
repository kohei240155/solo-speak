'use client'

import { useState, useEffect, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import DropdownMenu from '../common/DropdownMenu'
import { BsClipboardData } from 'react-icons/bs'
import { LuSettings } from 'react-icons/lu'
import { MdLogout } from 'react-icons/md'

const Header = memo(function Header() {
  const { user, signOut, showLoginModal } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)

  // 表示するアイコンURL（シンプル化）
  const userIconUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture

  // ユーザーが変更された時の状態リセット
  useEffect(() => {
    if (!user) {
      setIsDropdownOpen(false)
      setIsMobileDropdownOpen(false)
    }
  }, [user])

  const handleSignOut = async () => {
    await signOut()
    setIsDropdownOpen(false)
    setIsMobileDropdownOpen(false)
  }

  // ドロップダウンメニューのアイテム（固定）
  const dropdownMenuItems = [
    {
      id: 'dashboard',
      label: 'ダッシュボード',
      icon: BsClipboardData,
      onClick: () => window.location.href = '/dashboard'
    },
    {
      id: 'settings',
      label: 'ユーザー設定',
      icon: LuSettings,
      onClick: () => window.location.href = '/settings'
    },
    {
      id: 'logout',
      label: 'ログアウト',
      icon: MdLogout,
      onClick: handleSignOut
    }
  ]

  const handleLoginClick = () => {
    showLoginModal()
  }

  // ロゴクリック時の処理
  const handleLogoClick = (e: React.MouseEvent) => {
    e.preventDefault()
    window.location.href = user ? '/phrase/list' : '/'
  }

  // デフォルトのユーザーアイコン
  const defaultUserIcon = (
    <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center border border-gray-300">
      <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
      </svg>
    </div>
  )

  return (
    <header className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            {user ? (
              <Link 
                href="/phrase/list" 
                className="flex items-center space-x-2" 
                onClick={handleLogoClick}
              >
                <Image
                  src="/images/logo/Solo Speak Logo.png"
                  alt="Solo Speak"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </Link>
            ) : (
              <div className="flex items-center space-x-2 cursor-default">
                <Image
                  src="/images/logo/Solo Speak Logo.png"
                  alt="Solo Speak"
                  width={150}
                  height={40}
                  className="h-8 w-auto"
                  priority
                />
              </div>
            )}
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center">
            {user ? (
              <DropdownMenu
                isOpen={isDropdownOpen}
                onToggle={() => setIsDropdownOpen(!isDropdownOpen)}
                onClose={() => setIsDropdownOpen(false)}
                items={dropdownMenuItems}
                position="bottom-right"
                width="w-48"
                zIndex={60}
                customTrigger={
                  userIconUrl ? (
                    <Image
                      src={userIconUrl}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    defaultUserIcon
                  )
                }
                triggerClassName="p-1 rounded-full hover:bg-gray-100"
              />
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#616161' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#525252'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#616161'
                }}
              >
                ログイン
              </button>
            )}
          </nav>

          {/* モバイルメニュー */}
          <div className="md:hidden">
            {user ? (
              <DropdownMenu
                isOpen={isMobileDropdownOpen}
                onToggle={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                onClose={() => setIsMobileDropdownOpen(false)}
                items={dropdownMenuItems}
                position="bottom-right"
                width="w-48"
                zIndex={60}
                customTrigger={
                  userIconUrl ? (
                    <Image
                      src={userIconUrl}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      priority
                    />
                  ) : (
                    defaultUserIcon
                  )
                }
                triggerClassName="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
              />
            ) : (
              <button
                onClick={handleLoginClick}
                className="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200"
                style={{ backgroundColor: '#616161' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#525252'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#616161'
                }}
              >
                ログイン
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
})

export default Header
