import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { api } from '@/utils/api'
import { Language, SavedPhrase, PhraseVariation } from '@/types/phrase'
import { SituationResponse } from '@/types/situation'
import toast from 'react-hot-toast'

export const usePhraseManager = () => {
  const { user } = useAuth()
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [useChatGptApi, setUseChatGptApi] = useState(true)
  const [desiredPhrase, setDesiredPhrase] = useState('')
  const [selectedContext, setSelectedContext] = useState<string | null>(null)
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState(0)
  const [languages, setLanguages] = useState<Language[]>([])
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
  
  // ユーザー設定の初期化が完了したかを追跡
  const [userSettingsInitialized, setUserSettingsInitialized] = useState(false)

  // ユーザーがログアウトした時の状態クリア
  useEffect(() => {
    if (!user) {
      // ログアウト時に状態をクリア
      setRemainingGenerations(0)
      setSavedPhrases([])
      setLanguages([])
      setSituations([])
      setUserSettingsInitialized(false)
      setLearningLanguage('en')
      setIsInitializing(true)
    }
  }, [user])

  // useChatGptApiの状態に応じてフレーズを自動設定
  useEffect(() => {
    if (!useChatGptApi) {
      setDesiredPhrase('明日花火に行きたい')
    } else {
      setDesiredPhrase('')
    }
  }, [useChatGptApi])

  // 認証ヘッダーを取得するヘルパー関数（削除予定）
  
  const fetchLanguages = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      return
    }

    try {
      const data = await api.get<Language[]>('/api/languages')
      setLanguages(data)
    } catch {
      setLanguages([])
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

  const fetchUserSettings = useCallback(async () => {
    try {
      const userData = await api.get<{ nativeLanguage?: { code: string }, defaultLearningLanguage?: { code: string } }>('/api/user/settings', {
        showErrorToast: false // LP画面のエラーはトーストを表示しない
      })
      
      // 初期化済みの場合は何もしない
      if (userSettingsInitialized) {
        return
      }
      
      // ユーザー設定を適用
      if (userData.nativeLanguage?.code) {
        setNativeLanguage(userData.nativeLanguage.code)
      }
      if (userData.defaultLearningLanguage?.code) {
        setLearningLanguage(userData.defaultLearningLanguage.code)
      }
      setUserSettingsInitialized(true)
    } catch {
      // エラーが発生した場合はスキップ
    }
  }, [userSettingsInitialized])

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
        selectedStyle: 'common' as const,
        useChatGptApi,
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
    const finalText = editingVariations[index] || variation.text
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
      const learningLang = languages.find(lang => lang.code === learningLanguage)
      if (!learningLang) {
        throw new Error('学習言語が見つかりません')
      }

      await api.post('/api/phrase', {
        userId: user.id,
        languageId: learningLang.id,
        text: finalText,      // 学習言語のフレーズ
        translation: desiredPhrase, // 母国語の翻訳
        nuance: variation.explanation, // ニュアンス説明
        level: variation.type, // フレーズのレベル（common, polite, casual）を追加
      })

      // 成功時の処理 - 即座に初期状態に戻す
      toast.success('Phrase registered successfully!')
      
      // 即座に全ての状態を初期化（flushSyncで同期的に実行）
      flushSync(() => {
        setIsSaving(false)
        setSavingVariationIndex(null)
        setGeneratedVariations([])  // これにより AI Suggest ボタンが活性になる
        setEditingVariations({})
        setVariationValidationErrors({})
        setUseChatGptApi(true)  // デフォルトでChatGPT APIをONに
        setDesiredPhrase('')    // フレーズを空に
        setSelectedContext(null) // コンテキスト選択をリセット
      })
      
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
      return window.confirm('生成されたフレーズが保存されていません。このページを離れますか？')
    }
    return true
  }, [generatedVariations.length])

  useEffect(() => {
    // ユーザーの初期データを並列取得
    if (user) {
      setIsInitializing(true)
      Promise.all([
        fetchLanguages(),
        fetchSituations(),
        fetchUserRemainingGenerations(),
        fetchUserSettings(),
        fetchSavedPhrases(1, false)
      ]).then(() => {
        setIsInitializing(false)
      }).catch(error => {
        console.error('初期データ取得エラー:', error)
        setIsInitializing(false)
      })
    }
  }, [user, fetchUserSettings, fetchSavedPhrases, fetchUserRemainingGenerations, fetchLanguages, fetchSituations])

  // 学習言語が変更されたときにフレーズを再取得
  useEffect(() => {
    if (user) {
      fetchSavedPhrases(1, false)
    }
  }, [learningLanguage, user, fetchSavedPhrases])

  const handleUseChatGptApiChange = (value: boolean) => {
    setUseChatGptApi(value)
    // useEffectでフレーズの自動設定が行われるため、ここでは何もしない
  }

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
    languages,
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
    useChatGptApi,
    selectedContext,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    fetchSavedPhrases,
    checkUnsavedChanges,
    handleLearningLanguageChange,
    handleUseChatGptApiChange,
    handleContextChange,
    addSituation,
    deleteSituation
  }
}
