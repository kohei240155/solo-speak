import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { DatabaseDebugResponseData } from '@/types/debug-api'
import { ApiErrorResponse } from '@/types/api'

export async function GET() {
  try {
    // 1. speak_logsテーブルのデータ数を確認
    const totalSpeakLogs = await prisma.speakLog.count()

    // 1.5. quiz_resultsテーブルのデータ数を確認
    const totalQuizResults = await prisma.quizResult.count()

    // 2. 実際のspeak_logsデータを取得（最初の5件）
    const sampleSpeakLogs = await prisma.speakLog.findMany({
      take: 5,
      include: {
        phrase: {
          select: {
            id: true,
            languageId: true,
            original: true,
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    })

    // 2.5. 実際のquiz_resultsデータを取得（最初の5件）
    const sampleQuizResults = await prisma.quizResult.findMany({
      take: 5,
      include: {
        phrase: {
          select: {
            id: true,
            languageId: true,
            original: true,
            user: {
              select: {
                id: true,
                username: true
              }
            }
          }
        }
      }
    })

    // 3. 言語データを確認
    const languages = await prisma.language.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    })

    // 4. フレーズデータを確認
    const totalPhrases = await prisma.phrase.count()
    const phrasesEn = await prisma.phrase.count({
      where: {
        languageId: 'en'
      }
    })

    // 5. ユーザーデータを確認
    const totalUsers = await prisma.user.count()

    const responseData: DatabaseDebugResponseData = {
      success: true,
      data: {
        totalSpeakLogs,
        totalQuizResults,
        sampleSpeakLogs,
        sampleQuizResults,
        languages,
        totalPhrases,
        phrasesEn,
        totalUsers
      }
    }

    return NextResponse.json(responseData)

  } catch (error) {
    const errorResponse: ApiErrorResponse = {
      error: 'Database error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
