import { NextRequest, NextResponse } from 'next/server'
import { 
  authenticateRequest, 
  validateUsername, 
  validateEmail, 
  validateBirthdate, 
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
import { Gender } from '@/generated/prisma'

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
    console.log('POST /api/user/settings called')
    
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    console.log('Request body:', body)
    
    const {
      username,
      iconUrl,
      nativeLanguageId,
      defaultLearningLanguageId,
      birthdate,
      gender,
      email,
      defaultQuizCount
    } = body

    // 必須フィールドのバリデーション
    const requiredValidation = validateRequiredFields(body, ['username', 'nativeLanguageId', 'defaultLearningLanguageId'])
    if (!requiredValidation.isValid) {
      console.log('Missing required fields')
      return NextResponse.json({ error: requiredValidation.error }, { status: 400 })
    }

    // ユーザーが既に存在するかチェック
    const existingUser = await checkUserExists(authResult.user.id)

    let result
    if (existingUser) {
      console.log('User already exists, updating...')
      result = await updateUserSettings(authResult.user.id, {
        username,
        iconUrl,
        nativeLanguageId,
        defaultLearningLanguageId,
        birthdate,
        gender: gender as Gender,
        email: authResult.user.email || email,
        defaultQuizCount: defaultQuizCount || 10,
      })
      console.log('User updated successfully')
    } else {
      console.log('Creating new user...')
      result = await createUserSettings(authResult.user, {
        username,
        iconUrl,
        nativeLanguageId,
        defaultLearningLanguageId,
        birthdate,
        gender: gender as Gender,
        email,
        defaultQuizCount: defaultQuizCount || 10,
      })
      console.log('User created successfully')
    }

    return NextResponse.json(result, { status: existingUser ? 200 : 201 })
  } catch (error) {
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
      birthdate,
      gender,
      email,
      defaultQuizCount
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
        console.log('Username already exists for another user')
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

    // 生年月日のバリデーション
    if (birthdate) {
      const birthdateValidation = validateBirthdate(birthdate)
      if (!birthdateValidation.isValid) {
        return NextResponse.json({ error: birthdateValidation.error }, { status: 400 })
      }
    }

    const updatedUser = await updateUserSettings(authResult.user.id, {
      username,
      iconUrl,
      nativeLanguageId,
      defaultLearningLanguageId,
      birthdate,
      gender: gender as Gender,
      email,
      defaultQuizCount,
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    return createErrorResponse(error, 'PUT /api/user/settings')
  }
}
