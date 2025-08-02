#!/usr/bin/env tsx
/**
 * データベーステーブル手動再作成スクリプト
 * 1. 既存テーブルを全削除
 * 2. Prismaスキーマに基づいてテーブルを再作成
 * 3. 初期シードデータを投入
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

// 環境を判定
const databaseUrl = process.env.DATABASE_URL || ''
const isProduction = databaseUrl.includes('pooler.supabase.com') && 
                    !databaseUrl.includes('localhost') &&
                    process.env.NODE_ENV === 'production'

console.log(`🔍 データベース接続先: ${databaseUrl}`)
console.log(`🌍 環境判定: ${isProduction ? '本番環境' : '開発環境'}`)

async function recreateDatabaseTables() {
  const envName = isProduction ? '本番環境' : '開発環境'
  console.log(`🚨 警告: ${envName}のテーブルを手動で再作成します`)
  console.log('⏰ 5秒後に開始されます...')
  
  // 5秒待機
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  try {
    console.log('🗑️  既存テーブルを削除中...')
    
    // Step 1: 外部キー制約を無効にして全テーブルを削除
    await prisma.$executeRaw`SET session_replication_role = replica;`
    
    const tableNames = [
      'speak_logs',
      'quiz_results', 
      'phrases',
      'situations',
      'users',
      'phrase_levels',
      'languages'
    ]
    
    for (const tableName of tableNames) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`)
        console.log(`✅ ${tableName} テーブルを削除`)
      } catch (dropError) {
        console.log(`⚠️  ${tableName} テーブルの削除をスキップ (存在しない可能性)`)
        console.log(`詳細: ${dropError instanceof Error ? dropError.message : 'Unknown error'}`)
      }
    }
    
    // Enumタイプも削除
    try {
      await prisma.$executeRaw`DROP TYPE IF EXISTS "Gender" CASCADE;`
      console.log('✅ Gender enumタイプを削除')
    } catch (enumError) {
      console.log('⚠️  Gender enumタイプの削除をスキップ')
      console.log(`詳細: ${enumError instanceof Error ? enumError.message : 'Unknown error'}`)
    }
    
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`
    
    console.log('📋 Prismaでテーブルを再作成中...')
    
    // Step 2: Prisma db pushでテーブルを再作成
    await prisma.$disconnect()
    
    console.log('✅ テーブル削除完了')
    console.log('')
    console.log('次のコマンドを実行してテーブルを再作成してください:')
    if (isProduction) {
      console.log('1. Copy-Item .env.production .env')
      console.log('2. npx prisma db push')
      console.log('3. npx tsx scripts/seed-production-data.ts')
    } else {
      console.log('1. Copy-Item .env.local .env')
      console.log('2. npx prisma db push')
      console.log('3. npx tsx prisma/seed.ts')
    }
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  recreateDatabaseTables()
    .then(() => {
      console.log('✅ テーブル削除スクリプト完了')
      process.exit(0)
    })
    .catch((error: Error) => {
      console.error('❌ スクリプト実行エラー:', error)
      process.exit(1)
    })
}

export { recreateDatabaseTables }
