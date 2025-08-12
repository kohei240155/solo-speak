import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { CreateSituationRequest, SituationsListResponse } from '@/types/situation'
import { ApiErrorResponse } from '@/types/api'

const prisma = new PrismaClient()

/** シチュエーションの一覧取得と新規作成APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns シチュエーションの一覧または新規作成されたシチュエーションデータ
 */
export async function GET(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult

    // ユーザーのシチュエーション一覧を取得
    const situations = await prisma.situation.findMany({
      where: {
        userId: user.id,
        deletedAt: null
      },
      select: {
        id: true,
        name: true,
        createdAt: true,
        updatedAt: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    const response: SituationsListResponse = {
      situations: situations.map(situation => ({
        id: situation.id,
        name: situation.name,
        createdAt: situation.createdAt.toISOString(),
        updatedAt: situation.updatedAt.toISOString()
      }))
    }

    return NextResponse.json(response)

  } catch (error) {
    console.error('Error fetching situations:', error)
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}

 /** シチュエーションの新規作成APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @returns CreateSituationResponseData - 作成されたシチュエーションデータ
 */
export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult

    const body: CreateSituationRequest = await request.json()
    
    // バリデーション
    if (!body.name || body.name.trim().length === 0) {
      const errorResponse: ApiErrorResponse = {
        error: 'Situation name is required'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    if (body.name.length > 20) {
      const errorResponse: ApiErrorResponse = {
        error: 'Situation name must be 20 characters or less'
      }
      return NextResponse.json(errorResponse, { status: 400 })
    }

    // 同じ名前のシチュエーションが既に存在するかチェック
    const existingSituation = await prisma.situation.findFirst({
      where: {
        userId: user.id,
        name: body.name.trim(),
        deletedAt: null
      }
    })

    if (existingSituation) {
      const errorResponse: ApiErrorResponse = {
        error: 'Situation with this name already exists'
      }
      return NextResponse.json(errorResponse, { status: 409 })
    }

    // 新しいシチュエーションを作成
    const newSituation = await prisma.situation.create({
      data: {
        userId: user.id,
        name: body.name.trim()
      }
    })

    return NextResponse.json({
      id: newSituation.id,
      name: newSituation.name,
      createdAt: newSituation.createdAt.toISOString(),
      updatedAt: newSituation.updatedAt.toISOString()
    }, { status: 201 })

  } catch (error) {
    console.error('Error creating situation:', error)
    const errorResponse: ApiErrorResponse = {
      error: 'Internal server error'
    }
    return NextResponse.json(errorResponse, { status: 500 })
  }
}
