import { useState, useRef } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { api, ApiError } from '@/utils/api'
import { ImageUploadRef } from '@/components/common/ImageUpload'
import toast from 'react-hot-toast'
import { UserSetupFormData } from '@/types/userSettings'
import { useRouter } from 'next/navigation'
import { mutate } from 'swr'

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
      let currentLanguageSettings = { nativeLanguageId: '', defaultLearningLanguageId: '' }
      
      try {
        const currentSettings = await api.get('/api/user/settings', {
          showErrorToast: false // 404エラー時のトーストを無効化
        }) as { iconUrl?: string; nativeLanguageId?: string; defaultLearningLanguageId?: string }
        existingIconUrl = currentSettings.iconUrl || ''
        currentLanguageSettings = {
          nativeLanguageId: currentSettings.nativeLanguageId || '',
          defaultLearningLanguageId: currentSettings.defaultLearningLanguageId || ''
        }
      } catch (error) {
        if (error instanceof ApiError && error.status === 404) {
          // 初回セットアップの場合
          isFirstTimeSetup = true
        } else if (error instanceof Error && error.message.includes('404')) {
          // 初回セットアップの場合（メッセージベースの判定）
          isFirstTimeSetup = true
        } else {
          // その他のエラーの場合はログに記録するがトーストは表示しない
        }
      }

      // 言語設定が変更されたかをチェック
      const languageChanged = !isFirstTimeSetup && (
        currentLanguageSettings.nativeLanguageId !== data.nativeLanguageId ||
        currentLanguageSettings.defaultLearningLanguageId !== data.defaultLearningLanguageId
      )
      
      // 母国語が変更されたかをチェック
      const nativeLanguageChanged = !isFirstTimeSetup && 
        currentLanguageSettings.nativeLanguageId !== data.nativeLanguageId

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
        } else {
          // Googleアバターがない場合はデフォルト画像を設定
          finalData.iconUrl = '/images/user-icon/user-icon.png'
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
        
        // Supabase StorageのURLかどうかをチェック
        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || ''
        const isSupabaseUrl = existingIconUrl.includes(supabaseUrl) &&
                              existingIconUrl.includes('/storage/v1/object/public/')
        
        // Supabase Storageに保存された画像の場合は物理削除
        if (isSupabaseUrl) {
          try {
            await api.delete('/api/user/icon', { iconUrl: existingIconUrl })
          } catch {
            // 削除に失敗してもユーザー設定の更新は続行
          }
        }
        
        // デフォルト画像を設定
        finalData.iconUrl = '/images/user-icon/user-icon.png'
      }

      // 2つ目のAPI: ユーザー設定を保存
      await api.post('/api/user/settings', finalData)
      
      // SWRキャッシュを更新
      if (user?.id) {
        await mutate(['/api/user/settings', user.id])
      }
      
      // Supabaseのユーザーメタデータも更新（空文字列の場合も含む）
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
      setTimeout(() => {
        window.dispatchEvent(new Event('userSettingsUpdated'))
        
        // 母国語が変更された場合、または初回セットアップ時は表示言語変更イベントも発行
        if (nativeLanguageChanged || isFirstTimeSetup) {
          // 言語情報を取得して言語コードを特定
          api.get('/api/languages')
            .then((response) => {
              const languages = response as any[]
              const selectedLanguage = languages.find(lang => lang.id === data.nativeLanguageId)
              if (selectedLanguage?.code) {
                window.dispatchEvent(new CustomEvent('nativeLanguageChanged', {
                  detail: { nativeLanguageCode: selectedLanguage.code }
                }))
              }
            })
            .catch(() => {
              // エラーが発生した場合は何もしない
            })
        }
      }, 100)
      
      // 成功メッセージを表示
      setError('')
      toast.success('Settings saved successfully!', {
        duration: 3000,
        position: 'top-center',
      })
      
      // 言語設定が変更された場合はPhrase Add画面でリロードするためのフラグを設定
      if (languageChanged) {
        sessionStorage.setItem('reloadAfterLanguageChange', 'true')
      }
      
      // 常にPhrase Add画面に遷移
      setTimeout(() => {
        router.push('/phrase/add')
      }, 500)
    } catch (error) {
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
