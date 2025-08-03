import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormHandleSubmit } from 'react-hook-form'
import { UserSetupFormData, Language } from '@/types/userSettings'
import { useUserSettingsSubmit } from '@/hooks/useUserSettingsSubmit'
import { useTranslation } from '@/hooks/useTranslation'
import ImageUpload from '@/components/common/ImageUpload'

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
  onSubmit, // 未使用だが型との整合性のため受け取る
  submitting: submittingProp
}: UserSettingsFormProps) {
  const { t } = useTranslation('common')
  const { submitting, imageUploadRef, onSubmit: onSubmitFromHook } = useUserSettingsSubmit(
    setError, 
    setIsUserSetupComplete
  )
  const watchIconUrl = watch('iconUrl')
  const isDisabled = dataLoading || submitting || submittingProp
  
  // 実際に使用するsubmitting状態を統一
  const actualSubmitting = submitting || submittingProp

  return (
    <form onSubmit={handleSubmit(onSubmitFromHook)} className="space-y-6">
      {/* User Icon */}
      <div>
        <label className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          {t('settings.userIcon')}
        </label>
        <ImageUpload
          ref={imageUploadRef}
          currentImage={watchIconUrl}
          onImageChange={(imageUrl) => {
            setValue('iconUrl', imageUrl)
          }}
          onImageRemove={() => {
            setValue('iconUrl', '')
          }}
          disabled={isDisabled}
        />
        {errors.iconUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.iconUrl.message}</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="username" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          {t('settings.displayName')}
        </label>
        <input
          type="text"
          id="username"
          {...register('username')}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
          placeholder={t('settings.placeholders.displayName')}
          disabled={isDisabled}
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Native Language */}
      <div>
        <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
              {dataLoading ? t('settings.loadingLanguages') : t('settings.selectLanguage')}
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
        <label htmlFor="defaultLearningLanguageId" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
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
              {dataLoading ? t('settings.loadingLanguages') : t('settings.selectLanguage')}
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
        {errors.defaultLearningLanguageId && (
          <p className="mt-1 text-sm text-red-600">{errors.defaultLearningLanguageId.message}</p>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          {t('settings.contactEmail')}
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          className={`w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-gray-900 ${isDisabled ? 'bg-gray-100 cursor-not-allowed text-gray-600' : ''}`}
          placeholder={t('settings.placeholders.contactEmail')}
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
          disabled={actualSubmitting}
          className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:cursor-not-allowed transition-colors duration-200"
          style={{ 
            backgroundColor: actualSubmitting ? '#9CA3AF' : '#616161'
          }}
          onMouseEnter={(e) => {
            if (!actualSubmitting && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#525252'
            }
          }}
          onMouseLeave={(e) => {
            if (!actualSubmitting && e.currentTarget) {
              e.currentTarget.style.backgroundColor = '#616161'
            }
          }}
        >
          {actualSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              {t('settings.saving')}
            </div>
          ) : (
            t('settings.save')
          )}
        </button>
      </div>
    </form>
  )
}
