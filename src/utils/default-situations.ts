import { getInitialSituations } from '@/data/situations'

/**
 * 指定された言語コードに対応するデフォルトシチュエーションを取得
 * @param languageCode 言語コード
 * @returns デフォルトシチュエーションの配列
 */
export function getDefaultSituations(languageCode: string): string[] {
  return getInitialSituations(languageCode)
}
