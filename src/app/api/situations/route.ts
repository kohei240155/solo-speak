import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { authenticateRequest } from '@/utils/api-helpers'
import { CreateSituationRequest } from '@/types/situation'

const prisma = new PrismaClient()

// GET: ユーザーのシチュエーション一覧を取得
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
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json({
      situations: situations.map(situation => ({
        id: situation.id,
        name: situation.name,
        createdAt: situation.createdAt.toISOString(),
        updatedAt: situation.updatedAt.toISOString()
      }))
    })

  } catch (error) {
    console.error('Error fetching situations:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

// POST: 新しいシチュエーションを作成
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
      return NextResponse.json({ error: 'Situation name is required' }, { status: 400 })
    }

    if (body.name.length > 20) {
      return NextResponse.json({ error: 'Situation name must be 20 characters or less' }, { status: 400 })
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
      return NextResponse.json({ error: 'Situation with this name already exists' }, { status: 409 })
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
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
