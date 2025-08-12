import useSWR from 'swr'
import useSWRInfinite from 'swr/infinite'
import { api } from '@/utils/api'
import { RemainingGenerationsResponse } from '@/types/phrase'
import { SituationsListResponse } from '@/types/situation'
import { useAuth } from '@/contexts/AuthContext'

// SWR用のfetcher関数
const fetcher = async (url: string) => {
  return await api.get(url)
}

// ユーザー設定用のカスタムfetcher（404エラーでトーストを表示しない）
const userSettingsFetcher = async (url: string) => {
  return await api.get(url, { showErrorToast: false })
}

// 残り生成回数用のfetcher（エラートーストを表示しない）
const generationsFetcher = async (url: string) => {
  return await api.get<RemainingGenerationsResponse>(url, { showErrorToast: false })
}

// シチュエーション用のfetcher（エラートーストを表示しない）
const situationsFetcher = async (url: string) => {
  return await api.get<SituationsListResponse>(url, { showErrorToast: false })
}

// 共通のSWRオプション設定
const SWR_CONFIGS = {
  // 短期キャッシュ（動的データ用）
  SHORT_CACHE: {
    dedupingInterval: 1 * 60 * 1000, // 1分
    revalidateOnFocus: true,
    shouldRetryOnError: true,
    errorRetryInterval: 10000,
  },
  // 中期キャッシュ（ユーザーデータ用）
  MEDIUM_CACHE: {
    dedupingInterval: 5 * 60 * 1000, // 5分
    revalidateOnFocus: true,
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
  // リアルタイムデータ用（自動更新あり）
  REALTIME: {
    dedupingInterval: 2 * 60 * 1000, // 2分
    revalidateOnFocus: true,
    refreshInterval: 30 * 1000, // 30秒間隔で自動更新
    shouldRetryOnError: true,
  }
} as const

// ユーザー設定を取得するSWRフック
export function useUserSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/settings', userSettingsFetcher, SWR_CONFIGS.MEDIUM_CACHE)

  return {
    userSettings: data as {
      username?: string
      iconUrl?: string
      nativeLanguage?: { id: string; name: string; code: string }
      defaultLearningLanguage?: { id: string; name: string; code: string }
      email?: string
    } | undefined,
    isLoading,
    error,
    refetch: mutate
  }
}

// 言語リストを取得するSWRフック
export function useLanguages() {
  const { data, error, isLoading, mutate } = useSWR('/api/languages', fetcher, SWR_CONFIGS.LONG_CACHE)

  // APIは直接言語配列を返すため、dataをそのまま使用
  const languages = data as Array<{ id: string; name: string; code: string }> | undefined

  return {
    languages,
    isLoading,
    error,
    refetch: mutate
  }
}

// ダッシュボードデータを取得するSWRフック
export function useDashboardData(language?: string) {
  const url = language ? `/api/dashboard?language=${language}` : null
  
  // ダッシュボード用の最適化されたキャッシュ設定
  const DASHBOARD_CONFIG = {
    dedupingInterval: 5 * 1000, // 5秒に短縮（フレーズ追加後の即座な反映のため）
    revalidateOnFocus: true,
    revalidateOnMount: true, // マウント時に常に再検証
    refreshInterval: 30 * 1000, // 30秒間隔で自動更新（リアルタイム性向上）
    shouldRetryOnError: true,
    errorRetryInterval: 10000,
  }
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, DASHBOARD_CONFIG)

  return {
    dashboardData: data as {
      phraseCreationStreak?: number
      speakStreak?: number
      speakCountToday?: number
      speakCountTotal?: number
      quizMastery?: Array<{
        level: string
        score: number
        color: string
      }>
    } | undefined,
    isLoading,
    error,
    refetch: mutate
  }
}

// フレーズリストを取得するSWRフック
export function usePhrases(language?: string, page = 1) {
  const url = language ? `/api/phrase?languageCode=${language}&page=${page}&limit=10&minimal=true` : null
  
  // フレーズリスト用の最適化されたキャッシュ設定
  const PHRASE_LIST_CONFIG = {
    dedupingInterval: 5 * 1000, // 5秒に短縮（フレーズ追加後の即座な反映のため）
    revalidateOnFocus: true,
    revalidateOnMount: true, // マウント時に常に再検証
    shouldRetryOnError: true,
    errorRetryInterval: 10000,
  }
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, PHRASE_LIST_CONFIG)

  const typedData = data as {
    phrases?: Array<{
      id: string
      text: string
      translation: string
      totalSpeakCount: number
      dailySpeakCount: number
    }>
    pagination?: { hasMore: boolean; total: number }
  } | undefined

  return {
    phrases: typedData?.phrases,
    hasMore: typedData?.pagination?.hasMore,
    totalCount: typedData?.pagination?.total,
    isLoading,
    error,
    refetch: mutate
  }
}

// 特定のフレーズを取得するSWRフック
export function usePhrase(phraseId?: string) {
  const url = phraseId ? `/api/phrase/${phraseId}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, SWR_CONFIGS.MEDIUM_CACHE)

  return {
    phrase: data as {
      id: string
      text: string
      translation: string
      totalSpeakCount?: number
      dailySpeakCount?: number
    } | undefined,
    isLoading,
    error,
    refetch: mutate
  }
}

// Speakモード用のフレーズを取得するSWRフック
export function useSpeakPhrase(language?: string) {
  const url = language ? `/api/phrase/speak?language=${language}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // キャッシュしない（毎回新しいランダムなフレーズを取得するため）
    dedupingInterval: 0,
    // フォーカス時の再検証を無効
    revalidateOnFocus: false,
    // 自動再検証を無効
    revalidateOnReconnect: false,
  })

  const typedData = data as {
    success: boolean
    phrase?: {
      id: string
      text: string
      translation: string
      totalSpeakCount: number
      dailySpeakCount: number
    }
    message?: string
  } | undefined

  return {
    data: typedData,
    phrase: typedData?.phrase,
    isLoading,
    error,
    refetch: mutate
  }
}

