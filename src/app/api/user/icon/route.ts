import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { uploadUserIcon, deleteUserIcon } from '@/utils/storage'
import { prisma } from '@/utils/prisma'

// ユーザーアイコンのアップロード
export async function POST(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    // FormDataから画像ファイルを取得
    const formData = await request.formData()
    const file = formData.get('icon') as File
    
    if (!file) {
      return NextResponse.json({ error: 'Icon file is required' }, { status: 400 })
    }

    // ファイルタイプのバリデーション
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({ 
        error: 'Invalid file type. Only JPEG, PNG, and WebP are allowed.' 
      }, { status: 400 })
    }

    // ファイルサイズのバリデーション（5MB制限）
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      return NextResponse.json({ 
        error: 'File size too large. Maximum size is 5MB.' 
      }, { status: 400 })
    }

    // 既存のアイコンがある場合は削除
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: { iconUrl: true }
      })

      if (existingUser?.iconUrl) {
        // Google URLかSupabase以外のURLかどうかをチェック
        const isGoogleUrl = existingUser.iconUrl.includes('googleusercontent.com') || 
                           existingUser.iconUrl.includes('googleapis.com') ||
                           existingUser.iconUrl.startsWith('https://lh3.googleusercontent.com') ||
                           existingUser.iconUrl.includes('accounts.google.com')
        
        // Supabase StorageのURLかどうかをチェック
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const isSupabaseUrl = existingUser.iconUrl.includes(supabaseUrl) &&
                              existingUser.iconUrl.includes('/storage/v1/object/public/')
        
        if (isSupabaseUrl && !isGoogleUrl) {
          try {
            await deleteUserIcon(existingUser.iconUrl)
          } catch {
            // 削除に失敗しても新しいアップロードは続行
          }
        }
      }
    } catch {
      // データベースエラーでも新しいアップロードは続行
    }

    // Supabase Storageにアップロード（サーバーモードで）
    const publicUrl = await uploadUserIcon(file, authResult.user.id, true)

    return NextResponse.json({ 
      iconUrl: publicUrl,
      message: 'Icon uploaded successfully'
    })
  } catch (error) {
    return createErrorResponse(error, 'POST /api/user/icon')
  }
}

// ユーザーアイコンの削除
export async function DELETE(request: NextRequest) {
  try {
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { iconUrl } = body

    if (!iconUrl) {
      return NextResponse.json({ error: 'Icon URL is required' }, { status: 400 })
    }

    // Supabase Storageから削除
    await deleteUserIcon(iconUrl)

    return NextResponse.json({ 
      message: 'Icon deleted successfully'
    })
  } catch (error) {
    return createErrorResponse(error, 'DELETE /api/user/icon')
  }
}
