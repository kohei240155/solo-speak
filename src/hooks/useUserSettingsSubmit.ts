import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { supabase } from '@/utils/spabase'
import { ImageUploadRef } from '@/components/ImageUpload'
import toast from 'react-hot-toast'
import { UserSetupFormData } from '@/types/userSettings'

export function useUserSettingsSubmit(
  setError: (error: string) => void,
  setIsUserSetupComplete: (complete: boolean) => void,
  onIconUrlUpdate?: (iconUrl: string) => void
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

      // 現在のユーザー設定を取得して既存のiconUrlを保持
      let existingIconUrl = ''
      try {
        const currentSettingsResponse = await fetch('/api/user/settings', {
          method: 'GET',
          headers: {
            'Authorization': `Bearer ${session.access_token}`
          }
        })
        
        if (currentSettingsResponse.ok) {
          const currentSettings = await currentSettingsResponse.json()
          existingIconUrl = currentSettings.iconUrl || ''
          console.log('UserSettingsSubmit: Existing iconUrl:', existingIconUrl)
        }
      } catch (error) {
        console.log('UserSettingsSubmit: Could not fetch existing settings:', error)
      }

      // 画像がアップロードされている場合、専用APIを使用してSupabase Storageにアップロード
      if (imageUploadRef.current && user) {
        try {
          // 新しいAPI経由でアップロード
          const uploadedUrl = await imageUploadRef.current.uploadImageViaAPI()
          if (uploadedUrl) {
            console.log('UserSettingsSubmit: Image uploaded via API successfully:', uploadedUrl)
            finalData.iconUrl = uploadedUrl
            
            // フォームのiconUrlも更新して表示に反映
            onIconUrlUpdate?.(uploadedUrl)
          } else {
            // 新しい画像がアップロードされなかった場合
            if (finalData.iconUrl && finalData.iconUrl.startsWith('blob:')) {
              // ローカルBlob URLの場合は既存のSupabaseストレージURLを保持
              console.log('UserSettingsSubmit: No new upload, keeping existing iconUrl:', existingIconUrl)
              finalData.iconUrl = existingIconUrl
            }
            // 既にSupabaseストレージURLの場合はそのまま保持
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
      } else {
        // ImageUploadコンポーネントがない場合もローカルBlob URLをチェック
        if (finalData.iconUrl && finalData.iconUrl.startsWith('blob:')) {
          console.log('UserSettingsSubmit: No ImageUpload ref, keeping existing iconUrl:', existingIconUrl)
          finalData.iconUrl = existingIconUrl
        }
        
        // GoogleアバターURLの場合はそのまま保存（Storageに保存しない）
        if (finalData.iconUrl && user &&
            (finalData.iconUrl.includes('googleusercontent.com') || 
             finalData.iconUrl.includes('googleapis.com') || 
             finalData.iconUrl.includes('google.com') ||
             finalData.iconUrl.includes('/api/proxy/image'))) {
          
          console.log('UserSettingsSubmit: Google avatar detected, saving URL directly to database')
          
          // プロキシ経由のURLの場合は元のURLを取得してデータベースに保存
          if (finalData.iconUrl.includes('/api/proxy/image')) {
            const urlParams = new URLSearchParams(finalData.iconUrl.split('?')[1])
            const originalGoogleUrl = urlParams.get('url')
            if (originalGoogleUrl) {
              console.log('UserSettingsSubmit: Using original Google URL for database:', originalGoogleUrl)
              finalData.iconUrl = originalGoogleUrl
            }
          }
          
          console.log('UserSettingsSubmit: Google avatar URL will be saved directly:', finalData.iconUrl)
        }
      }

      console.log('Final data being sent to API:', {
        ...finalData,
        iconUrl: finalData.iconUrl ? `${finalData.iconUrl.substring(0, 50)}...` : 'null'
      })
      console.log('Full iconUrl being sent:', finalData.iconUrl)

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
