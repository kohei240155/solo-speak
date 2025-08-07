import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { PhraseVariation } from '@/types/phrase'
import { useLanguages, useUserSettings, useInfinitePhrases } from '@/hooks/api/useSWRApi'
import useSWR, { mutate } from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

// 型定義
interface GenerationsData {
  remainingGenerations: number
  hasActiveSubscription?: boolean
}

interface SituationsData {
  situations: Array<{
    id: string
    name: string
    createdAt: string
    updatedAt: string
  }>
}

// SWR用のfetcher関数
const fetcher = async (url: string) => {
  return await api.get(url, { showErrorToast: false })
}

export const usePhraseManagerSWR = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  
  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useUserSettings()
  
  // 残り生成回数をSWRで取得
  const { data: generationsData, mutate: mutateGenerations } = useSWR(
    user ? '/api/user/phrase-generations' : null,
    fetcher,
    {
      dedupingInterval: 30 * 1000, // 30秒間キャッシュ（日付変更検出を早くするため）
      revalidateOnFocus: true,
      revalidateOnReconnect: true,
      refreshInterval: 5 * 60 * 1000, // 5分ごとに自動更新（日付変更を検出）
      shouldRetryOnError: true,
    }
  ) as { data: GenerationsData | undefined, mutate: () => void }
  
  // シチュエーションをSWRで取得
  const { data: situationsData, mutate: mutateSituations } = useSWR(
    user ? '/api/situations' : null,
    fetcher,
    {
      dedupingInterval: 5 * 60 * 1000, // 5分間キャッシュ
      revalidateOnFocus: true,
      shouldRetryOnError: true,
    }
  ) as { data: SituationsData | undefined, mutate: () => void }

  // ローカル状態
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  
  // フレーズ数をSWRで取得（学習言語変更に対応）
  const { totalCount: availablePhraseCount } = useInfinitePhrases(learningLanguage)
  const [desiredPhrase, setDesiredPhrase] = useState('')
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [savingVariationIndex, setSavingVariationIndex] = useState<number | null>(null)
  const [editingVariations, setEditingVariations] = useState<{[key: number]: string}>({})
  
  // バリデーション用state
  const [phraseValidationError, setPhraseValidationError] = useState('')
  const [variationValidationErrors, setVariationValidationErrors] = useState<{[key: number]: string}>({})
  
  // ユーザー設定の初期化が完了したかを追跡
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // ユーザー設定からの初期化
  useEffect(() => {
    if (userSettings && !userSettingsInitialized) {
      if (userSettings.nativeLanguage?.code) {
        setNativeLanguage(userSettings.nativeLanguage.code)
      }
      if (userSettings.defaultLearningLanguage?.code) {
        setLearningLanguage(userSettings.defaultLearningLanguage.code)
      }
      setUserSettingsInitialized(true)
    }
  }, [userSettings, userSettingsInitialized])

  // ユーザーがログアウトした時の状態クリア
  useEffect(() => {
    if (!user) {
      setUserSettingsInitialized(false)
      setLearningLanguage('en')
      setDesiredPhrase('')
      setGeneratedVariations([])
      setSelectedContext(null)
    }
  }, [user])

  // サブスクリプションキャンセルイベントを監視
  useEffect(() => {
    const handleSubscriptionCanceled = () => {
      console.log('Subscription canceled event received, refreshing generation data...')
      mutateGenerations()
    }

    window.addEventListener('subscriptionCanceled', handleSubscriptionCanceled)
    
    return () => {
      window.removeEventListener('subscriptionCanceled', handleSubscriptionCanceled)
    }
  }, [mutateGenerations])

  // 日付変更の検出（UTC基準）
  useEffect(() => {
    let currentUTCDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const checkDateChange = () => {
      const newUTCDate = new Date().toISOString().split('T')[0]
      if (newUTCDate !== currentUTCDate) {
        currentUTCDate = newUTCDate
        mutateGenerations() // 日付が変わったら生成回数データを再取得
      }
    }
    
    // 1分ごとに日付変更をチェック
    const interval = setInterval(checkDateChange, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [mutateGenerations])

  // データ取得状態の計算
  const isInitializing = !user || !languages || !userSettings || !generationsData || !situationsData
  const remainingGenerations = generationsData?.remainingGenerations || 0
  const situations = situationsData?.situations || []

  // バリデーション関数
  const validatePhrase = useCallback((phrase: string) => {
    setPhraseValidationError('')
    
    if (!phrase.trim()) {
      setPhraseValidationError('フレーズを入力してください')
      return false
    }
    
    if (phrase.length > 100) {
      setPhraseValidationError('フレーズは100文字以内で入力してください')
      return false
    }
    
    return true
  }, [])

  const validateVariation = useCallback((text: string, index: number) => {
    setVariationValidationErrors(prev => ({
      ...prev,
      [index]: ''
    }))
    
    if (!text.trim()) {
      setVariationValidationErrors(prev => ({
        ...prev,
        [index]: 'フレーズを入力してください'
      }))
      return false
    }
    
    if (text.length > 200) {
      setVariationValidationErrors(prev => ({
        ...prev,
        [index]: 'フレーズは200文字以内で入力してください'
      }))
      return false
    }
    
    return true
  }, [])

  // フレーズ変更ハンドラー
  const handlePhraseChange = useCallback((value: string) => {
    setDesiredPhrase(value)
    
    // リアルタイムバリデーション
    if (value.trim().length > 0) {
      validatePhrase(value)
    } else {
      setPhraseValidationError('')
    }
  }, [validatePhrase])

  // フレーズ生成ハンドラー
  const handleGeneratePhrase = useCallback(async () => {
    if (!validatePhrase(desiredPhrase)) {
      return
    }
    // 残り回数チェック（サブスクリプション関連のメッセージのみ無効化）
    if (remainingGenerations <= 0) {
      // SUBSCRIPTION_DISABLED: サブスクリプション関連のメッセージを無効化
      // const hasActiveSubscription = generationsData?.hasActiveSubscription || false
      // if (!hasActiveSubscription) {
      //   setError('フレーズ生成機能を利用するにはBasicプランへの登録が必要です。Settingsページから登録してください。')
      // } else {
        setError('本日の生成回数を超過しました。明日再度お試しください。')
      // }
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const response = await api.post<{ variations: PhraseVariation[], error?: string }>('/api/phrase/generate', {
        desiredPhrase,
        nativeLanguage,
        learningLanguage,
        selectedContext
      })

      if (response.variations && response.variations.length > 0) {
        setGeneratedVariations(response.variations)
        
        // 残り生成回数を更新
        mutateGenerations()
      } else {
        setError(response.error || 'フレーズの生成に失敗しました')
      }
    } catch (error) {
      console.error('Error generating phrase:', error)
      if (error instanceof Error && error.message?.includes('remainingGenerations')) {
        const hasActiveSubscription = generationsData?.hasActiveSubscription || false
        if (!hasActiveSubscription) {
          setError('フレーズ生成機能を利用するにはBasicプランへの登録が必要です。Settingsページから登録してください。')
        } else {
          setError('本日の生成回数を超過しました。明日再度お試しください。')
        }
        mutateGenerations()
      } else {
        setError('フレーズの生成中にエラーが発生しました')
      }
    } finally {
      setIsLoading(false)
    }
    // SUBSCRIPTION_DISABLED: generationsData?.hasActiveSubscriptionの依存関係は削除済み
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desiredPhrase, nativeLanguage, learningLanguage, selectedContext, validatePhrase, mutateGenerations, remainingGenerations])

  // バリエーション編集ハンドラー
  const handleEditVariation = useCallback((index: number, newText: string) => {
    setEditingVariations(prev => ({
      ...prev,
      [index]: newText
    }))
    
    // リアルタイムバリデーション
    if (newText.trim().length > 0) {
      validateVariation(newText, index)
    }
  }, [validateVariation])

  // バリエーション選択ハンドラー
  const handleSelectVariation = useCallback(async (variation: PhraseVariation, index: number) => {
    const textToSave = editingVariations[index] || variation.original
    
    if (!validateVariation(textToSave, index)) {
      return
    }

    setSavingVariationIndex(index)
    setIsSaving(true)

    try {
      // contextがnullの場合は送信しない
      const requestBody: {
        languageId: string
        original: string
        translation: string
        explanation: string
        level: string
        context?: string
      } = {
        languageId: languages?.find(lang => lang.code === learningLanguage)?.id || '',
        original: textToSave,
        translation: desiredPhrase,
        explanation: variation.explanation || '',
        level: 'common'
      }

      // selectedContextが存在する場合のみcontextを追加
      if (selectedContext) {
        requestBody.context = selectedContext
      }

      await api.post('/api/phrase', requestBody)

      flushSync(() => {
        setGeneratedVariations([])
        setDesiredPhrase('')
        setEditingVariations({})
        setSelectedContext(null)
        setError('')
        setPhraseValidationError('')
        setVariationValidationErrors({})
      })

      // フレーズリストのキャッシュを無効化して最新データを取得
      mutate((key) => typeof key === 'string' && key.includes('/api/phrase'))

      toast.success(t('phrase.messages.saveSuccess'))
    } catch (error) {
      console.error('Error saving phrase:', error)
      toast.error(t('phrase.messages.saveError'))
    } finally {
      setSavingVariationIndex(null)
      setIsSaving(false)
    }
  }, [editingVariations, desiredPhrase, learningLanguage, languages, selectedContext, validateVariation, t])

  // バリエーションリセットハンドラー
  const handleResetVariations = useCallback(() => {
    setGeneratedVariations([])
    setEditingVariations({})
    setError('')
    setVariationValidationErrors({})
  }, [])

  // 学習言語変更ハンドラー
  const handleLearningLanguageChange = useCallback((language: string) => {
    setLearningLanguage(language)
    setUserSettingsInitialized(true)
  }, [])

  // コンテキスト変更ハンドラー
  const handleContextChange = useCallback((context: string | null) => {
    setSelectedContext(context)
  }, [])

  // シチュエーション追加ハンドラー
  const addSituation = useCallback(async (name: string) => {
    try {
      await api.post('/api/situations', { name })
      // SWRキャッシュを更新
      mutateSituations()
      toast.success(t('situation.addSuccess'))
    } catch (error) {
      console.error('Error adding situation:', error)
      toast.error(t('situation.addError'))
      throw error
    }
  }, [mutateSituations, t])

  // シチュエーション削除ハンドラー
  const deleteSituation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/situations/${id}`)
      // SWRキャッシュを更新
      mutateSituations()
      toast.success(t('situation.deleteSuccess'))
    } catch (error) {
      console.error('Error deleting situation:', error)
      toast.error(t('situation.deleteError'))
      throw error
    }
  }, [mutateSituations, t])

  // 未保存変更チェック
  const checkUnsavedChanges = useCallback(() => {
    return generatedVariations.length > 0
  }, [generatedVariations])

  return {
    // State
    nativeLanguage,
    learningLanguage,
    desiredPhrase,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
    hasActiveSubscription: generationsData?.hasActiveSubscription || false,
    languages: languages || [],
    situations,
    isInitializing,
    isSaving,
    savingVariationIndex,
    editingVariations,
    phraseValidationError,
    variationValidationErrors,
    selectedContext,
    availablePhraseCount: availablePhraseCount || 0,
    
    // Handlers
    handlePhraseChange,
    handleGeneratePhrase,
    handleEditVariation,
    handleSelectVariation,
    handleResetVariations,
    handleLearningLanguageChange,
    handleContextChange,
    addSituation,
    deleteSituation,
    checkUnsavedChanges
  }
}
