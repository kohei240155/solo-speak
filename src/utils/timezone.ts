/**
 * タイムゾーン関連ユーティリティ
 *
 * フレーズ生成回数・スピーチ回数のリセット、ストリーク計算で使用
 */

/**
 * 指定したタイムゾーンでのローカル日付を取得
 * @param date UTC日時
 * @param timezone IANAタイムゾーン文字列（例: "Asia/Tokyo"）
 * @returns ローカル日付のDateオブジェクト（時刻は00:00:00）
 */
export function getLocalDate(date: Date, timezone: string): Date {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	const parts = formatter.formatToParts(date);
	const year = parseInt(parts.find((p) => p.type === "year")?.value || "0");
	const month =
		parseInt(parts.find((p) => p.type === "month")?.value || "1") - 1;
	const day = parseInt(parts.find((p) => p.type === "day")?.value || "1");

	return new Date(year, month, day);
}

/**
 * 指定したタイムゾーンでの日付文字列を取得（YYYY-MM-DD形式）
 * @param date UTC日時
 * @param timezone IANAタイムゾーン文字列
 * @returns YYYY-MM-DD形式の日付文字列
 */
export function getLocalDateString(date: Date, timezone: string): string {
	const formatter = new Intl.DateTimeFormat("en-CA", {
		timeZone: timezone,
		year: "numeric",
		month: "2-digit",
		day: "2-digit",
	});

	return formatter.format(date);
}

/**
 * リセット可能かどうかを判定
 *
 * 条件:
 * 1. ローカルTZで日付が変わっている
 * 2. 前回リセットから20時間以上経過している（不正防止）
 *
 * @param userTimezone ユーザーのタイムゾーン
 * @param lastResetTimestamp 前回リセット日時（null = 初回）
 * @param now 現在日時（テスト用にオプション）
 * @returns リセット可能ならtrue
 */
export function canReset(
	userTimezone: string,
	lastResetTimestamp: Date | null,
	now: Date = new Date()
): boolean {
	// 初回リセットは常に許可
	if (lastResetTimestamp === null) {
		return true;
	}

	// 条件1: ローカルTZで日付が変わっている
	const localToday = getLocalDateString(now, userTimezone);
	const localLastReset = getLocalDateString(lastResetTimestamp, userTimezone);
	const isDifferentDay = localToday > localLastReset;

	// 条件2: 前回リセットから20時間以上経過
	const hoursSinceLastReset =
		(now.getTime() - lastResetTimestamp.getTime()) / (1000 * 60 * 60);
	const hasPassedMinimumTime = hoursSinceLastReset >= 20;

	return isDifferentDay && hasPassedMinimumTime;
}

/**
 * タイムゾーン文字列が有効かどうかを検証
 * @param timezone タイムゾーン文字列
 * @returns 有効ならtrue
 */
export function isValidTimezone(timezone: string): boolean {
	if (!timezone) {
		return false;
	}

	try {
		Intl.DateTimeFormat(undefined, { timeZone: timezone });
		return true;
	} catch {
		return false;
	}
}
