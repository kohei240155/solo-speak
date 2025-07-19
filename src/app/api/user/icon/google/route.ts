import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { downloadAndUploadGoogleAvatar } from '@/utils/storage'

// Googleアバターのダウンロードとアップロード
export async function POST(request: NextRequest) {
  try {
    console.log('POST /api/user/icon/google called')
    
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      console.log('Authentication failed in Google avatar upload')
      return authResult.error
    }

    let body
    try {
      body = await request.json()
    } catch (parseError) {
      console.error('Failed to parse request body:', parseError)
      return NextResponse.json({ error: 'Invalid JSON in request body' }, { status: 400 })
    }

    const { googleAvatarUrl } = body
    
    console.log('Request body:', { googleAvatarUrl })
    
    if (!googleAvatarUrl) {
      console.log('Google avatar URL is missing')
      return NextResponse.json({ error: 'Google avatar URL is required' }, { status: 400 })
    }

    // Google画像URLのバリデーション
    if (!googleAvatarUrl.includes('googleusercontent.com') && 
        !googleAvatarUrl.includes('googleapis.com') && 
        !googleAvatarUrl.includes('google.com')) {
      console.log('Invalid Google avatar URL:', googleAvatarUrl)
      return NextResponse.json({ 
        error: 'Invalid Google avatar URL' 
      }, { status: 400 })
    }

    console.log('Downloading and uploading Google avatar for user:', authResult.user.id)
    console.log('Google avatar URL:', googleAvatarUrl)

    // Google画像をダウンロードしてSupabase Storageにアップロード
    // APIルートでは認証済みなので、セッション情報は不要
    const publicUrl = await downloadAndUploadGoogleAvatar(googleAvatarUrl, authResult.user.id)
    
    console.log('Google avatar upload successful:', publicUrl)

    return NextResponse.json({ 
      iconUrl: publicUrl,
      message: 'Google avatar uploaded successfully'
    })
  } catch (error) {
    console.error('Error in Google avatar upload API:', error)
    console.error('Error details:', {
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      name: error instanceof Error ? error.name : undefined,
      cause: error instanceof Error ? error.cause : undefined
    })
    return createErrorResponse(error, 'POST /api/user/icon/google')
  }
}
