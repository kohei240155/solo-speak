import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params
    const body = await request.json()
    const { text, translation } = body

    // バリデーション
    if (!text || !translation) {
      return NextResponse.json(
        { error: 'text and translation are required' },
        { status: 400 }
      )
    }

    if (text.length > 100 || translation.length > 100) {
      return NextResponse.json(
        { error: 'text and translation must be 100 characters or less' },
        { status: 400 }
      )
    }

    // フレーズの存在確認
    const existingPhrase = await prisma.phrase.findUnique({
      where: { id }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found' },
        { status: 404 }
      )
    }

    // フレーズの更新
    const updatedPhrase = await prisma.phrase.update({
      where: { id },
      data: {
        text: text.trim(),
        translation: translation.trim(),
        updatedAt: new Date()
      },
      include: {
        language: {
          select: {
            name: true,
            code: true
          }
        }
      }
    })

    return NextResponse.json({
      id: updatedPhrase.id,
      text: updatedPhrase.text,
      translation: updatedPhrase.translation,
      createdAt: updatedPhrase.createdAt.toISOString(),
      practiceCount: updatedPhrase.totalReadCount,
      correctAnswers: updatedPhrase.correctQuizCount,
      language: updatedPhrase.language
    })

  } catch (error) {
    console.error('Error updating phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
