import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const resolvedParams = await params
    const phraseId = resolvedParams.id

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Phrase ID is required' },
        { status: 400 }
      )
    }

    // session_spokenをtrueに更新（userIdも条件に含めることで権限チェックも兼ねる）
    await prisma.phrase.update({
      where: {
        id: phraseId,
        userId: authResult.user.id,
        deletedAt: null
      },
      data: {
        sessionSpoken: true
      }
    })

    return NextResponse.json({
      success: true,
      message: 'Phrase marked as session spoken'
    })

  } catch (error) {
    console.error('Error marking phrase as session spoken:', error)
    
    // Prismaの RecordNotFound エラーの場合は404を返す
    if (error && typeof error === 'object' && 'code' in error && error.code === 'P2025') {
      return NextResponse.json(
        { error: 'Phrase not found' },
        { status: 404 }
      )
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
