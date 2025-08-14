/**
 * ユーザーのタイムゾーンを取得するヘルパー関数
 */

export interface TimezoneInfo {
  timezone: string
  offset: number
  isValid: boolean
}

/**
 * ユーザーのタイムゾーンを取得
 */
export function getUserTimezone(): string {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC'
  } catch {
    return 'UTC'
  }
}

/**
 * タイムゾーンが有効かチェック
 */
export const isValidTimezone = (timezone: string): boolean => {
  try {
    // タイムゾーンでフォーマットを試行
    new Intl.DateTimeFormat('en', { timeZone: timezone }).format(new Date())
    return true
  } catch {
    return false
  }
}

/**
 * タイムゾーンの表示名を取得
 */
export const getTimezoneDisplayName = (timezone: string, locale: string = 'ja'): string => {
  try {
    const formatter = new Intl.DateTimeFormat(locale, {
      timeZone: timezone,
      timeZoneName: 'long'
    })
    
    const parts = formatter.formatToParts(new Date())
    const timeZonePart = parts.find(part => part.type === 'timeZoneName')
    
    return timeZonePart?.value || timezone
  } catch {
    return timezone
  }
}

/**
 * ユーザーのローカル日付を取得（YYYY-MM-DD形式）
 */
export const getUserLocalDate = (timezone?: string): string => {
  const tz = timezone || getUserTimezone()
  
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: tz,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit'
  }).format(new Date())
}

/**
 * デバッグ用：タイムゾーン情報を出力
 */
export const logTimezoneInfo = (): void => {
  // デバッグ情報（本番環境では使用しない）
}
