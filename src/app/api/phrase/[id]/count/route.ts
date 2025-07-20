import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const phraseId = params.id

    if (!phraseId) {
      return NextResponse.json(
        { error: 'Phrase ID is required' },
        { status: 400 }
      )
    }

    // フレーズが存在するかチェック
    const existingPhrase = await prisma.phrase.findUnique({
      where: { id: phraseId }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found' },
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
