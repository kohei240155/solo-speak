import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const languages = [
  { name: '日本語', code: 'ja' },
  { name: '英語', code: 'en' },
  { name: '中国語', code: 'zh' },
  { name: '韓国語', code: 'ko' },
  { name: 'スペイン語', code: 'es' },
  { name: 'フランス語', code: 'fr' },
  { name: 'ドイツ語', code: 'de' },
  { name: 'イタリア語', code: 'it' },
  { name: 'ポルトガル語', code: 'pt' },
  { name: 'ロシア語', code: 'ru' },
  { name: 'アラビア語', code: 'ar' },
  { name: 'ヒンディー語', code: 'hi' },
  { name: 'タイ語', code: 'th' },
  { name: 'ベトナム語', code: 'vi' },
  { name: 'インドネシア語', code: 'id' }
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
