'use client'

import AddToHomeScreenModal from './AddToHomeScreenModal'
import { useAddToHomeScreenModal } from '@/hooks/ui/useAddToHomeScreenModal'

export default function AddToHomeScreenModalWrapper() {
  const { isOpen, closeModal } = useAddToHomeScreenModal()

  return (
    <AddToHomeScreenModal
      isOpen={isOpen}
      onClose={closeModal}
    />
  )
}
