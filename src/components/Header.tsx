'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import Image from 'next/image'
import Link from 'next/link'
import LoginModal from './LoginModal'
import { supabase } from '@/utils/spabase'

export default function Header() {
  const { user, signOut } = useAuth()
  const [isLoginModalOpen, setIsLoginModalOpen] = useState(false)
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [isMobileDropdownOpen, setIsMobileDropdownOpen] = useState(false)
  const [isUserSetupComplete, setIsUserSetupComplete] = useState(false)
  const [userIconUrl, setUserIconUrl] = useState<string | null>(null)
  const dropdownRef = useRef<HTMLDivElement>(null)
  const mobileDropdownRef = useRef<HTMLDivElement>(null)

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

  // ユーザー設定の完了状態をチェック
  const checkUserSetupComplete = useCallback(async () => {
    console.log('Header: checkUserSetupComplete called for user:', user?.id)
    
    if (!user) {
      console.log('Header: No user, setting iconUrl to null')
      setUserIconUrl(null)
      return
    }

    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.log('Header: No session found')
        setIsUserSetupComplete(false)
        setUserIconUrl(null)
        return
      }

      console.log('Header: Fetching user settings...')
      const response = await fetch(`/api/user/settings?t=${Date.now()}`, {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Cache-Control': 'no-cache, no-store, must-revalidate',
          'Pragma': 'no-cache'
        }
      })

      if (response.ok) {
        // ユーザー設定が存在する場合は完了とみなす
        const userData = await response.json()
        console.log('Header: User settings found:', { 
          iconUrl: userData.iconUrl,
          iconUrlType: typeof userData.iconUrl,
          iconUrlLength: userData.iconUrl?.length 
        })
        setIsUserSetupComplete(true)
        
        // 画像URLの有効性をチェック
        if (userData.iconUrl && typeof userData.iconUrl === 'string' && userData.iconUrl.trim() !== '') {
          console.log('Header: Setting valid iconUrl:', userData.iconUrl)
          console.log('Header: URL analysis:', {
            startsWithHttps: userData.iconUrl.startsWith('https://'),
            includesSupabase: userData.iconUrl.includes('supabase'),
            urlStructure: userData.iconUrl.split('/').slice(0, 5).join('/')
          })
          setUserIconUrl(userData.iconUrl)
        } else {
          console.log('Header: iconUrl is invalid or empty, using null')
          setUserIconUrl(null)
        }
      } else if (response.status === 404) {
        // ユーザー設定が存在しない場合は未完了
        console.log('Header: User settings not found, using Google avatar')
        setIsUserSetupComplete(false)
        // Googleアカウントの初期アイコンを使用
        setUserIconUrl(user.user_metadata?.avatar_url || null)
      } else {
        console.log('Header: Error response:', response.status)
        setIsUserSetupComplete(false)
        setUserIconUrl(null)
      }
    } catch (error) {
      console.error('Header: Error checking user setup:', error)
      setIsUserSetupComplete(false)
      setUserIconUrl(null)
    }
  }, [user]) // userオブジェクト全体を依存関係に含める

  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen)
  }

  const closeDropdown = () => {
    setIsDropdownOpen(false)
  }

  const toggleMobileDropdown = () => {
    console.log('Mobile dropdown toggle clicked')
    setIsMobileDropdownOpen(!isMobileDropdownOpen)
  }

  const closeMobileDropdown = () => {
    console.log('Mobile dropdown close')
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
    console.log('Header: useEffect triggered for checkUserSetupComplete, user:', user?.id)
    if (user) {
      checkUserSetupComplete()
    }
  }, [user, checkUserSetupComplete])

  // カスタムイベントでユーザー設定の更新を監視
  useEffect(() => {
    const handleUserSettingsUpdate = () => {
      console.log('Header: userSettingsUpdated event received')
      if (user) {
        console.log('Header: Triggering checkUserSetupComplete from event')
        // 直接関数を呼び出す（依存関係の問題を回避）
        checkUserSetupComplete()
      } else {
        console.log('Header: No user found, skipping update')
      }
    }

    console.log('Header: Setting up userSettingsUpdated event listener')
    window.addEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    
    return () => {
      console.log('Header: Removing userSettingsUpdated event listener')
      window.removeEventListener('userSettingsUpdated', handleUserSettingsUpdate)
    }
  }, [user, checkUserSetupComplete]) // userとcheckUserSetupCompleteに依存

  // デバッグ用: userIconUrlの変更を監視
  useEffect(() => {
    console.log('Header: userIconUrl state changed:', {
      userIconUrl,
      type: typeof userIconUrl,
      length: userIconUrl?.length,
      timestamp: new Date().toISOString()
    })
  }, [userIconUrl])

  // デフォルトのユーザーアイコン（ImageUploadコンポーネントと同じスタイル）を生成
  const getDefaultUserIcon = () => {
    return (
      <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center border border-gray-300">
        <svg className="w-5 h-5 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
          <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
        </svg>
      </div>
    )
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
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
                    // TODO: Switch back to Next.js Image component after debugging
                    <img
                      src={userIconUrl}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-gray-300 object-cover"
                      onLoad={() => {
                        console.log('Header: Successfully loaded user icon:', userIconUrl)
                      }}
                      onError={(e) => {
                        console.error('Header: Failed to load user icon URL:', userIconUrl)
                        console.error('Header: Image load error details:', {
                          error: e,
                          naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                          naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                          src: (e.target as HTMLImageElement).src
                        })
                        setUserIconUrl(null)
                      }}
                    />
                  ) : (
                    getDefaultUserIcon()
                  )}
                </button>

                {                /* ドロップダウンメニュー */}
                {isDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
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
                            href="/setup"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
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
                    <img
                      src={userIconUrl}
                      alt="User Avatar"
                      width={32}
                      height={32}
                      className="w-8 h-8 rounded-full border border-gray-300 object-cover"
                      onLoad={() => {
                        console.log('Header: Successfully loaded user icon (mobile):', userIconUrl)
                      }}
                      onError={(e) => {
                        console.error('Header: Failed to load user icon URL (mobile):', userIconUrl)
                        console.error('Header: Mobile image load error details:', {
                          error: e,
                          naturalWidth: (e.target as HTMLImageElement).naturalWidth,
                          naturalHeight: (e.target as HTMLImageElement).naturalHeight,
                          src: (e.target as HTMLImageElement).src
                        })
                        setUserIconUrl(null)
                      }}
                    />
                  ) : (
                    getDefaultUserIcon()
                  )}
                </button>

                {/* モバイル用ドロップダウンメニュー */}
                {isMobileDropdownOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg border border-gray-200 z-50">
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
                            href="/setup"
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
                className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-2 rounded-md text-sm font-medium"
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
}
