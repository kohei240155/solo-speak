/**
 * 回答送信API（POST /api/phrase/practice/answer）のテスト
 * @jest-environment node
 */

import { NextRequest } from "next/server";
import { POST } from "./route";

// Prismaのモック
jest.mock("@/utils/prisma", () => ({
	prisma: {
		phrase: {
			findUnique: jest.fn(),
			update: jest.fn(),
		},
		practiceLog: {
			create: jest.fn(),
		},
		user: {
			findUnique: jest.fn(),
		},
		$transaction: jest.fn(),
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

describe("POST /api/phrase/practice/answer", () => {
	beforeEach(() => {
		jest.clearAllMocks();
	});

	const createRequest = (body: Record<string, unknown>) => {
		return new NextRequest("http://localhost/api/phrase/practice/answer", {
			method: "POST",
			body: JSON.stringify(body),
			headers: {
				"Content-Type": "application/json",
			},
		});
	};

	const mockUser = {
		id: "user-1",
		email: "test@example.com",
		timezone: "Asia/Tokyo",
	};

	const mockPhrase = {
		id: "phrase-1",
		userId: "user-1",
		original: "I would like to have a coffee",
		translation: "コーヒーを一杯いただきたいです",
		practiceCorrectCount: 2,
		practiceIncorrectCount: 1,
		lastPracticeDate: null,
	};

	describe("正常系", () => {
		beforeEach(() => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
		});

		it("80%以上一致で正解判定、practiceCorrectCount +1", async () => {
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(mockPhrase);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue({
							...mockPhrase,
							practiceCorrectCount: 3,
						}),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "I would like to have a coffee", // 完全一致
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.correct).toBe(true);
			expect(data.similarity).toBeGreaterThanOrEqual(0.9);
			expect(data.newCorrectCount).toBe(3);
		});

		it("90%未満で不正解判定、正解カウント変更なし", async () => {
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(mockPhrase);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue({
							...mockPhrase,
							practiceIncorrectCount: 2,
						}),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "completely different text",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.success).toBe(true);
			expect(data.correct).toBe(false);
			expect(data.similarity).toBeLessThan(0.9);
			expect(data.newCorrectCount).toBe(2); // 変更なし
		});

		it("5回目の正解でisMastered: true", async () => {
			const almostMasteredPhrase = { ...mockPhrase, practiceCorrectCount: 4 };
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(
				almostMasteredPhrase
			);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue({
							...almostMasteredPhrase,
							practiceCorrectCount: 5,
						}),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "I would like to have a coffee",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.correct).toBe(true);
			expect(data.newCorrectCount).toBe(5);
			expect(data.isMastered).toBe(true);
		});

		it("差分情報が正しく返される", async () => {
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(mockPhrase);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue(mockPhrase),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "I would like to have coffee", // "a" が欠落
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.diffResult).toBeDefined();
			expect(Array.isArray(data.diffResult)).toBe(true);
		});

		it("本日すでに正解済みの場合、カウントは増えないが正解判定はする", async () => {
			const todayPracticedPhrase = {
				...mockPhrase,
				lastPracticeDate: new Date(), // 今日
			};
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(
				todayPracticedPhrase
			);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue(todayPracticedPhrase),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "I would like to have a coffee",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.correct).toBe(true);
			// 正解カウントは増えない
			expect(data.newCorrectCount).toBe(2);
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
				phraseId: "phrase-1",
				transcript: "test",
				mode: "normal",
			});
			const response = await POST(request);

			expect(response.status).toBe(401);
		});

		it("存在しないphraseIdで404を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(null);

			const request = createRequest({
				phraseId: "nonexistent",
				transcript: "test",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(404);
			expect(data.error).toBeDefined();
		});

		it("他ユーザーのフレーズで403を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue({
				...mockPhrase,
				userId: "other-user",
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "test",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(403);
			expect(data.error).toBeDefined();
		});

		it("必須パラメータがない場合400を返す", async () => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });

			const request = createRequest({
				phraseId: "phrase-1",
				// transcript missing
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(400);
			expect(data.error).toBeDefined();
		});
	});

	describe("境界値テスト", () => {
		beforeEach(() => {
			mockAuthenticateRequest.mockResolvedValue({ user: mockUser });
			(mockPrisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
		});

		it("一致率ちょうど80%で正解", async () => {
			// "hello world" vs "helloXworld" のような80%一致
			const testPhrase = { ...mockPhrase, original: "abcde" };
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(testPhrase);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue({
							...testPhrase,
							practiceCorrectCount: 3,
						}),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "abcdx", // 4/5 = 80%一致
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.correct).toBe(true);
		});

		it("空文字の発話で不正解", async () => {
			(mockPrisma.phrase.findUnique as jest.Mock).mockResolvedValue(mockPhrase);
			(mockPrisma.$transaction as jest.Mock).mockImplementation(async (fn) => {
				return fn({
					phrase: {
						update: jest.fn().mockResolvedValue({
							...mockPhrase,
							practiceIncorrectCount: 2,
						}),
					},
					practiceLog: {
						create: jest.fn().mockResolvedValue({}),
					},
				});
			});

			const request = createRequest({
				phraseId: "phrase-1",
				transcript: "",
				mode: "normal",
			});
			const response = await POST(request);
			const data = await response.json();

			expect(response.status).toBe(200);
			expect(data.correct).toBe(false);
			expect(data.similarity).toBe(0);
		});
	});
});
