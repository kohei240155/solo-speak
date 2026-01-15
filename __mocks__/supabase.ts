/**
 * Supabaseクライアントのモック
 *
 * 使用例:
 * ```typescript
 * import { supabaseMock, mockUser } from '@/__mocks__/supabase'
 *
 * beforeEach(() => {
 *   jest.clearAllMocks()
 * })
 *
 * test('認証済みユーザーを取得できる', async () => {
 *   supabaseMock.auth.getUser.mockResolvedValue({
 *     data: { user: mockUser },
 *     error: null,
 *   })
 *
 *   // テスト対象の関数を呼び出し
 * })
 * ```
 */

// テスト用のモックユーザー
export const mockUser = {
  id: 'test-user-id',
  email: 'test@example.com',
  app_metadata: {},
  user_metadata: {},
  aud: 'authenticated',
  created_at: new Date().toISOString(),
}

// Supabaseクライアントのモック
export const supabaseMock = {
  auth: {
    getUser: jest.fn(),
    getSession: jest.fn(),
    signInWithPassword: jest.fn(),
    signInWithOAuth: jest.fn(),
    signOut: jest.fn(),
    onAuthStateChange: jest.fn(() => ({
      data: { subscription: { unsubscribe: jest.fn() } },
    })),
  },
  from: jest.fn(() => ({
    select: jest.fn().mockReturnThis(),
    insert: jest.fn().mockReturnThis(),
    update: jest.fn().mockReturnThis(),
    delete: jest.fn().mockReturnThis(),
    eq: jest.fn().mockReturnThis(),
    neq: jest.fn().mockReturnThis(),
    gt: jest.fn().mockReturnThis(),
    gte: jest.fn().mockReturnThis(),
    lt: jest.fn().mockReturnThis(),
    lte: jest.fn().mockReturnThis(),
    like: jest.fn().mockReturnThis(),
    ilike: jest.fn().mockReturnThis(),
    is: jest.fn().mockReturnThis(),
    in: jest.fn().mockReturnThis(),
    order: jest.fn().mockReturnThis(),
    limit: jest.fn().mockReturnThis(),
    range: jest.fn().mockReturnThis(),
    single: jest.fn(),
    maybeSingle: jest.fn(),
  })),
  storage: {
    from: jest.fn(() => ({
      upload: jest.fn(),
      download: jest.fn(),
      getPublicUrl: jest.fn(),
      remove: jest.fn(),
      list: jest.fn(),
    })),
  },
}

// createServerSupabaseClient のモック
export const createServerSupabaseClient = jest.fn(() => supabaseMock)
