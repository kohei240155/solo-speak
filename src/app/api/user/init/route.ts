import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { checkUserExists, initializeUser } from '@/utils/database-helpers'

/** * ユーザー初期化APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns { message: string, user?: User } - 初期化結果とユーザーデータ
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // リクエストボディから言語設定を取得
    let displayLanguage: string | undefined = undefined
    try {
      const body = await request.json()
      displayLanguage = body.displayLanguage
    } catch {
      // リクエストボディがない場合は無視
    }

    // ユーザーが既に存在するかチェック
    const userExists = await checkUserExists(user.id)
    
    if (userExists) {
      return NextResponse.json({ 
        message: 'User already exists'
      }, { status: 200 })
    }

    // 初期ユーザーデータを作成（言語設定を含む）
    const newUser = await initializeUser(user, displayLanguage)

    return NextResponse.json({
      message: 'User initialized successfully',
      user: newUser
    }, { status: 201 })

  } catch (error) {
    return createErrorResponse(error)
  }
}
