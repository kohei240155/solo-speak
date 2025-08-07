import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/utils/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { 
  UpdatePhraseRequestBody, 
  GetPhraseResponseData, 
  UpdatePhraseResponseData, 
  DeletePhraseResponseData 
} from '@/types/phrase-api'
import { ApiErrorResponse } from '@/types/api-responses'

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
      const errorResponse: ApiErrorResponse = {
        error: 'Phrase not found or access denied'
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    const responseData: GetPhraseResponseData = {
      id: phrase.id,
      original: phrase.original,
      translation: phrase.translation,
      totalSpeakCount: phrase.totalSpeakCount,
      dailySpeakCount: phrase.dailySpeakCount,
      language: phrase.language
    }

    return NextResponse.json(responseData)

  } catch {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { id } = await params
    const body: unknown = await request.json()
    const { original, translation }: UpdatePhraseRequestBody = body as UpdatePhraseRequestBody

    // バリデーション
    if (!original || !translation) {
      const errorResponse: ApiErrorResponse = {
        error: 'original text and translation are required'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (original.length > 200 || translation.length > 200) {
      const errorResponse: ApiErrorResponse = {
        error: 'original text and translation must be 200 characters or less'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // フレーズの存在確認（認証されたユーザーのフレーズのみ）
    const existingPhrase = await prisma.phrase.findUnique({
      where: { 
        id,
        userId: authResult.user.id // 認証されたユーザーのフレーズのみ
      }
    })

    if (!existingPhrase) {
      const errorResponse: ApiErrorResponse = {
        error: 'Phrase not found or access denied'
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // フレーズの更新
    const updatedPhrase = await prisma.phrase.update({
      where: { id },
      data: {
        original: original.trim(),
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

    const responseData: UpdatePhraseResponseData = {
      id: updatedPhrase.id,
      original: updatedPhrase.original,
      translation: updatedPhrase.translation,
      createdAt: updatedPhrase.createdAt.toISOString(),
      practiceCount: updatedPhrase.totalSpeakCount,
      correctAnswers: updatedPhrase.correctQuizCount,
      language: updatedPhrase.language
    }

    return NextResponse.json(responseData)

  } catch {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
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
      const errorResponse: ApiErrorResponse = {
        error: 'Phrase not found or access denied'
      }
      return NextResponse.json(errorResponse, { status: 404 })
    }

    // フレーズの削除（ソフトデリート）
    await prisma.phrase.update({
      where: { id },
      data: {
        deletedAt: new Date()
      }
    })

    const responseData: DeletePhraseResponseData = {
      message: 'Phrase deleted successfully'
    }

    return NextResponse.json(responseData)

  } catch {
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
