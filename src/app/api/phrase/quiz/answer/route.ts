import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { QuizAnswerResponse } from '@/types/quiz'

/** * クイズ回答APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns QuizAnswerResponse - クイズの回答結果
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { phraseId, isCorrect } = body

    if (!phraseId || typeof isCorrect !== 'boolean') {
      return NextResponse.json(
        { error: 'phraseId and isCorrect are required' },
        { status: 400 }
      )
    }

    // トランザクションで実行
    const result = await prisma.$transaction(async (tx) => {
      // フレーズの正解数/不正解数を更新
      const updatedPhrase = await tx.phrase.update({
        where: {
          id: phraseId,
          userId: authResult.user.id // セキュリティチェック
        },
        data: isCorrect
          ? { correctQuizCount: { increment: 1 } }
          : { incorrectQuizCount: { increment: 1 } }
      })

      // クイズ結果を記録
      await tx.quizResult.create({
        data: {
          phraseId,
          correct: isCorrect,
          date: new Date()
        }
      })

      return updatedPhrase
    })

    return NextResponse.json({
      success: true,
      phrase: {
        id: result.id,
        correctQuizCount: result.correctQuizCount,
        incorrectQuizCount: result.incorrectQuizCount
      }
    } satisfies QuizAnswerResponse)

  } catch (error) {
    console.error('Error updating quiz result:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
