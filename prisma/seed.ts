import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const languages = [
  // 主要国際言語
  { name: 'English', code: 'en' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Japanese', code: 'ja' },
  { name: 'German', code: 'de' },
  { name: 'Korean', code: 'ko' },
  { name: 'Italian', code: 'it' },
  { name: 'Thai', code: 'th' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Danish', code: 'da' }
]

const phraseLevels = [
  { id: 'cm2d9i0000001abc123def000', name: 'Lv1', score: 0, color: '#D9D9D9' },
  { id: 'cm2d9i0000002abc123def000', name: 'Lv2', score: 1, color: '#BFBFBF' },
  { id: 'cm2d9i0000003abc123def000', name: 'Lv3', score: 3, color: '#A6A6A6' },
  { id: 'cm2d9i0000004abc123def000', name: 'Lv4', score: 6, color: '#8C8C8C' },
  { id: 'cm2d9i0000005abc123def000', name: 'Lv5', score: 10, color: '#737373' },
  { id: 'cm2d9i0000006abc123def000', name: 'Lv6', score: 15, color: '#595959' },
  { id: 'cm2d9i0000007abc123def000', name: 'Lv7', score: 21, color: '#404040' }
]

async function main() {
  try {
    console.log('🚀 Seeding database...')

    // 言語データの投入
    console.log('📝 Seeding languages...')
    for (const lang of languages) {
      await prisma.language.upsert({
        where: { code: lang.code },
        update: {},
        create: lang
      })
    }
    console.log(`✅ ${languages.length} languages seeded`)

    // フレーズレベルデータの投入
    console.log('📝 Seeding phrase levels...')
    for (const level of phraseLevels) {
      await prisma.phraseLevel.upsert({
        where: { id: level.id },
        update: {},
        create: level
      })
    }
    console.log(`✅ ${phraseLevels.length} phrase levels seeded`)

    console.log('🎉 Database seeding completed successfully!')
  } catch (error) {
    console.error('❌ Error seeding database:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
