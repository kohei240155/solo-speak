/**
 * デフォルトのシチュエーション（多言語対応）
 */
export const DEFAULT_SITUATIONS = {
  ja: [
    '友達との会話で',
    'SNSの投稿で',
    '上司との会話で'
  ],
  en: [
    'In conversation with friends',
    'In social media posts',
    'In conversation with boss'
  ],
  zh: [
    '与朋友聊天时',
    '在社交媒体发布时',
    '与老板对话时'
  ],
  ko: [
    '친구와의 대화에서',
    'SNS 게시물에서',
    '상사와의 대화에서'
  ],
  es: [
    'En conversación con amigos',
    'En publicaciones de redes sociales',
    'En conversación con el jefe'
  ],
  pt: [
    'Em conversa com amigos',
    'Em posts de redes sociais',
    'Em conversa com o chefe'
  ],
  th: [
    'ในการสนทนากับเพื่อน',
    'ในโพสต์โซเชียลมีเดีย',
    'ในการสนทนากับหัวหน้า'
  ]
} as const

export type SupportedLanguageCode = keyof typeof DEFAULT_SITUATIONS

/**
 * 指定された言語コードに対応するデフォルトシチュエーションを取得
 * @param languageCode 言語コード
 * @returns デフォルトシチュエーションの配列
 */
export function getDefaultSituations(languageCode: string): string[] {
  const code = languageCode as SupportedLanguageCode
  return [...(DEFAULT_SITUATIONS[code] || DEFAULT_SITUATIONS.ja)] // デフォルトは日本語
}

/**
 * サポートされている言語コードかどうかを判定
 * @param languageCode 判定対象の言語コード
 * @returns サポートされている場合はtrue
 */
export function isSupportedLanguageCode(languageCode: string): languageCode is SupportedLanguageCode {
  return languageCode in DEFAULT_SITUATIONS
}
