import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

// Global Prisma client for development
declare global {
  var prisma: PrismaClient | undefined
}

// Prismaクライアントの初期化（本番環境ではログを無効化）
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient({
      log: ['error'] // 開発環境でもエラーのみログ出力
    })
  }
  prisma = global.prisma
}

export async function GET() {
  try {
    const languages = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })
    
    if (languages.length === 0) {
      console.warn('No languages found in database, returning fallback data')
      // フォールバック用の言語データ
      const fallbackLanguages = [
        { id: 'fallback-ja', name: 'Japanese', code: 'ja' },
        { id: 'fallback-en', name: 'English', code: 'en' },
        { id: 'fallback-zh', name: 'Chinese', code: 'zh' },
        { id: 'fallback-ko', name: 'Korean', code: 'ko' },
        { id: 'fallback-es', name: 'Spanish', code: 'es' },
        { id: 'fallback-fr', name: 'French', code: 'fr' },
        { id: 'fallback-de', name: 'German', code: 'de' },
        { id: 'fallback-it', name: 'Italian', code: 'it' },
        { id: 'fallback-pt', name: 'Portuguese', code: 'pt' },
        { id: 'fallback-ru', name: 'Russian', code: 'ru' }
      ]
      
      return new NextResponse(JSON.stringify(fallbackLanguages), {
        status: 200,
        headers: {
          'Content-Type': 'application/json; charset=utf-8',
          'X-Fallback-Data': 'true',
          'Cache-Control': 'public, max-age=1800' // 30分間キャッシュ
        },
      })
    }

    const response = NextResponse.json(languages)
    response.headers.set('Cache-Control', 'public, max-age=3600') // 1時間キャッシュ
    return response
  } catch (error) {
    console.error('Error fetching languages:', error)
    
    // データベースエラーの場合、フォールバックデータを返す
    const fallbackLanguages = [
      { id: 'fallback-ja', name: 'Japanese', code: 'ja' },
      { id: 'fallback-en', name: 'English', code: 'en' },
      { id: 'fallback-zh', name: 'Chinese', code: 'zh' },
      { id: 'fallback-ko', name: 'Korean', code: 'ko' },
      { id: 'fallback-es', name: 'Spanish', code: 'es' },
      { id: 'fallback-fr', name: 'French', code: 'fr' },
      { id: 'fallback-de', name: 'German', code: 'de' },
      { id: 'fallback-it', name: 'Italian', code: 'it' },
      { id: 'fallback-pt', name: 'Portuguese', code: 'pt' },
      { id: 'fallback-ru', name: 'Russian', code: 'ru' }
    ]
    
    return new NextResponse(JSON.stringify(fallbackLanguages), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
        'X-Fallback-Data': 'true',
        'Cache-Control': 'public, max-age=1800' // 30分間キャッシュ
      },
    })
  }
}
