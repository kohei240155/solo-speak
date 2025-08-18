import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { api } from '@/utils/api'
import { RemainingGenerationsResponse, PhrasesListResponseData, PhraseDetailResponse, SpeakPhraseResponse, UpdatePhraseCountResponseData } from '@/types/phrase'
import { SituationsListResponse } from '@/types/situation'
import { DashboardData } from '@/types/dashboard'
import { LanguageInfo } from '@/types/common'
import { SpeakRankingResponseData, QuizRankingResponseData, PhraseRankingResponseData, UnifiedRankingUser } from '@/types/ranking'
import { UserSettingsResponse } from '@/types/userSettings'
import { useAuth } from '@/contexts/AuthContext'

// SWR用の統一fetcher関数
const fetcher = async <T = unknown>(url: string, options?: { showErrorToast?: boolean }): Promise<T> => {
  return await api.get<T>(url, options || {})
}

// 共通のSWRオプション設定
const SWR_CONFIGS = {
  // 短期キャッシュ（動的データ用）
  SHORT_CACHE: {
    dedupingInterval: 1 * 60 * 1000, // 1分に短縮（高速化）
    revalidateOnFocus: false, // フォーカス時の自動更新を無効化
    revalidateOnReconnect: true,
    shouldRetryOnError: true,
    errorRetryInterval: 5000, // エラー時の再試行間隔を短縮
  },
  // 中期キャッシュ（ユーザーデータ用）
  MEDIUM_CACHE: {
    dedupingInterval: 5 * 60 * 1000, // 5分に短縮
    revalidateOnFocus: false, // フォーカス時の自動更新を無効化
    revalidateOnReconnect: true, // ネットワーク復旧時のみ更新
    shouldRetryOnError: true,
    errorRetryInterval: 10000,
  },
  // 長期キャッシュ（静的データ用）
  LONG_CACHE: {
    dedupingInterval: 30 * 60 * 1000, // 30分
    revalidateOnFocus: false,
    revalidateOnReconnect: false,
    shouldRetryOnError: true,
  },
  // リアルタイムデータ用（自動更新間隔を長く）
  REALTIME: {
    dedupingInterval: 5 * 60 * 1000, // 5分
    revalidateOnFocus: false, // フォーカス時の自動更新を無効化
    revalidateOnReconnect: true,
    refreshInterval: 2 * 60 * 1000, // 2分間隔で自動更新（30秒→2分）
    shouldRetryOnError: true,
  }
} as const

// ユーザー設定を取得するSWRフック（完全版）
export function useUserSettingsData(userId: string | null) {
  const userSettingsKey = userId ? [`/api/user/settings`, userId] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(
    userSettingsKey,
    async ([url]) => {
      return await fetcher<UserSettingsResponse>(url, { showErrorToast: false })
    },
    {
      ...SWR_CONFIGS.MEDIUM_CACHE,
      errorRetryCount: 1, // 404エラー後の無限ループを防ぐ
    }
  )

  return {
    userSettings: data,
    isLoading,
    error,
    refresh: mutate
  }
}

// ユーザー設定を取得するSWRフック（軽量版 - AuthContextのデータを参照）
export function useUserSettings() {
  const { userSettings, userSettingsLoading, refreshUserSettings } = useAuth()
  
  return {
    userSettings: userSettings,
    isLoading: userSettingsLoading,
    error: null, // AuthContextでエラーハンドリングされているため
    refetch: refreshUserSettings
  }
}

// 言語リストを取得するSWRフック
export function useLanguages() {
  const { data, error, isLoading, mutate } = useSWR('/api/languages', fetcher<LanguageInfo[]>, SWR_CONFIGS.LONG_CACHE)

  return {
    languages: data,
    isLoading,
    error,
    refetch: mutate
  }
}

