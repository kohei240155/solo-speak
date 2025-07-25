import React from 'react'
import LoadingSpinner from '../common/LoadingSpinner'

interface AuthLoadingProps {
  message?: string
}

/**
 * 認証チェック中のローディング画面コンポーネント
 */
export const AuthLoading: React.FC<AuthLoadingProps> = ({ 
  message = 'Authenticating...' 
}) => {
  return <LoadingSpinner fullScreen message={message} />
}
