'use client'

import { useState, useEffect, memo, useMemo, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import DropdownMenu from '../common/DropdownMenu'
import { DisplayLanguageSelector } from '../common/DisplayLanguageSelector'
import { BsClipboardData } from 'react-icons/bs'
import { LuSettings } from 'react-icons/lu'
import { MdLogout } from 'react-icons/md'

const Header = memo(function Header() {
  const { user, signOut, userIconUrl, isUserSetupComplete, refreshUserSettings, showLoginModal } = useAuth()
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)

  // 表示するアイコンURLを決定（フォールバック機能付き）
  const getDisplayIconUrl = useMemo(() => {
    if (userIconUrl) {
      return userIconUrl
    }
    
    // AuthContextでまだロードされていない場合でも、Googleアバターがあればそれを使用
    const googleAvatarUrl = user?.user_metadata?.avatar_url || user?.user_metadata?.picture
    if (!googleAvatarUrl) {
      return null
    }
    
    if (googleAvatarUrl.includes('googleusercontent.com') || 
        googleAvatarUrl.includes('googleapis.com') || 
        googleAvatarUrl.includes('google.com')) {
      return googleAvatarUrl
    }
    
    return null
  }, [userIconUrl, user?.user_metadata?.avatar_url, user?.user_metadata?.picture])

  // ユーザーが変更された時の状態リセット
  useEffect(() => {
    if (!user) {
      // ユーザーがログアウトした場合
      setIsDropdownOpen(false)
      setIsMobileDropdownOpen(false)
    }
  }, [user]) // ユーザーオブジェクト全体が変更されたときに実行

  const handleSignOut = useCallback(async () => {
    await signOut()
    setIsDropdownOpen(false)
    setIsMobileDropdownOpen(false)
  }, [signOut])

  // ドロップダウンメニューのアイテムを生成
  const getDropdownMenuItems = useMemo(() => {
    const items = []
    
    if (isUserSetupComplete) {
      items.push(
        {
          id: 'dashboard',
          label: 'Dashboard',
          icon: BsClipboardData,
          onClick: () => window.location.href = '/dashboard'
        },
        {
          id: 'settings',
          label: 'User Settings',
          icon: LuSettings,
          onClick: () => window.location.href = '/settings'
        }
      )
    }
    
    items.push({
      id: 'logout',
      label: 'Logout',
      icon: MdLogout,
      onClick: handleSignOut
    })
    
    return items
  }, [isUserSetupComplete, handleSignOut])

  const handleLoginClick = () => {
    showLoginModal()
  }

  const handleImageError = () => {
    // AuthContextでエラーハンドリングを行うため、ここでは何もしない
  }

  // ロゴクリック時の処理
  const handleLogoClick = async (e: React.MouseEvent) => {
    // 未ログイン状態の場合はクリックを無効化
    if (!user) {
      e.preventDefault()
      return
    }
    
    e.preventDefault()
    
    // ログインしている場合はフレーズ一覧へ
    if (user) {
      window.location.href = '/phrase/list'
    }
  }

  // カスタムイベントでユーザー設定の更新を監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      if (user?.id) {
        refreshUserSettings()
      }
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    }
  }, [user?.id, refreshUserSettings])

  // デフォルトのユーザーアイコン（ImageUploadコンポーネントと同じスタイル）を生成
  const getDefaultUserIcon = useMemo(() => {
    return (
      <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center border border-gray-300">
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }, [])

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
                items={getDropdownMenuItems}
                position="bottom-right"
                width="w-48"
                zIndex={60}
                customTrigger={
                  getDisplayIconUrl ? (
                    <Image
                      src={getDisplayIconUrl}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      onError={handleImageError}
                      priority
                    />
                  ) : (
                    getDefaultUserIcon
                  )
                }
                triggerClassName="p-1 rounded-full hover:bg-gray-100"
              />
            ) : (
              <div className="flex items-center space-x-4">
                {/* 未ログイン時の言語選択 */}
                <DisplayLanguageSelector />
                
                <button
                  onClick={handleLoginClick}
                  className="text-white px-4 py-2 rounded-md text-sm font-medium transition-colors duration-200 w-[100px] flex items-center justify-center"
                  style={{ backgroundColor: '#616161' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#525252'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#616161'
                  }}
                >
                  Login
                </button>
              </div>
            )}
          </nav>

          {/* モバイルメニュー */}
          <div className="md:hidden">
            {user ? (
              <DropdownMenu
                isOpen={isMobileDropdownOpen}
                onToggle={() => setIsMobileDropdownOpen(!isMobileDropdownOpen)}
                onClose={() => setIsMobileDropdownOpen(false)}
                items={getDropdownMenuItems}
                position="bottom-right"
                width="w-48"
                zIndex={60}
                customTrigger={
                  getDisplayIconUrl ? (
                    <Image
                      src={getDisplayIconUrl}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      onError={handleImageError}
                      priority
                    />
                  ) : (
                    getDefaultUserIcon
                  )
                }
                triggerClassName="p-2 rounded-full hover:bg-gray-100 touch-manipulation"
              />
            ) : (
              <div className="flex items-center space-x-3">
                {/* 未ログイン時の言語選択（モバイル版） */}
                <DisplayLanguageSelector />
                
                <button
                  onClick={handleLoginClick}
                  className="text-white px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 w-[85px] flex items-center justify-center"
                  style={{ backgroundColor: '#616161' }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#525252'
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#616161'
                  }}
                >
                  Login
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  )
})

export default Header