// 特定のフレーズのSpeakデータを取得するSWRフック
export function useSpeakPhraseById(phraseId?: string) {
  const url = phraseId ? `/api/phrase/${phraseId}/speak` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, SWR_CONFIGS.REALTIME)

  const typedData = data as {
    success: boolean
    phrase?: {
      id: string
      original: string
      translation: string
      totalSpeakCount: number
      dailySpeakCount: number
    }
  } | undefined

  return {
    data: typedData,
    phrase: typedData?.phrase,
    isLoading,
    error,
    refetch: mutate
  }
}

// 無限スクロール対応のフレーズリストを取得するSWRフック
export function useInfinitePhrases(language?: string) {
  const getKey = (pageIndex: number, previousPageData: { pagination?: { hasMore: boolean } } | null) => {
    // 最後のページに到達した場合
    if (previousPageData && !previousPageData.pagination?.hasMore) return null
    
    // 最初のページ、または次のページ
    return language ? `/api/phrase?languageCode=${language}&page=${pageIndex + 1}&limit=10&minimal=true` : null
  }

  // 無限スクロール用の最適化されたキャッシュ設定
  const INFINITE_PHRASE_CONFIG = {
    dedupingInterval: 5 * 1000, // 5秒に短縮
    revalidateOnMount: true, // マウント時に再検証
    revalidateOnFocus: true, // フォーカス時に再検証
    refreshInterval: 0, // 自動更新は無効
    shouldRetryOnError: true,
    errorRetryInterval: 10000,
  }

  const { data, error, isLoading, isValidating, size, setSize, mutate } = useSWRInfinite(
    language ? getKey : () => null,
    fetcher,
    INFINITE_PHRASE_CONFIG
  )

  type PageData = {
    phrases?: Array<{
      id: string
      original: string
      translation: string
      explanation?: string
      createdAt: string
      practiceCount: number
      correctAnswers: number
      language: {
        name: string
        code: string
      }
    }>
    pagination?: { hasMore: boolean; total: number }
  }

  // 全ページのフレーズを平坦化
  const phrases = data ? data.flatMap((page: unknown) => {
    const typedPage = page as PageData
    return typedPage.phrases || []
  }) : []
  const totalCount = (data?.[0] as PageData)?.pagination?.total || 0
  const hasMore = (data?.[data.length - 1] as PageData)?.pagination?.hasMore || false

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

  const { data, error, isLoading, mutate } = useSWR(url, fetcher, SWR_CONFIGS.SHORT_CACHE)

  // レスポンスの型定義
  type RankingResponse = {
    success: boolean
    topUsers?: Array<{
      userId: string
      username: string
      iconUrl: string | null
      count: number
      rank: number
    }>
    rankings?: Array<{
      userId: string
      username: string
      iconUrl?: string
      totalCorrect?: number
      totalPhrases?: number
      rank: number
    }>
    currentUser?: {
      userId: string
      username: string
      iconUrl: string | null
      count: number
      rank: number
    } | null
    message?: string
  }

  const typedData = data as RankingResponse | undefined

  // データを統一形式に変換
  let transformedData: Array<{
    userId: string
    username: string
    iconUrl: string | null
    totalCount: number
    rank: number
  }> = []

  if (typedData?.success) {
    if (typedData.topUsers) {
      // speak/quiz API形式
      transformedData = typedData.topUsers.map(user => ({
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl,
        totalCount: user.count,
        rank: user.rank
      }))
    } else if (typedData.rankings) {
      // phrase/quiz API形式
      transformedData = typedData.rankings.map(user => ({
        userId: user.userId,
        username: user.username,
        iconUrl: user.iconUrl || null,
        totalCount: user.totalCorrect || user.totalPhrases || 0,
        rank: user.rank
      }))
    }
  }

  // currentUserも統一形式に変換
  let currentUser: {
    userId: string
    username: string
    iconUrl: string | null
    totalCount: number
    rank: number
  } | null = null

  if (typedData?.currentUser) {
    currentUser = {
      userId: typedData.currentUser.userId,
      username: typedData.currentUser.username,
      iconUrl: typedData.currentUser.iconUrl,
      totalCount: typedData.currentUser.count,
      rank: typedData.currentUser.rank
    }
  }

  return {
    rankingData: transformedData,
    currentUser,
    isLoading,
    error,
    message: typedData?.message,
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
    ([url]) => generationsFetcher(url),
    {
      dedupingInterval: 2 * 60 * 1000, // 2分間キャッシュ（適度なリアルタイム性）
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 10 * 60 * 1000, // 10分ごとに自動更新（5分→10分に緩和）
      shouldRetryOnError: true,
    }
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
    ([url]) => situationsFetcher(url),
    {
      dedupingInterval: 5 * 60 * 1000, // 5分間キャッシュ
      revalidateOnFocus: true,
      shouldRetryOnError: true,
    }
  )
  
  return {
    situations: data?.situations || [],
    situationsData: data,
    isLoading,
    error,
    refetch: mutate
  }
}