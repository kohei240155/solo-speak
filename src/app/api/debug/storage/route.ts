import { NextRequest, NextResponse } from 'next/server'
import { authenticateRequest, createErrorResponse } from '@/utils/api-helpers'
import { testStoragePermissions, deleteUserIcon } from '@/utils/storage'
import { createServerSupabaseClient } from '@/utils/supabase-server'

// ストレージデバッグエンドポイント
export async function GET(request: NextRequest) {
  try {
    console.log('🔍 Storage debug endpoint called')
    
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    // ストレージ権限テスト
    await testStoragePermissions()
    
    // user-iconsフォルダの詳細情報を取得
    const serverSupabase = createServerSupabaseClient()
    const { data: userIconFiles, error: userIconsError } = await serverSupabase.storage
      .from('images')
      .list('user-icons', {
        limit: 100,
        offset: 0
      })
    
    const debugInfo = {
      message: 'Storage debug information',
      userIconFiles: userIconFiles?.map((file: { name: string; id: string; updated_at?: string; created_at?: string; last_accessed_at?: string; metadata?: Record<string, unknown> }) => ({
        name: file.name,
        id: file.id,
        updated_at: file.updated_at,
        created_at: file.created_at,
        last_accessed_at: file.last_accessed_at,
        metadata: file.metadata
      })) || [],
      userIconsError: userIconsError,
      timestamp: new Date().toISOString()
    }
    
    console.log('Storage debug info:', debugInfo)
    
    return NextResponse.json(debugInfo)
  } catch (error) {
    return createErrorResponse(error, 'GET /api/debug/storage')
  }
}

// テスト削除エンドポイント
export async function DELETE(request: NextRequest) {
  try {
    console.log('🗑️ Storage debug delete endpoint called')
    
    const authResult = await authenticateRequest(request)
    if ('error' in authResult) {
      return authResult.error
    }

    const body = await request.json()
    const { iconUrl } = body

    if (!iconUrl) {
      return NextResponse.json({ error: 'Icon URL is required for debug delete' }, { status: 400 })
    }

    console.log('Debug delete requested for URL:', iconUrl)
    
    // テスト削除を実行
    await deleteUserIcon(iconUrl)
    
    console.log('✅ Debug delete completed successfully')

    return NextResponse.json({ 
      message: 'Debug delete completed successfully',
      deletedUrl: iconUrl,
      timestamp: new Date().toISOString()
    })
  } catch (error) {
    return createErrorResponse(error, 'DELETE /api/debug/storage')
  }
}
