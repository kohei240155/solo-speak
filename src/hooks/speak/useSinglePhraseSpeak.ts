import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { SpeakPhrase } from '@/types/speak'
import { useSpeakPhraseById } from '@/hooks/api/useSWRApi'
import { useTranslation } from '@/hooks/ui/useTranslation'

interface UseSinglePhraseSpeakProps {
  phraseId: string | null
  sendPendingCount: (phraseId: string, count: number) => Promise<boolean>
}

export function useSinglePhraseSpeak({ phraseId, sendPendingCount }: UseSinglePhraseSpeakProps) {
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
  const { data: singlePhraseData, phrase: singlePhraseFromSWR, isLoading: isLoadingSinglePhraseSWR } = useSpeakPhraseById(phraseId || undefined)

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
      toast.error(t('phrase.messages.notFound'))
      router.push('/phrase/list')
    }
  }, [singlePhraseFromSWR, singlePhraseData, phraseId, router, t])

  // ローディング状態の管理
  useEffect(() => {
    if (phraseId) {
      setIsLoadingSinglePhrase(isLoadingSinglePhraseSWR)
    }
  }, [phraseId, isLoadingSinglePhraseSWR])

  // 音読回数を更新（ローカルでのみカウントを増加）
  const handleCount = () => {
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
  }

  // 練習終了処理
  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      // 保留中のカウントを送信
      if (singlePhrase && singlePhrasePendingCount > 0) {
        const success = await sendPendingCount(singlePhrase.id, singlePhrasePendingCount)
        if (!success) {
          toast.error(t('phrase.messages.countError'))
        }
      }
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing single phrase practice:', error)
      toast.error(t('speak.messages.endError'))
    } finally {
      setIsFinishing(false)
    }
  }

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
