#!/usr/bin/env tsx
/**
 * 本番環境データベースのリセットとシードデータ投入スクリプト
 * 警告: 全てのデータが削除されます
 */

import { PrismaClient } from '@/generated/prisma'

const prisma = new PrismaClient()

async function resetProductionDatabase() {
  console.log('🚨 警告: 本番環境のデータベースをリセットします')
  console.log('⏰ 5秒後に開始されます...')
  
  // 5秒待機
  await new Promise(resolve => setTimeout(resolve, 5000))
  
  try {
    console.log('📋 現在のテーブル状況を確認中...')
    
    // 各テーブルのレコード数を確認
    const userCount = await prisma.user.count()
    const phraseCount = await prisma.phrase.count()
    const languageCount = await prisma.language.count()
    const phraseLevelCount = await prisma.phraseLevel.count()
    
    console.log(`現在のデータ:`)
    console.log(`- Users: ${userCount}`)
    console.log(`- Phrases: ${phraseCount}`)
    console.log(`- Languages: ${languageCount}`)
    console.log(`- Phrase Levels: ${phraseLevelCount}`)
    
    console.log('🗑️  全テーブルのデータを削除中...')
    
    // 外部キー制約を考慮した順序で削除
    await prisma.speakLog.deleteMany()
    console.log('✅ speak_logs テーブルをクリア')
    
    await prisma.phrase.deleteMany()
    console.log('✅ phrases テーブルをクリア')
    
    await prisma.user.deleteMany()
    console.log('✅ users テーブルをクリア')
    
    await prisma.phraseLevel.deleteMany()
    console.log('✅ phrase_levels テーブルをクリア')
    
    await prisma.language.deleteMany()
    console.log('✅ languages テーブルをクリア')
    
    console.log('🌱 シードデータを投入中...')
    
    // Languagesシードデータ
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
      await prisma.language.create({
        data: lang
      })
    }
    console.log(`✅ ${languages.length}個の言語を挿入`)
    
    // Phrase Levelsシードデータ
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
      await prisma.phraseLevel.create({
        data: level
      })
    }
    console.log(`✅ ${phraseLevels.length}個のフレーズレベルを挿入`)
    
    console.log('🎉 データベースのリセットとシード投入が完了しました!')
    
    // 最終確認
    const finalLanguageCount = await prisma.language.count()
    const finalPhraseLevelCount = await prisma.phraseLevel.count()
    
    console.log('📊 最終結果:')
    console.log(`- Languages: ${finalLanguageCount}`)
    console.log(`- Phrase Levels: ${finalPhraseLevelCount}`)
    
  } catch (error) {
    console.error('❌ エラーが発生しました:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

if (require.main === module) {
  resetProductionDatabase()
    .then(() => {
      console.log('✅ スクリプト実行完了')
      process.exit(0)
    })
    .catch((error) => {
      console.error('❌ スクリプト実行エラー:', error)
      process.exit(1)
    })
}

export { resetProductionDatabase }
