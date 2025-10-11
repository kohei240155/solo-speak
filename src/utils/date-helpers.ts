/**
 * 日付関連のユーティリティ関数
 */

/**
 * 日付が変わったかどうかを判定する関数（UTC基準）
 * @param lastSpeakDate 最後の音読日時
 * @param currentDate 現在の日時
 * @returns 日付が変わった場合はtrue
 */
export function isDayChanged(
  lastSpeakDate: Date | null,
  currentDate: Date,
): boolean {
  if (!lastSpeakDate) return false;

  // UTC基準でのdate比較
  const lastDateUTC = new Date(
    Date.UTC(
      lastSpeakDate.getUTCFullYear(),
      lastSpeakDate.getUTCMonth(),
      lastSpeakDate.getUTCDate(),
    ),
  );

  const currentDateUTC = new Date(
    Date.UTC(
      currentDate.getUTCFullYear(),
      currentDate.getUTCMonth(),
      currentDate.getUTCDate(),
    ),
  );

  return lastDateUTC.getTime() !== currentDateUTC.getTime();
}

/**
 * 今日の日付をUTC基準で取得する
 * @returns UTC基準での今日の日付文字列 (YYYY-MM-DD)
 */
export function getTodayUTC(): string {
  const now = new Date();
  return now.toISOString().split("T")[0];
}

/**
 * 指定した日付が今日かどうかを判定する（UTC基準）
 * @param date 判定する日付
 * @returns 今日の場合はtrue
 */
export function isToday(date: Date | null): boolean {
  if (!date) return false;

  const todayUTC = getTodayUTC();
  const targetDateUTC = date.toISOString().split("T")[0];

  return targetDateUTC === todayUTC;
}
