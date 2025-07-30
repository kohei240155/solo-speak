import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language') || 'en'

    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const user = authResult.user

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [languageRecord, allPhraseCounts] = await Promise.all([
      // 言語コードから言語IDを取得
      prisma.language.findFirst({
        where: {
          code: language
        }
      }),
      
      // 全言語のフレーズ数を事前に取得（後でフィルタリング）
      prisma.phrase.groupBy({
        by: ['userId', 'languageId'],
        where: {
          deletedAt: null // 削除されていないフレーズのみ
        },
        _count: {
          id: true
        }
      })
    ])

    if (!languageRecord) {
      return NextResponse.json({
        success: false,
        error: 'Language not found'
      }, { status: 400 })
    }

    const languageId = languageRecord.id

    // 指定された言語のフレーズ数のみをフィルタリング
    const phraseCounts = allPhraseCounts.filter(pc => pc.languageId === languageId)

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
        iconUrl: true,
        createdAt: true // ユーザー登録日時を取得
      }
    })

    // ランキングデータを作成
    const rankingData = phraseCounts.map(pc => {
      const userData = users.find(u => u.id === pc.userId)
      return {
        userId: pc.userId,
        username: userData?.username || 'Unknown User',
        iconUrl: userData?.iconUrl,
        count: pc._count.id,
        createdAt: userData?.createdAt || new Date()
      }
    })

    // カウント順でソート（同数の場合は登録日時が古い方が上位）
    rankingData.sort((a, b) => {
      if (b.count === a.count) {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      }
      return b.count - a.count
    })

    // ランクを付与（上位50位まで）
    const topUsers = rankingData
      .slice(0, 50) // 上位50位まで制限
      .map((user, index) => ({
        rank: index + 1,
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        count: user.count
      }))

    // 現在のユーザーの情報を取得
    const currentUser = topUsers.find(u => u.userId === user.id) || null

    return NextResponse.json({
      success: true,
      topUsers,
      currentUser
    })

  } catch {
    return NextResponse.json({ 
      success: false, 
      error: 'Internal server error'
    }, { status: 500 })
  }
}
