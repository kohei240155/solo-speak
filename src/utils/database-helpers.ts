import { prisma } from '@/utils/prisma'
import { User } from '@supabase/supabase-js'
import { createDefaultSituations } from './create-default-situations'

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
  try {
    console.log('checkUserExists - Checking user:', userId)
    const user = await prisma.user.findUnique({
      where: { id: userId }
    })
    const exists = !!user
    console.log('checkUserExists - Result:', { userId, exists })
    return exists
  } catch (error) {
    console.error('checkUserExists - Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      userId
    })
    throw error
  }
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
 * 初回ログイン時のユーザー初期化
 * @param user Supabaseユーザー情報
 * @returns 作成されたユーザーデータ
 */
export async function initializeUser(user: User) {
  try {
    console.log('initializeUser - Input data:', {
      userId: user.id,
      email: user.email,
      fullName: user.user_metadata?.full_name,
      name: user.user_metadata?.name,
      avatarUrl: user.user_metadata?.avatar_url ? `${user.user_metadata.avatar_url.substring(0, 50)}...` : undefined
    })

    // Googleから取得した情報
    const googleDisplayName = user.user_metadata?.full_name || user.user_metadata?.name || ''
    const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture || ''

    console.log('initializeUser - Extracted Google data:', {
      displayName: googleDisplayName,
      avatarUrl: googleAvatarUrl ? `${googleAvatarUrl.substring(0, 50)}...` : googleAvatarUrl
    })

    const result = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || '',
        username: googleDisplayName || null, // Googleの表示名を初期値として設定
        iconUrl: googleAvatarUrl,
        nativeLanguageId: null, // 初期状態では空（後で設定）
        defaultLearningLanguageId: null, // 初期状態では空（後で設定）
      },
      include: {
        nativeLanguage: true,
        defaultLearningLanguage: true,
      }
    })

    console.log('initializeUser - Success:', {
      userId: result.id,
      email: result.email,
      username: result.username,
      iconUrl: result.iconUrl ? `${result.iconUrl.substring(0, 50)}...` : result.iconUrl
    })

    return result
  } catch (error) {
    console.error('initializeUser - Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.id
    })
    throw error
  }
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
    email?: string
  }
) {
  try {
    console.log('createUserSettings - Input data:', {
      userId: user.id,
      email: user.email,
      userData: {
        ...userData,
        iconUrl: userData.iconUrl ? `${userData.iconUrl.substring(0, 50)}...` : userData.iconUrl
      }
    })

    const result = await prisma.user.create({
      data: {
        id: user.id,
        email: user.email || userData.email || '',
        username: userData.username,
        iconUrl: userData.iconUrl,
        nativeLanguageId: userData.nativeLanguageId,
        defaultLearningLanguageId: userData.defaultLearningLanguageId,
      },
      include: {
        nativeLanguage: true,
        defaultLearningLanguage: true,
      }
    })

    // ユーザー作成後、ネイティブ言語に応じたデフォルトシチュエーションを作成
    try {
      if (result.nativeLanguage) {
        await createDefaultSituations(prisma, result.id, result.nativeLanguage.code)
      }
    } catch (situationError) {
      console.error('Failed to create default situations:', situationError)
      // シチュエーション作成に失敗してもユーザー作成自体は成功として扱う
    }

    console.log('createUserSettings - Success:', {
      userId: result.id,
      username: result.username,
      iconUrl: result.iconUrl ? `${result.iconUrl.substring(0, 50)}...` : result.iconUrl
    })

    return result
  } catch (error) {
    console.error('createUserSettings - Error:', {
      error: error,
      message: error instanceof Error ? error.message : 'Unknown error',
      stack: error instanceof Error ? error.stack : undefined,
      userId: user.id,
      userData: {
        ...userData,
        iconUrl: userData.iconUrl ? `${userData.iconUrl.substring(0, 50)}...` : userData.iconUrl
      }
    })
    throw error
  }
}

/**
 * ユーザーのシチュエーションが存在するかチェック
 * @param userId ユーザーID
 * @returns シチュエーションが存在するかどうか
 */
export async function hasUserSituations(userId: string): Promise<boolean> {
  const count = await prisma.situation.count({
    where: {
      userId,
      deletedAt: null
    }
  })
  return count > 0
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
  }
){
  const result = await prisma.user.update({
    where: { id: userId },
    data: {
      username: userData.username,
      iconUrl: userData.iconUrl,
      nativeLanguageId: userData.nativeLanguageId,
      defaultLearningLanguageId: userData.defaultLearningLanguageId,
    },
    include: {
      nativeLanguage: true,
      defaultLearningLanguage: true,
    }
  })

  // ユーザーにシチュエーションが存在しない場合、デフォルトシチュエーションを作成
  try {
    const hasSituations = await hasUserSituations(userId)
    if (!hasSituations && result.nativeLanguage) {
      await createDefaultSituations(prisma, userId, result.nativeLanguage.code)
    }
  } catch (situationError) {
    console.error('Failed to create default situations during update:', situationError)
    // シチュエーション作成に失敗してもユーザー更新自体は成功として扱う
  }

  return result
}
