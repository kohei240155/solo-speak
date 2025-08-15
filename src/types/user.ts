// ユーザー関連の型定義

// ユーザー日次リセットレスポンス型
export interface UserDailyResetResponse {
  success: boolean
  reset: boolean
  message: string
  count: number
  lastDailySpeakCountResetDate: Date | null
}
