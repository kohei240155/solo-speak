'use client'

import { useState, useRef, useEffect, memo, useMemo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import LoginModal from './LoginModal'

const Header = memo(function Header() {
  const { user, signOut, userIconUrl, isUserSetupComplete, refreshUserSettings } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

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

  const handleSignOut = async () => {
    await signOut()
    setIsDropdownOpen(false)
    setIsMobileDropdownOpen(false)
  }

  const handleLoginClick = () => {
    setIsLoginModalOpen(true)
  }

  const handleCloseModal = () => {
    setIsLoginModalOpen(false)
  }

  // 画像読み込みエラーハンドラー
  const handleImageError = () => {
    // AuthContextでエラーハンドリングを行うため、ここでは何もしない
    console.warn('User icon failed to load')
  }

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  const toggleMobileDropdown = () => {
    setIsMobileDropdownOpen(!isMobileDropdownOpen)
  }

  const closeMobileDropdown = () => {
    setIsMobileDropdownOpen(false)
  }

  // ロゴクリック時の処理
  const handleLogoClick = async (e: React.MouseEvent) => {
    // 未ログイン状態の場合はクリックを無効化
    if (!user) {
      e.preventDefault()
      return
    }
    
    e.preventDefault()
    
    // ユーザー設定が未完了の場合は自動ログアウト
    if (user && !isUserSetupComplete) {
      await signOut()
      window.location.href = '/'
      return
    }
    
    // ログインしている場合はフレーズ一覧へ
    if (user && isUserSetupComplete) {
      window.location.href = '/phrase/list'
    }
  }

  // クリック外でドロップダウンを閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false)
      }
      if (mobileDropdownRef.current && !mobileDropdownRef.current.contains(event.target as Node)) {
        setIsMobileDropdownOpen(false)
      }
    }

    if (isDropdownOpen || isMobileDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isDropdownOpen, isMobileDropdownOpen])

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
            {user && isUserSetupComplete ? (
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
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {getDisplayIconUrl ? (
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
                  )}
                </button>

                {                /* ドロップダウンメニュー */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[60]">
                    <div className="py-1">
                      {isUserSetupComplete && (
                        <>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 transition-colors"
                            onClick={closeDropdown}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            ダッシュボード
                          </Link>
                          <Link
                            href="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 transition-colors"
                            onClick={closeDropdown}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            ユーザー設定
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
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
              <div className="relative" ref={mobileDropdownRef}>
                <button
                  onClick={toggleMobileDropdown}
                  className="flex items-center space-x-2 p-2 rounded-full hover:bg-gray-100 transition-colors touch-manipulation"
                >
                  {getDisplayIconUrl ? (
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
                  )}
                </button>

                {/* モバイル用ドロップダウンメニュー */}
                {isMobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-[60]">
                    <div className="py-1">
                      {isUserSetupComplete && (
                        <>
                          <Link
                            href="/dashboard"
                            className="block px-4 py-2 text-sm text-gray-700 transition-colors"
                            onClick={closeMobileDropdown}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            ダッシュボード
                          </Link>
                          <Link
                            href="/settings"
                            className="block px-4 py-2 text-sm text-gray-700 transition-colors"
                            onClick={closeMobileDropdown}
                            onMouseEnter={(e) => {
                              e.currentTarget.style.backgroundColor = '#F3F4F6'
                            }}
                            onMouseLeave={(e) => {
                              e.currentTarget.style.backgroundColor = 'transparent'
                            }}
                          >
                            ユーザー設定
                          </Link>
                        </>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="block w-full text-left px-4 py-2 text-sm text-gray-700 transition-colors"
                        onMouseEnter={(e) => {
                          e.currentTarget.style.backgroundColor = '#F3F4F6'
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.backgroundColor = 'transparent'
                        }}
                      >
                        ログアウト
                      </button>
                    </div>
                  </div>
                )}
              </div>
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

      {/* ログインモーダル */}
      <LoginModal isOpen={isLoginModalOpen} onClose={handleCloseModal} />
    </header>
  )
})

export default Header
