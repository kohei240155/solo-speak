import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { isDayChanged } from '@/utils/date-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id: phraseId } = await params

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Phrase ID is required' },
        { status: 400 }
      )
    }

    // リクエストボディから増加するカウント数を取得（デフォルトは1）
    const body = await request.json().catch(() => ({}))
    const countIncrement = Math.max(1, parseInt(body.count) || 1) // 最低1、最大値制限は必要に応じて追加

    // フレーズが存在するかチェック（認証されたユーザーのフレーズのみ）
    const existingPhrase = await prisma.phrase.findUnique({
      where: { 
        id: phraseId,
        userId: authResult.user.id // 認証されたユーザーのフレーズのみ
      }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    const currentDate = new Date()
    const isDayChangedFlag = isDayChanged(existingPhrase.lastSpeakDate, currentDate)

    // 日付が変わった場合は dailySpeakCount をリセット
    const dailyCountUpdate = isDayChangedFlag 
      ? countIncrement  // 新しい日なのでカウントをリセットして追加
      : { increment: countIncrement }  // 同じ日なので追加

    // トランザクションで音読回数の更新とspeak_logsの記録を同時に実行
    const updatedPhrase = await prisma.$transaction(async (prisma) => {
      // 音読回数を更新（指定された数だけ増加）
      const phrase = await prisma.phrase.update({
        where: { id: phraseId },
        data: {
          totalSpeakCount: {
            increment: countIncrement
          },
          dailySpeakCount: dailyCountUpdate,
          lastSpeakDate: currentDate,
          sessionSpoken: true // セッション中にSpeak練習済みとマーク
        },
        include: {
          language: true
        }
      })

      // speak_logsテーブルに記録を追加
      await prisma.speakLog.create({
        data: {
          phraseId: phraseId,
          date: currentDate,
          count: countIncrement
        }
      })

      return phrase
    })

    return NextResponse.json({
      success: true,
      phrase: {
        id: updatedPhrase.id,
        original: updatedPhrase.original,
        translation: updatedPhrase.translation,
        totalSpeakCount: updatedPhrase.totalSpeakCount,
        dailySpeakCount: updatedPhrase.dailySpeakCount
      }
    })

  } catch (error) {
    console.error('Error updating phrase count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
