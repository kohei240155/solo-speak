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
    const order = searchParams.get('order') || 'new_to_old'

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // モード設定をクエリパラメータから取得
    const config = {
      order
    }

    // データベースからフレーズを取得（削除されていないもののみ）
    // 認証されたユーザーのフレーズのみを取得
    const phrases = await prisma.phrase.findMany({
      where: {
        userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
        language: {
          code: language
        },
        deletedAt: null // 削除されていないフレーズのみ
      },
      include: {
        language: true
      }
    })

    if (phrases.length === 0) {
      return NextResponse.json({
        success: false,
        message: 'No phrases found for the specified language'
      })
    }

    // ソート処理
    const sortedPhrases = [...phrases]

    // 常に音読回数の少ない順を優先
    sortedPhrases.sort((a, b) => {
      const practiceA = a.totalReadCount || 0
      const practiceB = b.totalReadCount || 0
      
      // 音読回数が異なる場合は音読回数で優先
      if (practiceA !== practiceB) {
        return practiceA - practiceB // 少ない順
      }
      
      // 音読回数が同じ場合は日付順でソート
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      
      if (config.order === 'new_to_old') {
        return dateB - dateA // 新しい順
      } else {
        return dateA - dateB // 古い順
      }
    })

    // 最初のフレーズを返す
    const firstPhrase = sortedPhrases[0]

    // 今日の音読回数を計算
    const dailyReadCount = firstPhrase.dailyReadCount || 0

    return NextResponse.json({
      success: true,
      phrase: {
        id: firstPhrase.id,
        text: firstPhrase.text,
        translation: firstPhrase.translation,
        totalReadCount: firstPhrase.totalReadCount || 0,
        dailyReadCount: dailyReadCount,
        languageCode: firstPhrase.language.code
      }
    })

  } catch (error) {
    console.error('Error fetching speak phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
