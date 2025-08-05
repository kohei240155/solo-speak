import { useEffect, useRef } from 'react'
import { useTranslation } from './useTranslation'

interface UsePageLeaveWarningProps {
  hasPendingChanges: boolean
  warningMessage?: string
}

export function usePageLeaveWarning({ 
  hasPendingChanges, 
  warningMessage 
}: UsePageLeaveWarningProps) {
  const { t } = useTranslation('common')
  const defaultMessage = warningMessage || t('confirm.unsavedCount')
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
        const confirmLeave = window.confirm(defaultMessage)
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
        
        // タブナビゲーション内のボタンはスキップ（独自の警告処理があるため）
        if (link && link.closest('[data-tab-navigation]')) {
          return
        }
        
        // ページ離脱に関係のないボタンをスキップ
        if (link && link instanceof HTMLButtonElement) {
          // onclick属性がある場合でも、href属性がなければページ離脱しないボタンとして扱う
          if (!link.getAttribute('href') && !link.getAttribute('data-navigate')) {
            return
          }
        }
        
        if (link && (
          link.getAttribute('href') || 
          link.getAttribute('data-navigate') // 明示的にナビゲーションを示すdata属性がある場合のみ
        )) {
          const confirmLeave = window.confirm(defaultMessage)
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
  }, [defaultMessage, warningMessage])
}
