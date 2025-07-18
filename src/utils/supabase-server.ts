import { createClient } from '@supabase/supabase-js'

// サーバーサイド用のSupabaseクライアント（新しいSecret key使用）
export function createServerSupabaseClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
  // 新しいSecret key方式に対応（古い方式も後方互換性のためサポート）
  const supabaseSecretKey = process.env.SUPABASE_SECRET_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY

  if (!supabaseUrl) {
    throw new Error('Missing env.NEXT_PUBLIC_SUPABASE_URL')
  }

  if (!supabaseSecretKey) {
    throw new Error('Missing env.SUPABASE_SECRET_KEY (or SUPABASE_SERVICE_ROLE_KEY for backward compatibility)')
  }

  return createClient(supabaseUrl, supabaseSecretKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  })
}
