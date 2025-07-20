import { supabase } from './spabase'

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

export async function deleteUserIcon(iconUrl: string): Promise<void> {
  try {
    console.log('Deleting user icon:', iconUrl)
    
    // ローカルのBlob URLの場合は削除処理をスキップ
    if (iconUrl.startsWith('blob:')) {
      console.log('Skipping deletion of local blob URL')
      return
    }
    
    // URLからファイルパスを抽出
    const url = new URL(iconUrl)
    const pathSegments = url.pathname.split('/')
    
    // Supabaseストレージの公開URLの構造: /storage/v1/object/public/images/user-icons/filename
    const imagesIndex = pathSegments.findIndex(segment => segment === 'images')
    if (imagesIndex === -1) {
      console.error('Invalid storage URL structure:', iconUrl)
      return
    }
    
    // images以降のパスを取得
    const filePath = pathSegments.slice(imagesIndex + 1).join('/')
    console.log('Extracted file path:', filePath)

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath])

    if (error) {
      console.error('Supabase storage delete error:', error)
      throw new Error('画像の削除に失敗しました')
    }
    
    console.log('Successfully deleted file:', filePath)
  } catch (error) {
    console.error('Error deleting user icon:', error)
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
