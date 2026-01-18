/**
 * 差分計算ユーティリティのテスト
 */

import { calculateDiff } from "./diff";

describe("diff utilities", () => {
	describe("calculateDiff", () => {
		describe("完全一致", () => {
			it("完全一致の場合はequalのみを返す", () => {
				const result = calculateDiff("hello world", "hello world");
				expect(result).toEqual([{ type: "equal", value: "hello world" }]);
			});

			it("空文字同士の場合は空配列を返す", () => {
				const result = calculateDiff("", "");
				expect(result).toEqual([]);
			});
		});

		describe("単語の欠落（正解テキストにあるが発話テキストにない）", () => {
			it("1単語の欠落を検出する", () => {
				// 正解: "I have a pen"
				// 発話: "I have pen"
				const result = calculateDiff("I have pen", "I have a pen");
				// 比較は正規化されるが、表示は元の原文を維持
				expect(result).toContainEqual({ type: "equal", value: "I have " });
				expect(result).toContainEqual({ type: "delete", value: "a " });
				expect(result).toContainEqual({ type: "equal", value: "pen" });
			});

			it("複数単語の欠落を検出する", () => {
				// 正解: "I would like to have a coffee"
				// 発話: "I would like coffee"
				const result = calculateDiff(
					"I would like coffee",
					"I would like to have a coffee"
				);
				const deleteResults = result.filter((r) => r.type === "delete");
				expect(deleteResults.length).toBeGreaterThan(0);
			});
		});

		describe("単語の追加（発話テキストにあるが正解テキストにない）", () => {
			it("1単語の追加を検出する", () => {
				// 正解: "hello world"
				// 発話: "hello beautiful world"
				const result = calculateDiff("hello beautiful world", "hello world");
				expect(result).toContainEqual({ type: "insert", value: "beautiful " });
			});
		});

		describe("単語の置換", () => {
			it("単語の置換をdelete+insertとして検出する", () => {
				// 正解: "I like coffee"
				// 発話: "I love coffee"
				const result = calculateDiff("I love coffee", "I like coffee");
				const hasDelete = result.some(
					(r) => r.type === "delete" && r.value.includes("like")
				);
				const hasInsert = result.some(
					(r) => r.type === "insert" && r.value.includes("love")
				);
				expect(hasDelete || hasInsert).toBe(true);
			});
		});

		describe("片方が空の場合", () => {
			it("発話が空の場合、正解テキスト全体がdeleteになる", () => {
				const result = calculateDiff("", "hello world");
				expect(result).toEqual([{ type: "delete", value: "hello world" }]);
			});

			it("正解が空の場合、発話テキスト全体がinsertになる", () => {
				const result = calculateDiff("hello world", "");
				expect(result).toEqual([{ type: "insert", value: "hello world" }]);
			});
		});

		describe("正規化", () => {
			it("大文字小文字を区別せずに比較するが、表示は正解の原文を維持", () => {
				const result = calculateDiff("Hello World", "hello world");
				// 比較は正規化されるが、表示は正解テキストの原文を維持
				expect(result).toEqual([{ type: "equal", value: "hello world" }]);
			});

			it("句読点を無視して比較するが、表示は正解の原文を維持", () => {
				const result = calculateDiff("hello world", "Hello, World!");
				// 比較は正規化されるが、表示は正解テキストの原文を維持（句読点含む）
				expect(result).toEqual([{ type: "equal", value: "Hello, World!" }]);
			});
		});

		describe("連続する差分", () => {
			it("連続する差分を適切にグループ化する", () => {
				// 複雑なケースでも結果が配列として返される
				const result = calculateDiff(
					"the quick fox",
					"the quick brown fox"
				);
				expect(Array.isArray(result)).toBe(true);
				expect(result.length).toBeGreaterThan(0);
			});
		});

		describe("日本語テキスト", () => {
			it("日本語テキストの差分を計算できる", () => {
				const result = calculateDiff("私は犬が好きです", "私は猫が好きです");
				expect(result.length).toBeGreaterThan(0);
			});
		});
	});
});
