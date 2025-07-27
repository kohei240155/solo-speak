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
    response.headers.set('Cache-Control', 'public, max-age=3600') // 1時間キャッシュ
    return response
  } catch (error) {
    // データベースエラーの場合、フォールバックデータを返す
    console.error('Error fetching languages:', error)
    return createLanguageFallbackResponse()
  }
}
