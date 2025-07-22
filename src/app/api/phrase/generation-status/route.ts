import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user: supabaseUser } = authResult

    // Prismaからユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { email: supabaseUser.email! },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    const currentTime = new Date()
    const todayStart = new Date(currentTime.getFullYear(), currentTime.getMonth(), currentTime.getDate())
    const tomorrowStart = new Date(todayStart)
    tomorrowStart.setDate(tomorrowStart.getDate() + 1)

    // 今日作成したフレーズ数をチェック
    const todayPhrasesCount = await prisma.phrase.count({
      where: {
        userId: user.id,
        createdAt: {
          gte: todayStart,
          lt: tomorrowStart
        },
        deletedAt: null
      }
    })

    // 残り生成回数の計算（翌日復活ロジック付き）
    let remainingGenerations = user.remainingPhraseGenerations

    if (user.lastSpeakingDate) {
      const lastSpeakingDate = new Date(user.lastSpeakingDate)
      const lastSpeakingDay = new Date(lastSpeakingDate.getFullYear(), lastSpeakingDate.getMonth(), lastSpeakingDate.getDate())
      
      // 最後のスピーキング日が今日より前の場合、残り回数をリセット
      if (lastSpeakingDay.getTime() < todayStart.getTime()) {
        remainingGenerations = 5 // 毎日5回にリセット
        
        // データベースも更新
        await prisma.user.update({
          where: { id: user.id },
          data: {
            remainingPhraseGenerations: 5
          }
        })
      }
    } else {
      // 初回の場合も5回に設定
      remainingGenerations = 5
      await prisma.user.update({
        where: { id: user.id },
        data: {
          remainingPhraseGenerations: 5
        }
      })
    }

    // 実際の今日のフレーズ数と比較して、より少ない方を使用
    const actualRemaining = Math.max(0, 5 - todayPhrasesCount)
    const finalRemaining = Math.min(remainingGenerations, actualRemaining)

    return NextResponse.json({
      remainingGenerations: finalRemaining,
      todayPhrasesCount,
      dailyLimit: 5,
      nextResetTime: tomorrowStart.toISOString(),
      canGenerate: finalRemaining > 0
    })

  } catch (error) {
    console.error('Error fetching phrase generation status:', error)
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
