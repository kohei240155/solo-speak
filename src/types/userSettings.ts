import { z } from 'zod'
import { LanguageInfo } from './common'

// バリデーションスキーマ
export const userSetupSchema = z.object({
  username: z.string().min(1, 'Display Name is required'),
  iconUrl: z.string().optional(),
  nativeLanguageId: z.string().min(1, 'Native Language is required'),
  defaultLearningLanguageId: z.string().min(1, 'Default Learning Language is required'),
  email: z.string().email('Please enter a valid email address'),
  defaultQuizCount: z.number().min(5, 'Default Quiz Length must be at least 5').max(25, 'Default Quiz Length must be at most 25')
})

export type UserSetupFormData = z.infer<typeof userSetupSchema>

// 再エクスポート（後方互換性のため）
export type Language = LanguageInfo
