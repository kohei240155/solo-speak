import * as dotenv from 'dotenv'
import path from 'path'

// .env.localファイルを読み込み
dotenv.config({ path: path.join(process.cwd(), '.env.local') })

import { createStorageBucket } from '../src/utils/storage'
import { supabase } from '../src/utils/spabase'

async function testStorage() {
  try {
    console.log('Testing Supabase Storage setup...')
    
    // 環境変数の確認
    console.log('Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Set' : 'Missing',
      supabaseAnonKey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
      supabaseSecretKey: process.env.SUPABASE_SECRET_KEY ? 'Set' : 'Missing'
    })
    
    // バケットリストの確認
    const { data: buckets, error: listError } = await supabase.storage.listBuckets()
    
    if (listError) {
      console.error('Error listing buckets:', listError)
    } else {
      console.log('Available buckets:', buckets?.map(b => ({
        name: b.name,
        public: b.public,
        created_at: b.created_at
      })))
    }
    
    // バケット作成の試行
    console.log('Attempting to create storage bucket...')
    await createStorageBucket()
    
    console.log('Storage test completed successfully!')
  } catch (error) {
    console.error('Storage test failed:', error)
  }
}

testStorage()
