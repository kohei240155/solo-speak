import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id } = await params

    // フレーズを取得（削除されていないもののみ、認証されたユーザーのもののみ）
    const phrase = await prisma.phrase.findUnique({
      where: { 
        id,
        userId: authResult.user.id, // 認証されたユーザーのフレーズのみ
        deletedAt: null // 削除されていないフレーズのみ
      },
      include: {
        language: true
      }
    })

    if (!phrase) {
      return NextResponse.json(
        { error: 'Phrase not found or access denied' },
        { status: 404 }
      )
    }

    return NextResponse.json({
      id: phrase.id,
      text: phrase.text,
      translation: phrase.translation,
      totalSpeakCount: phrase.totalSpeakCount,
      dailySpeakCount: phrase.dailySpeakCount,
      language: phrase.language
    })

  } catch (error) {
    console.error('Error fetching phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id } = await params
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

    // フレーズの存在確認（認証されたユーザーのフレーズのみ）
    const existingPhrase = await prisma.phrase.findUnique({
      where: { 
        id,
        userId: authResult.user.id // 認証されたユーザーのフレーズのみ
      }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found or access denied' },
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
      practiceCount: updatedPhrase.totalSpeakCount,
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

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id } = await params

    // フレーズの存在確認（認証されたユーザーのフレーズのみ）
    const existingPhrase = await prisma.phrase.findUnique({
      where: { 
        id,
        userId: authResult.user.id // 認証されたユーザーのフレーズのみ
      }
    })

    if (!existingPhrase) {
      return NextResponse.json(
        { error: 'Phrase not found or access denied' },
        { status: 404 }
      )
    }

    // フレーズの削除（ソフトデリート）
    await prisma.phrase.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    return NextResponse.json({
      message: 'Phrase deleted successfully'
    })

  } catch (error) {
    console.error('Error deleting phrase:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}
