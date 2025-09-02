import Image from 'next/image'
import { BsCheckSquareFill } from 'react-icons/bs'
import { useTranslation } from '@/hooks/ui/useTranslation'
import { useState, useEffect } from 'react'

interface HeroSectionProps {
  onGetStartedClick: () => void
}

export default function HeroSection({ onGetStartedClick }: HeroSectionProps) {
  const { t } = useTranslation('common')
  const [animationStarted, setAnimationStarted] = useState(false)

  // コンポーネントマウント後にアニメーションを開始
  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimationStarted(true)
    }, 300) // 300ms後にアニメーション開始

    return () => clearTimeout(timer)
  }, [])

  return (
    <section 
      id="hero-section"
      data-scroll-animation
      className="py-8 md:py-12 lg:py-16 flex items-center justify-center relative overflow-hidden bg-gray-50"
    >
      {/* 背景の装飾要素 */}
      <div className={`absolute inset-0 opacity-30 transition-opacity duration-1500 ease-out ${
        animationStarted ? 'opacity-30' : 'opacity-0'
      }`} style={{ transitionDelay: '100ms' }}>
        <div className="absolute top-20 left-20 w-72 h-72 bg-gray-200 rounded-full blur-3xl"></div>
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300 rounded-full blur-3xl"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-100 rounded-full blur-3xl"></div>
      </div>
      
      <div className="container mx-auto px-4 sm:px-8 relative z-10">
        <div className="max-w-6xl mx-auto">
          {/* スマホ版: 縦並びレイアウト */}
          <div className="flex flex-col items-center text-center lg:hidden space-y-2 px-2">
            {/* サブタイトル */}
            <p className={`text-base sm:text-lg md:text-xl text-gray-600 font-medium w-full max-w-2xl transition-all duration-1000 ease-out ${
              animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '200ms' }}>
              {t('home.hero.subtitle')}
            </p>
            
            {/* メインタイトル */}
            <h1 className={`text-4xl sm:text-5xl md:text-6xl font-bold text-gray-900 tracking-tight w-full max-w-2xl mb-4 transition-all duration-1000 ease-out ${
              animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ lineHeight: '1.2', transitionDelay: '400ms' }}>
              <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                {t('home.hero.title').split('\n').map((line, index) => (
                  <span key={index}>
                    {line}
                    {index < t('home.hero.title').split('\n').length - 1 && <br />}
                  </span>
                ))}
              </span>
            </h1>
            
            {/* アプリ画像 */}
            <div className={`flex items-center justify-center mt-6 transition-all duration-1000 ease-out ${
              animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '600ms' }}>
              <div className="relative">
                <div className="transform hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/top/smartphone.png"
                    alt="Solo Speak アプリのデモ画面"
                    width={450}
                    height={550}
                    className="w-80 h-auto sm:w-96 drop-shadow-2xl rounded-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
              
            {/* 特徴リスト */}
            <div className={`bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg w-full max-w-2xl mx-2 mt-6 transition-all duration-1000 ease-out ${
              animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '800ms' }}>
              <div className="space-y-4">
                <div className="flex items-start text-left">
                  <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                  <span className="text-md md:text-xl text-gray-800 font-medium">
                    {t('home.hero.features.aiGeneration')}
                  </span>
                </div>
                
                <div className="flex items-start text-left">
                  <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                  <span className="text-md md:text-xl text-gray-800 font-medium">
                    {t('home.hero.features.practiceSupport')}
                  </span>
                </div>
                
                <div className="flex items-start text-left">
                  <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                  <span className="text-md md:text-xl text-gray-800 font-medium">
                    {t('home.hero.features.quizFunction')}
                  </span>
                </div>
              </div>
            </div>
            
            {/* CTA */}
            <div 
              className={`inline-flex items-center px-6 py-3 rounded-xl border border-gray-300 text-white transition-all duration-1000 group cursor-pointer shadow-lg mt-6 ease-out ${
                animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`}
              style={{ backgroundColor: '#616161', transitionDelay: '1000ms' }}
              onMouseEnter={(e) => {
                e.currentTarget.style.backgroundColor = '#525252'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.backgroundColor = '#616161'
              }}
              onClick={onGetStartedClick}
            >
              <span className="font-semibold text-sm group-hover:text-gray-100 transition-colors duration-300">
                {t('home.hero.cta.desktop')}
              </span>
            </div>
          </div>

          {/* PC版: 左右レイアウト */}
          <div className="hidden lg:grid lg:grid-cols-[3fr_2fr] gap-4 items-start">
            {/* 左側: テキストコンテンツ */}
            <div className="text-left max-w-4xl">
              {/* サブタイトル */}
              <p className={`text-2xl text-gray-600 font-medium transition-all duration-1000 ease-out ${
                animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '200ms' }}>
                {t('home.hero.subtitle')}
              </p>
              
              {/* メインタイトル */}
              <h1 className={`text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight transition-all duration-1000 ease-out ${
                animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '400ms' }}>
                <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                  {t('home.hero.title').split('\n').map((line, index) => (
                    <span key={index}>
                      {line}
                      {index < t('home.hero.title').split('\n').length - 1 && <br />}
                    </span>
                  ))}
                </span>
              </h1>
              
              {/* 特徴リスト */}
              <div className={`bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg mb-8 max-w-lg transition-all duration-1000 ease-out ${
                animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
              }`} style={{ transitionDelay: '600ms' }}>
                <div className="space-y-4">
                  <div className="flex items-start text-left">
                    <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                    <span className="text-xl text-gray-800 font-medium">
                      {t('home.hero.features.aiGeneration')}
                    </span>
                  </div>
                  
                  <div className="flex items-start text-left">
                    <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                    <span className="text-xl text-gray-800 font-medium">
                      {t('home.hero.features.practiceSupport')}
                    </span>
                  </div>
                  
                  <div className="flex items-start text-left">
                    <BsCheckSquareFill className="w-5 h-5 mr-4 flex-shrink-0 mt-1" style={{ color: '#616161' }} />
                    <span className="text-xl text-gray-800 font-medium">
                      {t('home.hero.features.quizFunction')}
                    </span>
                  </div>
                </div>
              </div>
              
              {/* CTA */}
              <div 
                className={`inline-flex items-center px-6 py-3 rounded-xl border border-gray-300 text-white transition-all duration-1000 group cursor-pointer shadow-lg ease-out ${
                  animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
                }`}
                style={{ backgroundColor: '#616161', transitionDelay: '800ms' }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = '#525252'
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = '#616161'
                }}
                onClick={onGetStartedClick}
              >
                <span className="font-semibold text-base group-hover:text-gray-100 transition-colors duration-300">
                  {t('home.hero.cta.desktop')}
                </span>
              </div>
            </div>
            
            {/* 右側: アプリ画像 */}
            <div className={`flex items-center justify-center transition-all duration-1000 ease-out ${
              animationStarted ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'
            }`} style={{ transitionDelay: '1000ms' }}>
              <div className="relative">
                <div className="transform hover:scale-105 transition-transform duration-500">
                  <Image
                    src="/images/top/smartphone.png"
                    alt="Solo Speak アプリのデモ画面"
                    width={450}
                    height={550}
                    className="w-[28rem] h-auto drop-shadow-2xl rounded-2xl"
                    priority
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
