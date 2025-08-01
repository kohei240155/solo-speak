import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const phraseId = params.id

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Phrase ID is required' },
        { status: 400 }
      )
    }

    // フレーズが存在し、認証されたユーザーに属しているかチェック
    const phrase = await prisma.phrase.findFirst({
      where: {
        id: phraseId,
        userId: authResult.user.id,
        deletedAt: null
      }
    })

    if (!phrase) {
      return NextResponse.json(
        { error: 'Phrase not found' },
        { status: 404 }
      )
    }

    // session_spokenをtrueに更新
    await prisma.phrase.update({
      where: { id: phraseId },
      data: {
        sessionSpoken: true
      }
    })

    console.log(`Phrase ${phraseId} marked as session spoken`)

    return NextResponse.json({
      success: true,
      message: 'Phrase marked as session spoken'
    })

  } catch (error) {
    console.error('Error marking phrase as session spoken:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
