import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'

/**
 * ユーザーのフレーズ生成回数を取得し、日付リセットを実行
 */
export async function GET(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true,
        lastPhraseGenerationDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    let remainingGenerations = user.remainingPhraseGenerations
    const lastGenerationDate = user.lastPhraseGenerationDate

    // 日付リセットロジック
    const today = new Date()
    today.setHours(0, 0, 0, 0) // 今日の開始時刻に設定

    // lastPhraseGenerationDateが存在しない、または今日より前の場合
    if (!lastGenerationDate || new Date(lastGenerationDate) < today) {
      // フレーズ生成回数を5にリセット
      remainingGenerations = 5
      
      // データベースを更新
      await prisma.user.update({
        where: { id: userId },
        data: {
          remainingPhraseGenerations: 5,
          lastPhraseGenerationDate: new Date()
        }
      })
    }

    return NextResponse.json({
      remainingGenerations,
      lastGenerationDate: lastGenerationDate || null
    })

  } catch (error) {
    return createErrorResponse(error, 'GET /api/user/phrase-generations')
  }
}

/**
 * フレーズ生成時に回数を減らす
 */
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // 現在のユーザー情報を取得
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        remainingPhraseGenerations: true,
        lastPhraseGenerationDate: true
      }
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // 残り回数をチェック
    if (user.remainingPhraseGenerations <= 0) {
      return NextResponse.json({ error: 'No remaining generations' }, { status: 403 })
    }

    // 回数を1減らして更新
    const newRemainingGenerations = user.remainingPhraseGenerations - 1
    await prisma.user.update({
      where: { id: userId },
      data: {
        remainingPhraseGenerations: newRemainingGenerations,
        lastPhraseGenerationDate: new Date()
      }
    })

    return NextResponse.json({
      remainingGenerations: newRemainingGenerations
    })

  } catch (error) {
    return createErrorResponse(error, 'POST /api/user/phrase-generations')
  }
}
