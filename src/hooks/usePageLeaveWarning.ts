import { useEffect } from 'react'

interface UsePageLeaveWarningProps {
  hasPendingChanges: boolean
  warningMessage?: string
}

export function usePageLeaveWarning({ 
  hasPendingChanges, 
  warningMessage = 'Countが登録されていません。このページを離れますか？' 
}: UsePageLeaveWarningProps) {
  
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasPendingChanges) {
        e.preventDefault()
        e.returnValue = warningMessage
        return warningMessage
      }
    }

    const handleRouteChange = () => {
      if (hasPendingChanges) {
        const confirmLeave = window.confirm(warningMessage)
        if (!confirmLeave) {
          // ナビゲーションをキャンセルする
          window.history.pushState(null, '', window.location.pathname + window.location.search)
          throw new Error('Route change cancelled by user')
        }
      }
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    window.addEventListener('popstate', handleRouteChange)
    
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
      window.removeEventListener('popstate', handleRouteChange)
    }
  }, [hasPendingChanges, warningMessage])
}
