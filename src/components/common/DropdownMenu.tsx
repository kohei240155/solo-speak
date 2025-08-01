'use client'

import { useEffect, useRef } from 'react'
import { HiOutlineEllipsisHorizontalCircle } from 'react-icons/hi2'

export interface DropdownMenuItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
  onClick: () => void
  variant?: 'default' | 'danger'
  disabled?: boolean
}

interface DropdownMenuProps {
  /** ドロップダウンメニューの表示/非表示状態 */
  isOpen: boolean
  /** メニューの開閉を切り替える関数 */
  onToggle: () => void
  /** メニューを閉じる関数 */
  onClose: () => void
  /** メニューアイテムの配列 */
  items: DropdownMenuItem[]
  /** トリガーボタンのアイコン（デフォルトは三点リーダー） */
  triggerIcon?: React.ComponentType<{ className?: string }>
  /** カスタムトリガー要素（triggerIconよりも優先されます） */
  customTrigger?: React.ReactNode
  /** トリガーボタンのサイズ */
  triggerSize?: 'sm' | 'md' | 'lg'
  /** メニューの位置 */
  position?: 'bottom-left' | 'bottom-right' | 'top-left' | 'top-right'
  /** メニューの幅 */
  width?: string
  /** メニューのz-index */
  zIndex?: number
  /** トリガーボタンのクラス名 */
  triggerClassName?: string
  /** メニューコンテナのクラス名 */
  menuClassName?: string
  /** メニューアイテムの文字サイズ */
  fontSize?: 'sm' | 'base' | 'lg'
}

export default function DropdownMenu({
  isOpen,
  onToggle,
  onClose,
  items,
  triggerIcon: TriggerIcon = HiOutlineEllipsisHorizontalCircle,
  customTrigger,
  triggerSize = 'md',
  position = 'bottom-right',
  width = 'w-28',
  zIndex = 10,
  triggerClassName = '',
  menuClassName = '',
  fontSize = 'sm'
}: DropdownMenuProps) {
  const menuRef = useRef<HTMLDivElement>(null)

  // メニュー外クリックで閉じる
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  // ESCキーで閉じる
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, onClose])

  const getTriggerSize = () => {
    switch (triggerSize) {
      case 'sm':
        return 'w-4 h-4'
      case 'lg':
        return 'w-6 h-6'
      default:
        return 'w-5 h-5'
    }
  }

  const getFontSize = () => {
    switch (fontSize) {
      case 'base':
        return 'text-base'
      case 'lg':
        return 'text-lg'
      default:
        return 'text-sm'
    }
  }

  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'left-0 top-8'
      case 'top-left':
        return 'left-0 bottom-8'
      case 'top-right':
        return 'right-0 bottom-8'
      default: // bottom-right
        return 'right-0 top-8'
    }
  }

  const handleItemClick = (item: DropdownMenuItem, event: React.MouseEvent) => {
    event.stopPropagation()
    if (!item.disabled) {
      item.onClick()
      onClose()
    }
  }

  return (
    <div className="relative" ref={menuRef}>
      {/* トリガーボタン */}
      <button
        onClick={(e) => {
          e.stopPropagation()
          onToggle()
        }}
        className={`text-gray-900 hover:text-gray-700 flex-shrink-0 self-start transition-colors ${triggerClassName}`}
        aria-expanded={isOpen}
        aria-haspopup="true"
      >
        {customTrigger || <TriggerIcon className={getTriggerSize()} />}
      </button>

      {/* ドロップダウンメニュー */}
      {isOpen && (
        <div 
          className={`absolute ${getPositionClasses()} bg-white border border-gray-200 rounded-md shadow-lg ${width} ${menuClassName}`}
          style={{ zIndex }}
          onClick={(e) => e.stopPropagation()}
        >
          {items.map((item) => {
            const ItemIcon = item.icon
            const isDisabled = item.disabled
            const isDanger = item.variant === 'danger'
            
            return (
              <button
                key={item.id}
                onClick={(e) => handleItemClick(item, e)}
                disabled={isDisabled}
                className={`
                  w-full px-3 py-2 text-left ${getFontSize()} flex items-center gap-2 transition-colors
                  ${isDisabled 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : isDanger 
                      ? 'text-red-600 hover:bg-red-50' 
                      : 'text-gray-700 hover:bg-gray-50'
                  }
                `}
              >
                {ItemIcon && <ItemIcon className="w-4 h-4 flex-shrink-0" />}
                <span className="truncate">{item.label}</span>
              </button>
            )
          })}
        </div>
      )}
    </div>
  )
}
