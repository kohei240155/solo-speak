/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付が変わったかどうかを判定する関数
 * @param lastSpeakDate 最後の音読日時
 * @param currentDate 現在の日時
 * @returns 日付が変わった場合はtrue
 */
export function isDayChanged(lastSpeakDate: Date | null, currentDate: Date): boolean {
  if (!lastSpeakDate) return false
  
  // 日本時間でのdate比較（UTC+9）
  const lastDate = new Date(lastSpeakDate.getTime() + 9 * 60 * 60 * 1000)
  const currentDateJST = new Date(currentDate.getTime() + 9 * 60 * 60 * 1000)
  
  const lastDateStr = lastDate.toISOString().split('T')[0]
  const currentDateStr = currentDateJST.toISOString().split('T')[0]
  
  return lastDateStr !== currentDateStr
}

/**
 * 今日の日付を日本時間で取得する
 * @returns 日本時間での今日の日付文字列 (YYYY-MM-DD)
 */
export function getTodayJST(): string {
  const now = new Date()
  const jstDate = new Date(now.getTime() + 9 * 60 * 60 * 1000)
  return jstDate.toISOString().split('T')[0]
}

/**
 * 指定した日付が今日かどうかを判定する
 * @param date 判定する日付
 * @returns 今日の場合はtrue
 */
export function isToday(date: Date | null): boolean {
  if (!date) return false
  
  const todayJST = getTodayJST()
  const targetDateJST = new Date(date.getTime() + 9 * 60 * 60 * 1000)
  const targetDateStr = targetDateJST.toISOString().split('T')[0]
  
  return todayJST === targetDateStr
}
