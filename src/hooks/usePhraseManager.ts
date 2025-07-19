import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { Language, SavedPhrase, PhraseVariation } from '@/types/phrase'
import toast from 'react-hot-toast'

export const usePhraseManager = () => {
  const { user } = useAuth()
  const [nativeLanguage, setNativeLanguage] = useState('ja')
  const [learningLanguage, setLearningLanguage] = useState('en')
  const [desiredPhrase, setDesiredPhrase] = useState('明日花火に行きたい')
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
  
  // バリデーション用state
  const [phraseValidationError, setPhraseValidationError] = useState('')
  const [variationValidationErrors, setVariationValidationErrors] = useState<{[key: number]: string}>({})

  const fetchLanguages = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        console.error('認証情報が見つかりません')
        return
      }

      const response = await fetch('/api/languages', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      })
      if (response.ok) {
        const data = await response.json()
        setLanguages(data)
      }
    } catch (error) {
      console.error('Error fetching languages:', error)
    }
  }

  const fetchUserSettings = async () => {
    try {
      const response = await fetch('/api/user/settings')
      if (response.ok) {
        const userData = await response.json()
        if (userData.nativeLanguage?.code) {
          setNativeLanguage(userData.nativeLanguage.code)
        }
        if (userData.defaultLearningLanguage?.code) {
          setLearningLanguage(userData.defaultLearningLanguage.code)
        }
      }
    } catch (error) {
      console.error('Error fetching user settings:', error)
    }
  }

  const fetchUserRemainingGenerations = async () => {
    // ユーザー設定APIから残り生成回数を取得
    // 画像に合わせて2に設定
    setRemainingGenerations(2)
  }

  const fetchSavedPhrases = useCallback(async (page = 1, append = false) => {
    if (!user) return
    
    setIsLoadingPhrases(true)
    try {
      const response = await fetch(`/api/phrase?userId=${user.id}&languageCode=${learningLanguage}&page=${page}&limit=10`)
      if (response.ok) {
        const data = await response.json()
        const phrases = Array.isArray(data.phrases) ? data.phrases : []
        
        if (append) {
          setSavedPhrases(prev => [...prev, ...phrases])
        } else {
          setSavedPhrases(phrases)
        }
        
        setHasMorePhrases(data.pagination?.hasMore || phrases.length === 10)
        setPhrasePage(page)
      }
    } catch (error) {
      console.error('Error fetching saved phrases:', error)
      if (!append) {
        setSavedPhrases([]) // エラー時は空配列に設定
      }
    } finally {
      setIsLoadingPhrases(false)
    }
  }, [user, learningLanguage])

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
      // 固定のフレーズを返す（テスト用）
      await new Promise(resolve => setTimeout(resolve, 1000)) // 1秒待機でAPIっぽく見せる
      
      const mockVariations = [
        {
          type: 'common' as const,
          text: 'I want to go see the fireworks tomorrow.',
          explanation: '一般的な表現'
        },
        {
          type: 'polite' as const,
          text: "I would like to go see the fireworks tomorrow, if that's alright.",
          explanation: '丁寧な表現'
        },
        {
          type: 'casual' as const,
          text: 'I wanna hit up the fireworks tomorrow!',
          explanation: 'カジュアルな表現'
        }
      ]
      
      setGeneratedVariations(mockVariations)
      setRemainingGenerations(prev => Math.max(0, prev - 1))

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
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          userId: user.id,
          languageId: learningLang.id,
          text: desiredPhrase,
          translation: finalText,
          level: variation.type, // フレーズのレベル（common, polite, casual）を追加
        }),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'フレーズの登録に失敗しました')
      }

      // 成功時の処理
      toast.success('Phrase registered successfully!')
      
      // 表示を元に戻す
      setGeneratedVariations([])
      setEditingVariations({})
      setVariationValidationErrors({})
      
      // 保存されたフレーズリストを再取得
      fetchSavedPhrases(1, false)

    } catch (error) {
      console.error('Error saving phrase:', error)
      setError(error instanceof Error ? error.message : 'フレーズの登録に失敗しました')
    } finally {
      setIsSaving(false)
      setSavingVariationIndex(null)
    }
  }

  const handleResetVariations = () => {
    setEditingVariations({})
  }

  useEffect(() => {
    // 言語一覧を取得
    fetchLanguages()
  }, [])

  useEffect(() => {
    // ユーザーの残り生成回数を取得
    if (user) {
      fetchUserRemainingGenerations()
      fetchUserSettings()
      fetchSavedPhrases(1, false)
    }
  }, [user, fetchSavedPhrases])

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
    languages,
    isSaving,
    savingVariationIndex,
    editingVariations,
    savedPhrases,
    isLoadingPhrases,
    hasMorePhrases,
    phrasePage,
    phraseValidationError,
    variationValidationErrors,
    
    // Handlers
    handleEditVariation,
    handlePhraseChange,
    handleGeneratePhrase,
    handleSelectVariation,
    handleResetVariations,
    fetchSavedPhrases
  }
}
