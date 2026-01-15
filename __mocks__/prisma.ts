/**
 * Prismaクライアントのモック
 *
 * 使用例:
 * ```typescript
 * import { prismaMock } from '@/__mocks__/prisma'
 *
 * beforeEach(() => {
 *   jest.clearAllMocks()
 * })
 *
 * test('ユーザーを取得できる', async () => {
 *   const mockUser = { id: '1', email: 'test@example.com' }
 *   prismaMock.user.findUnique.mockResolvedValue(mockUser)
 *
 *   // テスト対象の関数を呼び出し
 *   const result = await getUser('1')
 *
 *   expect(result).toEqual(mockUser)
 * })
 * ```
 */

// Prismaの主要モデルのモック
const createModelMock = () => ({
  findUnique: jest.fn(),
  findFirst: jest.fn(),
  findMany: jest.fn(),
  create: jest.fn(),
  createMany: jest.fn(),
  update: jest.fn(),
  updateMany: jest.fn(),
  upsert: jest.fn(),
  delete: jest.fn(),
  deleteMany: jest.fn(),
  count: jest.fn(),
  aggregate: jest.fn(),
  groupBy: jest.fn(),
})

export const prismaMock = {
  user: createModelMock(),
  phrase: createModelMock(),
  phraseLevel: createModelMock(),
  language: createModelMock(),
  quiz: createModelMock(),
  quizQuestion: createModelMock(),
  speakingPractice: createModelMock(),
  speech: createModelMock(),
  speechStatus: createModelMock(),
  speechFeedback: createModelMock(),
  subscription: createModelMock(),
  $transaction: jest.fn((fn) => fn(prismaMock)),
  $connect: jest.fn(),
  $disconnect: jest.fn(),
}

// @/utils/prisma のモック
export const prisma = prismaMock
