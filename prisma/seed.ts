import { PrismaClient } from '../src/generated/prisma'

const prisma = new PrismaClient()

const languages = [
  // 主要国際言語
  { name: 'English', code: 'en' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Hindi', code: 'hi' },
  { name: 'Spanish', code: 'es' },
  { name: 'French', code: 'fr' },
  { name: 'Arabic', code: 'ar' },
  { name: 'Bengali', code: 'bn' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Russian', code: 'ru' },
  { name: 'Urdu', code: 'ur' },
  { name: 'Japanese', code: 'ja' },
  { name: 'German', code: 'de' },
  { name: 'Korean', code: 'ko' },
  { name: 'Swahili', code: 'sw' },
  { name: 'Italian', code: 'it' },
  { name: 'Turkish', code: 'tr' },
  { name: 'Vietnamese', code: 'vi' },
  
  // インド系言語
  { name: 'Tamil', code: 'ta' },
  { name: 'Telugu', code: 'te' },
  { name: 'Marathi', code: 'mr' },
  { name: 'Gujarati', code: 'gu' },
  { name: 'Malayalam', code: 'ml' },
  { name: 'Kannada', code: 'kn' },
  { name: 'Odia', code: 'or' },
  { name: 'Punjabi', code: 'pa' },
  { name: 'Sindhi', code: 'sd' },
  { name: 'Nepali', code: 'ne' },
  
  // 中東・西アジア系言語
  { name: 'Persian', code: 'fa' },
  { name: 'Kurdish', code: 'ku' },
  { name: 'Hebrew', code: 'he' },
  { name: 'Pashto', code: 'ps' },
  
  // 東南アジア系言語
  { name: 'Javanese', code: 'jv' },
  { name: 'Thai', code: 'th' },
  { name: 'Tagalog', code: 'tl' },
  { name: 'Lao', code: 'lo' },
  { name: 'Khmer', code: 'km' },
  { name: 'Sinhala', code: 'si' },
  
  // ヨーロッパ系言語
  { name: 'Czech', code: 'cs' },
  { name: 'Hungarian', code: 'hu' },
  { name: 'Romanian', code: 'ro' },
  { name: 'Serbian', code: 'sr' },
  { name: 'Bulgarian', code: 'bg' },
  { name: 'Greek', code: 'el' },
  { name: 'Dutch', code: 'nl' },
  { name: 'Swedish', code: 'sv' },
  { name: 'Finnish', code: 'fi' },
  { name: 'Danish', code: 'da' },
  { name: 'Norwegian', code: 'no' },
  { name: 'Ukrainian', code: 'uk' },
  { name: 'Polish', code: 'pl' },
  
  // その他の言語
  { name: 'Mongolian', code: 'mn' },
  { name: 'Amharic', code: 'am' },
  { name: 'Somali', code: 'so' },
  { name: 'Yoruba', code: 'yo' },
  { name: 'Igbo', code: 'ig' },
  { name: 'Zulu', code: 'zu' }
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
