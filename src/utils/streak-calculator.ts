/**
 * Streak計算ユーティリティ
 * 前日までの連続日数をベースに、当日のアクティビティを加算して計算する
 */

import { getLocalDateString } from "./timezone";

/**
 * 前日までのStreak日数を計算し、当日のアクティビティがあれば加算する
 * @param dates - アクティビティが記録された日付の配列（YYYY-MM-DD形式）
 * @param timezone - ユーザーのタイムゾーン（デフォルト: UTC）
 * @returns Streak日数
 */
export function calculateStreak(dates: string[], timezone: string = "UTC"): number {
	if (dates.length === 0) {
		return 0;
	}

	// 重複を除去してソート
	const uniqueDates = [...new Set(dates)].sort();

	// 今日と昨日の日付をユーザーのタイムゾーンで取得
	const now = new Date();
	const todayStr = getLocalDateString(now, timezone);

	const yesterday = new Date(now);
	yesterday.setDate(yesterday.getDate() - 1);
	const yesterdayStr = getLocalDateString(yesterday, timezone);

	// 昨日から遡って連続日数を計算（前日までのStreak）
	let baseStreak = 0;
	const checkDate = new Date(yesterdayStr);

	while (true) {
		const checkDateStr = getLocalDateString(checkDate, timezone);

		if (uniqueDates.includes(checkDateStr)) {
			baseStreak++;
			// 前日をチェック
			checkDate.setDate(checkDate.getDate() - 1);
		} else {
			// 連続が途切れた場合
			break;
		}
	}

	// 当日のアクティビティがあるかチェックして加算
	const hasTodayActivity = uniqueDates.includes(todayStr);
	const currentStreak = baseStreak + (hasTodayActivity ? 1 : 0);

	return currentStreak;
}

/**
 * 日付文字列の配列をYYYY-MM-DD形式に変換
 * @param dateObjects - Dateオブジェクトの配列
 * @param timezone - ユーザーのタイムゾーン（デフォルト: UTC）
 * @returns YYYY-MM-DD形式の日付文字列配列
 */
export function formatDatesToStrings(dateObjects: Date[], timezone: string = "UTC"): string[] {
	return dateObjects.map((date) => {
		return getLocalDateString(new Date(date), timezone);
	});
}
