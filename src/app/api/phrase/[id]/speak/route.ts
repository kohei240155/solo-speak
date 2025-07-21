import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id } = await params

    // フレーズを取得（削除されていないもののみ、認証されたユーザーのもののみ）
    const phrase = await prisma.phrase.findUnique({
      where: { 
        id,
        userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
        deletedAt: null // 削除されていないフレーズのみ
      },
      include: {
        language: true
      }
    })

    if (!phrase) {
      return NextResponse.json({
        success: false,
        message: 'Phrase not found or access denied'
      }, { status: 404 })
    }

    // 今日の音読回数を計算
    const dailyReadCount = phrase.dailyReadCount || 0

    return NextResponse.json({
      success: true,
      phrase: {
        id: phrase.id,
        text: phrase.text,
        translation: phrase.translation,
        totalReadCount: phrase.totalReadCount || 0,
        dailyReadCount: dailyReadCount,
        languageCode: phrase.language.code
      }
    })

  } catch (error) {
    console.error('Error fetching specific phrase for speak:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
