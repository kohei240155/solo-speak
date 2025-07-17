'use client'

import { useState, useRef, useCallback } from 'react'
import ReactCrop, { type Crop, centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

interface ImageUploadProps {
  currentImage?: string
  onImageChange: (imageUrl: string) => void
  onImageRemove: () => void
}

export default function ImageUpload({ currentImage, onImageChange, onImageRemove }: ImageUploadProps) {
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [crop, setCrop] = useState<Crop>()
  const [completedCrop, setCompletedCrop] = useState<Crop>()
  const [showCrop, setShowCrop] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const previewCanvasRef = useRef<HTMLCanvasElement>(null)
  const blobUrlRef = useRef('')

  const onSelectFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const reader = new FileReader()
      reader.addEventListener('load', () => {
        setSelectedImage(reader.result?.toString() || '')
        setShowCrop(true)
      })
      reader.readAsDataURL(e.target.files[0])
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

  const handleCropComplete = useCallback(async () => {
    if (!completedCrop || !previewCanvasRef.current || !imgRef.current) {
      return
    }

    const canvas = previewCanvasRef.current
    generateCroppedImage(canvas, completedCrop)

    canvas.toBlob(async (blob) => {
      if (blob) {
        try {
          // サーバーにアップロード
          const formData = new FormData()
          formData.append('file', blob, 'avatar.png')
          
          const response = await fetch('/api/upload', {
            method: 'POST',
            body: formData
          })
          
          if (response.ok) {
            const result = await response.json()
            onImageChange(result.url)
          } else {
            console.error('Upload failed')
          }
        } catch (error) {
          console.error('Upload error:', error)
        }
        
        if (blobUrlRef.current) {
          URL.revokeObjectURL(blobUrlRef.current)
        }
        setShowCrop(false)
        setSelectedImage(null)
      }
    })
  }, [completedCrop, generateCroppedImage, onImageChange])

  const handleCropCancel = () => {
    setShowCrop(false)
    setSelectedImage(null)
    setCrop(undefined)
    setCompletedCrop(undefined)
  }

  const handleRemoveImage = () => {
    if (blobUrlRef.current) {
      URL.revokeObjectURL(blobUrlRef.current)
      blobUrlRef.current = ''
    }
    onImageRemove()
  }

  return (
    <div className="space-y-4">
      {/* 現在のアイコン表示 */}
      <div className="flex items-center space-x-4">
        <div className="w-12 h-12 bg-gray-300 rounded-full flex items-center justify-center overflow-hidden">
          {currentImage ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={currentImage}
              alt="User Icon"
              className="w-full h-full object-cover"
            />
          ) : (
            <svg className="w-6 h-6 text-gray-500" fill="currentColor" viewBox="0 0 20 20">
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
            />
            <span
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 text-xs font-bold inline-block"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Select
            </span>
          </label>
          {currentImage && (
            <button
              type="button"
              onClick={handleRemoveImage}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-xs font-bold"
              style={{ fontFamily: 'Inter, sans-serif' }}
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
                onClick={handleCropCancel}
                className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCropComplete}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
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
}
