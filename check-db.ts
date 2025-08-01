import { PrismaClient } from './src/generated/prisma'

const prisma = new PrismaClient()

async function checkData() {
  console.log('🔍 Checking database data...')
  
  // 言語データを確認
  const languages = await prisma.language.findMany()
  console.log('Languages in database:')
  languages.forEach(lang => {
    console.log(`  - ${lang.name} (${lang.code}): ${lang.id}`)
  })
  
  // エラーで出てきたIDが存在するか確認
  const errorId = 'cmdrlf2j40000udysmz68oj2f'
  const languageWithErrorId = await prisma.language.findUnique({
    where: { id: errorId }
  })
  
  console.log(`\n🔍 Checking error ID '${errorId}':`)
  console.log('Found:', languageWithErrorId ? 'YES' : 'NO')
  
  // フレーズレベルデータを確認
  const phraseLevels = await prisma.phraseLevel.findMany()
  console.log('\nPhrase levels in database:')
  phraseLevels.forEach(level => {
    console.log(`  - ${level.name}: ${level.id}`)
  })
  
  // ユーザーデータを確認
  const users = await prisma.user.findMany()
  console.log('\nUsers in database:', users.length, 'users')
}

checkData()
  .catch((e) => {
    console.error('❌ Error checking database:', e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
