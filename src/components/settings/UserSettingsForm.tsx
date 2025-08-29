import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormHandleSubmit } from 'react-hook-form'
import { useEffect, useState } from 'react'
import { UserSetupFormData, Language } from '@/types/userSettings'
import { useUserSettingsSubmit } from '@/hooks/data/useUserSettingsSubmit'
import { useTranslation } from '@/hooks/ui/useTranslation'
import ImageUpload from '@/components/common/ImageUpload'
import WithdrawalModal from '@/components/modals/WithdrawalModal'
import { IoExitOutline } from 'react-icons/io5'

interface UserSettingsFormProps {
  register: UseFormRegister<UserSetupFormData>
  errors: FieldErrors<UserSetupFormData>
  setValue: UseFormSetValue<UserSetupFormData>
  watch: UseFormWatch<UserSetupFormData>
  handleSubmit: UseFormHandleSubmit<UserSetupFormData>
  languages: Language[]
  dataLoading: boolean
  setError: (error: string) => void
  setIsUserSetupComplete: (complete: boolean) => void
  onSubmit?: (data: UserSetupFormData) => void // オプショナルにする
  submitting: boolean
}

export default function UserSettingsForm({
  register,
  errors,
  setValue,
  watch,
  handleSubmit,
  languages,
  dataLoading,
  setError,
  setIsUserSetupComplete,
  submitting: submittingProp,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  ...rest // onSubmitを含む残りのpropsを受け取るが使用しない
}: UserSettingsFormProps) {
  const { t } = useTranslation('common')
  const { submitting, imageUploadRef, onSubmit: onSubmitFromHook } = useUserSettingsSubmit(
    setError, 
    setIsUserSetupComplete
  )
  const [isWithdrawalModalOpen, setIsWithdrawalModalOpen] = useState(false)
  
  const watchIconUrl = watch('iconUrl')
  const watchNativeLanguageId = watch('nativeLanguageId')
  const watchDefaultLearningLanguageId = watch('defaultLearningLanguageId')
  const isDisabled = dataLoading || submitting || submittingProp
  
  // 実際に使用するsubmitting状態を統一
  const actualSubmitting = submitting || submittingProp

  // 言語が同じかどうかをチェック
  const isSameLanguage = watchNativeLanguageId && watchDefaultLearningLanguageId && watchNativeLanguageId === watchDefaultLearningLanguageId

  // 母国語が変更された時、同じ言語が選択されていたらデフォルト学習言語をリセット
  useEffect(() => {
    if (isSameLanguage) {
      setValue('defaultLearningLanguageId', '')
    }
  }, [watchNativeLanguageId, isSameLanguage, setValue])

  return (
    <>
      <form onSubmit={handleSubmit(onSubmitFromHook)} className="space-y-6">
      {/* User Icon */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="block text-gray-700 text-base md:text-lg font-bold">
            {t('settings.userIcon')}
          </label>
          <button
            type="button"
            onClick={() => setIsWithdrawalModalOpen(true)}
            className="flex items-center justify-center w-8 h-8 text-red-600 bg-red-50 border border-red-200 rounded-md hover:bg-red-100 transition-colors"
            title={t('settings.withdrawal.button')}
          >
            <IoExitOutline className="w-4 h-4" />
          </button>
        </div>
        <ImageUpload
          ref={imageUploadRef}
          currentImage={watchIconUrl}
          onImageChange={(imageUrl) => {
            setValue('iconUrl', imageUrl)
          }}
          disabled={isDisabled}
        />
        {errors.iconUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.iconUrl.message}</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="username" className="block text-gray-700 mb-2 text-base md:text-lg font-bold">
          {t('settings.displayName')}
        </label>
        <input
          type="text"
          id="username"
          {...register('username')}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
          placeholder="Solo Ichiro"
          disabled={isDisabled}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Native Language */}
      <div>
        <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2 text-base md:text-lg font-bold">
          {t('settings.nativeLanguage')}
        </label>
        <div className="relative">
          <select
            id="nativeLanguageId"
            {...register('nativeLanguageId')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
            disabled={isDisabled}
          >
            <option value="">
              {dataLoading ? 'Loading languages...' : t('settings.selectLanguage')}
            </option>
            {languages.map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            {dataLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
            ) : (
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            )}
          </div>
        </div>
        {errors.nativeLanguageId && (
          <p className="mt-1 text-sm text-red-600">{errors.nativeLanguageId.message}</p>
        )}
      </div>

      {/* Default Learning Language */}
      <div>
        <label htmlFor="defaultLearningLanguageId" className="block text-gray-700 mb-2 text-base md:text-lg font-bold">
          {t('settings.defaultLearningLanguage')}
        </label>
        <div className="relative">
          <select
            id="defaultLearningLanguageId"
            {...register('defaultLearningLanguageId')}
            className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
            disabled={isDisabled}
          >
            <option value="">
              {dataLoading ? 'Loading languages...' : t('settings.selectLanguage')}
            </option>
            {languages.filter(lang => lang.id !== watchNativeLanguageId).map(lang => (
              <option key={lang.id} value={lang.id}>{lang.name}</option>
            ))}
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            {dataLoading ? (
              <div className="animate-spin h-4 w-4 border-2 border-gray-300 border-t-gray-600 rounded-full"></div>
            ) : (
              <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
                <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
              </svg>
            )}
          </div>
        </div>
        {errors.defaultLearningLanguageId && (
          <p className="mt-1 text-sm text-red-600">{errors.defaultLearningLanguageId.message}</p>
        )}
        {isSameLanguage && (
          <p className="mt-1 text-sm text-red-600">{t('settings.validation.sameLanguageError')}</p>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2 text-base md:text-lg font-bold">
          {t('settings.contactEmail')}
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
          placeholder="solospeak@example.com"
          disabled={isDisabled}
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={actualSubmitting || !!isSameLanguage}
          className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors duration-200"
          style={{ 
            backgroundColor: (actualSubmitting || !!isSameLanguage) ? '#9CA3AF' : '#616161'
          }}
          onMouseEnter={(e) => {
            if (!actualSubmitting && !isSameLanguage && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#525252'
            }
          }}
          onMouseLeave={(e) => {
            if (!actualSubmitting && e.currentTarget) {
              e.currentTarget.style.backgroundColor = (actualSubmitting || !!isSameLanguage) ? '#9CA3AF' : '#616161'
            }
          }}
        >
          {actualSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Saving...
            </div>
          ) : (
            'Save'
          )}
        </button>
      </div>
    </form>

    {/* Withdrawal Modal */}
    <WithdrawalModal
      isOpen={isWithdrawalModalOpen}
      onClose={() => setIsWithdrawalModalOpen(false)}
    />
  </>
  )
}
