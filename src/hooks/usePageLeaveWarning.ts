import { useEffect, useRef } from 'react'

interface UsePageLeaveWarningProps {
  hasPendingChanges: boolean
  warningMessage?: string
}

export function usePageLeaveWarning({ 
  hasPendingChanges, 
  warningMessage = 'Countが登録されていません。このページを離れますか？' 
}: UsePageLeaveWarningProps) {
  const pendingChangesRef = useRef(hasPendingChanges)
  
  // ref を更新
  useEffect(() => {
    pendingChangesRef.current = hasPendingChanges
  }, [hasPendingChanges])
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (pendingChangesRef.current) {
        e.preventDefault()
        e.returnValue = warningMessage
        return warningMessage
      }
    }

    const handleRouteChange = () => {
      if (pendingChangesRef.current) {
        const confirmLeave = window.confirm(warningMessage)
        if (!confirmLeave) {
          // ナビゲーションをキャンセルする
          window.history.pushState(null, '', window.location.pathname + window.location.search)
          throw new Error('Route change cancelled by user')
        }
      }
    }

    // ページ内のリンククリックをインターセプト
    const handleLinkClick = (e: MouseEvent) => {
      if (pendingChangesRef.current) {
        const target = e.target as HTMLElement
        const link = target.closest('a') || target.closest('[role="button"]') || target.closest('button')
        
        if (link && (
          link.getAttribute('href') || 
          link.onclick || 
          link.getAttribute('role') === 'button'
        )) {
          const confirmLeave = window.confirm(warningMessage)
          if (!confirmLeave) {
            e.preventDefault()
            e.stopPropagation()
            return false
          }
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handleRouteChange)
    document.addEventListener('click', handleLinkClick, true)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handleRouteChange)
      document.removeEventListener('click', handleLinkClick, true)
    }
  }, [warningMessage])
}
