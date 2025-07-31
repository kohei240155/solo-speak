import { ApiSuccessResponse } from './api'

export interface DatabaseDebugData {
  totalSpeakLogs: number
  totalQuizResults: number
  sampleSpeakLogs: Array<{
    id: string
    count: number
    date: Date
    phrase: {
      id: string
      languageId: string
      original: string
      user: {
        id: string
        username: string | null
      }
    }
  }>
  sampleQuizResults: Array<{
    id: string
    correct: boolean
    createdAt: Date
    phrase: {
      id: string
      languageId: string
      original: string
      user: {
        id: string
        username: string | null
      }
    }
  }>
  languages: Array<{
    id: string
    code: string
    name: string
  }>
  totalPhrases: number
  phrasesEn: number
  totalUsers: number
}

export interface DatabaseDebugResponseData extends ApiSuccessResponse {
  data: DatabaseDebugData
}
