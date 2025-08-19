import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { SpeakPhrase } from '@/types/speak'
import { useSpeakPhraseById, useInfinitePhrases } from '@/hooks/api/useSWRApi'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface UseSinglePhraseSpeakProps {
  phraseId: string | null
  learningLanguage: string
  sendPendingCount: (phraseId: string, count: number) => Promise<boolean>
}

export function useSinglePhraseSpeak({ phraseId, learningLanguage, sendPendingCount }: UseSinglePhraseSpeakProps) {
  const { t } = useTranslation()
  const router = useRouter()
  
  // 状態管理
  const [singlePhrase, setSinglePhrase] = useState<SpeakPhrase | null>(null)
  const [isLoadingSinglePhrase, setIsLoadingSinglePhrase] = useState(false)
  const [singlePhraseTodayCount, setSinglePhraseTodayCount] = useState(0)
  const [singlePhraseTotalCount, setSinglePhraseTotalCount] = useState(0)
  const [singlePhrasePendingCount, setSinglePhrasePendingCount] = useState(0)
  const [singlePhraseCountDisabled, setSinglePhraseCountDisabled] = useState(false)
  const [isFinishing, setIsFinishing] = useState(false)
  
  // SWRフックを使用してフレーズを取得
  const { data: singlePhraseData, phrase: singlePhraseFromSWR, isLoading: isLoadingSinglePhraseSWR, refetch: refetchPhrase } = useSpeakPhraseById(phraseId || undefined)
  
  // Phrase Listのキャッシュを取得（キャッシュ無効化用）
  const { refetch: refetchPhraseList } = useInfinitePhrases(learningLanguage)

  // エラーハンドリング用のコールバック
  const handleNotFoundError = useCallback(() => {
    toast.error(t('phrase.messages.notFound'))
    router.push('/phrase/list')
  }, [t, router])

  // SWRから取得したデータを状態に反映
  useEffect(() => {
    if (!phraseId) {
      return
    }
    
    if (singlePhraseFromSWR) {
      setSinglePhrase(singlePhraseFromSWR)
      setSinglePhraseTodayCount(singlePhraseFromSWR.dailySpeakCount || 0)
      setSinglePhraseTotalCount(singlePhraseFromSWR.totalSpeakCount || 0)
      setSinglePhrasePendingCount(0)
      setSinglePhraseCountDisabled((singlePhraseFromSWR.dailySpeakCount || 0) >= 100)
      setIsLoadingSinglePhrase(false)
      return
    }
    
    if (singlePhraseData && !singlePhraseData.success) {
      handleNotFoundError()
    }
  }, [singlePhraseFromSWR, singlePhraseData, phraseId, handleNotFoundError])

  // ローディング状態の管理
  useEffect(() => {
    if (phraseId) {
      setIsLoadingSinglePhrase(isLoadingSinglePhraseSWR)
    }
  }, [phraseId, isLoadingSinglePhraseSWR])

  // 音読回数を更新（ローカルでのみカウントを増加）
  const handleCount = useCallback(() => {
    if (!singlePhrase) return

    // ローカル状態のみを更新（APIは呼ばない）
    setSinglePhrasePendingCount(prev => prev + 1)
    setSinglePhraseTodayCount(prev => {
      const newCount = prev + 1
      setSinglePhraseCountDisabled(newCount >= 100)
      
      // ちょうど100回に達した時にトーストを表示
      if (newCount === 100) {
        toast.error(t('speak.messages.dailyLimitReached'), {
          duration: 4000
        })
      }
      
      return newCount
    })
    setSinglePhraseTotalCount(prev => prev + 1)
    
    // フレーズの表示カウントも更新（表示用）
    setSinglePhrase(prev => prev ? {
      ...prev,
      totalSpeakCount: prev.totalSpeakCount + 1
      // dailySpeakCount は実際のAPIレスポンスベースで管理するため更新しない
    } : null)
  }, [singlePhrase, t])

  // 練習終了処理
  const handleFinish = useCallback(async () => {
    setIsFinishing(true)
    try {
      // 保留中のカウントを送信
      if (singlePhrase && singlePhrasePendingCount > 0) {
        const success = await sendPendingCount(singlePhrase.id, singlePhrasePendingCount)
        if (!success) {
          toast.error(t('phrase.messages.countError'))
        }
      }
      
      // Phrase Listのキャッシュを無効化
      refetchPhraseList()
      
      router.push('/phrase/list')
    } catch {
      toast.error(t('speak.messages.endError'))
    } finally {
      setIsFinishing(false)
    }
  }, [singlePhrase, singlePhrasePendingCount, sendPendingCount, refetchPhraseList, t, router])

  // 日付変更の検出（UTC基準）- 単一フレーズSpeak練習用
  useEffect(() => {
    if (!phraseId) return
    
    let currentUTCDate = new Date().toISOString().split('T')[0] // YYYY-MM-DD形式
    
    const checkDateChange = () => {
      const newUTCDate = new Date().toISOString().split('T')[0]
      if (newUTCDate !== currentUTCDate) {
        currentUTCDate = newUTCDate
        // 日付が変わったらフレーズデータを再取得
        refetchPhrase()
      }
    }
    
    // 1分ごとに日付変更をチェック
    const interval = setInterval(checkDateChange, 60 * 1000)
    
    return () => clearInterval(interval)
  }, [phraseId, refetchPhrase])

  return {
    singlePhrase,
    isLoadingSinglePhrase,
    singlePhraseTodayCount,
    singlePhraseTotalCount,
    singlePhrasePendingCount,
    singlePhraseCountDisabled,
    isFinishing,
    handleCount,
    handleFinish
  }
}
