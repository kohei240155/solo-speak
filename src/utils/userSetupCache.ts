/**
 * PWA環境でのユーザー設定完了状態をキャッシュするユーティリティ
 */

const USER_SETUP_CACHE_KEY = 'solo_speak_user_setup_complete'

export const userSetupCache = {
  /**
   * ユーザー設定完了状態をLocalStorageに保存
   */
  setUserSetupComplete(userId: string, isComplete: boolean): void {
    try {
      const cacheData = {
        userId,
        isComplete,
        timestamp: Date.now()
      }
      localStorage.setItem(USER_SETUP_CACHE_KEY, JSON.stringify(cacheData))
    } catch {
      // LocalStorageが使用できない環境では何もしない
    }
  },

  /**
   * ユーザー設定完了状態をLocalStorageから取得
   */
  getUserSetupComplete(userId: string): boolean | null {
    try {
      const cached = localStorage.getItem(USER_SETUP_CACHE_KEY)
      if (!cached) return null

      const cacheData = JSON.parse(cached)
      
      // ユーザーIDが一致し、24時間以内のキャッシュのみ有効
      const isValidCache = 
        cacheData.userId === userId && 
        (Date.now() - cacheData.timestamp) < 24 * 60 * 60 * 1000

      return isValidCache ? cacheData.isComplete : null
    } catch {
      // パースエラーの場合はキャッシュをクリア
      this.clearUserSetupCache()
      return null
    }
  },

  /**
   * ユーザー設定キャッシュをクリア
   */
  clearUserSetupCache(): void {
    try {
      localStorage.removeItem(USER_SETUP_CACHE_KEY)
    } catch {
      // LocalStorageが使用できない環境では何もしない
    }
  }
}
