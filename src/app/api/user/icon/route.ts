import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { uploadUserIcon, deleteUserIcon } from '@/utils/storage'

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
