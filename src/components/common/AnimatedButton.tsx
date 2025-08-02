import { ReactNode } from 'react'

interface AnimatedButtonProps {
  children: ReactNode
  onClick: () => void
  disabled?: boolean
  variant?: 'primary' | 'secondary'
  size?: 'sm' | 'md' | 'lg'
  isLoading?: boolean
  loadingText?: string
  className?: string
  style?: React.CSSProperties
}

export default function AnimatedButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'md',
  isLoading = false,
  loadingText,
  className = '',
  style = {}
}: AnimatedButtonProps) {
  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (disabled || isLoading || !e.currentTarget) return
    
    // スケール効果
    e.currentTarget.style.transform = 'scale(0.98)'
    setTimeout(() => {
      if (e.currentTarget) {
        e.currentTarget.style.transform = 'scale(1)'
      }
    }, 150)
    
    onClick()
  }

  const getVariantStyles = () => {
    if (variant === 'secondary') {
      return {
        base: 'bg-white border text-gray-600',
        hover: 'hover:bg-gray-50',
        borderColor: '#616161',
        textColor: '#616161',
        spinnerColor: 'border-gray-600',
        hoverBg: '#f9fafb',
        normalBg: 'white'
      }
    }
    
    return {
      base: 'text-white',
      hover: '',
      backgroundColor: disabled || isLoading ? '#9CA3AF' : '#616161',
      spinnerColor: 'border-white',
      hoverBg: '#525252',
      normalBg: '#616161'
    }
  }

  const getSizeStyles = () => {
    switch (size) {
      case 'sm':
        return 'py-1 px-3 text-sm'
      case 'lg':
        return 'py-3 px-8 text-lg'
      default:
        return 'py-2 px-4'
    }
  }

  const variantStyles = getVariantStyles()
  const sizeStyles = getSizeStyles()

  const baseClasses = `
    w-full font-medium rounded-md 
    focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 
    transition-all duration-300 disabled:cursor-not-allowed relative
    ${variantStyles.base} ${variantStyles.hover} ${sizeStyles} ${className}
    ${isLoading ? 'animate-pulse' : ''}
    ${disabled && !isLoading ? 'opacity-50' : ''}
  `.trim()

  const buttonStyle = {
    ...style,
    ...(variant === 'secondary' ? {
      borderColor: variantStyles.borderColor,
      color: variantStyles.textColor,
    } : {
      backgroundColor: variantStyles.backgroundColor,
    }),
    ...(isLoading ? {
      boxShadow: '0 0 15px rgba(97, 97, 97, 0.4)'
    } : {})
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && e.currentTarget) {
      if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = variantStyles.hoverBg
      } else {
        e.currentTarget.style.backgroundColor = variantStyles.hoverBg
      }
      e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
    }
  }

  const handleMouseLeave = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled && !isLoading && e.currentTarget) {
      if (variant === 'secondary') {
        e.currentTarget.style.backgroundColor = variantStyles.normalBg
      } else {
        e.currentTarget.style.backgroundColor = variantStyles.normalBg
      }
      e.currentTarget.style.boxShadow = 'none'
    }
  }

  return (
    <button
      onClick={handleClick}
      disabled={disabled || isLoading}
      className={baseClasses}
      style={buttonStyle}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {isLoading ? (
        <div className="flex items-center justify-center">
          <div className={`animate-spin rounded-full h-5 w-5 border-b-2 ${variantStyles.spinnerColor} mr-2`}></div>
          {loadingText || children}
        </div>
      ) : (
        children
      )}
    </button>
  )
}
