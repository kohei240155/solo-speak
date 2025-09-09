'use client'

import React from 'react'
import { useLanguage } from '@/contexts/LanguageContext'

interface DisplayLanguageSelectorProps {
  className?: string
}

const LANGUAGE_NAMES = {
  ja: 'Japanese',
  en: 'English',
  ko: 'Korean',
  zh: 'Chinese',
  fr: 'French',
  es: 'Spanish',
  pt: 'Portuguese',
  de: 'German',
  th: 'Thai',
}

export const DisplayLanguageSelector: React.FC<DisplayLanguageSelectorProps> = ({ 
  className = '' 
}) => {
  const { locale, setLocale, availableLocales, isLoadingLocale } = useLanguage()

  // ローディング中でも既存の値で表示を維持する
  return (
    <div className={`relative ${className}`}>
      <select
        value={locale}
        onChange={(e) => setLocale(e.target.value)}
        className="appearance-none bg-white border border-gray-300 rounded-md px-3 py-2 pr-8 text-sm focus:outline-none min-w-[60px] md:min-w-[120px] text-gray-900 h-[40px]"
        disabled={isLoadingLocale}
      >
        {availableLocales.map((lang) => (
          <option key={lang} value={lang}>
            {className.includes('text-xs') ? lang.toUpperCase() : (LANGUAGE_NAMES[lang as keyof typeof LANGUAGE_NAMES] || lang)}
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
        </svg>
      </div>
    </div>
  )
}
