// 環境設定ユーティリティ
export const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV

  // 基本URL設定
  let baseUrl = 'http://localhost:3000'
  
  if (isVercel) {
    if (vercelEnv === 'production') {
      // 本番環境 - 明示的に設定されたサイトURLを優先使用
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
    } else if (vercelEnv === 'preview') {
      // プレビュー環境 - 本番URLを使用（プレビューでも本番認証を使用するため）
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'https://solo-speak.vercel.app'
    }
  } else {
    // ローカル開発環境
    baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  }

  return {
    baseUrl,
    isProduction,
    isVercel,
    vercelEnv,
    environment: vercelEnv || (isProduction ? 'production' : 'development'),
    callbackUrl: `${baseUrl}/auth/callback`,
    supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
    supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
  }
}

// デバッグ情報を出力
export const logEnvironmentInfo = () => {
  if (typeof window !== 'undefined') {
    const config = getEnvironmentConfig()
    console.log('Environment Config:', {
      ...config,
      supabaseAnonKey: config.supabaseAnonKey ? '***' : 'undefined'
    })
  }
}
