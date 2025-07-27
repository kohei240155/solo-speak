import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/utils/supabase-server'
import { User } from '@supabase/supabase-js'

/**
 * APIリクエストの認証処理
 * @param request NextRequest オブジェクト
 * @returns 認証されたユーザー情報またはエラーレスポンス
 */
export async function authenticateRequest(request: NextRequest): Promise<{ user: User } | { error: NextResponse }> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('認証ヘッダーが見つかりません')
      return { error: NextResponse.json({ error: 'Authorization header required' }, { status: 401 }) }
    }

    const token = authHeader.replace('Bearer ', '')
    
    const serverSupabase = createServerSupabaseClient()
    
    let authResponse = null
    let retryCount = 0
    const maxRetries = 3
    
    while (retryCount < maxRetries) {
      try {
        authResponse = await serverSupabase.auth.getUser(token)
        break // 成功した場合はループを抜ける
      } catch {
        retryCount++
        
        if (retryCount >= maxRetries) {
          return { error: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
        }
        
        // 1秒待ってからリトライ
        await new Promise(resolve => setTimeout(resolve, 1000))
      }
    }

    if (!authResponse) {
      return { error: NextResponse.json({ error: 'Authentication service unavailable' }, { status: 503 }) }
    }

    const { data: { user }, error } = authResponse

    if (error || !user) {
      return { error: NextResponse.json({ error: 'Invalid token' }, { status: 401 }) }
    }
    return { user }
  } catch (error) {
    console.error('Authentication error:', error)
    return { error: NextResponse.json({ error: 'Internal server error' }, { status: 500 }) }
  }
}

/**
 * ユーザー名のバリデーション
 * @param username バリデーション対象のユーザー名
 * @returns バリデーション結果
 */
export function validateUsername(username: string): { isValid: boolean; error?: string } {
  if (typeof username !== 'string' || username.trim().length < 2 || username.trim().length > 50) {
    return { isValid: false, error: 'Display Name must be between 2 and 50 characters' }
  }

  const usernameRegex = /^[a-zA-Z0-9\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF\s\-_]+$/
  if (!usernameRegex.test(username.trim())) {
    return { 
      isValid: false, 
      error: 'Display Name can only contain letters, numbers, Japanese characters, spaces, hyphens, and underscores' 
    }
  }

  return { isValid: true }
}

/**
 * メールアドレスのバリデーション
 * @param email バリデーション対象のメールアドレス
 * @returns バリデーション結果
 */
export function validateEmail(email: string): { isValid: boolean; error?: string } {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/
  if (!emailRegex.test(email) || email.length > 254) {
    return { isValid: false, error: 'Please enter a valid email address' }
  }
  
  if (email.includes('..') || email.startsWith('.') || email.endsWith('.')) {
    return { isValid: false, error: 'Please enter a valid email address format' }
  }

  return { isValid: true }
}

/**
 * 生年月日のバリデーション
 * @param birthdate バリデーション対象の生年月日
 * @returns バリデーション結果
 */
export function validateBirthdate(birthdate: string): { isValid: boolean; error?: string } {
  const birthdateObj = new Date(birthdate)
  if (isNaN(birthdateObj.getTime()) || birthdateObj > new Date() || birthdateObj.getFullYear() < 1900) {
    return { isValid: false, error: 'Please enter a valid birth date' }
  }

  return { isValid: true }
}

/**
 * 共通のエラーレスポンス作成
 * @param error エラーオブジェクト
 * @param context エラーが発生したコンテキスト
 * @returns エラーレスポンス
 */
export function createErrorResponse(error: unknown, context: string): NextResponse {
  console.error(`Error in ${context}:`, error)
  console.error('Error details:', {
    message: error instanceof Error ? error.message : 'Unknown error',
    stack: error instanceof Error ? error.stack : undefined,
    name: error instanceof Error ? error.name : undefined
  })
  
  return NextResponse.json({ 
    error: 'Internal server error',
    details: error instanceof Error ? error.message : 'Unknown error'
  }, { status: 500 })
}

/**
 * 言語データのフォールバック処理
 * @param isError エラー時のフォールバックかどうか
 * @returns フォールバック言語データのレスポンス
 */
export function createLanguageFallbackResponse(isError: boolean = false): NextResponse {
  const fallbackLanguages = [
    { id: 'fallback-ja', name: 'Japanese', code: 'ja' },
    { id: 'fallback-en', name: 'English', code: 'en' },
    { id: 'fallback-zh', name: 'Chinese', code: 'zh' },
    { id: 'fallback-ko', name: 'Korean', code: 'ko' },
    { id: 'fallback-es', name: 'Spanish', code: 'es' },
    { id: 'fallback-fr', name: 'French', code: 'fr' },
    { id: 'fallback-de', name: 'German', code: 'de' },
    { id: 'fallback-it', name: 'Italian', code: 'it' },
    { id: 'fallback-pt', name: 'Portuguese', code: 'pt' },
    { id: 'fallback-ru', name: 'Russian', code: 'ru' }
  ]
  
  if (isError) {
    console.warn('Database error occurred, returning fallback language data')
  } else {
    console.warn('No languages found in database, returning fallback data')
  }
  
  return new NextResponse(JSON.stringify(fallbackLanguages), {
    status: 200,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      'X-Fallback-Data': 'true',
      'Cache-Control': 'public, max-age=1800' // 30分間キャッシュ
    },
  })
}

/**
 * 必須フィールドのバリデーション
 * @param data バリデーション対象のデータ
 * @param requiredFields 必須フィールドのリスト
 * @returns バリデーション結果
 */
export function validateRequiredFields(
  data: Record<string, unknown>, 
  requiredFields: string[]
): { isValid: boolean; error?: string } {
  const missingFields = requiredFields.filter(field => !data[field])
  
  if (missingFields.length > 0) {
    return { 
      isValid: false, 
      error: `Required fields: ${missingFields.join(', ')}` 
    }
  }

  return { isValid: true }
}
