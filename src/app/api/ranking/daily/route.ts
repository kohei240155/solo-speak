import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

interface DailyRankingData {
  userId: string
  username: string
  iconUrl: string | null
  totalCount: number
  rank: number
}

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const url = new URL(request.url)
    const date = url.searchParams.get('date') // YYYY-MM-DD形式
    
    // 指定された日付、または指定がない場合は今日の日付を使用
    const targetDate = date ? new Date(date) : new Date()
    const startOfDay = new Date(targetDate)
    startOfDay.setHours(0, 0, 0, 0)
    
    const endOfDay = new Date(targetDate)
    endOfDay.setHours(23, 59, 59, 999)

    // 指定された日の音読回数を集計
    const dailyStats = await prisma.speakLog.groupBy({
      by: ['phraseId'],
      where: {
        date: {
          gte: startOfDay,
          lte: endOfDay
        }
      },
      _sum: {
        count: true
      }
    })

    // phraseIdからuserIdを取得し、ユーザーごとに集計
    const phraseIds = dailyStats.map(stat => stat.phraseId)
    const phrases = await prisma.phrase.findMany({
      where: {
        id: {
          in: phraseIds
        }
      },
      select: {
        id: true,
        userId: true
      }
    })

    // ユーザーごとの合計カウントを計算
    const userCounts = new Map<string, number>()
    dailyStats.forEach(stat => {
      const phrase = phrases.find(p => p.id === stat.phraseId)
      if (phrase) {
        const currentCount = userCounts.get(phrase.userId) || 0
        userCounts.set(phrase.userId, currentCount + (stat._sum.count || 0))
      }
    })

    // ユーザー情報を取得
    const userIds = Array.from(userCounts.keys())
    const users = await prisma.user.findMany({
      where: {
        id: {
          in: userIds
        },
        deletedAt: null
      },
      select: {
        id: true,
        username: true,
        iconUrl: true
      }
    })

    // ランキングデータを作成
    const rankingData: DailyRankingData[] = users
      .map(user => ({
        userId: user.id,
        username: user.username,
        iconUrl: user.iconUrl,
        totalCount: userCounts.get(user.id) || 0
      }))
      .sort((a, b) => b.totalCount - a.totalCount) // 降順でソート
      .map((user, index) => ({
        ...user,
        rank: index + 1
      }))

    return NextResponse.json({
      success: true,
      data: rankingData,
      date: targetDate.toISOString().split('T')[0] // YYYY-MM-DD形式で返す
    })

  } catch (error) {
    console.error('Error fetching daily ranking:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
