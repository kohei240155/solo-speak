import { z } from 'zod'

// バリデーションスキーマ
export const userSetupSchema = z.object({
  username: z.string().min(1, 'Display Name is required'),
  iconUrl: z.string().optional(),
  nativeLanguageId: z.string().min(1, 'Native Language is required'),
  defaultLearningLanguageId: z.string().min(1, 'Default Learning Language is required'),
  birthdate: z.string().min(1, 'Date of Birth is required'),
  gender: z.string().min(1, 'Gender is required'),
  email: z.string().email('Please enter a valid email address'),
  defaultQuizCount: z.number().min(5, 'Default Quiz Length must be at least 5').max(25, 'Default Quiz Length must be at most 25')
})

export type UserSetupFormData = z.infer<typeof userSetupSchema>

export interface Language {
  id: string
  name: string
  code: string
}
