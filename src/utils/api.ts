import { supabase } from './spabase'
import toast from 'react-hot-toast'

// AuthContextからshowLoginModalを呼び出すためのヘルパー関数
// この関数はクライアントサイドでのみ動作します
let showLoginModalRef: (() => void) | null = null

export const setShowLoginModalRef = (showLoginModal: () => void) => {
  showLoginModalRef = showLoginModal
}

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
            // 認証エラー時はログインモーダルを表示
            if (showLoginModalRef) {
              showLoginModalRef()
            } else {
              // フォールバック: ログインモーダルが利用できない場合はトーストを表示
              toast.error('Authentication has expired. Please reload the page.', {
                duration: 8000,
                id: 'auth-error',
              })
            }
          }
          throw new ApiError('Authentication required', 401)
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
            // 認証エラー時はログインモーダルを表示
            if (showLoginModalRef) {
              showLoginModalRef()
            } else {
              // フォールバック: ログインモーダルが利用できない場合はトーストを表示
              toast.error('Authentication has expired. Please reload the page.', {
                duration: 8000,
                id: 'auth-expired'
              })
            }
          } else if (response.status === 503 && showErrorToast) {
            toast.error('Authentication service is temporarily unavailable. Please try again later.', {
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
          const message = 'Request timed out'
          if (showErrorToast) {
            toast.error(message)
          }
          throw new ApiError(message, 408)
        }

        // ネットワークエラーやその他の接続エラー
        if (error instanceof Error) {
          let message = 'Network error occurred'
          
          // Fetch failed エラーの場合
          if (error.message.includes('fetch failed') || error.message.includes('Failed to fetch')) {
            message = 'Cannot connect to server. Please check your internet connection and try again.'
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

      let message = 'Network error occurred'
      if (error instanceof Error) {
        message = error.message
        
        // 特定のエラーパターンに対応
        if (error.message.includes('ENOTFOUND') || error.message.includes('fetch failed')) {
          message = 'Cannot connect to server. Please check your internet connection.'
        } else if (error.message.includes('Auth session missing')) {
          message = 'Authentication session is invalid. Please reload the page.'
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
