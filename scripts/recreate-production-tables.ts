#!/usr/bin/env tsx
/**
 * 本番環境テーブル手動再作成スクリプト
 * 1. 既存テーブルを全削除
 * 2. Prismaスキーマに基づいてテーブルを再作成
 * 3. 初期シードデータを投入
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function recreateProductionTables() {
  console.log('🚨 警告: 本番環境のテーブルを手動で再作成します')
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
      'users',
      'phrase_levels',
      'languages'
    ]
    
    for (const tableName of tableNames) {
      try {
        await prisma.$executeRawUnsafe(`DROP TABLE IF EXISTS "${tableName}" CASCADE;`)
        console.log(`✅ ${tableName} テーブルを削除`)
      } catch (error) {
        console.log(`⚠️  ${tableName} テーブルの削除をスキップ (存在しない可能性)`)
      }
    }
    
    // Enumタイプも削除
    try {
      await prisma.$executeRaw`DROP TYPE IF EXISTS "Gender" CASCADE;`
      console.log('✅ Gender enumタイプを削除')
    } catch (error) {
      console.log('⚠️  Gender enumタイプの削除をスキップ')
    }
    
    await prisma.$executeRaw`SET session_replication_role = DEFAULT;`
    
    console.log('📋 Prismaでテーブルを再作成中...')
    
    // Step 2: Prisma db pushでテーブルを再作成
    await prisma.$disconnect()
    
    console.log('✅ テーブル削除完了')
    console.log('')
    console.log('次のコマンドを実行してテーブルを再作成してください:')
    console.log('1. Copy-Item .env.production .env')
    console.log('2. npx prisma db push')
    console.log('3. npx tsx scripts/seed-production-data.ts')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  recreateProductionTables()
    .then(() => {
      console.log('✅ テーブル削除スクリプト完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ スクリプト実行エラー:', error)
      process.exit(1)
    })
}

export { recreateProductionTables }
