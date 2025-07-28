import { PrismaClient } from '@/generated/prisma'
import { getDefaultSituations } from './default-situations'

/**
 * ユーザーのデフォルトシチュエーションを作成
 * @param prisma Prismaクライアント
 * @param userId ユーザーID
 * @param languageCode ユーザーのネイティブ言語コード
 */
export async function createDefaultSituations(
  prisma: PrismaClient,
  userId: string,
  languageCode: string
): Promise<void> {
  const defaultSituations = getDefaultSituations(languageCode)
  
  // 既存のシチュエーションをチェック（重複作成を防ぐ）
  const existingSituations = await prisma.situation.findMany({
    where: {
      userId,
      deletedAt: null
    }
  })
  
  // 既存のシチュエーション名を取得
  const existingNames = existingSituations.map(s => s.name)
  
  // 重複しないシチュエーションのみを作成
  const situationsToCreate = defaultSituations.filter(name => !existingNames.includes(name))
  
  if (situationsToCreate.length > 0) {
    await prisma.situation.createMany({
      data: situationsToCreate.map(name => ({
        userId,
        name
      }))
    })
    
    console.log(`Created ${situationsToCreate.length} default situations for user ${userId} in language ${languageCode}`)
  } else {
    console.log(`No new default situations to create for user ${userId}`)
  }
}
