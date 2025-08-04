import { prisma } from '@/utils/prisma'

const basicLanguages = [
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
