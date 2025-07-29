import React from 'react'

interface RadioButtonProps {
  id?: string
  name: string
  value: string
  checked: boolean
  onChange: (value: string) => void
  disabled?: boolean
  className?: string
  children: React.ReactNode
}

export default function RadioButton({
  id,
  name,
  value,
  checked,
  onChange,
  disabled = false,
  className = '',
  children
}: RadioButtonProps) {
  return (
    <label className={`flex items-center cursor-pointer ${disabled ? 'cursor-not-allowed opacity-50' : ''} ${className}`}>
      <div className="relative">
        <input
          type="radio"
          id={id}
          name={name}
          value={value}
          checked={checked}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className="sr-only"
        />
        <div className={`
          w-4 h-4 rounded-full border-2 transition-all duration-200
          ${checked 
            ? 'border-blue-600 bg-blue-600' 
            : 'border-gray-300 bg-white hover:border-gray-400'
          }
          ${disabled ? 'opacity-50' : ''}
        `}>
          {checked && (
            <div className="w-2 h-2 bg-white rounded-full absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2" />
          )}
        </div>
      </div>
      <span className="ml-2 text-gray-900">
        {children}
      </span>
    </label>
  )
}
