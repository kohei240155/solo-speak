import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { QuizAnswerResponse } from '@/types/quiz'
import { getPhraseLevelScoreByCorrectAnswers } from '@/utils/phrase-level-utils'

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

      // 正解の場合、フレーズレベルを更新
      if (isCorrect) {
        const newCorrectCount = updatedPhrase.correctQuizCount
        const expectedScore = getPhraseLevelScoreByCorrectAnswers(newCorrectCount)
        
        // 期待されるスコアに対応するフレーズレベルを取得
        const expectedLevel = await tx.phraseLevel.findFirst({
          where: { score: expectedScore }
        })
        
        if (expectedLevel && updatedPhrase.phraseLevelId !== expectedLevel.id) {
          // フレーズレベルを更新
          await tx.phrase.update({
            where: { id: phraseId },
            data: { phraseLevelId: expectedLevel.id }
          })
          
          // 更新されたフレーズを再取得
          const finalPhrase = await tx.phrase.findUnique({
            where: { id: phraseId }
          })
          
          return finalPhrase || updatedPhrase
        }
      }

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
