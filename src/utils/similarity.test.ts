/**
 * 一致度判定ユーティリティのテスト
 */

import { calculateSimilarity, normalizeText } from "./similarity";

describe("similarity utilities", () => {
	describe("normalizeText", () => {
		it("大文字を小文字に変換する", () => {
			expect(normalizeText("Hello World")).toBe("hello world");
		});

		it("句読点を削除する", () => {
			expect(normalizeText("Hello, world!")).toBe("hello world");
			expect(normalizeText("What's up?")).toBe("whats up");
		});

		it("余分な空白を正規化する", () => {
			expect(normalizeText("hello   world")).toBe("hello world");
			expect(normalizeText("  hello world  ")).toBe("hello world");
		});

		it("複合的な正規化を行う", () => {
			expect(normalizeText("  Hello,  WORLD!  ")).toBe("hello world");
		});
	});

	describe("calculateSimilarity", () => {
		describe("基本的なケース", () => {
			it("完全一致の場合は1.0を返す", () => {
				expect(calculateSimilarity("hello world", "hello world")).toBe(1.0);
			});

			it("完全不一致の場合は0.0を返す", () => {
				expect(calculateSimilarity("abc", "xyz")).toBe(0.0);
			});

			it("空文字同士の比較は1.0を返す", () => {
				expect(calculateSimilarity("", "")).toBe(1.0);
			});

			it("片方が空文字の場合は0.0を返す", () => {
				expect(calculateSimilarity("hello", "")).toBe(0.0);
				expect(calculateSimilarity("", "hello")).toBe(0.0);
			});
		});

		describe("部分一致", () => {
			it("1文字違いで正しい一致率を返す", () => {
				// "hello" vs "hallo" → 4/5 = 0.8
				const similarity = calculateSimilarity("hello", "hallo");
				expect(similarity).toBeCloseTo(0.8, 1);
			});

			it("単語の欠落で正しい一致率を返す", () => {
				// "I would like to have a coffee" vs "I would like to have coffee"
				// 7単語中6単語一致 → 約0.86
				const similarity = calculateSimilarity(
					"I would like to have a coffee",
					"I would like to have coffee"
				);
				expect(similarity).toBeGreaterThan(0.8);
				expect(similarity).toBeLessThan(1.0);
			});

			it("単語の追加で正しい一致率を返す", () => {
				// "hello world" vs "hello beautiful world"
				const similarity = calculateSimilarity(
					"hello world",
					"hello beautiful world"
				);
				expect(similarity).toBeGreaterThan(0.5);
				expect(similarity).toBeLessThan(1.0);
			});
		});

		describe("正規化", () => {
			it("大文字小文字を無視して判定する", () => {
				expect(calculateSimilarity("Hello World", "hello world")).toBe(1.0);
				expect(calculateSimilarity("HELLO", "hello")).toBe(1.0);
			});

			it("句読点を無視して判定する", () => {
				expect(calculateSimilarity("Hello, world!", "hello world")).toBe(1.0);
				expect(
					calculateSimilarity("What's up?", "whats up")
				).toBe(1.0);
			});

			it("余分な空白を無視して判定する", () => {
				expect(calculateSimilarity("hello   world", "hello world")).toBe(1.0);
				expect(calculateSimilarity("  hello world  ", "hello world")).toBe(1.0);
			});
		});

		describe("境界値テスト", () => {
			it("一致率ちょうど80%のケース", () => {
				// 5文字中4文字一致 = 0.8
				const similarity = calculateSimilarity("abcde", "abcdx");
				expect(similarity).toBeCloseTo(0.8, 1);
			});

			it("一致率が80%未満のケース", () => {
				// 5文字中3文字一致 = 0.6
				const similarity = calculateSimilarity("abcde", "abxyz");
				expect(similarity).toBeLessThan(0.8);
			});

			it("長いテキストの一致度を正しく計算する", () => {
				const text1 = "The quick brown fox jumps over the lazy dog";
				const text2 = "The quick brown fox jumps over the lazy cat";
				const similarity = calculateSimilarity(text1, text2);
				expect(similarity).toBeGreaterThan(0.8);
				expect(similarity).toBeLessThan(1.0);
			});
		});

		describe("多言語対応", () => {
			it("日本語テキストの一致度を計算できる", () => {
				expect(calculateSimilarity("こんにちは", "こんにちは")).toBe(1.0);
				expect(calculateSimilarity("こんにちは", "こんばんは")).toBeLessThan(
					1.0
				);
			});

			it("アクセント記号付き文字を処理できる", () => {
				expect(calculateSimilarity("café", "cafe")).toBeGreaterThan(0.5);
			});
		});
	});
});
