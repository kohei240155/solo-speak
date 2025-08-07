import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { isDayChanged } from '@/utils/date-helpers'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const order = searchParams.get('order') || 'new_to_old'
    const excludeIfSpeakCountGTE = searchParams.get('excludeIfSpeakCountGTE')
    const excludeTodayPracticed = searchParams.get('excludeTodayPracticed') === 'true'

    if (!language) {
      return NextResponse.json(
        { error: 'Language parameter is required' },
        { status: 400 }
      )
    }

    // モード設定をクエリパラメータから取得
    const config = {
      order,
      excludeIfSpeakCountGTE: excludeIfSpeakCountGTE ? parseInt(excludeIfSpeakCountGTE, 10) : undefined,
      excludeTodayPracticed
    }

    // フィルタリング条件を構築
    const whereClause = {
      userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
      language: {
        code: language
      },
      deletedAt: null, // 削除されていないフレーズのみ
      sessionSpoken: false, // セッション中にまだSpeak練習していないフレーズのみ
      ...(config.excludeTodayPracticed && {
        dailySpeakCount: { equals: 0 } // 今日練習済みを除外する場合：今日の練習回数が0のフレーズのみ
      }),
      ...(config.excludeIfSpeakCountGTE !== undefined && {
        totalSpeakCount: {
          lt: config.excludeIfSpeakCountGTE // 指定された回数未満のフレーズのみ（指定回数以上を除外）
        }
      })
    }

    // Promise.allを使用して並列処理でパフォーマンスを向上
    const [languageExists, phrases, allPhrases] = await Promise.all([
      // 指定された言語が存在するか確認
      prisma.language.findUnique({
        where: { 
          code: language,
          deletedAt: null // 削除されていない言語のみ
        }
      }),
      
      // データベースからフレーズを取得（削除されていないもののみ）
      // 認証されたユーザーのフレーズのみを取得
      prisma.phrase.findMany({
        where: whereClause,
        include: {
          language: true
        }
      }),

      // セッション管理を除いた全フレーズ数を取得（デバッグ用）
      prisma.phrase.findMany({
        where: {
          userId: authResult.user.id,
          language: {
            code: language
          },
          deletedAt: null,
          ...(config.excludeTodayPracticed && {
            dailySpeakCount: { equals: 0 } // 今日練習済みを除外する場合：今日の練習回数が0のフレーズのみ
          }),
          ...(config.excludeIfSpeakCountGTE !== undefined && {
            totalSpeakCount: {
              lt: config.excludeIfSpeakCountGTE
            }
          })
        },
        select: {
          id: true,
          sessionSpoken: true
        }
      })
    ])

    if (!languageExists) {
      return NextResponse.json({
        success: false,
        message: `Language with code '${language}' not found`
      }, { status: 400 })
    }

    if (phrases.length === 0) {
      // すべてのフレーズがセッション完了済みかチェック
      const allSessionCompleted = allPhrases.length > 0 && allPhrases.every(p => p.sessionSpoken)
      
      if (allSessionCompleted) {
        // All Done状態の場合は成功レスポンスとして返す（トーストエラーを防ぐため）
        return NextResponse.json({
          success: true,
          allDone: true,
          message: 'All available phrases have been practiced in this session'
        })
      } else {
        // フレーズがない場合はエラーとして返す
        return NextResponse.json({
          success: false,
          message: 'No phrases available for practice in this session',
          allDone: false
        })
      }
    }

    // ソート処理
    const sortedPhrases = [...phrases]

    // 常に音読回数の少ない順を優先
    sortedPhrases.sort((a, b) => {
      const practiceA = a.totalSpeakCount || 0
      const practiceB = b.totalSpeakCount || 0
      
      // 音読回数が異なる場合は音読回数で優先
      if (practiceA !== practiceB) {
        return practiceA - practiceB // 少ない順
      }
      
      // 音読回数が同じ場合は日付順でソート
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      
      if (config.order === 'new_to_old') {
        return dateB - dateA // 新しい順
      } else {
        return dateA - dateB // 古い順
      }
    })

    // 最初のフレーズを返す
    const firstPhrase = sortedPhrases[0]
    const currentDate = new Date()

    // 日付が変わった場合はdailySpeakCountを0として扱う（UTC基準）
    const isDayChangedFlag = isDayChanged(firstPhrase.lastSpeakDate, currentDate)
    const dailySpeakCount = isDayChangedFlag ? 0 : (firstPhrase.dailySpeakCount || 0)

    return NextResponse.json({
      success: true,
      phrase: {
        id: firstPhrase.id,
        original: firstPhrase.original,
        translation: firstPhrase.translation,
        explanation: firstPhrase.explanation,
        totalSpeakCount: firstPhrase.totalSpeakCount || 0,
        dailySpeakCount: dailySpeakCount,
        languageCode: firstPhrase.language.code
      }
    })

  } catch {
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
