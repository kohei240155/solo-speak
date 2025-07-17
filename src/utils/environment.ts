// 環境設定ユーティリティ
export const getEnvironmentConfig = () => {
  const isProduction = process.env.NODE_ENV === 'production'
  const isVercel = process.env.VERCEL === '1'
  const vercelEnv = process.env.VERCEL_ENV

  // 基本URL設定
  let baseUrl = 'http://localhost:3000'
  
  if (isVercel) {
    if (vercelEnv === 'production') {
      // 本番環境 - 実際のVercelドメインを使用
      baseUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}` || 'https://solo-speak.vercel.app'
    } else if (vercelEnv === 'preview') {
      // プレビュー環境
      baseUrl = process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : baseUrl
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
