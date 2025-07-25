import useSWR from 'swr'
import { api } from '@/utils/api'

// SWR用のfetcher関数
const fetcher = async (url: string) => {
  return await api.get(url)
}

// ユーザー設定を取得するSWRフック
export function useUserSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/settings', fetcher, {
    // 5分間キャッシュ
    dedupingInterval: 5 * 60 * 1000,
    // フォーカス時の再検証を有効
    revalidateOnFocus: true,
    // エラー時は再試行
    shouldRetryOnError: true,
    // 10秒でタイムアウト
    errorRetryInterval: 10000,
  })

  return {
    userSettings: data as {
      username?: string
      iconUrl?: string
      nativeLanguage?: { id: string; name: string; code: string }
      defaultLearningLanguage?: { id: string; name: string; code: string }
      birthdate?: string
      gender?: string
      email?: string
      defaultQuizCount?: number
    } | undefined,
    isLoading,
    error,
    refetch: mutate
  }
}

// 言語リストを取得するSWRフック
export function useLanguages() {
  const { data, error, isLoading, mutate } = useSWR('/api/languages', fetcher, {
    // 30分間キャッシュ（言語データは変更頻度が低いため）
    dedupingInterval: 30 * 60 * 1000,
    // フォーカス時の再検証を無効（静的データのため）
    revalidateOnFocus: false,
    // 長期キャッシュ
    revalidateOnReconnect: false,
  })

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
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // 2分間キャッシュ
    dedupingInterval: 2 * 60 * 1000,
    // フォーカス時の再検証を有効
    revalidateOnFocus: true,
    // 30秒間隔で自動更新
    refreshInterval: 30 * 1000,
  })

  return {
    dashboardData: data as {
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
  const url = language ? `/api/phrase?language=${language}&page=${page}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // 1分間キャッシュ
    dedupingInterval: 1 * 60 * 1000,
    // フォーカス時の再検証を有効
    revalidateOnFocus: true,
  })

  const typedData = data as {
    phrases?: Array<{
      id: string
      text: string
      translation: string
      totalSpeakCount: number
      dailySpeakCount: number
    }>
    totalCount?: number
  } | undefined

  return {
    phrases: typedData?.phrases,
    totalCount: typedData?.totalCount,
    isLoading,
    error,
    refetch: mutate
  }
}

// 特定のフレーズを取得するSWRフック
export function usePhrase(phraseId?: string) {
  const url = phraseId ? `/api/phrase/${phraseId}` : null
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // 5分間キャッシュ
    dedupingInterval: 5 * 60 * 1000,
    // フォーカス時の再検証を有効
    revalidateOnFocus: true,
  })

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
  
  const { data, error, isLoading, mutate } = useSWR(url, fetcher, {
    // 2分間キャッシュ
    dedupingInterval: 2 * 60 * 1000,
    // フォーカス時の再検証を有効
    revalidateOnFocus: true,
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
  } | undefined

  return {
    data: typedData,
    phrase: typedData?.phrase,
    isLoading,
    error,
    refetch: mutate
  }
}