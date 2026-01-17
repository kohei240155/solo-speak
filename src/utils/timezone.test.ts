/**
 * タイムゾーンユーティリティのテスト
 */

import {
	getLocalDate,
	getLocalDateString,
	canReset,
	isValidTimezone,
} from "./timezone";

describe("timezone utilities", () => {
	describe("getLocalDate", () => {
		it("UTCの日付をローカルタイムゾーンの日付に変換する", () => {
			// 2024-01-15 15:00:00 UTC
			const utcDate = new Date("2024-01-15T15:00:00.000Z");

			// 日本時間（UTC+9）では2024-01-16 00:00:00
			const localDate = getLocalDate(utcDate, "Asia/Tokyo");
			expect(localDate.getFullYear()).toBe(2024);
			expect(localDate.getMonth()).toBe(0); // January
			expect(localDate.getDate()).toBe(16);
		});

		it("異なるタイムゾーンで正しい日付を返す", () => {
			// 2024-01-15 23:00:00 UTC
			const utcDate = new Date("2024-01-15T23:00:00.000Z");

			// ニューヨーク（UTC-5）では2024-01-15 18:00:00
			const nyDate = getLocalDate(utcDate, "America/New_York");
			expect(nyDate.getDate()).toBe(15);

			// ロンドン（UTC+0/+1）では2024-01-15 23:00:00
			const londonDate = getLocalDate(utcDate, "Europe/London");
			expect(londonDate.getDate()).toBe(15);
		});
	});

	describe("getLocalDateString", () => {
		it("ローカルタイムゾーンの日付文字列を返す（YYYY-MM-DD形式）", () => {
			// 2024-01-15 15:00:00 UTC → 日本時間で2024-01-16
			const utcDate = new Date("2024-01-15T15:00:00.000Z");
			const dateString = getLocalDateString(utcDate, "Asia/Tokyo");
			expect(dateString).toBe("2024-01-16");
		});

		it("月・日が一桁の場合もゼロパディングされる", () => {
			// 2024-03-05 00:00:00 UTC → ロサンゼルス時間で2024-03-04
			const utcDate = new Date("2024-03-05T00:00:00.000Z");
			const dateString = getLocalDateString(utcDate, "America/Los_Angeles");
			expect(dateString).toBe("2024-03-04");
		});
	});

	describe("canReset", () => {
		it("日付が変わり、20時間以上経過している場合はtrueを返す", () => {
			// 前回リセット: 2024-01-15 00:00:00 JST (2024-01-14 15:00:00 UTC)
			const lastReset = new Date("2024-01-14T15:00:00.000Z");

			// 現在: 2024-01-16 01:00:00 JST (2024-01-15 16:00:00 UTC) - 25時間経過
			const now = new Date("2024-01-15T16:00:00.000Z");

			expect(canReset("Asia/Tokyo", lastReset, now)).toBe(true);
		});

		it("日付が変わっても20時間未満の場合はfalseを返す", () => {
			// 前回リセット: 2024-01-15 23:00:00 JST (2024-01-15 14:00:00 UTC)
			const lastReset = new Date("2024-01-15T14:00:00.000Z");

			// 現在: 2024-01-16 00:30:00 JST (2024-01-15 15:30:00 UTC) - 1.5時間経過
			const now = new Date("2024-01-15T15:30:00.000Z");

			expect(canReset("Asia/Tokyo", lastReset, now)).toBe(false);
		});

		it("20時間以上経過しても日付が同じ場合はfalseを返す", () => {
			// 前回リセット: 2024-01-15 00:00:00 JST (2024-01-14 15:00:00 UTC)
			const lastReset = new Date("2024-01-14T15:00:00.000Z");

			// 現在: 2024-01-15 22:00:00 JST (2024-01-15 13:00:00 UTC) - 22時間経過、同じ日
			const now = new Date("2024-01-15T13:00:00.000Z");

			expect(canReset("Asia/Tokyo", lastReset, now)).toBe(false);
		});

		it("タイムゾーン変更後も20時間ルールが適用される", () => {
			// 前回リセット: 2024-01-15 00:00:00 UTC
			const lastReset = new Date("2024-01-15T00:00:00.000Z");

			// 現在: 2024-01-15 10:00:00 UTC - 10時間経過
			// タイムゾーンをUTC+12に変更すると日付は2024-01-15 22:00:00
			// 日付は同じだが、UTC基準で日付が変わったように見せかけても
			// 20時間ルールで防止される
			const now = new Date("2024-01-15T10:00:00.000Z");

			expect(canReset("Pacific/Auckland", lastReset, now)).toBe(false);
		});

		it("lastResetがnullの場合はtrueを返す（初回リセット）", () => {
			const now = new Date("2024-01-15T10:00:00.000Z");
			expect(canReset("Asia/Tokyo", null, now)).toBe(true);
		});
	});

	describe("isValidTimezone", () => {
		it("有効なタイムゾーン文字列に対してtrueを返す", () => {
			expect(isValidTimezone("Asia/Tokyo")).toBe(true);
			expect(isValidTimezone("America/New_York")).toBe(true);
			expect(isValidTimezone("Europe/London")).toBe(true);
			expect(isValidTimezone("UTC")).toBe(true);
		});

		it("無効なタイムゾーン文字列に対してfalseを返す", () => {
			expect(isValidTimezone("Invalid/Timezone")).toBe(false);
			expect(isValidTimezone("")).toBe(false);
			expect(isValidTimezone("Not_A_Real_Zone")).toBe(false);
		});
	});
});
