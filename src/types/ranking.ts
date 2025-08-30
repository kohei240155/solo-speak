// ランキング関連の型定義

export interface RankingQueryParams {
  language?: string
  period?: 'daily' | 'weekly' | 'monthly'
}

export interface RankingUser {
  userId: string
  username: string
  iconUrl: string | null
  count: number
  rank: number
}

// フロントエンド用の統一されたランキングユーザー型
export interface UnifiedRankingUser {
  userId: string
  username: string
  iconUrl: string | null
  totalCount: number
  rank: number
}

export interface SpeakRankingResponseData {
  success: true
  topUsers: RankingUser[]
  currentUser: RankingUser | null
}

export interface QuizRankingResponseData {
  success: true
  rankings: Array<{
    userId: string
    username: string
    iconUrl?: string
    totalCorrect: number
    rank: number
  }>
  userRank?: {
    userId: string
    username: string
    iconUrl?: string
    totalCorrect: number
    rank: number
  }
  period: string
  language: string
}

export interface PhraseRankingResponseData {
  success: true
  rankings: Array<{
    userId: string
    username: string
    iconUrl?: string
    totalPhrases: number
    rank: number
  }>
  userRank?: {
    userId: string
    username: string
    iconUrl?: string
    totalPhrases: number
    rank: number
  }
  period: string
  language: string
}

export interface DailyRankingResponseData {
  success: true
  rankings: Array<{
    userId: string
    username: string
    iconUrl?: string
    streakDays: number
    rank: number
  }>
  userRank?: {
    userId: string
    username: string
    iconUrl?: string
    streakDays: number
    rank: number
  }
}

export interface PhraseStreakRankingResponseData {
  success: true
  topUsers: Array<{
    userId: string
    username: string
    iconUrl: string | null
    streakDays: number
    rank: number
  }>
  currentUser: {
    userId: string
    username: string
    iconUrl: string | null
    streakDays: number
    rank: number
  } | null
}
