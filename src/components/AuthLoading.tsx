import React from 'react'

interface AuthLoadingProps {
  message?: string
}

/**
 * 認証チェック中のローディング画面コンポーネント
 */
export const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = '認証確認中...' 
}) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
      <div className="text-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
        <p className="mt-2 text-gray-600">{message}</p>
      </div>
    </div>
  )
}
