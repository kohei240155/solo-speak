#!/usr/bin/env tsx

import { PrismaClient } from '../src/generated/prisma/client'

async function insertProductionLanguages() {
  const prisma = new PrismaClient()
  
  console.log('🌐 本番環境に言語データを挿入します...\n')
  
  const languageData = [
    { name: 'Japanese', code: 'ja' },
    { name: 'English', code: 'en' },
    { name: 'Chinese', code: 'zh' },
    { name: 'Korean', code: 'ko' },
    { name: 'Spanish', code: 'es' },
    { name: 'French', code: 'fr' },
    { name: 'German', code: 'de' },
    { name: 'Italian', code: 'it' },
    { name: 'Portuguese', code: 'pt' },
    { name: 'Russian', code: 'ru' },
    { name: 'Arabic', code: 'ar' },
    { name: 'Hindi', code: 'hi' },
    { name: 'Thai', code: 'th' },
    { name: 'Vietnamese', code: 'vi' },
    { name: 'Indonesian', code: 'id' }
  ]
  
  try {
    await prisma.$connect()
    console.log('✅ データベース接続成功')
    
    // 既存データを確認
    const existingLanguages = await prisma.language.findMany({
      where: { deletedAt: null }
    })
    
    console.log(`現在の言語データ: ${existingLanguages.length}件`)
    
    // 各言語をupsert
    let insertedCount = 0
    let updatedCount = 0
    
    for (const langData of languageData) {
      const existing = existingLanguages.find(l => l.code === langData.code)
      
      if (existing) {
        // 更新
        await prisma.language.update({
          where: { id: existing.id },
          data: {
            name: langData.name,
            updatedAt: new Date()
          }
        })
        updatedCount++
        console.log(`📝 更新: ${langData.name} (${langData.code})`)
      } else {
        // 新規挿入
        await prisma.language.create({
          data: {
            name: langData.name,
            code: langData.code
          }
        })
        insertedCount++
        console.log(`✨ 新規: ${langData.name} (${langData.code})`)
      }
    }
    
    console.log(`\n📊 完了統計:`)
    console.log(`   新規挿入: ${insertedCount}件`)
    console.log(`   更新: ${updatedCount}件`)
    
    // 最終確認
    const finalLanguages = await prisma.language.findMany({
      where: { deletedAt: null },
      orderBy: { name: 'asc' }
    })
    
    console.log(`\n🎯 最終言語データ (${finalLanguages.length}件):`)
    finalLanguages.forEach((lang, index) => {
      console.log(`   ${index + 1}. ${lang.name} (${lang.code})`)
    })
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
  } finally {
    await prisma.$disconnect()
  }
}

// スクリプト実行
insertProductionLanguages().catch(console.error)
