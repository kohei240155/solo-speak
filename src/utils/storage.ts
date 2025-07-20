import { supabase } from './spabase'
import { createServerSupabaseClient } from './supabase-server'

export async function uploadUserIcon(file: File, userId: string, serverMode: boolean = false): Promise<string> {
  try {
    // 環境情報をログ出力
    console.log('Storage environment info:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL,
      nodeEnv: process.env.NODE_ENV,
      vercelEnv: process.env.VERCEL_ENV,
      serverMode
    })

    let supabaseClient = supabase

    // サーバーサイドモードの場合は、サーバーサイドクライアントを使用
    if (serverMode) {
      const { createServerSupabaseClient } = await import('@/utils/supabase-server')
      supabaseClient = createServerSupabaseClient()
      console.log('Using server-side Supabase client')
    } else {
      // 認証状態を確認（クライアントサイドのみ）
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('認証が必要です')
      }

      // ユーザー情報を詳細ログ出力
      console.log('User session info:', {
        userId,
        sessionUserId: session.user.id,
        userEmail: session.user.email
      })
    }

    // バケットの存在確認とアップロード前の準備
    await ensureStorageBucket(supabaseClient)

    // ファイル名を生成（重複回避のためタイムスタンプを含む）
    const fileExt = file.name.split('.').pop()
    const fileName = `${userId}_${Date.now()}.${fileExt}`
    const filePath = `user-icons/${fileName}`

    console.log('Uploading file:', {
      fileName,
      filePath,
      fileSize: file.size,
      fileType: file.type,
      userId
    })

    // Supabase Storageにアップロード
    const { data, error } = await supabaseClient.storage
      .from('images')
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: true // 同じファイル名の場合は上書き
      })

    if (error) {
      console.error('Supabase storage upload error:', error)
      console.error('Error details:', {
        message: error.message,
        name: error.name,
        cause: error.cause
      })
      
      // RLSエラーの場合はより詳細なエラーメッセージを提供
      if (error.message.includes('row-level security') || error.message.includes('policy')) {
        throw new Error(`画像のアップロード権限がありません。RLSポリシーを確認してください。\n詳細: ${error.message}`)
      }
      
      throw new Error(`画像のアップロードに失敗しました: ${error.message}`)
    }

    console.log('Upload successful:', {
      data,
      path: data?.path,
      fullPath: data?.fullPath,
      id: data?.id
    })

    // 公開URLを取得
    const { data: publicUrlData } = supabaseClient.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('Public URL generated:', {
      publicUrl: publicUrlData.publicUrl,
      filePath: filePath,
      urlStructure: {
        protocol: new URL(publicUrlData.publicUrl).protocol,
        hostname: new URL(publicUrlData.publicUrl).hostname,
        pathname: new URL(publicUrlData.publicUrl).pathname
      }
    })

    // URL の有効性をテスト（オプション）
    try {
      const testResponse = await fetch(publicUrlData.publicUrl, { method: 'HEAD' })
      console.log('URL accessibility test:', {
        status: testResponse.status,
        ok: testResponse.ok,
        headers: Object.fromEntries(testResponse.headers.entries())
      })        // 公開URLでアクセスできない場合は、認証付きURLを試す
        if (!testResponse.ok) {
          console.log('Public URL failed, trying signed URL...')
          const { data: signedUrlData, error: signedUrlError } = await supabaseClient.storage
            .from('images')
            .createSignedUrl(filePath, 365 * 24 * 60 * 60) // 1年間有効
        
        if (signedUrlError) {
          console.error('Error creating signed URL:', signedUrlError)
        } else {
          console.log('Signed URL created:', signedUrlData.signedUrl)
          return signedUrlData.signedUrl
        }
      }
    } catch (urlError) {
      console.error('URL accessibility test failed:', urlError)
    }

    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading user icon:', error)
    throw error
  }
}