// ダッシュボードデータを取得するSWRフック
export function useDashboardData(language?: string) {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const dashboardKey = user && language ? [`/api/dashboard?language=${language}`, user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(dashboardKey, ([url]) => fetcher<DashboardData>(url), SWR_CONFIGS.REALTIME)

  return {
    dashboardData: data,
    isLoading,
    error,
    refetch: mutate
  }
}

// フレーズリストを取得するSWRフック
export function usePhrases(language?: string, page = 1) {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const phrasesKey = user && language ? [`/api/phrase?languageCode=${language}&page=${page}&limit=10&minimal=true`, user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(phrasesKey, ([url]) => fetcher<PhrasesListResponseData>(url), SWR_CONFIGS.SHORT_CACHE)

  return {
    phrases: data?.phrases,
    hasMore: data?.pagination?.hasMore,
    totalCount: data?.pagination?.total,
    isLoading,
    error,
    refetch: mutate
  }
}

// 特定のフレーズを取得するSWRフック
export function usePhrase(phraseId?: string) {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const phraseKey = user && phraseId ? [`/api/phrase/${phraseId}`, user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(phraseKey, ([url]) => fetcher<PhraseDetailResponse>(url), SWR_CONFIGS.MEDIUM_CACHE)

  return {
    phrase: data,
    isLoading,
    error,
    refetch: mutate
  }
}

// Speakモード用のフレーズを取得するSWRフック
export function useSpeakPhrase(language?: string) {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const speakKey = user && language ? [`/api/phrase/speak?language=${language}`, user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(speakKey, ([url]) => fetcher<SpeakPhraseResponse>(url), {
    // キャッシュしない（毎回新しいランダムなフレーズを取得するため）
    dedupingInterval: 0,
    // フォーカス時の再検証を無効
    revalidateOnFocus: false,
    // 自動再検証を無効
    revalidateOnReconnect: false,
  })

  return {
    data: data,
    phrase: data?.phrase,
    isLoading,
    error,
    refetch: mutate
  }
}

// 特定のフレーズのSpeakデータを取得するSWRフック
export function useSpeakPhraseById(phraseId?: string) {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const speakByIdKey = user && phraseId ? [`/api/phrase/${phraseId}/speak`, user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR(speakByIdKey, ([url]) => fetcher<UpdatePhraseCountResponseData>(url), SWR_CONFIGS.REALTIME)

  return {
    data: data,
    phrase: data?.phrase,
    isLoading,
    error,
    refetch: mutate
  }
}

// 無限スクロール対応のフレーズリストを取得するSWRフック
export function useInfinitePhrases(language?: string) {
  const { user } = useAuth()
  
  const getKey = (pageIndex: number, previousPageData: { pagination?: { hasMore: boolean } } | null) => {
    // 最後のページに到達した場合
    if (previousPageData && !previousPageData.pagination?.hasMore) return null
    
    // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
    return user && language ? [`/api/phrase?languageCode=${language}&page=${pageIndex + 1}&limit=10&minimal=true`, user.id] as const : null
  }

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    user && language ? getKey : () => null,
    ([url]) => fetcher<PhrasesListResponseData>(url),
    SWR_CONFIGS.SHORT_CACHE
  )

  // 全ページのフレーズを平坦化
  const phrases = data ? data.flatMap((page) => page.phrases || []) : []
  const totalCount = data?.[0]?.pagination?.total || 0
  const hasMore = data?.[data.length - 1]?.pagination?.hasMore || false

  return {
    phrases,
    totalCount,
    hasMore,
    isLoading, // 初回読み込み中
    isLoadingMore: isValidating && !isLoading, // 追加ページ読み込み中
    error,
    size,
    setSize,
    refetch: mutate
  }
}

// ランキングデータを取得するSWRフック
export function useRanking(type?: 'phrase' | 'speak' | 'quiz', language?: string, period?: 'daily' | 'weekly' | 'total') {
  const { user } = useAuth()
  
  // エンドポイントを構築
  let url: string | null = null
  if (type && language) {
    if (type === 'phrase') {
      // Phraseランキングは常にtotal（期間指定なし）
      url = `/api/ranking/phrase?language=${language}`
    } else if (type === 'speak' || type === 'quiz') {
      const validPeriod = period || 'daily'
      url = `/api/ranking/${type}?language=${language}&period=${validPeriod}`
    }
  }

  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const rankingKey = user && url ? [url, user.id] as const : null

  const { data, error, isLoading, mutate } = useSWR(rankingKey, ([url]) => fetcher<SpeakRankingResponseData | QuizRankingResponseData | PhraseRankingResponseData>(url), SWR_CONFIGS.SHORT_CACHE)

  // データを統一形式に変換
  let transformedData: UnifiedRankingUser[] = []

  if (data?.success) {
    if ('topUsers' in data) {
      // speak API形式
      transformedData = data.topUsers.map(user => ({
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        totalCount: user.count,
        rank: user.rank
      }))
    } else if ('rankings' in data) {
      // phrase/quiz API形式
      transformedData = data.rankings.map(user => ({
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl || null,
        totalCount: ('totalCorrect' in user) ? user.totalCorrect : ('totalPhrases' in user) ? user.totalPhrases : 0,
        rank: user.rank
      }))
    }
  }

  // currentUserも統一形式に変換
  let currentUser: UnifiedRankingUser | null = null

  if (data && 'currentUser' in data && data.currentUser) {
    currentUser = {
      userId: data.currentUser.userId,
      username: data.currentUser.username,
      iconUrl: data.currentUser.iconUrl,
      totalCount: data.currentUser.count,
      rank: data.currentUser.rank
    }
  } else if (data && 'userRank' in data && data.userRank) {
    currentUser = {
      userId: data.userRank.userId,
      username: data.userRank.username,
      iconUrl: data.userRank.iconUrl || null,
      totalCount: ('totalCorrect' in data.userRank) ? data.userRank.totalCorrect : ('totalPhrases' in data.userRank) ? data.userRank.totalPhrases : 0,
      rank: data.userRank.rank
    }
  }

  return {
    rankingData: transformedData,
    currentUser,
    isLoading,
    error,
    message: data && 'message' in data ? data.message : undefined,
    refetch: mutate
  }
}

// 残り生成回数を取得するSWRフック
export function useRemainingGenerations() {
  const { user } = useAuth()
  
  // ユーザー切り替え時のキャッシュ衝突を避けるためにuser.idをキーに含める
  const generationsKey = user ? ['/api/phrase/remaining', user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR<RemainingGenerationsResponse>(
    generationsKey,
    ([url]) => fetcher<RemainingGenerationsResponse>(url, { showErrorToast: false }),
    SWR_CONFIGS.MEDIUM_CACHE
  )
  
  return {
    remainingGenerations: data?.remainingGenerations || 0,
    generationsData: data,
    isLoading,
    error,
    refetch: mutate
  }
}

// シチュエーションリストを取得するSWRフック
export function useSituations() {
  const { user } = useAuth()
  
  const situationsKey = user ? ['/api/situations', user.id] as const : null
  
  const { data, error, isLoading, mutate } = useSWR<SituationsListResponse>(
    situationsKey,
    ([url]) => fetcher<SituationsListResponse>(url, { showErrorToast: false }),
    SWR_CONFIGS.MEDIUM_CACHE
  )
  
  return {
    situations: data?.situations || [],
    situationsData: data,
    isLoading,
    error,
    refetch: mutate
  }
}