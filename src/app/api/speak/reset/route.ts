import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { language } = await request.json()

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // 指定された言語が存在するか確認
    const languageExists = await prisma.language.findUnique({
      where: { code: language }
    })

    if (!languageExists) {
      return NextResponse.json({
        success: false,
        message: `Language with code '${language}' not found`
      }, { status: 400 })
    }

    // ユーザーの指定言語のすべてのフレーズのsessionSpokenフラグをリセット
    const updateResult = await prisma.phrase.updateMany({
      where: {
        userId: authResult.user.id,
        language: {
          code: language
        },
        deletedAt: null // 削除されていないフレーズのみ
      },
      data: {
        sessionSpoken: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Reset session spoken flags for ${updateResult.count} phrases`,
      updatedCount: updateResult.count
    })

  } catch (error) {
    console.error('Error resetting session spoken flags:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
