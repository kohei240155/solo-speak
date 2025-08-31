import { useState } from 'react'
import toast from 'react-hot-toast'
import { LANGUAGE_NAMES, type LanguageCode } from '@/constants/languages'

type RankingType = 'phrase' | 'speak' | 'quiz'
type TabType = 'Daily' | 'Weekly' | 'Total' | 'Streak'

export const useShareStreak = () => {
  const [isLoading, setIsLoading] = useState(false)

  const shareStreak = async (
    language: string, 
    count: number, 
    rankingType: RankingType, 
    tabType: TabType
  ) => {
    setIsLoading(true)
    try {
      if (count === 0) {
        toast.error('カウントが0のため投稿できません')
        return null
      }

      // 既存の言語定数から言語名を取得
      const languageName = LANGUAGE_NAMES[language as LanguageCode] || language

      // ランキングタイプとタブに応じてメッセージを生成
      let shareText = 'Solo Speakを使っています⚡\n\n'

      if (rankingType === 'phrase') {
        if (tabType === 'Total') {
          shareText += `これまでに ${count}フレーズ 生成しました！`
        } else if (tabType === 'Streak') {
          shareText += `${count}日連続でフレーズを生成しました！`
        }
      } else if (rankingType === 'speak') {
        if (tabType === 'Daily') {
          shareText += `今日は ${count}回 音読しました！`
        } else if (tabType === 'Weekly') {
          shareText += `今週は${count}回 音読しました！`
        } else if (tabType === 'Total') {
          shareText += `これまでに ${count}回 音読しました！`
        } else if (tabType === 'Streak') {
          shareText += `${count}日連続で音読を継続しました！`
        }
      } else if (rankingType === 'quiz') {
        if (tabType === 'Daily') {
          shareText += `今日はクイズに ${count}回 正解しました！`
        } else if (tabType === 'Weekly') {
          shareText += `今週はクイズに ${count}回 正解しました！`
        } else if (tabType === 'Total') {
          shareText += `これまでにクイズに ${count}回 正解しました！`
        } else if (tabType === 'Streak') {
          shareText += `${count}日連続でクイズに正解しました！`
        }
      }

      shareText += '\n\nhttps://solo-speak.com \n#SoloSpeak'

      // Twitter/X用のURLを生成
      const twitterUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}`
      
      // 新しいタブでTwitterを開く
      window.open(twitterUrl, '_blank', 'noopener,noreferrer')
      
      return { count, shareText, language: languageName, rankingType, tabType }
    } catch (error) {
      console.error('Share streak error:', error)
      toast.error('投稿リンクの生成中にエラーが発生しました')
      return null
    } finally {
      setIsLoading(false)
    }
  }

  return {
    shareStreak,
    isLoading
  }
}
