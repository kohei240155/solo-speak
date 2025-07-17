#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/prisma/client'

async function diagnoseProdDatabase() {
  const prisma = new PrismaClient()
  
  console.log('🔍 本番データベース診断を開始します...\n')
  
  try {
    // 1. データベース接続テスト
    console.log('1. データベース接続テスト...')
    await prisma.$connect()
    console.log('✅ データベース接続成功\n')
    
    // 2. languagesテーブルの存在確認
    console.log('2. languagesテーブルの確認...')
    try {
      const languageCount = await prisma.language.count()
      console.log(`✅ languagesテーブル存在確認済み (${languageCount}件のレコード)\n`)
      
      // 3. 言語データの詳細確認
      if (languageCount > 0) {
        console.log('3. 言語データの詳細:')
        const languages = await prisma.language.findMany({
          where: { deletedAt: null },
          orderBy: { name: 'asc' }
        })
        
        languages.forEach((lang, index) => {
          console.log(`   ${index + 1}. ${lang.name} (${lang.code}) - ID: ${lang.id}`)
        })
        console.log()
      } else {
        console.log('⚠️  languagesテーブルにデータがありません')
        console.log('   解決方法: insert_production_languages.sql を実行してください\n')
      }
      
    } catch (tableError) {
      console.log('❌ languagesテーブルにアクセスできません')
      console.log('   エラー:', tableError instanceof Error ? tableError.message : 'Unknown error')
      console.log('   解決方法: Prisma migrateを実行してテーブルを作成してください\n')
    }
    
    // 4. データベース設定の確認
    console.log('4. 環境変数の確認:')
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL ? '設定済み' : '未設定'}`)
    console.log(`   DIRECT_URL: ${process.env.DIRECT_URL ? '設定済み' : '未設定'}`)
    console.log(`   NODE_ENV: ${process.env.NODE_ENV || '未設定'}`)
    console.log()
    
  } catch (connectionError) {
    console.log('❌ データベース接続に失敗しました')
    console.log('   エラー:', connectionError instanceof Error ? connectionError.message : 'Unknown error')
    console.log('   解決方法:')
    console.log('   1. .env.local の DATABASE_URL と DIRECT_URL を確認')
    console.log('   2. Supabase プロジェクトが正しく設定されているか確認')
    console.log('   3. ネットワーク接続を確認')
    console.log()
  } finally {
    await prisma.$disconnect()
  }
  
  console.log('診断完了 🎯')
}

// スクリプト実行
diagnoseProdDatabase().catch(console.error)
