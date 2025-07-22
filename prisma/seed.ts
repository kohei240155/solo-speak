import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const languages = [
  { name: 'Japanese', code: 'ja' },
  { name: 'English', code: 'en' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Korean', code: 'ko' },
  { name: 'Spanish', code: 'es' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Thai', code: 'th' }
]

const phraseLevels = [
  { name: 'Lv1', score: 0, color: '#D9D9D9' },
  { name: 'Lv2', score: 1, color: '#BFBFBF' },
  { name: 'Lv3', score: 3, color: '#A6A6A6' },
  { name: 'Lv4', score: 5, color: '#8C8C8C' },
  { name: 'Lv5', score: 10, color: '#737373' },
  { name: 'Lv6', score: 20, color: '#595959' },
  { name: 'Lv7', score: 30, color: '#404040' }
]

async function main() {
  console.log('🌱 Seeding database...')
  
  // 言語データの挿入
  for (const language of languages) {
    await prisma.language.upsert({
      where: { code: language.code },
      update: {},
      create: {
        name: language.name,
        code: language.code
      }
    })
  }
  
  console.log('✅ Languages seeded successfully!')
  
  // フレーズレベルデータの挿入
  for (const level of phraseLevels) {
    // 既存のレベルを確認
    const existingLevel = await prisma.phraseLevel.findFirst({
      where: { name: level.name }
    })
    
    if (existingLevel) {
      // 既存の場合は更新
      await prisma.phraseLevel.update({
        where: { id: existingLevel.id },
        data: {
          score: level.score,
          color: level.color
        }
      })
    } else {
      // 新規作成
      await prisma.phraseLevel.create({
        data: {
          name: level.name,
          score: level.score,
          color: level.color
        }
      })
    }
  }
  
  console.log('✅ Phrase levels seeded successfully!')
  console.log('✅ Database seeded successfully!')
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
