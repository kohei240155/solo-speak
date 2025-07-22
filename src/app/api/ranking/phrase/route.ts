import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    console.log('Phrase ranking API called')
    
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'
    
    console.log('Parameters:', { language })

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user
    console.log('User authenticated:', user.id)

    // 言語コードから言語IDを取得
    const languageRecord = await prisma.language.findFirst({
      where: {
        code: language
      }
    })

    if (!languageRecord) {
      console.log('Language not found:', language)
      return NextResponse.json({
        success: false,
        error: 'Language not found'
      }, { status: 400 })
    }

    const languageId = languageRecord.id
    console.log('Language mapping:', { code: language, id: languageId })

    // 指定された言語のフレーズ数をユーザー別に集計
    const phraseCounts = await prisma.phrase.groupBy({
      by: ['userId'],
      where: {
        languageId: languageId,
        deletedAt: null // 削除されていないフレーズのみ
      },
      _count: {
        id: true
      }
    })

    console.log('Phrase counts:', phraseCounts)

    // ユーザー情報を取得してランキングデータを作成
    const userIds = phraseCounts.map(pc => pc.userId)
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        }
      },
      select: {
        id: true,
        username: true,
        iconUrl: true
      }
    })

    console.log('Users found:', users.length)

    // ランキングデータを作成
    const rankingData = phraseCounts.map(pc => {
      const userData = users.find(u => u.id === pc.userId)
      return {
        userId: pc.userId,
        username: userData?.username || 'Unknown User',
        iconUrl: userData?.iconUrl,
        count: pc._count.id
      }
    })

    // カウント順でソート
    rankingData.sort((a, b) => b.count - a.count)

    // ランクを付与
    const topUsers = rankingData.map((user, index) => ({
      rank: index + 1,
      userId: user.userId,
      username: user.username,
      iconUrl: user.iconUrl,
      count: user.count
    }))

    console.log('Top users:', topUsers)

    // 現在のユーザーの情報を取得
    const currentUser = topUsers.find(u => u.userId === user.id) || null

    console.log('Current user ranking:', currentUser)

    return NextResponse.json({
      success: true,
      topUsers,
      currentUser
    })

  } catch (error) {
    console.error('Phrase ranking error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
