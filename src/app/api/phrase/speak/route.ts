import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { SpeakPhraseResponse, ApiErrorResponse } from '@/types/api-responses'

/** * フレーズの音読練習用APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（フレーズID）
 * @returns SpeakPhraseResponse - 音読練習用のフレーズデータ
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { searchParams } = new URL(request.url)
    const language = searchParams.get('language')
    const excludeIfSpeakCountGTE = searchParams.get('excludeIfSpeakCountGTE')
    const excludeTodayPracticed = searchParams.get('excludeTodayPracticed') === 'true'

    if (!language) {
      const errorResponse: ApiErrorResponse = {
        error: 'Language parameter is required'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // モード設定をクエリパラメータから取得
    const config = {
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
    const [languageExists, phrases] = await Promise.all([
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
      })
    ])

    if (!languageExists) {
      const errorResponse: SpeakPhraseResponse = {
        success: false,
        message: `Language with code '${language}' not found`
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (phrases.length === 0) {
      // フレーズがない場合はエラーとして返す
      const responseData: SpeakPhraseResponse = {
        success: false,
        message: 'No phrases available for practice in this session'
      }
      return NextResponse.json(responseData)
    }

    // ソート処理
    const sortedPhrases = [...phrases]

    // 常に音読回数の少ない順を優先、音読回数が同じ場合は古い順
    sortedPhrases.sort((a, b) => {
      const practiceA = a.totalSpeakCount || 0
      const practiceB = b.totalSpeakCount || 0
      
      // 音読回数が異なる場合は音読回数で優先
      if (practiceA !== practiceB) {
        return practiceA - practiceB // 少ない順
      }
      
      // 音読回数が同じ場合は古い順でソート
      const dateA = new Date(a.createdAt).getTime()
      const dateB = new Date(b.createdAt).getTime()
      return dateA - dateB // 古い順（old-to-new）
    })

    // 最初のフレーズを返す
    const firstPhrase = sortedPhrases[0]

    const responseData: SpeakPhraseResponse = {
      success: true,
      phrase: {
        id: firstPhrase.id,
        original: firstPhrase.original,
        translation: firstPhrase.translation,
        explanation: firstPhrase.explanation || undefined,
        totalSpeakCount: firstPhrase.totalSpeakCount || 0,
        dailySpeakCount: firstPhrase.dailySpeakCount || 0,
        languageCode: firstPhrase.language.code
      }
    }

    return NextResponse.json(responseData)

  } catch {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
