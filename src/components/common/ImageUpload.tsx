'use client'

import { useState, useRef, useCallback, useImperativeHandle, forwardRef } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  onImageRemove?: () => void // オプショナルに変更
  disabled?: boolean
}

export interface ImageUploadRef {
  getImageFile: () => File | null
}

const ImageUpload = forwardRef<ImageUploadRef, ImageUploadProps>(
  ({ currentImage, onImageChange, disabled = false }, ref) => {
    const [selectedImage, setSelectedImage] = useState<string | null>(null)
    const [selectedFile, setSelectedFile] = useState<File | null>(null) // 元のファイルオブジェクトを保持
    const [crop, setCrop] = useState<Crop>()
    const [completedCrop, setCompletedCrop] = useState<Crop>()
    const [showCrop, setShowCrop] = useState(false)
    const [croppedImageBlob, setCroppedImageBlob] = useState<Blob | null>(null)
    const imgRef = useRef<HTMLImageElement>(null)
    const previewCanvasRef = useRef<HTMLCanvasElement>(null)
    const blobUrlRef = useRef('')

    // 共通のgetImageFile関数
    const getImageFile = useCallback(() => {
      // クロップされた画像があればそれを使用
      if (croppedImageBlob) {
        const file = new File([croppedImageBlob], 'avatar.png', { type: 'image/png' })
        return file
      }
      
      // 元のファイルオブジェクトがある場合はそれを使用
      if (selectedFile) {
        return selectedFile
      }
      
      // selectedImageがData URLの場合の処理
      if (selectedImage && selectedImage.startsWith('data:')) {
        try {
          // Data URLをBlobに変換
          const [header, data] = selectedImage.split(',')
          const mime = header.match(/:(.*?);/)?.[1] || 'image/jpeg'
          const binary = atob(data)
          const array = new Uint8Array(binary.length)
          for (let i = 0; i < binary.length; i++) {
            array[i] = binary.charCodeAt(i)
          }
          const blob = new Blob([array], { type: mime })
          const file = new File([blob], 'avatar.jpg', { type: mime })
          return file
        } catch (error) {
          console.error('ImageUpload: Failed to convert selected image to file:', error)
          return null
        }
      }
      
      return null
    }, [croppedImageBlob, selectedFile, selectedImage])

    // 親コンポーネントが呼び出せる関数を公開
    useImperativeHandle(ref, () => ({
      getImageFile
    }), [getImageFile])

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const file = e.target.files[0]
      setSelectedFile(file) // 元のファイルオブジェクトを保存
      
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result?.toString() || '')
        setShowCrop(true)
      })
      reader.readAsDataURL(file)
    }
  }

  const onImageLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const { width, height } = e.currentTarget
    setCrop(centerCrop(
      makeAspectCrop(
        {
          unit: '%',
          width: 90,
        },
        1,
        width,
        height,
      ),
      width,
      height,
    ))
  }, [])

  const generateCroppedImage = useCallback(
    (canvas: HTMLCanvasElement, crop: Crop) => {
      if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
        return
      }

      const image = imgRef.current
      const scaleX = image.naturalWidth / image.width
      const scaleY = image.naturalHeight / image.height
      const ctx = canvas.getContext('2d')
      const pixelRatio = window.devicePixelRatio

      canvas.width = crop.width * pixelRatio * scaleX
      canvas.height = crop.height * pixelRatio * scaleY

      if (ctx) {
        ctx.setTransform(pixelRatio, 0, 0, pixelRatio, 0, 0)
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width * scaleX,
          crop.height * scaleY,
        )
      }
    },
    [completedCrop],
  )

    const handleCropComplete = useCallback(() => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return
    }

    const canvas = previewCanvasRef.current
    generateCroppedImage(canvas, completedCrop)

    // Blobを作成してローカル保存
    canvas.toBlob((blob) => {
      if (blob) {
        setCroppedImageBlob(blob)
      }
    })

    // フォーム表示用にBase64データURLを作成
    const dataUrl = canvas.toDataURL('image/png', 0.9)
    onImageChange(dataUrl)
    
    // 古いBlob URLをクリーンアップ
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = ''
    }
    
    setShowCrop(false)
    setSelectedImage(null)
  }, [completedCrop, generateCroppedImage, onImageChange])

  const handleCropCancel = () => {
    setShowCrop(false)
    setSelectedImage(null)
    setSelectedFile(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  const handleRemoveImage = async () => {
    // ローカル状態をクリア（実際のStorage削除はSave時に実行）
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = ''
    }
    
    // ローカル状態もクリア
    setSelectedFile(null)
    setSelectedImage(null)
    setCroppedImageBlob(null)
    
    // デフォルト画像を設定
    const defaultImagePath = '/images/user-icon/user-icon.png'
    onImageChange(defaultImagePath)
  }

  return (
    <div className="space-y-4">
      {/* 現在のアイコン表示 */}
      <div className="flex items-center space-x-4">
        <div 
          className="w-10 h-10 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden border border-gray-300 cursor-pointer transition-all duration-200"
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#9CA3AF'
            e.currentTarget.style.boxShadow = '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)'
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#D1D5DB'
            e.currentTarget.style.boxShadow = 'none'
          }}
        >
          {currentImage && currentImage.trim() !== '' ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage.startsWith('data:') ? currentImage : `${currentImage}${currentImage.includes('?') ? '&' : '?'}t=${Date.now()}`}
              alt="User Icon"
              className="w-full h-full object-cover transition-transform duration-200"
              onMouseEnter={(e) => {
                e.currentTarget.style.transform = 'scale(1.05)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.transform = 'scale(1)'
              }}
            />
          ) : (
            <svg 
              className="w-6 h-6 text-gray-500 transition-colors duration-200" 
              fill="currentColor" 
              viewBox="0 0 20 20"
              onMouseEnter={(e) => {
                e.currentTarget.style.color = '#6B7280'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.color = '#9CA3AF'
              }}
            >
              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
            </svg>
          )}
        </div>
        <div className="flex space-x-2">
          <label className="cursor-pointer">
            <input
              type="file"
              accept="image/*"
              onChange={onSelectFile}
              className="hidden"
              disabled={disabled}
            />
            <span
              className={`px-4 py-2 text-white rounded-md text-sm inline-block transition-colors duration-200 ${disabled ? 'bg-gray-400 cursor-not-allowed' : ''}`}
              style={{ backgroundColor: disabled ? '#9CA3AF' : '#616161' }}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#525252'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#616161'
                }
              }}
            >
              Select
            </span>
          </label>
          {currentImage && currentImage.trim() !== '' && !currentImage.includes('/images/user-icon/user-icon.png') && (
            <button
              type="button"
              onClick={handleRemoveImage}
              disabled={disabled}
              className={`px-4 py-2 border border-gray-300 text-gray-700 rounded-md text-sm transition-colors duration-200 ${disabled ? 'bg-gray-100 cursor-not-allowed' : ''}`}
              onMouseEnter={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = '#F3F4F6'
                  e.currentTarget.style.borderColor = '#9CA3AF'
                }
              }}
              onMouseLeave={(e) => {
                if (!disabled) {
                  e.currentTarget.style.backgroundColor = 'transparent'
                  e.currentTarget.style.borderColor = '#D1D5DB'
                }
              }}
            >
              Delete
            </button>
          )}
        </div>
      </div>

      {/* 画像クロップモーダル */}
      {showCrop && selectedImage && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold mb-4">Crop Image</h3>
            <div className="mb-4">
              <ReactCrop
                crop={crop}
                onChange={(_, percentCrop) => setCrop(percentCrop)}
                onComplete={(c) => setCompletedCrop(c)}
                aspect={1}
                minWidth={50}
                minHeight={50}
                circularCrop
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  ref={imgRef}
                  alt="Crop me"
                  src={selectedImage}
                  onLoad={onImageLoad}
                  className="max-w-full max-h-80"
                />
              </ReactCrop>
            </div>
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                onClick={handleCropCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-100 hover:border-gray-400 transition-colors duration-200"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleCropComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 非表示のキャンバス */}
      <canvas
        ref={previewCanvasRef}
        className="hidden"
      />
    </div>
  )
})

ImageUpload.displayName = 'ImageUpload'

export default ImageUpload
