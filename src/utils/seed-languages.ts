import { prisma } from '@/utils/prisma'

const basicLanguages = [
  { name: 'Japanese', code: 'ja' },
  { name: 'English', code: 'en' },
  { name: 'Chinese', code: 'zh' },
  { name: 'Korean', code: 'ko' },
  { name: 'Spanish', code: 'es' },
  { name: 'Portuguese', code: 'pt' },
  { name: 'Thai', code: 'th' }
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
