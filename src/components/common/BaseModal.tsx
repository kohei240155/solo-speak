'use client'

import Modal from 'react-modal'
import { ReactNode, useEffect } from 'react'
import { MdClose } from 'react-icons/md'

// React Modalのアプリルート要素を設定
if (typeof window !== 'undefined') {
  Modal.setAppElement('body')
}

export interface BaseModalProps {
  isOpen: boolean
  onClose: () => void
  children: ReactNode
  title?: string
  maxWidth?: 'sm' | 'md' | 'lg' | 'xl' | '2xl'
  showCloseButton?: boolean
  closeOnOverlayClick?: boolean
}

export default function BaseModal({
  isOpen,
  onClose,
  children,
  title,
  maxWidth = 'md',
  showCloseButton = true,
  closeOnOverlayClick = true
}: BaseModalProps) {
  // Escキーでモーダルを閉じる
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose()
      }
    }

    document.addEventListener('keydown', handleEscape)
    return () => document.removeEventListener('keydown', handleEscape)
  }, [isOpen, onClose])

  // 最大幅の設定
  const getMaxWidthClass = () => {
    switch (maxWidth) {
      case 'sm':
        return 'max-w-sm'
      case 'md':
        return 'max-w-md'
      case 'lg':
        return 'max-w-lg'
      case 'xl':
        return 'max-w-xl'
      case '2xl':
        return 'max-w-2xl'
      default:
        return 'max-w-md'
    }
  }

  const customStyles = {
    overlay: {
      backgroundColor: 'rgba(97, 97, 97, 0.5)',
      zIndex: 50,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    },
    content: {
      position: 'relative' as const,
      top: 'auto',
      left: 'auto',
      right: 'auto',
      bottom: 'auto',
      border: 'none',
      borderRadius: '0.5rem',
      boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
      padding: 0,
      margin: '1rem',
      maxHeight: '90vh',
      overflow: 'auto',
      backgroundColor: 'white'
    }
  }

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={closeOnOverlayClick ? onClose : undefined}
      style={customStyles}
      contentLabel={title || 'Modal'}
      shouldCloseOnEsc={true}
      shouldCloseOnOverlayClick={closeOnOverlayClick}
    >
      <div className={`relative bg-white rounded-lg ${getMaxWidthClass()} w-full`}>
        {/* 閉じるボタン */}
        {showCloseButton && (
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
          >
            <MdClose className="w-6 h-6" />
          </button>
        )}

        {/* タイトル付きの場合のヘッダー */}
        {title && (
          <div className="p-6 pb-0">
            <h2 className="text-xl md:text-2xl font-bold text-gray-900 pr-8">
              {title}
            </h2>
          </div>
        )}

        {/* コンテンツ */}
        <div className={title ? 'p-6 pt-4' : 'p-6'}>
          {children}
        </div>
      </div>
    </Modal>
  )
}
