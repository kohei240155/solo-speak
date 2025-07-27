import { supabase } from './spabase'
import toast from 'react-hot-toast'

interface ApiOptions extends RequestInit {
  /**
   * Supabaseセッションを使用してAuthorizationヘッダーを自動付与するか
   * @default true
   */
  useAuth?: boolean
  /**
   * エラー時に自動でトーストを表示するか
   * @default true
   */
  showErrorToast?: boolean
  /**
   * タイムアウト時間（ミリ秒）
   * @default 30000
   */
  timeout?: number
}

interface ApiResponse<T = unknown> {
  success: boolean
  data?: T
  message?: string
  error?: string
}

class ApiError extends Error {
  status: number
  response?: Response

  constructor(message: string, status: number, response?: Response) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.response = response
  }
}

/**
 * 汎用APIクライアント
 * Supabaseセッションを使用した認証とエラーハンドリングを提供
 */
class ApiClient {
  private baseUrl = ''

  /**
   * 共通のAPIリクエスト処理
   */
  private async request<T = unknown>(
    endpoint: string,
    options: ApiOptions = {}
  ): Promise<T> {
    const {
      useAuth = true,
      showErrorToast = true,
      timeout = 30000,
      headers = {},
      ...fetchOptions
    } = options

    try {
      // リクエストヘッダーの準備
      const requestHeaders: Record<string, string> = {
        ...(headers as Record<string, string>),
      }

      // FormDataでない場合のみContent-Typeを設定
      if (!(fetchOptions.body instanceof FormData)) {
        requestHeaders['Content-Type'] = 'application/json'
      }

      // 認証トークンの取得と設定
      if (useAuth) {
        let { data: { session }, error: sessionError } = await supabase.auth.getSession()
        
        // セッションが無効またはエラーの場合、リフレッシュを試行
        if (sessionError || !session?.access_token) {
          const { data: { session: refreshedSession }, error: refreshError } = await supabase.auth.refreshSession()
          
          if (!refreshError && refreshedSession) {
            session = refreshedSession
            sessionError = null // エラーをクリア
          }
        }
        
        const finalError = sessionError
        if (finalError || !session?.access_token) {
          if (showErrorToast) {
            // より詳細なメッセージに変更
            toast.error('認証情報が期限切れです。ページを再読み込みしてください。', {
              duration: 8000, // 8秒間表示
              id: 'auth-error', // 重複トーストを防ぐ
            })
          }
          throw new ApiError('認証情報なし', 401)
        }

        requestHeaders['Authorization'] = `Bearer ${session.access_token}`
      }

      // タイムアウト制御
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), timeout)

      try {
        const response = await fetch(`${this.baseUrl}${endpoint}`, {
          ...fetchOptions,
          headers: requestHeaders,
          signal: controller.signal,
        })

        clearTimeout(timeoutId)

        // レスポンスステータスの確認
        if (!response.ok) {
          let errorMessage = `HTTP Error: ${response.status}`
          
          try {
            const errorData = await response.json()
            errorMessage = errorData.message || errorData.error || errorMessage
          } catch {
            // JSONパースに失敗した場合はステータステキストを使用
            errorMessage = response.statusText || errorMessage
          }

          // 401エラーの場合は特別なメッセージを表示
          if (response.status === 401 && showErrorToast) {
            toast.error('認証が失効しました。ページを再読み込みしてください。', {
              duration: 8000,
              id: 'auth-expired'
            })
          } else if (response.status === 503 && showErrorToast) {
            toast.error('認証サービスが一時的に利用できません。しばらく待ってから再試行してください。', {
              duration: 8000,
              id: 'service-unavailable'
            })
          } else if (showErrorToast) {
            toast.error(errorMessage)
          }

          throw new ApiError(errorMessage, response.status, response)
        }

        // レスポンスのパース
        const contentType = response.headers.get('content-type')
        if (contentType && contentType.includes('application/json')) {
          return await response.json()
        } else {
          return response.text() as T
        }

      } catch (error) {
        clearTimeout(timeoutId)
        
        if (error instanceof ApiError) {
          throw error
        }

        if (error instanceof Error && error.name === 'AbortError') {
          const message = 'リクエストがタイムアウトしました'
          if (showErrorToast) {
            toast.error(message)
          }
          throw new ApiError(message, 408)
        }

        // ネットワークエラーやその他の接続エラー
        if (error instanceof Error) {
          let message = 'ネットワークエラーが発生しました'
          
          // Fetch failed エラーの場合
          if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
            message = 'サーバーに接続できません。インターネット接続を確認してから再試行してください。'
          }
          
          if (showErrorToast) {
            toast.error(message, {
              duration: 8000,
              id: 'network-error'
            })
          }
          throw new ApiError(message, 0)
        }

        throw error
      }

    } catch (error) {
      if (error instanceof ApiError) {
        throw error
      }

      let message = 'ネットワークエラーが発生しました'
      if (error instanceof Error) {
        message = error.message
        
        // 特定のエラーパターンに対応
        if (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
          message = 'サーバーに接続できません。インターネット接続を確認してください。'
        } else if (error.message.includes('Auth session missing')) {
          message = '認証セッションが無効です。ページを再読み込みしてください。'
        }
      }
      
      if (showErrorToast) {
        toast.error(message, {
          duration: 6000,
          id: 'api-error'
        })
      }
      throw new ApiError(message, 0)
    }
  }

  /**
   * GETリクエスト
   */
  async get<T = unknown>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'GET' })
  }

  /**
   * POSTリクエスト
   */
  async post<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'POST',
      body: body instanceof FormData ? body : (body ? JSON.stringify(body) : undefined),
    })
  }

  /**
   * PUTリクエスト
   */
  async put<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * PATCHリクエスト
   */
  async patch<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, {
      ...options,
      method: 'PATCH',
      body: body ? JSON.stringify(body) : undefined,
    })
  }

  /**
   * DELETEリクエスト
   */
  async delete<T = unknown>(
    endpoint: string,
    body?: unknown,
    options: Omit<ApiOptions, 'method' | 'body'> = {}
  ): Promise<T> {
    return this.request<T>(endpoint, { 
      ...options, 
      method: 'DELETE',
      body: body ? JSON.stringify(body) : undefined,
    })
  }
}

// シングルトンインスタンスをエクスポート
export const api = new ApiClient()

// 型定義もエクスポート
export type { ApiOptions, ApiResponse }
export { ApiError }