export async function testStoragePermissions(): Promise<void> {
  try {
    console.log('🔍 Testing Supabase Storage permissions...')
    
    // サーバーサイドクライアントを使用
    const serverSupabase = createServerSupabaseClient()
    
    // バケット一覧を取得
    const { data: buckets, error: bucketsError } = await serverSupabase.storage.listBuckets()
    console.log('Buckets list:', { buckets, error: bucketsError })
    
    // imagesバケットの内容を確認
    const { data: files, error: listError } = await serverSupabase.storage
      .from('images')
      .list('')
    console.log('Images bucket root contents:', { files, error: listError })
    
    // user-iconsフォルダの内容を確認
    const { data: userIconFiles, error: userIconsError } = await serverSupabase.storage
      .from('images')
      .list('user-icons')
    console.log('User icons folder contents:', { userIconFiles, error: userIconsError })
    
    console.log('✅ Storage permissions test completed')
  } catch (error) {
    console.error('❌ Storage permissions test failed:', error)
    throw error
  }
}

export async function deleteUserIcon(iconUrl: string): Promise<void> {
  try {
    console.log('Starting user icon deletion process...')
    console.log('Icon URL to delete:', iconUrl)
    
    // ローカルのBlob URLの場合は削除処理をスキップ
    if (iconUrl.startsWith('blob:')) {
      console.log('Skipping deletion of local blob URL')
      return
    }
    
    // Google URLの場合はスキップ
    if (iconUrl.includes('googleusercontent.com') || 
        iconUrl.includes('googleapis.com') || 
        iconUrl.includes('google.com')) {
      console.log('Skipping deletion of Google URL')
      return
    }
    
    // サーバーサイドクライアントを使用（より強い権限で削除操作）
    const serverSupabase = createServerSupabaseClient()
    console.log('Using server-side Supabase client for deletion')
    
    // URLからファイルパスを抽出
    let url: URL
    try {
      url = new URL(iconUrl)
    } catch {
      console.error('Invalid URL format:', iconUrl)
      throw new Error('無効なURL形式です')
    }
    
    const pathSegments = url.pathname.split('/')
    console.log('URL path segments:', pathSegments)
    
    // Supabaseストレージの公開URLの構造: /storage/v1/object/public/images/user-icons/filename
    const imagesIndex = pathSegments.findIndex(segment => segment === 'images')
    if (imagesIndex === -1) {
      console.error('Invalid storage URL structure - no "images" segment found:', iconUrl)
      console.error('Path segments:', pathSegments)
      throw new Error('無効なストレージURL構造です')
    }
    
    // images以降のパスを取得
    const filePath = pathSegments.slice(imagesIndex + 1).join('/')
    console.log('Extracted file path for deletion:', filePath)

    if (!filePath) {
      console.error('Empty file path extracted from URL:', iconUrl)
      throw new Error('ファイルパスが空です')
    }

    console.log('Attempting to delete from Supabase storage:', filePath)
    
    // まず、ファイルが存在するかを確認
    console.log('Checking if file exists before deletion...')
    try {
      const { data: files, error: listError } = await serverSupabase.storage
        .from('images')
        .list(filePath.split('/').slice(0, -1).join('/') || '')
      
      if (listError) {
        console.error('Error listing files for existence check:', listError)
      } else {
        const fileName = filePath.split('/').pop()
        const fileExists = files?.some(file => file.name === fileName)
        console.log('File existence check result:', {
          fileName,
          fileExists,
          filesInDirectory: files?.map(f => f.name) || []
        })
      }
    } catch (listError) {
      console.error('Failed to check file existence:', listError)
    }

    // ファイルの削除を実行
    console.log('Executing storage delete operation...')
    const deleteResult = await serverSupabase.storage
      .from('images')
      .remove([filePath])

    console.log('Storage delete operation completed:', {
      error: deleteResult.error,
      data: deleteResult.data
    })

    if (deleteResult.error) {
      console.error('Supabase storage delete error:', deleteResult.error)
      console.error('Error details:', {
        message: deleteResult.error.message,
        name: deleteResult.error.name,
        status: (deleteResult.error as unknown as { status?: number }).status,
        statusCode: (deleteResult.error as unknown as { statusCode?: number }).statusCode
      })
      throw new Error(`画像の削除に失敗しました: ${deleteResult.error.message}`)
    }
    
    // 削除後の確認
    console.log('Verifying file deletion...')
    try {
      const { data: filesAfter, error: listAfterError } = await serverSupabase.storage
        .from('images')
        .list(filePath.split('/').slice(0, -1).join('/') || '')
      
      if (!listAfterError) {
        const fileName = filePath.split('/').pop()
        const fileStillExists = filesAfter?.some(file => file.name === fileName)
        console.log('Post-deletion verification:', {
          fileName,
          fileStillExists,
          filesInDirectory: filesAfter?.map(f => f.name) || []
        })
      }
    } catch (verifyError) {
      console.error('Failed to verify deletion:', verifyError)
    }
    
    console.log('Successfully completed delete operation for:', filePath)
  } catch (error) {
    console.error('Error in deleteUserIcon function:', error)
    if (error instanceof Error) {
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      })
    }
    throw error
  }
}

