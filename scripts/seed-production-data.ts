#!/usr/bin/env tsx
/**
 * 本番環境シードデータ投入スクリプト
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function seedProductionData() {
  console.log('🌱 本番環境にシードデータを投入中...')
  
  try {
    // Languages シードデータ
    console.log('📝 Languages データを投入中...')
    const languages = [
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
    
    for (const lang of languages) {
      await prisma.language.upsert({
        where: { code: lang.code },
        update: {},
        create: lang
      })
    }
    console.log(`✅ ${languages.length}個の言語を投入`)
    
    // Phrase Levels シードデータ
    console.log('📝 Phrase Levels データを投入中...')
    const phraseLevels = [
      { id: 'cm2d9i0000001abc123def000', name: 'Lv1', score: 0, color: '#D9D9D9' },
      { id: 'cm2d9i0000002abc123def000', name: 'Lv2', score: 1, color: '#BFBFBF' },
      { id: 'cm2d9i0000003abc123def000', name: 'Lv3', score: 3, color: '#A6A6A6' },
      { id: 'cm2d9i0000004abc123def000', name: 'Lv4', score: 5, color: '#8C8C8C' },
      { id: 'cm2d9i0000005abc123def000', name: 'Lv5', score: 10, color: '#737373' },
      { id: 'cm2d9i0000006abc123def000', name: 'Lv6', score: 20, color: '#595959' },
      { id: 'cm2d9i0000007abc123def000', name: 'Lv7', score: 30, color: '#404040' }
    ]
    
    for (const level of phraseLevels) {
      await prisma.phraseLevel.upsert({
        where: { id: level.id },
        update: {
          name: level.name,
          score: level.score,
          color: level.color
        },
        create: level
      })
    }
    console.log(`✅ ${phraseLevels.length}個のフレーズレベルを投入`)
    
    // 最終確認
    const languageCount = await prisma.language.count()
    const phraseLevelCount = await prisma.phraseLevel.count()
    
    console.log('📊 投入結果:')
    console.log(`- Languages: ${languageCount}`)
    console.log(`- Phrase Levels: ${phraseLevelCount}`)
    
    console.log('🎉 シードデータの投入が完了しました!')
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  seedProductionData()
    .then(() => {
      console.log('✅ シードデータ投入完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ シードデータ投入エラー:', error)
      process.exit(1)
    })
}

export { seedProductionData }
