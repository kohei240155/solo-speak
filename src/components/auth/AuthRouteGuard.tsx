'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useRouter, usePathname } from 'next/navigation'
import { useEffect, ReactNode } from 'react'
import LoadingSpinner from '../common/LoadingSpinner'

interface AuthRouteGuardProps {
  children: ReactNode
}

// 認証が必要なルートのパターン
const PROTECTED_ROUTES = [
  '/dashboard',
  '/settings',
  '/phrase',
  '/ranking',
  '/commercial-transaction'
]

function isProtectedRoute(pathname: string): boolean {
  return PROTECTED_ROUTES.some(route => pathname.startsWith(route))
}

export default function AuthRouteGuard({ children }: AuthRouteGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    // ローディング中は何もしない
    if (loading) return

    // 保護されたルートで未認証の場合
    if (isProtectedRoute(pathname) && !user) {
      router.push('/auth/login')
      return
    }

    // 認証済みユーザーがログインページにアクセスした場合はダッシュボードにリダイレクト
    if (pathname === '/auth/login' && user) {
      router.push('/dashboard')
      return
    }
  }, [user, loading, pathname, router])

  // ローディング中は全画面ローディングを表示
  if (loading) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  // 保護されたルートで未認証の場合はローディングを表示（リダイレクト中）
  if (isProtectedRoute(pathname) && !user) {
    return <LoadingSpinner fullScreen message="Redirecting to login..." />
  }

  return <>{children}</>
}
