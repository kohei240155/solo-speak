'use client'

import { useState, useRef, useEffect, useCallback, memo } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import LoginModal from './LoginModal'
import { supabase } from '@/utils/spabase'

const Header = memo(function Header() {
  const { user, signOut } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

  // ユーザーが変更された時の状態リセット
  useEffect(() => {
    if (!user) {
      // ユーザーがログアウトした場合
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
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
    setUserIconUrl(null)
  }

  // ユーザー設定の完了状態をチェック（キャッシュ機能付き）
  const checkUserSetupComplete = useCallback(async () => {
    if (!user?.id) {
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setIsUserSetupComplete(false)
        // セッションがない場合はデフォルトアイコンを表示
        setUserIconUrl(null)
        return
      }

      // ユーザー切り替え対応のためキャッシュを無効化
      const response = await fetch(`/api/user/settings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache',
          'Expires': '0'
        }
      })

      if (response.ok) {
        const userData = await response.json()
        setIsUserSetupComplete(true)
        
        // 画像URLの有効性をチェック（空文字列や無効な値の場合はnullに設定してデフォルトアイコンを表示）
        if (userData.iconUrl && typeof userData.iconUrl === 'string' && userData.iconUrl.trim() !== '') {
          setUserIconUrl(userData.iconUrl)
        } else {
          // iconUrlが空の場合はnullに設定（デフォルトアイコンが表示される）
          setUserIconUrl(null)
        }
      } else if (response.status === 404) {
        // 初回ログイン時：Googleアイコンを自動設定
        setIsUserSetupComplete(false)
        
        // Googleアバターがある場合は自動的に表示
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          console.log('Header: Setting Google avatar for initial display:', googleAvatarUrl)
          setUserIconUrl(googleAvatarUrl)
        } else {
          setUserIconUrl(null)
        }
      } else {
        setIsUserSetupComplete(false)
        // エラーの場合もデフォルトアイコンを使用
        setUserIconUrl(null)
      }
    } catch (error) {
      console.error('Header: Error checking user setup:', error)
      setIsUserSetupComplete(false)
      // エラーの場合もデフォルトアイコンを使用
      setUserIconUrl(null)
    }
  }, [user?.id, user?.user_metadata]) // Googleアバター情報も依存関係に含める

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
    // ユーザー設定が未完了の場合は自動ログアウト
    if (!isUserSetupComplete) {
      e.preventDefault()
      await signOut()
    }
    // 設定完了済みの場合は通常のリンク動作
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

  // ユーザー設定完了状態のチェック
  useEffect(() => {
    if (user?.id) {
      checkUserSetupComplete()
    }
  }, [user?.id, checkUserSetupComplete])

  // カスタムイベントでユーザー設定の更新を監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      if (user?.id) {
        // アイコンを強制的にリセット
        setUserIconUrl(null)
        // 少し遅延させてから再取得
        setTimeout(() => {
          checkUserSetupComplete()
        }, 100)
      }
    }

    const handleUserSignedOut = () => {
      // ログアウト時の状態をクリア
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
      setIsDropdownOpen(false)
      setIsMobileDropdownOpen(false)
    }

    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    window.addEventListener('userSignedOut', handleUserSignedOut)
    
    return () => {
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
      window.removeEventListener('userSignedOut', handleUserSignedOut)
    }
  }, [user?.id, checkUserSetupComplete])

  // デバッグ用のuseEffectを削除してパフォーマンス改善

  // デフォルトのユーザーアイコン（ImageUploadコンポーネントと同じスタイル）を生成
  const getDefaultUserIcon = () => {
    return (
      <div className="w-9 h-9 bg-gray-300 rounded-full flex items-center justify-center border border-gray-300">
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  return (
    <header className="bg-white">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* ロゴ */}
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-2" onClick={handleLogoClick}>
              <Image
                src="/images/logo/Solo Speak Logo.png"
                alt="Solo Speak"
                width={150}
                height={40}
                className="h-8 w-auto"
                priority
              />
            </Link>
          </div>

          {/* デスクトップナビゲーション */}
          <nav className="hidden md:flex items-center">
            {user ? (
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={toggleDropdown}
                  className="flex items-center space-x-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                >
                  {userIconUrl ? (
                    <Image
                      src={`${userIconUrl}${userIconUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      onError={handleImageError}
                    />
                  ) : (
                    getDefaultUserIcon()
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
                  {userIconUrl ? (
                    <Image
                      src={`${userIconUrl}${userIconUrl.includes('?') ? '&' : '?'}t=${Date.now()}`}
                      alt="User Avatar"
                      width={36}
                      height={36}
                      className="w-9 h-9 rounded-full border border-gray-300 object-cover"
                      unoptimized
                      onError={handleImageError}
                    />
                  ) : (
                    getDefaultUserIcon()
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
