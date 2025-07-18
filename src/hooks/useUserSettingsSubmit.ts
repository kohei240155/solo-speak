import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { ImageUploadRef } from '@/components/ImageUpload'
import toast from 'react-hot-toast'
import { UserSetupFormData } from '@/types/userSettings'

export function useUserSettingsSubmit(
  setError: (error: string) => void,
  setIsUserSetupComplete: (complete: boolean) => void
) {
  const { user, updateUserMetadata } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const imageUploadRef = useRef<ImageUploadRef>(null)

  const onSubmit = async (data: UserSetupFormData) => {
    setSubmitting(true)
    setError('')

    try {
      // 現在のセッションから認証トークンを取得
      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        setError('認証情報が見つかりません。再度ログインしてください。')
        setSubmitting(false)
        return
      }

      const finalData = { ...data }

      // 画像がアップロードされている場合、Supabase Storageにアップロード
      if (imageUploadRef.current && user) {
        try {
          const uploadedUrl = await imageUploadRef.current.uploadImage(user.id)
          if (uploadedUrl) {
            finalData.iconUrl = uploadedUrl
          }
        } catch (uploadError) {
          console.error('Image upload failed:', uploadError)
          
          // RLSエラーの場合はより詳細なエラーメッセージを提供
          if (uploadError instanceof Error) {
            if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
              setError(`画像のアップロード権限がありません。\n解決方法：\n1. Supabase Dashboard > Storage > Settings でRLSを一時的に無効化\n2. または適切なポリシーを設定してください。\n\n詳細: ${uploadError.message}`)
            } else {
              setError(`画像のアップロードに失敗しました: ${uploadError.message}`)
            }
          } else {
            setError('画像のアップロードに失敗しました。')
          }
          
          setSubmitting(false)
          return
        }
      }

      const response = await fetch('/api/user/settings', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify(finalData)
      })

      if (response.ok) {
        const result = await response.json()
        console.log('Settings: User settings saved successfully:', { iconUrl: result.iconUrl })
        
        // Supabaseのユーザーメタデータも更新
        if (finalData.iconUrl) {
          console.log('Settings: Updating user metadata with iconUrl:', finalData.iconUrl)
          await updateUserMetadata({ icon_url: finalData.iconUrl })
        }
        
        // 設定完了状態を更新
        setIsUserSetupComplete(true)
        
        // ヘッダーに設定更新を通知するカスタムイベントを発行（少し遅延を入れる）
        console.log('Settings: Dispatching userSettingsUpdated event')
        setTimeout(() => {
          window.dispatchEvent(new Event('userSettingsUpdated'))
        }, 100)
        
        // 成功メッセージを表示
        setError('')
        toast.success('Settings saved successfully!', {
          duration: 3000,
          position: 'top-center',
        })
        
        // Settings画面に留まる（ダッシュボードへのリダイレクトを削除）
      } else {
        let errorData
        try {
          const responseText = await response.text()
          
          if (responseText) {
            errorData = JSON.parse(responseText)
          } else {
            errorData = { error: 'Empty response from server' }
          }
        } catch {
          errorData = { error: 'Invalid response format from server' }
        }
        
        console.error('Settings save failed:', { status: response.status, errorData })
        
        // 400番台のエラーの場合はサーバーからのエラーメッセージを表示
        if (response.status >= 400 && response.status < 500) {
          setError(errorData.error || 'ユーザー設定の保存に失敗しました')
        } else {
          setError('サーバーエラーが発生しました。しばらくしてからもう一度お試しください。')
        }
      }
    } catch (error) {
      console.error('Error saving user settings:', error)
      setError('ユーザー設定の保存に失敗しました')
    } finally {
      setSubmitting(false)
    }
  }

  return {
    submitting,
    imageUploadRef,
    onSubmit
  }
}
