import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { uploadUserIcon, deleteUserIcon } from '@/utils/storage'
import { prisma } from '@/utils/prisma'

// ユーザーアイコンのアップロード
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/icon called')
    
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

    console.log('Uploading icon for user:', authResult.user.id)
    console.log('File info:', {
      name: file.name,
      type: file.type,
      size: file.size
    })

    // 既存のアイコンがある場合は削除
    try {
      const existingUser = await prisma.user.findUnique({
        where: { id: authResult.user.id },
        select: { iconUrl: true }
      })

      if (existingUser?.iconUrl) {
        console.log('Existing icon URL found:', existingUser.iconUrl)
        
        // Google URLかSupabase以外のURLかどうかをチェック
        const isGoogleUrl = existingUser.iconUrl.includes('googleusercontent.com') || 
                           existingUser.iconUrl.includes('googleapis.com') ||
                           existingUser.iconUrl.startsWith('https://lh3.googleusercontent.com') ||
                           existingUser.iconUrl.includes('accounts.google.com')
        
        // Supabase StorageのURLかどうかをチェック
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const isSupabaseUrl = existingUser.iconUrl.includes(supabaseUrl) &&
                              existingUser.iconUrl.includes('/storage/v1/object/public/')
        
        console.log('URL analysis for existing icon:', {
          isGoogleUrl,
          isSupabaseUrl,
          existingIconUrl: existingUser.iconUrl.substring(0, 50) + '...',
          supabaseUrl: supabaseUrl.substring(0, 30) + '...'
        })
        
        if (isSupabaseUrl && !isGoogleUrl) {
          console.log('Deleting existing Supabase icon before new upload...')
          console.log('About to delete URL:', existingUser.iconUrl)
          try {
            await deleteUserIcon(existingUser.iconUrl)
            console.log('✅ Existing icon deleted successfully from storage')
          } catch (deleteError) {
            console.error('❌ Failed to delete existing icon from storage:', deleteError)
            console.error('Delete error details:', {
              message: deleteError instanceof Error ? deleteError.message : 'Unknown error',
              stack: deleteError instanceof Error ? deleteError.stack : undefined
            })
            // 削除に失敗しても新しいアップロードは続行
            console.log('⚠️ Continuing with new upload despite deletion failure')
          }
        } else {
          console.log('Existing icon is from Google or external source, skipping deletion')
          console.log('URL analysis result:', { isGoogleUrl, isSupabaseUrl })
        }
      } else {
        console.log('No existing icon found for user')
      }
    } catch (dbError) {
      console.error('Failed to check existing icon in database:', dbError)
      console.error('Database error details:', {
        message: dbError instanceof Error ? dbError.message : 'Unknown error',
        stack: dbError instanceof Error ? dbError.stack : undefined
      })
      // データベースエラーでも新しいアップロードは続行
      console.log('Continuing with new upload despite database check failure')
    }

    // Supabase Storageにアップロード（サーバーモードで）
    console.log('Calling uploadUserIcon with serverMode=true...')
    const publicUrl = await uploadUserIcon(file, authResult.user.id, true)
    
    console.log('Icon upload successful:', {
      publicUrl,
      length: publicUrl?.length,
      startsWithHttp: publicUrl?.startsWith('http')
    })

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
    console.log('DELETE /api/user/icon called')
    
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { iconUrl } = body

    if (!iconUrl) {
      return NextResponse.json({ error: 'Icon URL is required' }, { status: 400 })
    }

    console.log('Deleting icon for user:', authResult.user.id)
    console.log('Icon URL:', iconUrl)

    // Supabase Storageから削除
    await deleteUserIcon(iconUrl)
    
    console.log('Icon deletion successful')

    return NextResponse.json({ 
      message: 'Icon deleted successfully'
    })
  } catch (error) {
    return createErrorResponse(error, 'DELETE /api/user/icon')
  }
}
