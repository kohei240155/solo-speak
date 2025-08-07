import { NextRequest, NextResponse } from 'next/server'
import { PrismaClient } from '@/generated/prisma'
import { authenticateRequest } from '@/utils/api-helpers'

const prisma = new PrismaClient()

/** シチュエーションの更新APIエンドポイント
 * @param request - Next.jsのリクエストオブジェクト
 * @param params - URLパラメータ（シチュエーションID）
 * @returns 更新されたシチュエーションデータ
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const { user } = authResult
    const { id } = await params

    // シチュエーションの存在確認とユーザー権限チェック
    const situation = await prisma.situation.findUnique({
      where: {
        id,
        userId: user.id
      }
    })

    if (!situation) {
      return NextResponse.json({ message: 'Situation not found' }, { status: 404 })
    }

    // シチュエーションを削除
    await prisma.situation.delete({
      where: { id }
    })

    return NextResponse.json({ message: 'Situation deleted successfully' })

  } catch (error) {
    console.error('Error deleting situation:', error)
    return NextResponse.json(
      { message: 'Internal server error' },
      { status: 500 }
    )
  }
}
