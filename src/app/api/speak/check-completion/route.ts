import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')

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

    // ユーザーの指定言語のフレーズを取得し、session_spokenの状態をチェック
    const phrases = await prisma.phrase.findMany({
      where: {
        userId: authResult.user.id,
        language: {
          code: language
        },
        deletedAt: null // 削除されていないフレーズのみ
      },
      select: {
        id: true,
        sessionSpoken: true
      }
    })

    // フレーズが存在しない場合
    if (phrases.length === 0) {
      return NextResponse.json({
        success: true,
        allSpoken: true,
        totalCount: 0,
        spokenCount: 0
      })
    }

    // 全てのフレーズがsession_spoken=trueかチェック
    const spokenCount = phrases.filter(phrase => phrase.sessionSpoken).length
    const allSpoken = spokenCount === phrases.length

    return NextResponse.json({
      success: true,
      allSpoken,
      totalCount: phrases.length,
      spokenCount
    })

  } catch (error) {
    console.error('Error checking speak completion:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
