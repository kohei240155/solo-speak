import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/utils/spabase'
import { createServerSupabaseClient } from '@/utils/supabase-server'
import { PrismaClient } from '@/generated/prisma/client'

// Prismaクライアントの初期化を改善
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
})

// ユーザー設定取得
export async function GET(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    // サーバーサイドクライアントを使用してより確実な認証を実行
    const serverSupabase = createServerSupabaseClient()
    const { data: { user }, error } = await serverSupabase.auth.getUser(token)

    if (error || !user) {
      console.log('認証エラー:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
    }

    const userSettings = await prisma.user.findUnique({
      where: { id: user.id },
      include: {
        nativeLanguage: true,
        defaultLearningLanguage: true,
      }
    })

    if (!userSettings) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json(userSettings)
  } catch (error) {
    console.error('Error getting user settings:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// ユーザー設定登録
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/settings called')
    
    // データベース接続テスト
    try {
      await prisma.$connect()
      console.log('Database connection successful')
    } catch (dbError) {
      console.error('Database connection failed:', dbError)
      return NextResponse.json({ 
        error: 'Database connection failed',
        details: dbError instanceof Error ? dbError.message : 'Unknown database error'
      }, { status: 500 })
    }
    
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      console.log('No authorization header')
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      console.log('Invalid token or user:', error)
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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
    if (!username || !nativeLanguageId || !defaultLearningLanguageId) {
      console.log('Missing required fields')
      return NextResponse.json({ 
        error: 'Required fields: username, nativeLanguageId, defaultLearningLanguageId' 
      }, { status: 400 })
    }

    // ユーザーが既に存在するかチェック
    const existingUser = await prisma.user.findUnique({
      where: { id: user.id }
    })

    let result
    if (existingUser) {
      console.log('User already exists, updating...')
      // 既存ユーザーの場合は更新
      result = await prisma.user.update({
        where: { id: user.id },
        data: {
          username,
          iconUrl,
          nativeLanguageId,
          defaultLearningLanguageId,
          birthdate: birthdate ? new Date(birthdate) : null,
          gender,
          email: user.email || email,
          defaultQuizCount: defaultQuizCount || 10,
        },
        include: {
          nativeLanguage: true,
          defaultLearningLanguage: true,
        }
      })
      console.log('User updated successfully')
    } else {
      console.log('Creating new user...')
      // 新規ユーザーの場合は作成
      result = await prisma.user.create({
        data: {
          id: user.id,
          email: user.email || email,
          username,
          iconUrl,
          nativeLanguageId,
          defaultLearningLanguageId,
          birthdate: birthdate ? new Date(birthdate) : null,
          gender,
          defaultQuizCount: defaultQuizCount || 10,
        },
        include: {
          nativeLanguage: true,
          defaultLearningLanguage: true,
        }
      })
      console.log('User created successfully')
    }

    return NextResponse.json(result, { status: existingUser ? 200 : 201 })
  } catch (error) {
    console.error('Error in POST /api/user/settings:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined
    })
    
    return NextResponse.json({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}

// ユーザー設定更新
export async function PUT(request: NextRequest) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json({ error: 'Authorization header required' }, { status: 401 })
    }

    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error } = await supabase.auth.getUser(token)

    if (error || !user) {
      return NextResponse.json({ error: 'Invalid token' }, { status: 401 })
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

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        username,
        iconUrl,
        nativeLanguageId,
        defaultLearningLanguageId,
        birthdate: birthdate ? new Date(birthdate) : null,
        gender,
        email,
        defaultQuizCount,
      },
      include: {
        nativeLanguage: true,
        defaultLearningLanguage: true,
      }
    })

    return NextResponse.json(updatedUser)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
