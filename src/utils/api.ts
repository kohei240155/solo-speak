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
        'Content-Type': 'application/json',
        ...(headers as Record<string, string>),
      }

      // 認証トークンの取得と設定
      if (useAuth) {
        const { data: { session }, error } = await supabase.auth.getSession()
        
        if (error) {
          console.error('Session error:', error)
          if (showErrorToast) {
            toast.error('認証エラーが発生しました')
          }
          throw new ApiError('認証エラー', 401)
        }

        if (!session?.access_token) {
          if (showErrorToast) {
            toast.error('認証情報が見つかりません。再度ログインしてください。')
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

          if (showErrorToast) {
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

        throw error
      }

    } catch (error) {
      console.error('API request failed:', { endpoint, error })
      
      if (error instanceof ApiError) {
        throw error
      }

      const message = error instanceof Error ? error.message : 'ネットワークエラーが発生しました'
      if (showErrorToast) {
        toast.error(message)
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
      body: body ? JSON.stringify(body) : undefined,
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
  async delete<T = unknown>(endpoint: string, options: Omit<ApiOptions, 'method' | 'body'> = {}): Promise<T> {
    return this.request<T>(endpoint, { ...options, method: 'DELETE' })
  }
}

// シングルトンインスタンスをエクスポート
export const api = new ApiClient()

// 型定義もエクスポート
export type { ApiOptions, ApiResponse }
export { ApiError }
