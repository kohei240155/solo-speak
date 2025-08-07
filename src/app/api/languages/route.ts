import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { LanguagesResponseData } from '@/types/language-api'

export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const languages: LanguagesResponseData = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    if (languages.length === 0) {
      return createErrorResponse(
        new Error('No languages found in database'), 
        'GET /api/languages'
      )
    }

    return NextResponse.json(languages)
  } catch (error) {
    // データベースエラーの場合、共通のエラーレスポンスを返す
    console.error('Error fetching languages:', error)
    return createErrorResponse(error, 'GET /api/languages')
  }
}