export async function createStorageBucket(): Promise<void> {
  try {
    console.log('Checking if images bucket exists...')
    
    // バケットが既に存在するかチェック
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      // バケットリストの取得に失敗した場合でも、作成を試みる
    } else {
      console.log('Available buckets:', buckets?.map(b => b.name) || [])
      
      const existingBucket = buckets?.find(bucket => bucket.name === 'images')
      
      if (existingBucket) {
        console.log('Images bucket already exists')
        return
      }
    }

    console.log('Creating images bucket...')
    
    // バケットを作成
    const { error } = await supabase.storage.createBucket('images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('The resource already exists')) {
        console.log('Images bucket already exists (from creation attempt)')
        return
      }
      console.error('Error creating storage bucket:', error)
      throw error
    }

    console.log('Images bucket created successfully')
  } catch (error) {
    console.error('Error in createStorageBucket:', error)
    // バケット作成に失敗しても、アップロード時に再試行される可能性があるため、エラーを投げない
    console.log('Bucket creation failed, but continuing...')
  }
}

// バケットの存在を確認し、なければ作成
async function ensureStorageBucket(supabaseClient: typeof supabase): Promise<void> {
  try {
    console.log('Ensuring images bucket exists...')
    
    // バケットが既に存在するかチェック
    const { data: buckets, error: listError } = await supabaseClient.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
      throw listError
    }

    console.log('Available buckets:', buckets?.map(b => ({ name: b.name, public: b.public })))
    
    const imagesBucket = buckets?.find(bucket => bucket.name === 'images')
    
    if (imagesBucket) {
      console.log('Images bucket exists:', {
        name: imagesBucket.name,
        public: imagesBucket.public,
        createdAt: imagesBucket.created_at
      })
      
      if (!imagesBucket.public) {
        console.warn('WARNING: Images bucket is not public! This may cause access issues.')
      }
      return
    }

    console.log('Images bucket not found, creating...')
    
    // バケットを作成
    const { error } = await supabaseClient.storage.createBucket('images', {
      public: true,
      fileSizeLimit: 5 * 1024 * 1024, // 5MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/gif', 'image/webp']
    })

    if (error) {
      if (error.message.includes('already exists') || error.message.includes('The resource already exists')) {
        console.log('Images bucket already exists (race condition)')
        return
      }
      console.error('Error creating storage bucket:', error)
      throw error
    }

    console.log('Images bucket created successfully')
  } catch (error) {
    console.error('Error in ensureStorageBucket:', error)
    throw error
  }
}

// Googleアバターをダウンロードしてアップロード
export async function downloadAndUploadGoogleAvatar(googleAvatarUrl: string, userId: string): Promise<string> {
  try {
    console.log('Downloading Google avatar:', googleAvatarUrl)
    
    // Google画像をダウンロード
    const response = await fetch(googleAvatarUrl)
    if (!response.ok) {
      throw new Error(`Failed to download Google avatar: ${response.status}`)
    }
    
    const arrayBuffer = await response.arrayBuffer()
    const blob = new Blob([arrayBuffer], { type: response.headers.get('content-type') || 'image/jpeg' })
    
    // BlobをFileに変換
    const file = new File([blob], 'google_avatar.jpg', { type: blob.type })
    
    console.log('Downloaded Google avatar, uploading to Supabase Storage...')
    
    // Supabase Storageにアップロード（サーバーモードで）
    return await uploadUserIcon(file, userId, true)
  } catch (error) {
    console.error('Error downloading and uploading Google avatar:', error)
    throw error
  }
}
