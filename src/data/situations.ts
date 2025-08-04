// 初期シチュエーションデータ
export const initialSituations = {
  // English (英語)
  en: [
    'In conversation with friends',
    'Ordering at a café',
    'In business conversation'
  ],
  // Chinese (中国語)
  zh: [
    '和朋友聊天时',
    '在咖啡厅点餐时',
    '商务对话中'
  ],
  // Hindi (ヒンディー語)
  hi: [
    'दोस्तों के साथ बातचीत में',
    'कैफे में ऑर्डर करते समय',
    'व्यापारिक बातचीत में'
  ],
  // Spanish (スペイン語)
  es: [
    'En conversación con amigos',
    'Al pedir en una cafetería',
    'En conversación de negocios'
  ],
  // French (フランス語)
  fr: [
    'En conversation avec des amis',
    'En commandant dans un café',
    'En conversation d\'affaires'
  ],
  // Portuguese (ポルトガル語)
  pt: [
    'Em conversa com amigos',
    'Fazendo pedido no café',
    'Em conversa de negócios'
  ],
  // Japanese (日本語)
  ja: [
    '友達との会話で',
    'カフェで注文するとき',
    'ビジネス会話で'
  ],
  // German (ドイツ語)
  de: [
    'Im Gespräch mit Freunden',
    'Bei der Bestellung im Café',
    'Im Geschäftsgespräch'
  ],
  // Korean (韓国語)
  ko: [
    '친구들과의 대화에서',
    '카페에서 주문할 때',
    '비즈니스 대화에서'
  ],
  // Italian (イタリア語)
  it: [
    'In conversazione con gli amici',
    'Ordinando al caffè',
    'In conversazione di lavoro'
  ],
  // Thai (タイ語)
  th: [
    'ในการสนทนากับเพื่อน',
    'เมื่อสั่งในร้านกาแฟ',
    'ในการสนทนาทางธุรกิจ'
  ],
  // Dutch (オランダ語)
  nl: [
    'In gesprek met vrienden',
    'Bij het bestellen in café',
    'In zakelijk gesprek'
  ],
  // Danish (デンマーク語)
  da: [
    'I samtale med venner',
    'Ved bestilling på café',
    'I forretningssamtale'
  ]
} as const

// サポートされている言語タイプ
export type SupportedLanguage = keyof typeof initialSituations

// 指定された言語の初期シチュエーションを取得する関数
export const getInitialSituations = (language: string): string[] => {
  if (language in initialSituations) {
    return [...initialSituations[language as SupportedLanguage]]
  }
  
  // デフォルトは日本語のシチュエーションを返す
  return [...initialSituations.ja]
}

// すべての言語のシチュエーションを取得する関数
export const getAllLanguageSituations = () => {
  return initialSituations
}
