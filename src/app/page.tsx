'use client'

import { useTranslation } from '@/hooks/ui/useTranslation'
import { useAuth } from '@/contexts/AuthContext'
import { useScrollAnimation } from '@/hooks/ui/useScrollAnimation'
import Footer from '@/components/layout/Footer'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import SplashScreen from '@/components/layout/SplashScreen'
import HeroSection from '@/components/layout/HeroSection'
import FeaturesSection from '@/components/layout/FeaturesSection'
import SolutionsSection from '@/components/layout/SolutionsSection'
import FAQSection from '@/components/layout/FAQSection'
import CTASection from '@/components/layout/CTASection'
import { useState, useEffect } from 'react'

export default function Home() {
  const { t, isLoading: isLoadingTranslation } = useTranslation('common')
  const { showLoginModal } = useAuth()
  const visibleSections = useScrollAnimation()
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [showContent, setShowContent] = useState(false)

  useEffect(() => {
    const fadeTimer = setTimeout(() => {
      setFadeOut(true)
    }, 1500) // 1.5秒後にフェードアウト開始

    const hideTimer = setTimeout(() => {
      setShowSplash(false)
      setShowContent(true)
    }, 2000) // 2秒後にスプラッシュ画面を非表示、コンテンツ表示

    return () => {
      clearTimeout(fadeTimer)
      clearTimeout(hideTimer)
    }
  }, [])

  const handleGetStartedClick = () => {
    showLoginModal()
  }

  // スプラッシュ画面を最優先で表示
  if (showSplash) {
    return <SplashScreen showSplash={showSplash} fadeOut={fadeOut} />
  }

  if (isLoadingTranslation) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  return (
    <div className={`min-h-screen transition-opacity duration-700 ease-in-out ${
      showContent ? 'opacity-100' : 'opacity-0'
    }`}>
      <HeroSection 
        visibleSections={visibleSections}
        onGetStartedClick={handleGetStartedClick}
      />

      <FeaturesSection visibleSections={visibleSections} />

      <SolutionsSection visibleSections={visibleSections} />

      <FAQSection visibleSections={visibleSections} />

      <CTASection 
        visibleSections={visibleSections}
        onGetStartedClick={handleGetStartedClick}
      />
      
      <Footer />
    </div>
  )
}
