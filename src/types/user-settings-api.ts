// ユーザー設定API用の型定義
import { Gender } from '@/generated/prisma'

export interface UserSettingsData {
  id: string
  username: string
  iconUrl?: string | null
  nativeLanguageId: string
  defaultLearningLanguageId: string
  birthdate?: Date | null
  gender?: Gender | null
  email: string
  defaultQuizCount: number
  stripeCustomerId?: string | null
  remainingPhraseGenerations: number
  lastPhraseGenerationDate?: Date | null
  lastSpeakingDate?: Date | null
  createdAt: Date
  updatedAt: Date
  deletedAt?: Date | null
}

export interface CreateUserSettingsRequestBody {
  username: string
  iconUrl?: string
  nativeLanguageId: string
  defaultLearningLanguageId: string
  birthdate: string
  gender: string
  email: string
  defaultQuizCount: number
}

export interface UpdateUserSettingsRequestBody {
  username?: string
  iconUrl?: string
  nativeLanguageId?: string
  defaultLearningLanguageId?: string
  birthdate?: string
  gender?: string
  email?: string
  defaultQuizCount?: number
}

export type UserSettingsResponseData = UserSettingsData
