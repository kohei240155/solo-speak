'use client'

import { useState, useEffect } from 'react'
import BaseModal from '../common/BaseModal'
import { Language } from '@/types/phrase'
import { useTranslation } from '@/hooks/ui/useTranslation'

// 共通の設定項目の型定義
export interface ModalConfigItem {
  id: string
  label: string
  type: 'select' | 'info' | 'checkbox'
  options?: { value: string; label: string }[]
  value?: string | number | boolean
  onChange?: (value: string | boolean) => void
  readonly?: boolean
  checkboxLabel?: string // チェックボックスの右側に表示するラベル
}

// 共通のモーダル設定の型
export interface ModeModalConfig {
  title: string
  configItems: ModalConfigItem[]
  onStart: (selectedLanguage: string) => Promise<void> | void
  startButtonText?: string
  titleButton?: {
    icon: React.ComponentType<{ className?: string }>
    onClick: () => void
  }
}

interface ModeModalProps {
  isOpen: boolean
  onClose: () => void
  config: ModeModalConfig
  languages: Language[]
  defaultLearningLanguage: string
  isLoading?: boolean
}

export default function ModeModal({
  isOpen,
  onClose,
  config,
  languages,
  defaultLearningLanguage,
  isLoading: externalLoading = false
}: ModeModalProps) {
  const { t } = useTranslation('common')
  const [selectedLanguage, setSelectedLanguage] = useState('')
  const [internalLoading, setInternalLoading] = useState(false)
  
  // どちらかのローディング状態がtrueの場合はローディング中
  const isLoading = externalLoading || internalLoading

  // 初期言語の設定
  useEffect(() => {
    if (isOpen) {
      const languageToSet = defaultLearningLanguage || (languages.length > 0 ? languages[0].code : 'en')
      setSelectedLanguage(languageToSet)
      setInternalLoading(false)
    }
  }, [isOpen, defaultLearningLanguage, languages])

  // defaultLearningLanguageまたはlanguagesが変更された時も選択言語を更新
  useEffect(() => {
    if (defaultLearningLanguage) {
      setSelectedLanguage(defaultLearningLanguage)
    } else if (languages.length > 0 && !defaultLearningLanguage) {
      setSelectedLanguage(languages[0].code)
    }
  }, [defaultLearningLanguage, languages])

  const handleStart = async () => {
    if (isLoading) return

    setInternalLoading(true)
    try {
      await config.onStart(selectedLanguage)
    } catch (error) {
      console.error('Error starting mode:', error)
    } finally {
      setInternalLoading(false)
    }
  }

  // セレクトボックスのスタイル定義
  const selectStyle = {
    backgroundImage: `url("data:image/svg+xml;charset=UTF-8,%3csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='none' stroke='currentColor' stroke-width='2' stroke-linecap='round' stroke-linejoin='round'%3e%3cpolyline points='6,9 12,15 18,9'%3e%3c/polyline%3e%3c/svg%3e")`,
    backgroundRepeat: 'no-repeat',
    backgroundPosition: 'right 12px center',
    backgroundSize: '20px'
  }

  const renderConfigItem = (item: ModalConfigItem) => {
    switch (item.type) {
      case 'select':
        return (
          <div className="relative">
            <select
              value={item.value as string}
              onChange={(e) => item.onChange?.(e.target.value)}
              className="w-full border border-gray-300 rounded-md px-3 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 appearance-none bg-white text-gray-900"
              style={selectStyle}
            >
              {item.options?.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        )
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <input
              id={`checkbox-${item.id}`}
              type="checkbox"
              checked={item.value as boolean}
              onChange={(e) => item.onChange?.(e.target.checked)}
              className="h-4 w-4 accent-gray-500 border-gray-300 rounded focus:outline-none"
            />
            {item.checkboxLabel && (
              <label 
                htmlFor={`checkbox-${item.id}`}
                className="text-sm text-gray-700 select-none"
              >
                {item.checkboxLabel}
              </label>
            )}
          </div>
        )
      case 'info':
        // 情報表示の場合
        return (
          <div className="px-3 py-3 text-sm text-gray-700 bg-gray-50 rounded-md">
            {item.value}
          </div>
        )
      default:
        return null
    }
  }

  // Language設定項目を作成
  const languageConfigItem: ModalConfigItem = {
    id: 'language',
    label: t('speak.modal.language'),
    type: 'select',
    value: selectedLanguage,
    options: languages.map(lang => ({ value: lang.code, label: lang.name })),
    onChange: (value: string | boolean) => setSelectedLanguage(value as string)
  }

  // Language設定項目を最初に追加した設定項目配列を作成
  const allConfigItems = [languageConfigItem, ...config.configItems]

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} title={config.title} titleButton={config.titleButton}>
      {/* 全ての設定項目を統一的に表示 */}
      {allConfigItems.map((item, index) => (
        <div key={item.id} className={index === allConfigItems.length - 1 ? "mb-8" : "mb-4"}>
          <h3 className="text-base font-medium text-gray-900 mb-3">
            {item.label}
          </h3>
          {renderConfigItem(item)}
        </div>
      ))}

      {/* Start ボタン */}
      <button
        onClick={handleStart}
        disabled={isLoading}
        className="w-full text-white py-3 px-4 rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
        style={{ 
          backgroundColor: isLoading ? '#9CA3AF' : '#616161'
        }}
        onMouseEnter={(e) => {
          if (!isLoading && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#525252'
          }
        }}
        onMouseLeave={(e) => {
          if (!isLoading && e.currentTarget) {
            e.currentTarget.style.backgroundColor = '#616161'
          }
        }}
      >
        {isLoading ? (
          <div className="flex items-center justify-center">
            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
            Loading...
          </div>
        ) : (
          config.startButtonText || 'Start'
        )}
      </button>
    </BaseModal>
  )
}
