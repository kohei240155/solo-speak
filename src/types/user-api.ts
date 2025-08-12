// ユーザーAPI関連のレスポンス型定義

// ユーザー日次リセットレスポンス型
export interface UserDailyResetResponse {
  success: boolean
  reset: boolean
  message: string
  count: number
  lastSpeakingDate: Date | null
}
