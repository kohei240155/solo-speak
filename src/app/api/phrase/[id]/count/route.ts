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

    const { id: phraseId } = await params

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Phrase ID is required' },
        { status: 400 }
      )
    }

    // フレーズが存在するかチェック（認証されたユーザーのフレーズのみ）
    const existingPhrase = await prisma.phrase.findUnique({
      where: { 
        id: phraseId,
        userId: authResult.user.id // 認証されたユーザーのフレーズのみ
      }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found or you do not have permission to access it' },
        { status: 404 }
      )
    }

    // 音読回数を更新
    const updatedPhrase = await prisma.phrase.update({
      where: { id: phraseId },
      data: {
        totalReadCount: {
          increment: 1
        },
        dailyReadCount: {
          increment: 1
        }
      },
      include: {
        language: true
      }
    })

    return NextResponse.json({
      success: true,
      phrase: {
        id: updatedPhrase.id,
        text: updatedPhrase.text,
        translation: updatedPhrase.translation,
        totalReadCount: updatedPhrase.totalReadCount,
        dailyReadCount: updatedPhrase.dailyReadCount
      }
    })

  } catch (error) {
    console.error('Error updating phrase count:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
