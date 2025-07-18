import { createClient } from '@supabase/supabase-js'
import { getEnvironmentConfig } from './environment'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
// 新しいAPI Keys方式に対応
const supabasePublishableKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

if (!supabaseUrl) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
}

if (!supabasePublishableKey) {
  throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY (or NEXT_PUBLIC_SUPABASE_ANON_KEY for backward compatibility)')
}

// 環境設定を取得
const envConfig = getEnvironmentConfig()

export const supabase = createClient(supabaseUrl, supabasePublishableKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
    flowType: 'pkce'
  }
})

// リダイレクトURL設定関数を提供
export const getAuthRedirectUrl = () => {
  return envConfig.callbackUrl
}