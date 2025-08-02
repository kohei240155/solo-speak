import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api, ApiError } from '@/utils/api'
import { ImageUploadRef } from '@/components/common/ImageUpload'
import toast from 'react-hot-toast'
import { UserSetupFormData } from '@/types/userSettings'
import { useRouter } from 'next/navigation'

export function useUserSettingsSubmit(
  setError: (error: string) => void,
  setIsUserSetupComplete: (complete: boolean) => void
) {
  const { user, updateUserMetadata, refreshUserSettings, clearSettingsRedirect } = useAuth()
  const [submitting, setSubmitting] = useState(false)
  const imageUploadRef = useRef<ImageUploadRef>(null)
  const router = useRouter()

  const onSubmit = async (data: UserSetupFormData) => {
    setSubmitting(true)
    setError('')

    try {
      const finalData = { ...data }

      // 現在のユーザー設定を取得して既存のiconUrlを保持
      let existingIconUrl = ''
      let isFirstTimeSetup = false
      try {
        const currentSettings = await api.get('/api/user/settings', {
          showErrorToast: false // 404エラー時のトーストを無効化
        }) as { iconUrl?: string }
        existingIconUrl = currentSettings.iconUrl || ''
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // 初回セットアップの場合
          isFirstTimeSetup = true
        } else if (error instanceof Error && error.message.includes('404')) {
          // 初回セットアップの場合（メッセージベースの判定）
          isFirstTimeSetup = true
        } else {
          // その他のエラーの場合はログに記録するがトーストは表示しない
          console.warn('Failed to fetch current user settings:', error)
        }
      }

      // 初回セットアップでGoogleアバターがある場合の自動設定
      if (isFirstTimeSetup && user && (!finalData.iconUrl || finalData.iconUrl.trim() === '')) {
        const googleAvatarUrl = user.user_metadata?.avatar_url || user.user_metadata?.picture
        if (googleAvatarUrl && (googleAvatarUrl.includes('googleusercontent.com') || 
                               googleAvatarUrl.includes('googleapis.com') || 
                               googleAvatarUrl.includes('google.com'))) {
          
          try {
            // Google画像をSupabase Storageにダウンロード・アップロード
            const googleUploadResult = await api.post('/api/user/icon/google', { googleAvatarUrl }) as { iconUrl: string }
            finalData.iconUrl = googleUploadResult.iconUrl
          } catch {
            finalData.iconUrl = googleAvatarUrl
          }
        }
      }

      // 画像がある場合はSupabase Storageにアップロード
      if (imageUploadRef.current && user) {
        const imageFile = imageUploadRef.current.getImageFile()
        
        if (imageFile) {
          
          try {
            // 1つ目のAPI: 画像をSupabase Storageにアップロード
            const formData = new FormData()
            formData.append('icon', imageFile)
            
            const uploadResult = await api.post('/api/user/icon', formData) as { iconUrl: string }
            
            // アップロードしたURLをフォームデータに設定
            finalData.iconUrl = uploadResult.iconUrl
            
          } catch (uploadError) {
            if (!(uploadError instanceof Error)) {
              setError('画像のアップロードに失敗しました。')
              setSubmitting(false)
              return
            }
            
            if (uploadError.message.includes('row-level security') || uploadError.message.includes('policy')) {
              setError(`画像のアップロード権限がありません。\n解決方法：\n1. Supabase Dashboard > Storage > Settings でRLSを一時的に無効化\n2. または適切なポリシーを設定してください。\n\n詳細: ${uploadError.message}`)
            } else {
              setError(`画像のアップロードに失敗しました: ${uploadError.message}`)
            }
            
            setSubmitting(false)
            return
          }
        } else {
          // 画像がない場合の処理：
          // 1. 空文字列('') → 明示的な削除意図なのでそのまま保持
          // 2. Blob URL → 画像が選択されているのでそのまま保持  
          // 3. undefined/null → 既存のURLを保持
          // 4. その他のURL → そのまま保持
          if (finalData.iconUrl === undefined || finalData.iconUrl === null) {
            finalData.iconUrl = existingIconUrl
          }
        }
      } else {
        // 画像コンポーネントがない場合も同様の処理
        if (finalData.iconUrl === undefined || finalData.iconUrl === null) {
          finalData.iconUrl = existingIconUrl
        }
      }

      // アイコンが削除された場合（空文字列に設定された場合）の処理
      if (finalData.iconUrl === '' && existingIconUrl && existingIconUrl.trim() !== '') {
        
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
            
            await api.delete('/api/user/icon', { iconUrl: existingIconUrl })
            console.log('UserSettingsSubmit: Icon deleted from storage successfully')
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
        iconUrl: finalData.iconUrl ? `${finalData.iconUrl.substring(0, 50)}...` : 'null',
        nativeLanguageId: finalData.nativeLanguageId,
        defaultLearningLanguageId: finalData.defaultLearningLanguageId
      })
      console.log('Full iconUrl being sent:', finalData.iconUrl)
      console.log('Language IDs being sent:', {
        nativeLanguageId: finalData.nativeLanguageId,
        defaultLearningLanguageId: finalData.defaultLearningLanguageId
      })
      console.log('Is first time setup:', isFirstTimeSetup)

      // 2つ目のAPI: ユーザー設定を保存
      const result = await api.post('/api/user/settings', finalData) as { iconUrl?: string }
      
      console.log('Settings: User settings saved successfully:', { iconUrl: result.iconUrl })
      
      // Supabaseのユーザーメタデータも更新（空文字列の場合も含む）
      console.log('Settings: Updating user metadata with iconUrl:', JSON.stringify(finalData.iconUrl))
      await updateUserMetadata({ icon_url: finalData.iconUrl || '' })
      
      // 設定完了状態を更新
      setIsUserSetupComplete(true)
      
      // AuthContextの状態も更新（初回セットアップの場合は少し遅延）
      if (isFirstTimeSetup) {
        // 初回セットアップの場合は少し遅延してから更新
        setTimeout(async () => {
          await refreshUserSettings()
        }, 500)
      } else {
        await refreshUserSettings()
      }
      
      // Settings画面への遷移フラグをクリア
      clearSettingsRedirect()
      
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
      
      // Phrase Add画面に遷移
      router.push('/phrase/add')
    } catch (error) {
      console.error('Settings save failed:', error)
      console.error('Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        name: error instanceof Error ? error.name : undefined
      })
      
      if (error instanceof ApiError) {
        // 初回ユーザーの404エラーではない場合のみエラーメッセージを表示
        if (error.status === 404 && error.message.includes('User not found')) {
          setError('ユーザー設定の初期化に失敗しました。ページを再読み込みして再試行してください。')
        } else {
          setError(`ユーザー設定の保存に失敗しました: ${error.message}`)
        }
      } else {
        setError(`ユーザー設定の保存に失敗しました: ${error instanceof Error ? error.message : 'Unknown error'}`)
      }
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
