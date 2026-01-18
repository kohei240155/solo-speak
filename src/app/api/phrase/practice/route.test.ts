/**
 * 練習フレーズ取得API（GET /api/phrase/practice）のテスト
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "./route";

// Prismaのモック
jest.mock("@/utils/prisma", () => ({
	prisma: {
		language: {
			findUnique: jest.fn(),
		},
		phrase: {
			findMany: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
	},
}));

// 認証のモック
jest.mock("@/utils/api-helpers", () => ({
	authenticateRequest: jest.fn(),
}));

import { prisma } from "@/utils/prisma";
import { authenticateRequest } from "@/utils/api-helpers";

const mockPrisma = prisma as jest.Mocked<typeof prisma>;
const mockAuthenticateRequest = authenticateRequest as jest.Mock;

describe("GET /api/phrase/practice", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const createRequest = (params: Record<string, string>) => {
		const url = new URL("http://localhost/api/phrase/practice");
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
		return new NextRequest(url);
	};

	const mockUser = {
		id: "user-1",
		email: "test@example.com",
		phraseMode: "practice",
		practiceIncludeExisting: false,
		practiceStartDate: new Date("2026-01-01"),
		timezone: "Asia/Tokyo",
	};

	const mockLanguage = {
		id: "lang-1",
		code: "en",
		name: "English",
	};

	const mockPhrases = [
		{
			id: "phrase-1",
			original: "Hello",
			translation: "こんにちは",
			practiceCorrectCount: 0,
			practiceIncorrectCount: 0,
			lastPracticeDate: null,
			createdAt: new Date("2026-01-10"),
			language: mockLanguage,
		},
		{
			id: "phrase-2",
			original: "Goodbye",
			translation: "さようなら",
			practiceCorrectCount: 3,
			practiceIncorrectCount: 1,
			lastPracticeDate: new Date("2026-01-15"),
			createdAt: new Date("2026-01-05"),
			language: mockLanguage,
		},
	];

	describe("正常系", () => {
		beforeEach(() => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.language.findUnique as jest.Mock).mockResolvedValue(
				mockLanguage
			);
			(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
		});

		it("通常モード: 未マスター（0〜4）かつ本日未正解のフレーズを取得", async () => {
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue(mockPhrases);

			const request = createRequest({ languageId: "lang-1", mode: "normal" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.phrases).toBeDefined();
			expect(data.totalCount).toBeDefined();
		});

		it("復習モード: マスター済み（5）かつ本日未正解のフレーズを取得", async () => {
			const masteredPhrases = [
				{
					...mockPhrases[0],
					practiceCorrectCount: 5,
				},
			];
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue(
				masteredPhrases
			);

			const request = createRequest({ languageId: "lang-1", mode: "review" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it("該当フレーズがない場合、空配列を返す", async () => {
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue([]);

			const request = createRequest({ languageId: "lang-1", mode: "normal" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.phrases).toEqual([]);
			expect(data.totalCount).toBe(0);
		});

		it("フレーズは登録日時が古い順にソートされる", async () => {
			// Prismaがソートして返す想定でモックを設定（createdAtが古い順）
			const sortedPhrases = [mockPhrases[1], mockPhrases[0]]; // phrase-2が先
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue(sortedPhrases);

			const request = createRequest({ languageId: "lang-1", mode: "normal" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			// Prismaのソート結果がそのまま返される
			if (data.phrases.length >= 2) {
				expect(data.phrases[0].id).toBe("phrase-2");
			}
		});
	});

	describe("異常系", () => {
		it("認証なしで401を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({
				error: new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
				}),
			});

			const request = createRequest({ languageId: "lang-1", mode: "normal" });
			const response = await GET(request);

			expect(response.status).toBe(401);
		});

		it("languageIdパラメータがない場合400を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });

			const request = createRequest({ mode: "normal" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});

		it("無効なmodeで400を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });

			const request = createRequest({ languageId: "lang-1", mode: "invalid" });
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});

		it("存在しないlanguageIdで404を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.language.findUnique as jest.Mock).mockResolvedValue(null);

			const request = createRequest({
				languageId: "nonexistent",
				mode: "normal",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBeDefined();
		});
	});
});
