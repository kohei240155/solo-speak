import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { PhraseVariation, CreatePhraseResponseData, GeneratePhraseRequestBody, CreatePhraseRequestBody } from '@/types/phrase'
import { useLanguages, useUserSettings, useInfinitePhrases, useRemainingGenerations, useSituations } from '@/hooks/api/useSWRApi'
import toast from 'react-hot-toast'
import { useTranslation } from '@/hooks/ui/useTranslation'

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
      // データをリフレッシュ
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

  const validateVariation = useCallback((text: string) => {
    if (!text.trim()) {
      return false
    }
    
    if (text.length > 200) {
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
    // 残り回数チェック
    if (remainingGenerations <= 0) {
      setError(t('phrase.messages.dailyLimitExceeded'))
      return
    }

    setIsLoading(true)
    setError('')

    try {
      const requestBody: GeneratePhraseRequestBody = {
        desiredPhrase,
        nativeLanguage,
        learningLanguage,
        selectedContext: selectedContext || undefined
      }

      const response = await api.post<{ variations: PhraseVariation[], error?: string }>('/api/phrase/generate', requestBody)

      if (response.variations && response.variations.length > 0) {
        setGeneratedVariations(response.variations)
        
        // 残り生成回数を更新
        mutateGenerations()
      } else {
        setError(response.error || t('phrase.messages.generationFailed'))
      }
    } catch (error) {
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
      validateVariation(newText)
    }
  }, [validateVariation])

  // バリエーション選択ハンドラー
  const handleSelectVariation = useCallback(async (variation: PhraseVariation, index: number) => {
    const textToSave = editingVariations[index] || variation.original
    
    if (!validateVariation(textToSave)) {
      return
    }

    setSavingVariationIndex(index)
    setIsSaving(true)

    try {
      const requestBody: CreatePhraseRequestBody = {
        languageId: languages?.find(lang => lang.code === learningLanguage)?.id || '',
        original: textToSave,
        translation: desiredPhrase,
        explanation: variation.explanation || '',
        level: 'common'
      }

      const response = await api.post<CreatePhraseResponseData>('/api/phrase', requestBody)

      flushSync(() => {
        setGeneratedVariations([])
        setDesiredPhrase('')
        setEditingVariations({})
        setSelectedContext(null)
        setError('')
        setPhraseValidationError('')
      })

      toast.success(t('phrase.messages.saveSuccess'))

      // フレーズ数が1になったときにホーム画面追加モーダルを表示
      if (response.totalPhraseCount === 1) {
        setShowAddToHomeScreenModal(true)
      }
    } catch {
      toast.error(t('phrase.messages.saveError'))
    } finally {
      setSavingVariationIndex(null)
      setIsSaving(false)
    }
  }, [editingVariations, desiredPhrase, learningLanguage, languages, validateVariation, t])

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
    } catch (err) {
      toast.error(t('situation.addError'))
      throw err
    }
  }, [mutateSituations, t])

  // シチュエーション削除ハンドラー
  const deleteSituation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/situations/${id}`)
      // SWRキャッシュを更新
      mutateSituations()
      toast.success(t('situation.deleteSuccess'))
    } catch {
      toast.error(t('situation.deleteError'))
      throw new Error('Failed to delete situation')
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
    selectedContext,
    availablePhraseCount: availablePhraseCount || 0,
    showAddToHomeScreenModal,
    
    // Handlers
    handlePhraseChange,
    handleGeneratePhrase,
    handleEditVariation,
    handleSelectVariation,
    handleLearningLanguageChange,
    handleContextChange,
    addSituation,
    deleteSituation,
    checkUnsavedChanges,
    closeAddToHomeScreenModal
  }
}
