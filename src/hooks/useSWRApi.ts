import useSWR from 'swr'
import { api } from '@/utils/api'

// 汎用のフェッチャー関数
const fetcher = (url: string) => api.get(url)

/**
 * ユーザー設定を取得・キャッシュするフック
 * SWRを使用してデータの状態管理とキャッシュを行う
 */
export function useUserSettings() {
  const { data, error, isLoading, mutate } = useSWR('/api/user/settings', fetcher, {
    // 初回フォーカス時に再検証を行う
    revalidateOnFocus: true,
    // ネットワーク復帰時に再検証を行う
    revalidateOnReconnect: true,
    // エラー時の再試行設定
    errorRetryCount: 2,
    errorRetryInterval: 1000,
  })

  return {
    user: (data as { data?: unknown })?.data,
    isLoading,
    error,
    // データを強制的に再取得する関数
    refetch: mutate,
  }
}

/**
 * 言語リストを取得・キャッシュするフック
 * 言語データは変更頻度が低いため、長時間キャッシュする
 */
export function useLanguages() {
  const { data, error, isLoading } = useSWR('/api/languages', fetcher, {
    // 言語データは変更頻度が低いため、フォーカス時に再検証しない
    revalidateOnFocus: false,
    // 10分間キャッシュ
    dedupingInterval: 10 * 60 * 1000,
  })

  return {
    languages: (data as { data?: unknown[] })?.data || [],
    isLoading,
    error,
  }
}

/**
 * ダッシュボード用の統合データを取得するフック
 * ユーザー設定と言語データを同時に取得
 */
export function useDashboardData() {
  const { user, isLoading: userLoading, error: userError, refetch: refetchUser } = useUserSettings()
  const { languages, isLoading: languagesLoading, error: languagesError } = useLanguages()

  return {
    user,
    languages,
    isLoading: userLoading || languagesLoading,
    error: userError || languagesError,
    refetch: refetchUser,
  }
}
