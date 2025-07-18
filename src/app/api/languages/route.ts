import { NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma/client'

// Global Prisma client for development
declare global {
  var prisma: PrismaClient | undefined
}

// Prismaクライアントの初期化をより確実に
let prisma: PrismaClient

if (process.env.NODE_ENV === 'production') {
  prisma = new PrismaClient()
} else {
  if (!global.prisma) {
    global.prisma = new PrismaClient()
  }
  prisma = global.prisma
}

export async function GET() {
  try {
    console.log('Fetching languages from database...')
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? 'Set' : 'Not set')
    console.log('DIRECT_URL:', process.env.DIRECT_URL ? 'Set' : 'Not set')
    
    const languages = await prisma.language.findMany({
      where: {
        deletedAt: null
      },
      orderBy: {
        name: 'asc'
      }
    })

    console.log('Languages fetched successfully:', languages.length)
    
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
        },
      })
    }

    return new NextResponse(JSON.stringify(languages), {
      status: 200,
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })
  } catch (error) {
    console.error('Error fetching languages:', error)
    console.error('Error details:', {
      name: error instanceof Error ? error.name : 'Unknown',
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : 'No stack trace'
    })
    
    // データベースエラーの場合、フォールバックデータを返す
    console.log('Database error detected, returning fallback languages')
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
        'X-Fallback-Data': 'true'
      },
    })
  }
}
