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

      // 現在のユーザー設定を取得して既存のiconUrlを保持
      let existingIconUrl = ''
      let isFirstTimeSetup = false
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
        } else if (currentSettingsResponse.status === 404) {
          // 初回セットアップの場合
          isFirstTimeSetup = true
          console.log('UserSettingsSubmit: First time setup detected')
        }
      } catch (error) {
        console.log('UserSettingsSubmit: Could not fetch existing settings:', error)
      }

      // 初回セットアップでGoogleアバターがある場合の自動設定
      if (isFirstTimeSetup && user && (!finalData.iconUrl || finalData.iconUrl.trim() === '')) {
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          console.log('UserSettingsSubmit: Auto-setting Google avatar for first time setup:', googleAvatarUrl)
          
          try {
            // Google画像をSupabase Storageにダウンロード・アップロード
            const googleUploadResponse = await fetch('/api/user/icon/google', {
              method: 'POST',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ googleAvatarUrl })
            })
            
            if (googleUploadResponse.ok) {
              const googleUploadResult = await googleUploadResponse.json()
              console.log('UserSettingsSubmit: Google avatar uploaded successfully:', googleUploadResult.iconUrl)
              finalData.iconUrl = googleUploadResult.iconUrl
            } else {
              console.log('UserSettingsSubmit: Failed to upload Google avatar, using original URL')
              finalData.iconUrl = googleAvatarUrl
            }
          } catch (googleError) {
            console.error('UserSettingsSubmit: Error uploading Google avatar:', googleError)
            // エラーの場合は元のGoogle URLを使用
            finalData.iconUrl = googleAvatarUrl
          }
        }
      }

      // 画像がある場合はSupabase Storageにアップロード
      console.log('UserSettingsSubmit: Checking image upload conditions...')
      console.log('UserSettingsSubmit: imageUploadRef.current:', !!imageUploadRef.current)
      console.log('UserSettingsSubmit: user:', !!user)
      
      if (imageUploadRef.current && user) {
        console.log('UserSettingsSubmit: Attempting image upload...')
        
        const imageFile = imageUploadRef.current.getImageFile()
        console.log('UserSettingsSubmit: imageFile:', imageFile)
        console.log('UserSettingsSubmit: imageFile type:', typeof imageFile)
        console.log('UserSettingsSubmit: imageFile size:', imageFile?.size)
        
        if (imageFile) {
          console.log('UserSettingsSubmit: Image file found, uploading to API...')
          
          try {
            // 1つ目のAPI: 画像をSupabase Storageにアップロード
            const formData = new FormData()
            formData.append('icon', imageFile)
            
            console.log('UserSettingsSubmit: Making API call to /api/user/icon')
            const uploadResponse = await fetch('/api/user/icon', {
              method: 'POST',
              headers: {
                'Authorization': `Bearer ${session.access_token}`
              },
              body: formData
            })
            
            if (!uploadResponse.ok) {
              const errorData = await uploadResponse.json()
              throw new Error(errorData.error || 'アップロードに失敗しました')
            }
            
            const uploadResult = await uploadResponse.json()
            console.log('UserSettingsSubmit: Image uploaded successfully:', uploadResult.iconUrl)
            
            // アップロードしたURLをフォームデータに設定
            finalData.iconUrl = uploadResult.iconUrl
            
          } catch (uploadError) {
            console.error('Image upload failed:', uploadError)
            
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
          console.log('UserSettingsSubmit: No image file to upload')
          console.log('UserSettingsSubmit: imageFile is null or undefined')
          console.log('UserSettingsSubmit: Current finalData.iconUrl:', finalData.iconUrl)
          
          // 画像がない場合の処理：
          // 1. 空文字列('') → 明示的な削除意図なのでそのまま保持
          // 2. Blob URL → 画像が選択されているのでそのまま保持  
          // 3. undefined/null → 既存のURLを保持
          // 4. その他のURL → そのまま保持
          if (finalData.iconUrl === undefined || finalData.iconUrl === null) {
            console.log('UserSettingsSubmit: iconUrl is undefined/null, using existing URL')
            finalData.iconUrl = existingIconUrl
          } else {
            console.log('UserSettingsSubmit: iconUrl has value, keeping as is:', finalData.iconUrl?.substring(0, 50) + '...')
          }
        }
      } else {
        console.log('UserSettingsSubmit: No image upload component or user')
        console.log('UserSettingsSubmit: imageUploadRef.current:', !!imageUploadRef.current)
        console.log('UserSettingsSubmit: user:', !!user)
        console.log('UserSettingsSubmit: Current finalData.iconUrl:', finalData.iconUrl)
        
        // 画像コンポーネントがない場合も同様の処理
        if (finalData.iconUrl === undefined || finalData.iconUrl === null) {
          console.log('UserSettingsSubmit: iconUrl is undefined/null, using existing URL')
          finalData.iconUrl = existingIconUrl
        } else {
          console.log('UserSettingsSubmit: iconUrl has value, keeping as is:', finalData.iconUrl?.substring(0, 50) + '...')
        }
      }

      // アイコンが削除された場合（空文字列に設定された場合）の処理
      console.log('UserSettingsSubmit: Checking deletion conditions...')
      console.log('UserSettingsSubmit: finalData.iconUrl:', JSON.stringify(finalData.iconUrl))
      console.log('UserSettingsSubmit: existingIconUrl:', JSON.stringify(existingIconUrl))
      console.log('UserSettingsSubmit: finalData.iconUrl === "":', finalData.iconUrl === '')
      console.log('UserSettingsSubmit: existingIconUrl exists:', existingIconUrl && existingIconUrl.trim() !== '')
      
      if (finalData.iconUrl === '' && existingIconUrl && existingIconUrl.trim() !== '') {
        console.log('UserSettingsSubmit: Icon deletion detected, analyzing existing URL...')
        
        // GoogleのプロフィールURLかどうかをチェック
        const isGoogleUrl = existingIconUrl.includes('googleusercontent.com') || 
                           existingIconUrl.includes('googleapis.com') ||
                           existingIconUrl.startsWith('https://lh3.googleusercontent.com') ||
                           existingIconUrl.includes('accounts.google.com') ||
                           existingIconUrl.includes('google.com')
        
        // Supabase StorageのURLかどうかをチェック
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const isSupabaseUrl = existingIconUrl.includes(supabaseUrl) &&
                              existingIconUrl.includes('/storage/v1/object/public/')
        
        console.log('UserSettingsSubmit: URL analysis for deletion:', {
          isGoogleUrl,
          isSupabaseUrl,
          existingIconUrl: existingIconUrl.substring(0, 50) + '...'
        })
        
        // Supabase Storageに保存された画像の場合は物理削除
        if (isSupabaseUrl) {
          try {
            console.log('UserSettingsSubmit: Deleting icon from Supabase storage:', existingIconUrl.substring(0, 50) + '...')
            const deleteResponse = await fetch('/api/user/icon', {
              method: 'DELETE',
              headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${session.access_token}`
              },
              body: JSON.stringify({ iconUrl: existingIconUrl })
            })
            
            if (deleteResponse.ok) {
              console.log('UserSettingsSubmit: Icon deleted from storage successfully')
            } else {
              const errorText = await deleteResponse.text()
              console.error('UserSettingsSubmit: Failed to delete icon from storage:', {
                status: deleteResponse.status,
                statusText: deleteResponse.statusText,
                error: errorText
              })
              // 削除に失敗してもユーザー設定の更新は続行
            }
          } catch (deleteError) {
            console.error('UserSettingsSubmit: Error deleting icon from storage:', deleteError)
            // 削除に失敗してもユーザー設定の更新は続行
          }
        } else {
          console.log('UserSettingsSubmit: Icon is external URL (Google or other), no storage deletion needed')
        }
        
        // アイコンを空に設定（デフォルトのシルエットアイコンが表示される）
        finalData.iconUrl = ''
        console.log('UserSettingsSubmit: Set finalData.iconUrl to empty string for database update')
      } else {
        console.log('UserSettingsSubmit: No deletion needed or conditions not met')
        if (finalData.iconUrl === '') {
          console.log('UserSettingsSubmit: iconUrl is empty but no existing icon to delete')
        }
      }

      console.log('Final data being sent to API:', {
        ...finalData,
        iconUrl: finalData.iconUrl ? `${finalData.iconUrl.substring(0, 50)}...` : 'null'
      })
      console.log('Full iconUrl being sent:', finalData.iconUrl)

      // 2つ目のAPI: ユーザー設定を保存
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
        
        // Supabaseのユーザーメタデータも更新（空文字列の場合も含む）
        console.log('Settings: Updating user metadata with iconUrl:', JSON.stringify(finalData.iconUrl))
        await updateUserMetadata({ icon_url: finalData.iconUrl || '' })
        
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
