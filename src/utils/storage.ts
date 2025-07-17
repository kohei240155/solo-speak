import { supabase } from './spabase'

export async function uploadUserIcon(file: File, userId: string): Promise<string> {
  try {
    // 認証状態を確認
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

    // バケットの存在確認
    const { data: buckets, error: bucketError } = await supabase.storage.listBuckets()
    if (bucketError) {
      console.error('Error listing buckets:', bucketError)
    } else {
      console.log('Available buckets:', buckets?.map(b => b.name))
    }

    // Supabase Storageにアップロード
    const { data, error } = await supabase.storage
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

    console.log('Upload successful:', data)

    // 公開URLを取得
    const { data: publicUrlData } = supabase.storage
      .from('images')
      .getPublicUrl(filePath)

    console.log('Public URL generated:', publicUrlData.publicUrl)
    return publicUrlData.publicUrl
  } catch (error) {
    console.error('Error uploading user icon:', error)
    throw error
  }
}

export async function deleteUserIcon(iconUrl: string): Promise<void> {
  try {
    // URLからファイルパスを抽出
    const url = new URL(iconUrl)
    const pathSegments = url.pathname.split('/')
    const fileName = pathSegments[pathSegments.length - 1]
    const filePath = `user-icons/${fileName}`

    const { error } = await supabase.storage
      .from('images')
      .remove([filePath])

    if (error) {
      console.error('Supabase storage delete error:', error)
      throw new Error('画像の削除に失敗しました')
    }
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
