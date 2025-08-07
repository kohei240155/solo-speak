import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { PrismaClient } from '@/generated/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { getPhraseLevelScoreByCorrectAnswers } from '@/utils/phrase-level-utils'

const prisma = new PrismaClient()

const updatePhraseStatsSchema = z.object({
  phraseId: z.string().min(1),
  action: z.enum(['practice', 'quiz_correct', 'quiz_incorrect']),
})

export async function PATCH(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { phraseId, action } = updatePhraseStatsSchema.parse(body)

    // フレーズを取得（ユーザー権限チェック含む）
    const phrase = await prisma.phrase.findFirst({
      where: {
        id: phraseId,
        userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
        deletedAt: null // 削除されていないフレーズのみ
      },
      include: {
        phraseLevel: true
      }
    })

    if (!phrase) {
      return NextResponse.json(
        { error: 'Phrase not found or access denied' },
        { status: 404 }
      )
    }

    // アクションに応じて統計を更新
    type UpdateData = {
      updatedAt: Date
      totalSpeakCount?: number
      dailySpeakCount?: number
      correctQuizCount?: number
      incorrectQuizCount?: number
      phraseLevelId?: string
    }

    let updateData: UpdateData = {
      updatedAt: new Date()
    }

    switch (action) {
      case 'practice':
        updateData = {
          ...updateData,
          totalSpeakCount: phrase.totalSpeakCount + 1,
          dailySpeakCount: phrase.dailySpeakCount + 1,
        }
        break

      case 'quiz_correct':
        updateData = {
          ...updateData,
          correctQuizCount: phrase.correctQuizCount + 1,
        }
        break

      case 'quiz_incorrect':
        updateData = {
          ...updateData,
          incorrectQuizCount: phrase.incorrectQuizCount + 1,
        }
        break
    }

    // 正解数が変更される場合はフレーズレベルも更新
    let newPhraseLevelId = phrase.phraseLevelId
    if (action === 'quiz_correct') {
      const newCorrectCount = phrase.correctQuizCount + 1
      const newLevelScore = getPhraseLevelScoreByCorrectAnswers(newCorrectCount)
      
      // 新しいレベルのIDを取得
      const newPhraseLevel = await prisma.phraseLevel.findFirst({
        where: { score: newLevelScore }
      })
      
      if (newPhraseLevel && newPhraseLevel.id !== phrase.phraseLevelId) {
        newPhraseLevelId = newPhraseLevel.id
        updateData.phraseLevelId = newPhraseLevelId
      }
    }

    // フレーズを更新
    const updatedPhrase = await prisma.$transaction(async (prisma) => {
      const phrase = await prisma.phrase.update({
        where: { id: phraseId },
        data: updateData,
        include: {
          language: {
            select: {
              id: true,
              name: true,
              code: true
            }
          },
          phraseLevel: true
        }
      })

      // クイズ結果の場合はQuizResultテーブルにも記録
      if (action === 'quiz_correct' || action === 'quiz_incorrect') {
        await prisma.quizResult.create({
          data: {
            phraseId: phraseId,
            date: new Date(),
            correct: action === 'quiz_correct'
          }
        })
      }

      return phrase
    })

    // フロントエンドの期待する形式に変換
    const transformedPhrase = {
      id: updatedPhrase.id,
      original: updatedPhrase.original,
      translation: updatedPhrase.translation,
      createdAt: updatedPhrase.createdAt,
      practiceCount: updatedPhrase.totalSpeakCount,
      correctAnswers: updatedPhrase.correctQuizCount,
      language: {
        name: updatedPhrase.language.name,
        code: updatedPhrase.language.code
      },
      phraseLevel: updatedPhrase.phraseLevel
    }

    return NextResponse.json({
      success: true,
      phrase: transformedPhrase,
      action: action,
      levelChanged: newPhraseLevelId !== phrase.phraseLevelId
    })

  } catch (error) {
    console.error('Error updating phrase stats:', error)
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      )
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
