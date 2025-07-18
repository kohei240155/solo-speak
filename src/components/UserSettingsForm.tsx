import { UseFormRegister, FieldErrors, UseFormSetValue, UseFormWatch, UseFormHandleSubmit } from 'react-hook-form'
import { UserSetupFormData, Language } from '@/types/userSettings'
import { useUserSettingsSubmit } from '@/hooks/useUserSettingsSubmit'
import ImageUpload from '@/components/ImageUpload'

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
  onSubmit: (data: UserSetupFormData) => void
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
  onSubmit
}: UserSettingsFormProps) {
  const { submitting, imageUploadRef } = useUserSettingsSubmit(setError, setIsUserSetupComplete)
  const watchIconUrl = watch('iconUrl')

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* User Icon */}
      <div>
        <label className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          User Icon
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
        />
        {errors.iconUrl && (
          <p className="mt-1 text-sm text-red-600">{errors.iconUrl.message}</p>
        )}
      </div>

      {/* Display Name */}
      <div>
        <label htmlFor="username" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Display Name
        </label>
        <input
          type="text"
          id="username"
          {...register('username')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="Solo Ichiro"
        />
        {errors.username && (
          <p className="mt-1 text-sm text-red-600">{errors.username.message}</p>
        )}
      </div>

      {/* Native Language */}
      <div>
        <label htmlFor="nativeLanguageId" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Native Language
        </label>
        <div className="relative">
          <select
            id="nativeLanguageId"
            {...register('nativeLanguageId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            disabled={dataLoading}
          >
            <option value="">
              {dataLoading ? 'Loading languages...' : 'Select a language'}
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
          Default Learning Language
        </label>
        <div className="relative">
          <select
            id="defaultLearningLanguageId"
            {...register('defaultLearningLanguageId')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
            disabled={dataLoading}
          >
            <option value="">
              {dataLoading ? 'Loading languages...' : 'Select a language'}
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

      {/* Date of Birth */}
      <div>
        <label htmlFor="birthdate" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Date of Birth
        </label>
        <div className="relative">
          <input
            type="date"
            id="birthdate"
            {...register('birthdate')}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          />
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        {errors.birthdate && (
          <p className="mt-1 text-sm text-red-600">{errors.birthdate.message}</p>
        )}
      </div>

      {/* Gender */}
      <div>
        <label className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Gender
        </label>
        <div className="flex space-x-6">
          <label className="flex items-center">
            <input
              type="radio"
              value="male"
              {...register('gender')}
              className="mr-2"
            />
            Male
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="female"
              {...register('gender')}
              className="mr-2"
            />
            Female
          </label>
          <label className="flex items-center">
            <input
              type="radio"
              value="unspecified"
              {...register('gender')}
              className="mr-2"
            />
            Unspecified
          </label>
        </div>
        {errors.gender && (
          <p className="mt-1 text-sm text-red-600">{errors.gender.message}</p>
        )}
      </div>

      {/* Contact Email */}
      <div>
        <label htmlFor="email" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Contact Email
        </label>
        <input
          type="email"
          id="email"
          {...register('email')}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
          placeholder="solospeak@example.com"
        />
        {errors.email && (
          <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>

      {/* Default Quiz Length */}
      <div>
        <label htmlFor="defaultQuizCount" className="block text-gray-700 mb-2 text-lg md:text-xl font-bold">
          Default Quiz Length
        </label>
        <div className="relative">
          <select
            id="defaultQuizCount"
            {...register('defaultQuizCount', { valueAsNumber: true })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 appearance-none bg-white"
          >
            <option value="5">5</option>
            <option value="10">10</option>
            <option value="15">15</option>
            <option value="20">20</option>
            <option value="25">25</option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
            <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
              <path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/>
            </svg>
          </div>
        </div>
        {errors.defaultQuizCount && (
          <p className="mt-1 text-sm text-red-600">{errors.defaultQuizCount.message}</p>
        )}
      </div>

      {/* Save Button */}
      <div className="pt-4">
        <button
          type="submit"
          disabled={submitting}
          className="w-full text-white py-2 px-4 rounded-md focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors duration-200"
          style={{ backgroundColor: '#616161' }}
          onMouseEnter={(e) => {
            if (!submitting) {
              e.currentTarget.style.backgroundColor = '#525252'
            }
          }}
          onMouseLeave={(e) => {
            if (!submitting) {
              e.currentTarget.style.backgroundColor = '#616161'
            }
          }}
        >
          {submitting ? 'Saving...' : 'Save'}
        </button>
      </div>
    </form>
  )
}
