// 型安全なAPI呼び出しの使用例

import { updatePhraseCount, getSpeakPhrase, isApiError, isApiSuccess } from '@/utils/api-client'

// 使用例1: フレーズカウント更新
export async function handlePhraseCount(phraseId: string, count: number) {
  const result = await updatePhraseCount(phraseId, count)
  
  if (isApiError(result)) {
    // エラーハンドリング - 型安全にerrorプロパティにアクセス可能
    return null
  }
  
  // 成功時 - 型安全にphraseプロパティにアクセス可能
  return result.phrase
}

// 使用例2: Speakフレーズ取得
export async function handleGetSpeakPhrase(languageCode: string) {
  const result = await getSpeakPhrase(languageCode, {
    excludeIfSpeakCountGTE: 5,
    excludeTodayPracticed: false
  })
  
  if (isApiSuccess(result)) {
    if (result.allDone) {
      return null
    }
    
    if (result.phrase) {
      return result.phrase
    }
  } else {
    // Failed to get phrase - silently handle error
  }
  
  return null
}

// 使用例3: React Hook での使用
export function useTypeSafePhraseCount() {
  const handleCount = async (phraseId: string, count: number) => {
    const result = await updatePhraseCount(phraseId, count)
    
    if (isApiError(result)) {
      // エラートーストなどの処理
      throw new Error(result.error)
    }
    
    // 成功時のレスポンスは完全に型安全
    return {
      id: result.phrase.id,
      totalSpeakCount: result.phrase.totalSpeakCount,
      dailySpeakCount: result.phrase.dailySpeakCount
    }
  }
  
  return { handleCount }
}
