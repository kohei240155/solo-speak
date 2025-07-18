import { prisma } from '@/utils/prisma'
import { User } from '@supabase/supabase-js'
import { Gender } from '@/generated/prisma/client'

/**
 * ユーザー名の重複チェック
 * @param username チェック対象のユーザー名
 * @param excludeUserId 除外するユーザーID（更新時に自分自身を除外）
 * @returns 重複があるかどうか
 */
export async function checkUsernameConflict(
  username: string, 
  excludeUserId?: string
): Promise<boolean> {
  const existingUser = await prisma.user.findFirst({
    where: { 
      username: username,
      ...(excludeUserId && { id: { not: excludeUserId } })
    }
  })

  return !!existingUser
}

/**
 * ユーザーの存在チェック
 * @param userId ユーザーID
 * @returns ユーザーが存在するかどうか
 */
export async function checkUserExists(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId }
  })

  return !!user
}

/**
 * ユーザー設定の取得
 * @param userId ユーザーID
 * @returns ユーザー設定データ
 */
export async function getUserSettings(userId: string) {
  return await prisma.user.findUnique({
    where: { id: userId },
    include: {
      nativeLanguage: true,
      defaultLearningLanguage: true,
    }
  })
}

/**
 * ユーザー設定の作成
 * @param user Supabaseユーザー情報
 * @param userData ユーザーデータ
 * @returns 作成されたユーザー設定
 */
export async function createUserSettings(
  user: User, 
  userData: {
    username: string
    iconUrl?: string
    nativeLanguageId: string
    defaultLearningLanguageId: string
    birthdate?: string
    gender?: Gender
    email?: string
    defaultQuizCount?: number
  }
) {
  return await prisma.user.create({
    data: {
      id: user.id,
      email: user.email || userData.email || '',
      username: userData.username,
      iconUrl: userData.iconUrl,
      nativeLanguageId: userData.nativeLanguageId,
      defaultLearningLanguageId: userData.defaultLearningLanguageId,
      birthdate: userData.birthdate ? new Date(userData.birthdate) : null,
      gender: userData.gender,
      defaultQuizCount: userData.defaultQuizCount || 10,
    },
    include: {
      nativeLanguage: true,
      defaultLearningLanguage: true,
    }
  })
}

/**
 * ユーザー設定の更新
 * @param userId ユーザーID
 * @param userData 更新データ
 * @returns 更新されたユーザー設定
 */
export async function updateUserSettings(
  userId: string, 
  userData: {
    username?: string
    iconUrl?: string
    nativeLanguageId?: string
    defaultLearningLanguageId?: string
    birthdate?: string
    gender?: Gender
    email?: string
    defaultQuizCount?: number
  }
) {
  return await prisma.user.update({
    where: { id: userId },
    data: {
      username: userData.username,
      iconUrl: userData.iconUrl,
      nativeLanguageId: userData.nativeLanguageId,
      defaultLearningLanguageId: userData.defaultLearningLanguageId,
      birthdate: userData.birthdate ? new Date(userData.birthdate) : null,
      gender: userData.gender,
      email: userData.email,
      defaultQuizCount: userData.defaultQuizCount,
    },
    include: {
      nativeLanguage: true,
      defaultLearningLanguage: true,
    }
  })
}
