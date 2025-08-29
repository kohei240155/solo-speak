import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest } from '@/utils/api-helpers'
import { createErrorResponse } from '@/utils/api-helpers'
import { prisma } from '@/utils/prisma'
import { supabase } from '@/utils/spabase'

// ユーザー退会（物理削除）
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const userId = authResult.user.id

    // ユーザー情報を取得してアイコンURLを確認
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { iconUrl: true }
    })

    // トランザクションでユーザーに関連するすべてのデータを物理削除
    await prisma.$transaction(async (tx) => {
      // SpeakLogを物理削除
      await tx.speakLog.deleteMany({
        where: {
          phrase: {
            userId: userId,
          },
        },
      })

      // QuizResultを物理削除
      await tx.quizResult.deleteMany({
        where: {
          phrase: {
            userId: userId,
          },
        },
      })

      // Phraseを物理削除
      await tx.phrase.deleteMany({
        where: {
          userId: userId,
        },
      })

      // Situationを物理削除
      await tx.situation.deleteMany({
        where: {
          userId: userId,
        },
      })

      // 最後にUserを物理削除
      await tx.user.delete({
        where: {
          id: userId,
        },
      })
    })

    // Supabaseストレージからアイコン画像を削除
    if (user?.iconUrl && user.iconUrl.includes('supabase')) {
      try {
        // URLからファイルパスを抽出
        const url = new URL(user.iconUrl)
        const pathParts = url.pathname.split('/')
        const bucketIndex = pathParts.findIndex(part => part === 'user-icons')
        
        if (bucketIndex !== -1 && pathParts[bucketIndex + 1]) {
          const filePath = pathParts.slice(bucketIndex + 1).join('/')
          
          const { error: deleteError } = await supabase.storage
            .from('user-icons')
            .remove([filePath])
            
          if (deleteError) {
            console.error('Failed to delete icon from storage:', deleteError)
            // ストレージ削除エラーは退会処理を止めない
          }
        }
      } catch (storageError) {
        console.error('Error processing icon deletion:', storageError)
        // ストレージ削除エラーは退会処理を止めない
      }
    }

    return NextResponse.json({ success: true }, { status: 200 })
  } catch (error) {
    console.error('User withdrawal error:', error)
    return createErrorResponse(error)
  }
}
