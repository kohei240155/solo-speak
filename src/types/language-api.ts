// 言語API用の型定義

export interface Language {
  id: string
  code: string
  name: string
  createdAt: Date
  updatedAt: Date
  deletedAt: Date | null
}

export type LanguagesResponseData = Language[]
