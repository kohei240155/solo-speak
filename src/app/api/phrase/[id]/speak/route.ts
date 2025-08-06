import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { isDayChanged } from '@/utils/date-helpers'

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

    const currentDate = new Date()

    // デバッグ用ログ - 日付変更判定前
    console.log('Single phrase API - Date check details:', {
      phraseId: phrase.id.substring(0, 10),
      lastSpeakDate: phrase.lastSpeakDate,
      currentDate: currentDate,
      dbDailySpeakCount: phrase.dailySpeakCount
    })

    // 日付が変わった場合はdailySpeakCountを0として扱う
    const isDayChangedFlag = isDayChanged(phrase.lastSpeakDate, currentDate)
    // 暫定的に、常にDBの実際の値を返す（日付変更判定は一時的に無効化）
    const dailySpeakCount = phrase.dailySpeakCount || 0
    // const dailySpeakCount = isDayChangedFlag ? 0 : (phrase.dailySpeakCount || 0)

    console.log('Single phrase API - Final values:', {
      isDayChanged: isDayChangedFlag,
      dbValue: phrase.dailySpeakCount,
      finalValue: dailySpeakCount
    })

    return NextResponse.json({
      success: true,
      phrase: {
        id: phrase.id,
        original: phrase.original,
        translation: phrase.translation,
        explanation: phrase.explanation,
        totalSpeakCount: phrase.totalSpeakCount || 0,
        dailySpeakCount: dailySpeakCount,
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
