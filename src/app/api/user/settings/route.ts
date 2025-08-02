import { NextRequest, NextResponse } from 'next/server'
import { 
  authenticateRequest, 
  validateUsername, 
  validateEmail, 
  validateRequiredFields, 
  createErrorResponse 
} from '@/utils/api-helpers'
import { 
  getUserSettings, 
  createUserSettings, 
  updateUserSettings, 
  checkUserExists, 
  checkUsernameConflict 
} from '@/utils/database-helpers'
import { prisma } from '@/utils/prisma'

// ユーザー設定取得
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userSettings = await getUserSettings(authResult.user.id)

    if (!userSettings) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // ユーザー切り替え対応のためキャッシュを無効化
    const response = NextResponse.json(userSettings)
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    return response
  } catch (error) {
    return createErrorResponse(error, 'GET /api/user/settings')
  }
}

// ユーザー設定登録
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    
    const {
      username,
      iconUrl,
      nativeLanguageId,
      defaultLearningLanguageId,
      email
    } = body

    // 必須フィールドのバリデーション
    const requiredValidation = validateRequiredFields(body, ['username', 'nativeLanguageId', 'defaultLearningLanguageId'])
    if (!requiredValidation.isValid) {
      return NextResponse.json({ error: requiredValidation.error }, { status: 400 })
    }

    // 言語IDの存在確認
    try {
      const [nativeLanguage, learningLanguage] = await Promise.all([
        prisma.language.findUnique({ where: { id: nativeLanguageId } }),
        prisma.language.findUnique({ where: { id: defaultLearningLanguageId } })
      ])

      if (!nativeLanguage) {
        return NextResponse.json({ 
          error: `Native language with ID '${nativeLanguageId}' not found. Please select a valid language.` 
        }, { status: 400 })
      }

      if (!learningLanguage) {
        return NextResponse.json({ 
          error: `Learning language with ID '${defaultLearningLanguageId}' not found. Please select a valid language.` 
        }, { status: 400 })
      }
    } catch (error) {
      console.error('Error validating language IDs:', error)
      return NextResponse.json({ 
        error: 'Failed to validate language selection. Please try again.' 
      }, { status: 500 })
    }

    // ユーザーが既に存在するかチェック
    const existingUser = await checkUserExists(authResult.user.id)

    let result
    if (existingUser) {
      result = await updateUserSettings(authResult.user.id, {
        username,
        iconUrl,
        nativeLanguageId,
        defaultLearningLanguageId,
      })
    } else {
      result = await createUserSettings(authResult.user, {
        username,
        iconUrl,
        nativeLanguageId,
        defaultLearningLanguageId,
        email,
      })
    }

    return NextResponse.json(result, { status: existingUser ? 200 : 201 })
  } catch (error) {
    console.error('POST /api/user/settings - Detailed error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      timestamp: new Date().toISOString()
    })
    return createErrorResponse(error, 'POST /api/user/settings')
  }
}

// ユーザー設定更新
export async function PUT(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const {
      username,
      iconUrl,
      nativeLanguageId,
      defaultLearningLanguageId,
      email
    } = body

    // ユーザー名のバリデーション
    if (username) {
      const usernameValidation = validateUsername(username)
      if (!usernameValidation.isValid) {
        return NextResponse.json({ error: usernameValidation.error }, { status: 400 })
      }

      // ユーザー名の重複チェック
      const hasConflict = await checkUsernameConflict(username, authResult.user.id)
      if (hasConflict) {
        return NextResponse.json({ 
          error: 'このユーザー名は既に使用されています。別のユーザー名を選択してください。' 
        }, { status: 400 })
      }
    }

    // メールアドレスのバリデーション
    if (email) {
      const emailValidation = validateEmail(email)
      if (!emailValidation.isValid) {
        return NextResponse.json({ error: emailValidation.error }, { status: 400 })
      }
    }

    const updatedUser = await updateUserSettings(authResult.user.id, {
      username,
      iconUrl,
      nativeLanguageId,
      defaultLearningLanguageId,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return createErrorResponse(error, 'PUT /api/user/settings')
  }
}
