import React from 'react'

interface CheckboxProps {
  id?: string
  checked: boolean
  onChange: (checked: boolean) => void
  disabled?: boolean
  className?: string
  children?: React.ReactNode
}

export default function Checkbox({
  id,
  checked,
  onChange,
  disabled = false,
  className = '',
  children
}: CheckboxProps) {
  return (
    <label className={`flex items-center cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <div className="relative">
        <input
          type="checkbox"
          id={id}
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-4 h-4 rounded border-2 transition-all duration-200
          ${checked 
            ? 'border-gray-600 bg-gray-600' 
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
          ${disabled ? 'opacity-50' : ''}
        `}>
          {checked && (
            <svg
              className="w-3 h-3 text-white absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
              xmlns="http://www.w3.org/2000/svg"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={3}
                d="M5 13l4 4L19 7"
              />
            </svg>
          )}
        </div>
      </div>
      {children && (
        <span className="ml-2 text-gray-900">
          {children}
        </span>
      )}
    </label>
  )
}
