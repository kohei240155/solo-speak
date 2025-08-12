import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { SavedPhrase, PhraseVariation } from '@/types/phrase'
import { SituationResponse } from '@/types/situation'
import { CreatePhraseResponseData } from '@/types/phrase'
import { useTranslation } from '@/hooks/ui/useTranslation'
import toast from 'react-hot-toast'
import { useUserSettings, useLanguages } from '@/hooks/api/useSWRApi'

export const usePhraseManager = () => {
  const { user } = useAuth()
  const { t } = useTranslation('common')
  const { userSettings } = useUserSettings() // SWRベースのフックを使用
  const { languages } = useLanguages() // SWRベースの言語取得フック
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [desiredPhrase, setDesiredPhrase] = useState('')
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState(0)
  const [situations, setSituations] = useState<SituationResponse[]>([])
  const [isInitializing, setIsInitializing] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [savingVariationIndex, setSavingVariationIndex] = useState<number | null>(null)
  const [editingVariations, setEditingVariations] = useState<{[key: number]: string}>({})
  const [savedPhrases, setSavedPhrases] = useState<SavedPhrase[]>([])
  const [isLoadingPhrases, setIsLoadingPhrases] = useState(true)
  const [hasMorePhrases, setHasMorePhrases] = useState(true)
  const [phrasePage, setPhrasePage] = useState(1)
  const [totalPhrases, setTotalPhrases] = useState(0)
  
  // バリデーション用state
  const [phraseValidationError, setPhraseValidationError] = useState('')
  const [variationValidationErrors, setVariationValidationErrors] = useState<{[key: number]: string}>({})
  
  // ホーム画面追加モーダル用state
  const [showAddToHomeScreenModal, setShowAddToHomeScreenModal] = useState(false)
  
  // ユーザー設定の初期化が完了したかを追跡
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // ユーザーがログアウトした時の状態クリア
  useEffect(() => {
    if (!user) {
      // ログアウト時に状態をクリア
      setRemainingGenerations(0)
      setSavedPhrases([])
      setSituations([])
      setUserSettingsInitialized(false)
      setLearningLanguage('en')
      setIsInitializing(true)
    }
  }, [user])

  const fetchSituations = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return
    }

    try {
      const data = await api.get<{ situations: SituationResponse[] }>('/api/situations')
      setSituations(data.situations)
    } catch {
      setSituations([])
    }
  }, [user])

  // SWRのuserSettingsからデータを設定
  useEffect(() => {
    if (userSettings && !userSettingsInitialized) {
      // ユーザー設定を適用
      if (userSettings.nativeLanguage?.code) {
        setNativeLanguage(userSettings.nativeLanguage.code)
      }
      if (userSettings.defaultLearningLanguage?.code) {
        setLearningLanguage(userSettings.defaultLearningLanguage.code)
      }
      setUserSettingsInitialized(true)
    }
  }, [userSettings, userSettingsInitialized])

  const fetchUserRemainingGenerations = useCallback(async () => {
    if (!user) {
      setRemainingGenerations(0)
      return
    }
    
    try {
      const data = await api.get<{ remainingGenerations: number }>('/api/user/phrase-generations', {
        showErrorToast: false // LP画面のエラーはトーストを表示しない
      })
      setRemainingGenerations(data.remainingGenerations)
    } catch {
      // ネットワークエラーや認証エラーの場合は静かに処理
      setRemainingGenerations(0)
    }
  }, [user])

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const data = await api.get<{ phrases: SavedPhrase[], pagination?: { hasMore: boolean, total: number } }>(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10`, {
        showErrorToast: false // LP画面のエラーはトーストを表示しない
      })
      const phrases = Array.isArray(data.phrases) ? data.phrases : []
      
      if (!append) {
        // 初回読み込み時は重複を除去して設定
        const uniquePhrases = phrases.filter((phrase: SavedPhrase, index: number, self: SavedPhrase[]) => 
          self.findIndex((p: SavedPhrase) => p.id === phrase.id) === index
        )
        setSavedPhrases(uniquePhrases)
        setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
        setPhrasePage(page)
        setTotalPhrases(data.pagination?.total || 0)
        return
      }
      
      // 追加読み込み時は重複を避けるため、IDが既に存在しないアイテムのみを追加
      setSavedPhrases(prev => {
        const existingIds = new Set(prev.map(p => p.id))
        const newPhrases = phrases.filter((phrase: SavedPhrase) => !existingIds.has(phrase.id))
        return [...prev, ...newPhrases]
      })
      
      setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
      setPhrasePage(page)
      setTotalPhrases(data.pagination?.total || 0)
    } catch {
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
      // ネットワークエラーや認証エラーの場合、サイレントに処理する
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage])

  const handleEditVariation = (index: number, newText: string) => {
    setEditingVariations(prev => ({ ...prev, [index]: newText }))
    
    // バリデーション
    if (newText.length > 200) {
      setVariationValidationErrors(prev => ({ 
        ...prev, 
        [index]: '200文字以内で入力してください' 
      }))
    } else {
      setVariationValidationErrors(prev => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { [index]: _, ...rest } = prev
        return rest
      })
    }
  }

  const handlePhraseChange = (value: string) => {
    setDesiredPhrase(value)
    
    // バリデーションエラーをクリア（空の場合はエラーメッセージを表示しない）
    setPhraseValidationError('')
  }

  const handleGeneratePhrase = async () => {
    // バリデーション
    if (!desiredPhrase.trim()) {
      setPhraseValidationError('フレーズを入力してください')
      return
    }

    if (desiredPhrase.length > 100) {
      setPhraseValidationError('フレーズは100文字以内で入力してください')
      return
    }

    if (remainingGenerations <= 0) {
      setError('本日の生成回数上限に達しました')
      return
    }

    // バリデーションをクリア
    setPhraseValidationError('')
    setError('')

    setIsLoading(true)
    setGeneratedVariations([])
    setEditingVariations({}) // 編集状態をリセット
    setVariationValidationErrors({}) // バリデーションエラーをリセット

    try {
      // 実際のAPI呼び出し
      const requestBody = {
        nativeLanguage,
        learningLanguage,
        desiredPhrase,
        selectedContext
      }
      
      const data = await api.post<{ variations?: PhraseVariation[] }>('/api/phrase/generate', requestBody)
      
      setGeneratedVariations(data.variations || [])
      
      // AI Suggest成功時に生成回数を減らす
      try {
        const generationsData = await api.post<{ remainingGenerations: number }>('/api/user/phrase-generations')
        setRemainingGenerations(generationsData.remainingGenerations)
      } catch {
        // エラーが発生しても生成処理は成功しているので続行
      }

    } catch (error) {
      setError(error instanceof Error ? error.message : 'フレーズの生成に失敗しました')
    } finally {
      setIsLoading(false)
    }
  }

  const handleSelectVariation = async (variation: PhraseVariation, index: number) => {
    if (!user) {
      setError('ログインが必要です')
      return
    }

    // 編集されたテキストの文字数バリデーション
    const finalText = editingVariations[index] || variation.original
    if (finalText.length > 200) {
      setVariationValidationErrors(prev => ({ 
        ...prev, 
        [index]: '200文字以内で入力してください' 
      }))
      return
    }

    if (finalText.trim().length === 0) {
      setVariationValidationErrors(prev => ({ 
        ...prev, 
        [index]: 'フレーズを入力してください' 
      }))
      return
    }

    // バリデーションをクリア
    setVariationValidationErrors(prev => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { [index]: _, ...rest } = prev
      return rest
    })
    setError('')

    setIsSaving(true)
    setSavingVariationIndex(index)

    try {
      // 学習言語のIDを取得
      const learningLang = languages?.find(lang => lang.code === learningLanguage)
      if (!learningLang) {
        throw new Error('学習言語が見つかりません')
      }

      const response = await api.post<CreatePhraseResponseData>('/api/phrase', {
        userId: user.id,
        languageId: learningLang.id,
        original: finalText,      // 学習言語のフレーズ
        translation: desiredPhrase, // 母国語の翻訳
        explanation: variation.explanation, // ニュアンス説明
        level: 'common', // フレーズのレベル（デフォルトcommon）
      })

      // 成功時の処理 - 即座に初期状態に戻す
      toast.success(t('phrase.messages.saveSuccess'))
      
      // 即座に全ての状態を初期化（flushSyncで同期的に実行）
      flushSync(() => {
        setIsSaving(false)
        setSavingVariationIndex(null)
        setGeneratedVariations([])  // これにより AI Suggest ボタンが活性になる
        setEditingVariations({})
        setVariationValidationErrors({})
        setDesiredPhrase('')    // フレーズを空に
        setSelectedContext(null) // コンテキスト選択をリセット
      })

      // フレーズ数が3になったときにホーム画面追加モーダルを表示
      if (response.totalPhraseCount === 3) {
        setShowAddToHomeScreenModal(true)
      }
      
      // 保存されたフレーズリストを再取得
      fetchSavedPhrases(1, false)

    } catch (error) {
      console.error('Error saving phrase:', error)
      setError(error instanceof Error ? error.message : 'フレーズの登録に失敗しました')
      // エラー時は保存関連の状態のみクリア（生成結果は残す）
      flushSync(() => {
        setIsSaving(false)
        setSavingVariationIndex(null)
      })
    }
  }

  const handleContextChange = (context: string | null) => {
    // 同じコンテキストが選択された場合は選択を解除（null に設定）
    setSelectedContext(prevContext => prevContext === context ? null : context)
  }

  const addSituation = useCallback(async (name: string) => {
    try {
      const newSituation = await api.post<SituationResponse>('/api/situations', { name })
      setSituations(prev => [newSituation, ...prev])
    } catch (err) {
      console.error('Failed to add situation:', err)
      throw err
    }
  }, [])

  const deleteSituation = useCallback(async (id: string) => {
    try {
      await api.delete(`/api/situations/${id}`)
      setSituations(prev => prev.filter(situation => situation.id !== id))
    } catch (err) {
      console.error('Failed to delete situation:', err)
      throw err
    }
  }, [])

  const handleResetVariations = () => {
    // ユーザーの編集内容のみをリセット（生成されたフレーズは残す）
    flushSync(() => {
      setEditingVariations({}) // 編集内容をクリアして元のAI生成フレーズに戻す
      setVariationValidationErrors({}) // バリデーションエラーもクリア
      setError('') // エラーメッセージもクリア
    })
  }

  // 手動での言語変更ハンドラー
  const handleLearningLanguageChange = (language: string) => {
    setLearningLanguage(language)
    setUserSettingsInitialized(true) // 手動変更後は初期化フラグをセット
  }

  // 警告チェック関数を公開（他のコンポーネントから使用可能）
  const checkUnsavedChanges = useCallback(() => {
    if (generatedVariations.length > 0) {
      return window.confirm(t('confirm.unsavedPhrase'))
    }
    return true
  }, [generatedVariations.length, t])

  // ホーム画面追加モーダルを閉じるハンドラー
  const closeAddToHomeScreenModal = useCallback(() => {
    setShowAddToHomeScreenModal(false)
  }, [])

  useEffect(() => {
    // ユーザーの初期データを並列取得
    if (user) {
      setIsInitializing(true)
      Promise.all([
        fetchSituations(),
        fetchUserRemainingGenerations(),
        fetchSavedPhrases(1, false)
      ]).then(() => {
        setIsInitializing(false)
      }).catch(error => {
        console.error('初期データ取得エラー:', error)
        setIsInitializing(false)
      })
    }
  }, [user, fetchSavedPhrases, fetchUserRemainingGenerations, fetchSituations])

  // 学習言語が変更されたときにフレーズを再取得
  useEffect(() => {
    if (user) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, user, fetchSavedPhrases])

  return {
    // State
    nativeLanguage,
    learningLanguage,
    setLearningLanguage,
    desiredPhrase,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
    languages: languages || [], // SWRベースのlanguagesを使用
    situations,
    isInitializing,
    isSaving,
    savingVariationIndex,
    editingVariations,
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    totalPhrases,
    phraseValidationError,
    variationValidationErrors,
    selectedContext,
    showAddToHomeScreenModal,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    fetchSavedPhrases,
    checkUnsavedChanges,
    handleLearningLanguageChange,
    handleContextChange,
    addSituation,
    deleteSituation,
    closeAddToHomeScreenModal
  }
}
