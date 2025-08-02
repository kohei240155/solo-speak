import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createLanguageFallbackResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { LanguagesResponseData } from '@/types/language-api'
import { ensureBasicLanguagesExist } from '@/utils/seed-languages'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    // 基本言語データが存在することを確認
    await ensureBasicLanguagesExist()

    const languages: LanguagesResponseData = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    if (languages.length === 0) {
      return createLanguageFallbackResponse()
    }

    const response = NextResponse.json(languages)
    
    // クエリパラメーターでキャッシュ無効が指定されているかチェック
    const { searchParams } = new URL(request.url)
    const noCache = searchParams.has('t') || request.headers.get('cache-control')?.includes('no-cache')
    
    if (noCache) {
      // ユーザー設定画面など、キャッシュを無効にする場合
      response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
      response.headers.set('Pragma', 'no-cache')
      response.headers.set('Expires', '0')
    } else {
      // 通常のキャッシュ設定
      response.headers.set('Cache-Control', 'public, max-age=3600') // 1時間キャッシュ
    }
    
    return response
  } catch (error) {
    // データベースエラーの場合、フォールバックデータを返す
    console.error('Error fetching languages:', error)
    return createLanguageFallbackResponse()
  }
}
