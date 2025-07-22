import { NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function GET() {
  try {
    console.log('Database debug API called')

    // 1. speak_logsテーブルのデータ数を確認
    const totalSpeakLogs = await prisma.speakLog.count()
    console.log('Total speak logs:', totalSpeakLogs)

    // 2. 実際のspeak_logsデータを取得（最初の5件）
    const sampleSpeakLogs = await prisma.speakLog.findMany({
      take: 5,
      include: {
        phrase: {
          select: {
            id: true,
            languageId: true,
            text: true,
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
    console.log('Sample speak logs:', sampleSpeakLogs)

    // 3. 言語データを確認
    const languages = await prisma.language.findMany({
      select: {
        id: true,
        code: true,
        name: true
      }
    })
    console.log('Available languages:', languages)

    // 4. フレーズデータを確認
    const totalPhrases = await prisma.phrase.count()
    const phrasesEn = await prisma.phrase.count({
      where: {
        languageId: 'en'
      }
    })
    console.log('Total phrases:', totalPhrases, 'EN phrases:', phrasesEn)

    // 5. ユーザーデータを確認
    const totalUsers = await prisma.user.count()
    console.log('Total users:', totalUsers)

    return NextResponse.json({
      success: true,
      data: {
        totalSpeakLogs,
        sampleSpeakLogs,
        languages,
        totalPhrases,
        phrasesEn,
        totalUsers
      }
    })

  } catch (error) {
    console.error('Database debug error:', error)
    return NextResponse.json({ 
      success: false, 
      error: 'Database error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 })
  }
}
