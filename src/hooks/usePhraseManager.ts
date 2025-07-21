import { useState, useEffect, useCallback } from 'react'
import { flushSync } from 'react-dom'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { Language, SavedPhrase, PhraseVariation } from '@/types/phrase'
import toast from 'react-hot-toast'

export const usePhraseManager = () => {
  const { user } = useAuth()
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [desiredPhrase, setDesiredPhrase] = useState('明日花火に行きたい')
  const [selectedType, setSelectedType] = useState<'common' | 'business' | 'casual'>('common')
  const [generatedVariations, setGeneratedVariations] = useState<PhraseVariation[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')
  const [remainingGenerations, setRemainingGenerations] = useState(0)
  const [languages, setLanguages] = useState<Language[]>([])
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

  // 認証ヘッダーを取得するヘルパー関数
  const getAuthHeaders = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession()
    if (!session?.access_token) {
      throw new Error('No authentication token available')
    }
    return {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json'
    }
  }, [])
  const fetchLanguages = useCallback(async () => {
    // ユーザーがログインしていない場合は何もしない
    if (!user) {
      console.log('User not logged in, skipping language fetch in usePhraseManager')
      return
    }

    try {
      const headers = await getAuthHeaders()
      const response = await fetch('/api/languages', {
        method: 'GET',
        headers
      })
      if (response.ok) {
        const data = await response.json()
        setLanguages(data)
      } else {
        console.error('Failed to fetch languages:', response.status, response.statusText)
      }
    } catch (error) {
      console.error('Error fetching languages in usePhraseManager:', error)
      setLanguages([])
    }
  }, [getAuthHeaders, user])

  const fetchUserSettings = useCallback(async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const userData = await response.json()
        // 初期化時のみユーザー設定を適用
        if (!userSettingsInitialized) {
          if (userData.nativeLanguage?.code) {
            setNativeLanguage(userData.nativeLanguage.code)
          }
          if (userData.defaultLearningLanguage?.code) {
            setLearningLanguage(userData.defaultLearningLanguage.code)
          }
          setUserSettingsInitialized(true)
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }, [userSettingsInitialized])

  const fetchUserRemainingGenerations = async () => {
    // ユーザー設定APIから残り生成回数を取得
    // テスト中なので多めに設定
    setRemainingGenerations(5)
  }

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const headers = await getAuthHeaders()
      const response = await fetch(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10`, {
        headers
      })
      if (response.ok) {
        const data = await response.json()
        const phrases = Array.isArray(data.phrases) ? data.phrases : []
        
        // デバッグ: 重複チェック
        const phraseIds = phrases.map((p: SavedPhrase) => p.id)
        const uniqueIds = new Set(phraseIds)
        if (phraseIds.length !== uniqueIds.size) {
          console.warn('Duplicate phrase IDs detected in API response:', phraseIds)
        }
        
        if (append) {
          // 重複を避けるため、IDが既に存在しないアイテムのみを追加
          setSavedPhrases(prev => {
            const existingIds = new Set(prev.map(p => p.id))
            const newPhrases = phrases.filter((phrase: SavedPhrase) => !existingIds.has(phrase.id))
            console.log(`Appending ${newPhrases.length} new phrases out of ${phrases.length} fetched`)
            return [...prev, ...newPhrases]
          })
        } else {
          // 初回読み込み時も重複を除去
          const uniquePhrases = phrases.filter((phrase: SavedPhrase, index: number, self: SavedPhrase[]) => 
            self.findIndex((p: SavedPhrase) => p.id === phrase.id) === index
          )
          console.log(`Setting ${uniquePhrases.length} unique phrases out of ${phrases.length} fetched`)
          setSavedPhrases(uniquePhrases)
        }
        
        setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
        setPhrasePage(page)
        setTotalPhrases(data.pagination?.total || 0)
      }
    } catch (error) {
      console.error('Error fetching saved phrases:', error)
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage, getAuthHeaders])

  const handleEditVariation = (index: number, newText: string) => {
    setEditingVariations(prev => ({ ...prev, [index]: newText }))
    
    // バリデーション
    if (newText.length > 100) {
      setVariationValidationErrors(prev => ({ 
        ...prev, 
        [index]: '100文字以内で入力してください' 
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
      const headers = await getAuthHeaders()
      const response = await fetch('/api/phrase/generate', {
        method: 'POST',
        headers,
        body: JSON.stringify({
          nativeLanguage,
          learningLanguage,
          desiredPhrase,
          selectedStyle: selectedType
        })
      })

      if (!response.ok) {
        throw new Error('フレーズの生成に失敗しました')
      }

      const data = await response.json()
      setGeneratedVariations(data.variations || [])
      
      // 生成回数の減算はSelect成功時に行うため、ここでは減らさない
      // setRemainingGenerations(prev => Math.max(0, prev - 1))

    } catch (error) {
      console.error('Error generating phrase:', error)
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
    if (finalText.length > 100) {
      setVariationValidationErrors(prev => ({ 
        ...prev, 
        [index]: '100文字以内で入力してください' 
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

      const response = await fetch('/api/phrase', {
        method: 'POST',
        headers: await getAuthHeaders(),
        body: JSON.stringify({
          userId: user.id,
          languageId: learningLang.id,
          text: finalText,      // 学習言語のフレーズ
          translation: desiredPhrase, // 母国語の翻訳
          level: variation.type, // フレーズのレベル（common, polite, casual）を追加
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'フレーズの登録に失敗しました')
      }

      // 成功時の処理 - 即座に初期状態に戻す
      toast.success('Phrase registered successfully!')
      
      // 即座に全ての状態を初期化（flushSyncで同期的に実行）
      flushSync(() => {
        setIsSaving(false)
        setSavingVariationIndex(null)
        setGeneratedVariations([])  // これにより AI Suggest ボタンが活性になる
        setEditingVariations({})
        setVariationValidationErrors({})
        // テスト中なので生成回数は減らさない
        // setRemainingGenerations(prev => Math.max(0, prev - 1))
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

  const handleTypeChange = (type: 'common' | 'business' | 'casual') => {
    setSelectedType(type)
  }

  const handleResetVariations = () => {
    // ユーザーの編集内容のみをリセット（生成されたフレーズは残す）
    flushSync(() => {
      setEditingVariations({}) // 編集内容をクリアして元のAI生成フレーズに戻す
      setVariationValidationErrors({}) // バリデーションエラーもクリア
      setError('') // エラーメッセージもクリア
    })
  }

  useEffect(() => {
    // ユーザーがログインしている場合のみ言語一覧を取得
    if (user) {
      fetchLanguages()
    }
  }, [fetchLanguages, user])

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
    // ユーザーの残り生成回数を取得
    if (user) {
      fetchUserRemainingGenerations()
      fetchUserSettings()
      fetchSavedPhrases(1, false)
    }
  }, [user, fetchUserSettings, fetchSavedPhrases])

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
    selectedType,
    generatedVariations,
    isLoading,
    error,
    remainingGenerations,
    languages,
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
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    fetchSavedPhrases,
    checkUnsavedChanges,
    handleTypeChange,
    handleLearningLanguageChange
  }
}
