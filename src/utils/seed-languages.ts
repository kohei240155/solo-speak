import { prisma } from '@/utils/prisma'

const basicLanguages = [
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
  { name: 'Nepali', code: 'ne' },
  { name: 'Kurdish', code: 'ku' },
  { name: 'Thai', code: 'th' },
  { name: 'Tagalog', code: 'tl' },
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
  { name: 'Polish', code: 'pl' }
]

/**
 * 基本言語データが存在しない場合に自動でシードする
 */
export async function ensureBasicLanguagesExist(): Promise<void> {
  try {
    // 既存の言語数をチェック
    const existingLanguagesCount = await prisma.language.count({
      where: { deletedAt: null }
    })

    if (existingLanguagesCount === 0) {
      // 基本言語データを作成
      for (const language of basicLanguages) {
        await prisma.language.upsert({
          where: { code: language.code },
          update: {},
          create: {
            name: language.name,
            code: language.code
          }
        })
      }
    }
  } catch (error) {
    console.error('Error ensuring basic languages exist:', error)
    // エラーが発生しても処理を続行（ログのみ出力）
  }
}
