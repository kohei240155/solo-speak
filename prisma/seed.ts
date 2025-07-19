import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

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
