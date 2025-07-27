/**
 * ネットワーク接続状況を監視するユーティリティ
 */

class ConnectionMonitor {
  private static instance: ConnectionMonitor
  private isOnline: boolean = navigator.onLine
  private listeners: ((isOnline: boolean) => void)[] = []

  private constructor() {
    window.addEventListener('online', this.handleOnline)
    window.addEventListener('offline', this.handleOffline)
  }

  public static getInstance(): ConnectionMonitor {
    if (!ConnectionMonitor.instance) {
      ConnectionMonitor.instance = new ConnectionMonitor()
    }
    return ConnectionMonitor.instance
  }

  private handleOnline = () => {
    this.isOnline = true
    this.notifyListeners()
  }

  private handleOffline = () => {
    this.isOnline = false
    this.notifyListeners()
  }

  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.isOnline))
  }

  public getConnectionStatus(): boolean {
    return this.isOnline
  }

  public addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback)
    
    // リスナーを削除する関数を返す
    return () => {
      const index = this.listeners.indexOf(callback)
      if (index > -1) {
        this.listeners.splice(index, 1)
      }
    }
  }

  public async testConnection(): Promise<boolean> {
    try {
      // ヘルスチェック用の軽量なリクエストを送信
      const controller = new AbortController()
      const timeoutId = setTimeout(() => controller.abort(), 5000)
      
      const response = await fetch('/api/health', {
        method: 'HEAD',
        cache: 'no-cache',
        signal: controller.signal
      })
      
      clearTimeout(timeoutId)
      return response.ok
    } catch {
      return false
    }
  }
}

export const connectionMonitor = ConnectionMonitor.getInstance()
