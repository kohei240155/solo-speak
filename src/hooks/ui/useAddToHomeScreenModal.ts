import { useState, useEffect } from 'react'

export const useAddToHomeScreenModal = () => {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleShowModal = () => {
      setIsOpen(true)
    }

    // カスタムイベントリスナーを設定
    window.addEventListener('showAddToHomeScreenModal', handleShowModal)

    return () => {
      window.removeEventListener('showAddToHomeScreenModal', handleShowModal)
    }
  }, [])

  const closeModal = () => {
    setIsOpen(false)
  }

  return {
    isOpen,
    closeModal
  }
}
