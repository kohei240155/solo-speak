import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'

export async function POST(request: NextRequest) {
  try {
    // 認証チェック
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // ユーザーに紐づく全てのフレーズのsession_spokenをfalseにリセット
    const updateResult = await prisma.phrase.updateMany({
      where: {
        userId: userId,
        deletedAt: null
      },
      data: {
        sessionSpoken: false
      }
    })

    return NextResponse.json({
      success: true,
      message: `Reset session_spoken for ${updateResult.count} phrases`,
      count: updateResult.count
    })

  } catch (error) {
    console.error('Error resetting session_spoken:', error)
    return NextResponse.json(
      { success: false, message: 'Internal server error' },
      { status: 500 }
    )
  }
}
