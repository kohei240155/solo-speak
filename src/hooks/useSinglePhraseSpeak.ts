import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import toast from 'react-hot-toast'
import { api } from '@/utils/api'
import { SpeakPhrase } from '@/types/speak'
import { speakText } from '@/utils/speechSynthesis'
import { useSpeakPhraseById } from '@/hooks/useSWRApi'

interface UseSinglePhraseSpeakProps {
  phraseId: string | null
  learningLanguage: string
  sendPendingCount: (phraseId: string, count: number) => Promise<boolean>
}

export function useSinglePhraseSpeak({ phraseId, learningLanguage, sendPendingCount }: UseSinglePhraseSpeakProps) {
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
      toast.error('フレーズが見つかりませんでした')
      router.push('/phrase/list')
    }
  }, [singlePhraseFromSWR, singlePhraseData, phraseId, router])

  // ローディング状態の管理
  useEffect(() => {
    if (phraseId) {
      setIsLoadingSinglePhrase(isLoadingSinglePhraseSWR)
    }
  }, [phraseId, isLoadingSinglePhraseSWR])

  // 音読回数を更新
  const handleCount = async () => {
    if (!singlePhrase) return

    try {
      // 実際にサーバーに送信して制限をチェック
      await api.post(`/api/phrase/${singlePhrase.id}/count`, { count: 1 })
      
      // 成功した場合のみローカル状態を更新
      setSinglePhrasePendingCount(prev => prev + 1)
      setSinglePhraseTodayCount(prev => {
        const newCount = prev + 1
        setSinglePhraseCountDisabled(newCount >= 100)
        return newCount
      })
      setSinglePhraseTotalCount(prev => prev + 1)
      
      // フレーズの表示カウントも更新
      setSinglePhrase(prev => prev ? {
        ...prev,
        dailySpeakCount: prev.dailySpeakCount + 1,
        totalSpeakCount: prev.totalSpeakCount + 1
      } : null)
      
    } catch (error: unknown) {
      console.error('Error updating count:', error)
      
      // 制限エラーの場合は専用のトーストを表示
      if (error && typeof error === 'object' && 'response' in error) {
        const apiError = error as { response?: { data?: { dailyLimitReached?: boolean } } }
        if (apiError.response?.data?.dailyLimitReached) {
          toast.error('1日100回のSpeak制限に到達しました。明日また挑戦してください！', {
            duration: 4000
          })
        } else {
          toast.error('カウントの更新に失敗しました')
        }
      } else {
        toast.error('カウントの更新に失敗しました')
      }
    }
  }

  // 音声再生
  const handleSound = async () => {
    if (!singlePhrase) return
    await speakText(singlePhrase.original, learningLanguage)
  }

  // 練習終了処理
  const handleFinish = async () => {
    setIsFinishing(true)
    try {
      // 保留中のカウントを送信
      if (singlePhrase && singlePhrasePendingCount > 0) {
        const success = await sendPendingCount(singlePhrase.id, singlePhrasePendingCount)
        if (!success) {
          toast.error('カウントの送信に失敗しました')
        }
      }
      router.push('/phrase/list')
    } catch (error) {
      console.error('Error finishing single phrase practice:', error)
      toast.error('終了処理中にエラーが発生しました')
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
    handleSound,
    handleFinish
  }
}
