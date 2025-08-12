import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { PhraseVariation, CreatePhraseResponseData } from '@/types/phrase'
import { useLanguages, useUserSettings, useInfinitePhrases, useRemainingGenerations, useSituations } from '@/hooks/api/useSWRApi'
import { mutate } from 'swr'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'
import { SWR_CACHE_HELPERS } from '@/utils/swr-keys'

export const usePhraseManagerSWR = () => {
  const { user } = useAuth()
  const { t } = useTranslation()
  
  // SWRフックを使用してデータを取得
  const { languages } = useLanguages()
  const { userSettings } = useUserSettings()
  const { remainingGenerations, generationsData, refetch: mutateGenerations } = useRemainingGenerations()
  const { situations, situationsData, refetch: mutateSituations } = useSituations()

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
  
  // ホーム画面追加モーダル用state
  const [showAddToHomeScreenModal, setShowAddToHomeScreenModal] = useState(false)
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

  // TODO: サブスクリプションキャンセルイベントを監視
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

  // データ取得状態の計算
  const isInitializing = !user || !languages || !userSettings || !generationsData || !situationsData

  // バリデーション関数
  const validatePhrase = useCallback((phrase: string) => {
    setPhraseValidationError('')
    
    if (!phrase.trim()) {
      setPhraseValidationError(t('phrase.validation.required'))
      return false
    }
    
    if (phrase.length > 100) {
      setPhraseValidationError(t('phrase.validation.phraseMaxLength'))
      return false
    }
    
    return true
  }, [t])

  const validateVariation = useCallback((text: string, index: number) => {
    setVariationValidationErrors(prev => ({
      ...prev,
      [index]: ''
    }))
    
    if (!text.trim()) {
      setVariationValidationErrors(prev => ({
        ...prev,
        [index]: t('phrase.validation.required')
      }))
      return false
    }
    
    if (text.length > 200) {
      setVariationValidationErrors(prev => ({
        ...prev,
        [index]: t('phrase.validation.variationMaxLength')
      }))
      return false
    }
    
    return true
  }, [t])

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
    // 残り回数チェック
    if (remainingGenerations <= 0) {
      setError(t('phrase.messages.dailyLimitExceeded'))
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
        setError(response.error || t('phrase.messages.generationFailed'))
      }
    } catch (error) {
      console.error('Error generating phrase:', error)
      if (error instanceof Error && error.message?.includes('remainingGenerations')) {
        setError(t('phrase.messages.dailyLimitExceeded'))
        mutateGenerations()
      } else {
        setError(t('phrase.messages.generationError'))
      }
    } finally {
      setIsLoading(false)
    }
  }, [desiredPhrase, nativeLanguage, learningLanguage, selectedContext, validatePhrase, mutateGenerations, remainingGenerations, t])

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

      const response = await api.post<CreatePhraseResponseData>('/api/phrase', requestBody)

      flushSync(() => {
        setGeneratedVariations([])
        setDesiredPhrase('')
        setEditingVariations({})
        setSelectedContext(null)
        setError('')
        setPhraseValidationError('')
        setVariationValidationErrors({})
      })

      // 特定の言語のフレーズリストキャッシュを無効化し、即座に再取得
      const mutatePromise = mutate(
        SWR_CACHE_HELPERS.invalidatePhrasesByLanguage(learningLanguage),
        undefined, // データを未定義にして強制的に再取得
        { 
          revalidate: true, // 即座に再検証を実行
          optimisticData: undefined, // 楽観的更新は無効にして確実にサーバーからデータを取得
          rollbackOnError: false
        }
      )

      // 非同期で再取得を待つ（ただしUIをブロックしない）
      mutatePromise.catch(error => {
        console.warn('Cache revalidation warning:', error)
      })

      toast.success(t('phrase.messages.saveSuccess'))

      // フレーズ数が3になったときにホーム画面追加モーダルを表示
      if (response.totalPhraseCount === 3) {
        setShowAddToHomeScreenModal(true)
      }
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

  // ホーム画面追加モーダルを閉じるハンドラー
  const closeAddToHomeScreenModal = useCallback(() => {
    setShowAddToHomeScreenModal(false)
  }, [])

  return {
    // State
    nativeLanguage,
    learningLanguage,
    desiredPhrase,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
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
    showAddToHomeScreenModal,
    
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
    checkUnsavedChanges,
    closeAddToHomeScreenModal
  }
}
