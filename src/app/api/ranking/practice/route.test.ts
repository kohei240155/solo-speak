/**
 * Practiceランキング API（GET /api/ranking/practice）のテスト
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { GET } from "./route";

// Prismaのモック
jest.mock("@/utils/prisma", () => ({
	prisma: {
		language: {
			findFirst: jest.fn(),
		},
		phrase: {
			groupBy: jest.fn(),
			findMany: jest.fn(),
		},
		practiceLog: {
			findMany: jest.fn(),
		},
		user: {
			findMany: jest.fn(),
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

describe("GET /api/ranking/practice", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const createRequest = (params: Record<string, string>) => {
		const url = new URL("http://localhost/api/ranking/practice");
		Object.entries(params).forEach(([key, value]) => {
			url.searchParams.set(key, value);
		});
		return new NextRequest(url);
	};

	const mockUser = {
		id: "user-1",
		username: "TestUser",
		iconUrl: null,
		createdAt: new Date("2026-01-01"),
	};

	const mockLanguage = {
		id: "lang-1",
		code: "en",
		name: "English",
	};

	describe("正常系", () => {
		beforeEach(() => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.language.findFirst as jest.Mock).mockResolvedValue(
				mockLanguage
			);
		});

		it("マスター数ランキングを取得できる", async () => {
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue([
				{
					userId: "user-1",
					practiceCorrectCount: 5,
					user: mockUser,
				},
				{
					userId: "user-2",
					practiceCorrectCount: 5,
					user: {
						id: "user-2",
						username: "User2",
						iconUrl: null,
						createdAt: new Date(),
					},
				},
			]);

			const request = createRequest({
				languageId: "lang-1",
				type: "master",
				period: "total",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.rankings).toBeDefined();
		});

		it("合計正解回数ランキングを取得できる", async () => {
			(mockPrisma.practiceLog.findMany as jest.Mock).mockResolvedValue([
				{
					userId: "user-1",
					correct: true,
					user: mockUser,
					phrase: { userId: "user-1" },
				},
			]);

			const request = createRequest({
				languageId: "lang-1",
				type: "total",
				period: "total",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
		});

		it("ユーザーの順位情報を含む", async () => {
			(mockPrisma.phrase.findMany as jest.Mock).mockResolvedValue([
				{
					userId: "user-1",
					practiceCorrectCount: 5,
					user: mockUser,
				},
			]);

			const request = createRequest({
				languageId: "lang-1",
				type: "master",
				period: "total",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.userRanking).toBeDefined();
		});
	});

	describe("異常系", () => {
		it("認証なしで401を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({
				error: new Response(JSON.stringify({ error: "Unauthorized" }), {
					status: 401,
				}),
			});

			const request = createRequest({
				languageId: "lang-1",
				type: "master",
				period: "total",
			});
			const response = await GET(request);

			expect(response.status).toBe(401);
		});

		it("languageIdがない場合400を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });

			const request = createRequest({
				type: "master",
				period: "total",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});

		it("無効なtypeで400を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });

			const request = createRequest({
				languageId: "lang-1",
				type: "invalid",
				period: "total",
			});
			const response = await GET(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});
	});
});
