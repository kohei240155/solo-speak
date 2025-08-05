'use client'

import { useRedirect } from '@/hooks/navigation/useRedirect'
import { useTranslation } from '@/hooks/ui/useTranslation'
import Footer from '@/components/layout/Footer'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useState, useEffect } from 'react'
import Image from 'next/image'

export default function Home() {
  const { loading } = useRedirect()
  const { t, isLoading: isLoadingTranslation } = useTranslation('common')
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

  // スプラッシュ画面を最優先で表示
  if (showSplash) {
    return (
      <div 
        className={`fixed inset-0 bg-white flex items-center justify-center transition-opacity duration-500 ${
          fadeOut ? 'opacity-0' : 'opacity-100'
        }`}
        style={{ zIndex: 9999 }}
      >
        <Image
          src="/images/logo/Solo Speak Logo.png"
          alt="Solo Speak"
          width={300}
          height={100}
          priority
          className={`transition-opacity duration-700 ${fadeOut ? 'opacity-0' : 'opacity-100'}`}
        />
      </div>
    )
  }

  if (loading || isLoadingTranslation) {
    return <LoadingSpinner fullScreen message="Loading..." />
  }

  return (
    <div className={`min-h-screen transition-opacity duration-700 ease-in-out ${
      showContent ? 'opacity-100' : 'opacity-0'
    }`} style={{ background: 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)' }}>
      
      {/* ヒーローセクション */}
      <section className="min-h-screen flex items-center justify-center relative overflow-hidden">
        {/* 背景の装飾要素 */}
        <div className="absolute inset-0 opacity-30">
          <div className="absolute top-20 left-20 w-72 h-72 bg-gray-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-20 right-20 w-96 h-96 bg-gray-300 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-80 h-80 bg-gray-100 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-7xl mx-auto">
            <div className="grid lg:grid-cols-[3fr_2fr] gap-12 lg:gap-16 items-start">
              {/* 左側: テキストコンテンツ */}
              <div className="text-center lg:text-left">
                {/* メインタイトル */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-12 leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    スピーキングアプリの<br />決定版
                  </span>
                </h1>
                
                {/* 特徴リスト */}
                <div className="space-y-4 mb-12">
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      AIが自然なフレーズを生成
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      フレーズが自然に口から出るまで徹底的に音読
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      クイズ機能を使って記憶を定着
                    </span>
                  </div>
                </div>
                
                {/* CTA */}
                <div className="inline-flex items-center px-6 py-3 bg-gray-700 hover:bg-gray-800 rounded-xl border border-gray-300 text-white transition-all duration-300 group cursor-pointer shadow-lg">
                  <div className="w-5 h-5 mr-3 rounded-full bg-white flex items-center justify-center">
                    <svg className="w-3 h-3 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                    </svg>
                  </div>
                  <span className="font-semibold text-base group-hover:text-gray-100 transition-colors duration-300">
                    今すぐはじめる
                  </span>
                </div>
              </div>
              
              {/* 右側: アプリ画像 */}
              <div className="flex items-center justify-center lg:justify-end">
                <div className="relative">
                  <div className="transform hover:scale-105 transition-transform duration-500">
                    <Image
                      src="/images/top/smartphone.png"
                      alt="Solo Speak アプリのデモ画面"
                      width={400}
                      height={500}
                      className="w-80 h-auto md:w-96 drop-shadow-2xl rounded-2xl"
                      priority
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* スクロールインジケーター */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-gray-500">
          <div className="animate-bounce">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
            </svg>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section className="py-32 bg-gray-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              {t('home.features.title')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-800 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-8">
            {/* お悩み 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed">
                  {t('home.features.speechRecognition.title')}
                </p>
              </div>
            </div>

            {/* お悩み 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed">
                  {t('home.features.quiz.title')}
                </p>
              </div>
            </div>

            {/* お悩み 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-3 h-3 bg-gray-600 rounded-full mt-2 flex-shrink-0"></div>
                <p className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed">
                  {t('home.features.progress.title')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section className="py-32 relative overflow-hidden bg-white">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 tracking-tight">
              Solo Speakが選ばれる理由
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-800 mx-auto rounded-full"></div>
          </div>
          
          <div className="max-w-7xl mx-auto space-y-32">
            {/* 特徴 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
              <div className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 text-white rounded-2xl text-2xl font-bold mb-6">
                  01
                </div>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  一人でも続けられる
                  <br />
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    学習システム
                  </span>
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  音声認識技術により、一人でも発音練習ができます。相手を必要とせず、自分のペースで学習を進められます。
                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gray-50 p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20"></div>
                    <svg className="w-24 h-24 text-gray-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 特徴 2 */}
            <div className="flex flex-col lg:flex-row-reverse items-center gap-16 lg:gap-20">
              <div className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-700 to-gray-900 text-white rounded-2xl text-2xl font-bold mb-6">
                  02
                </div>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  効果的な
                  <br />
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    記憶定着システム
                  </span>
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  クイズ形式の学習により、覚えたフレーズを長期記憶に定着させます。繰り返し学習で確実にスキルアップできます。
                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gray-50 p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20"></div>
                    <svg className="w-24 h-24 text-gray-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* 特徴 3 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
              <div className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-500 to-gray-700 text-white rounded-2xl text-2xl font-bold mb-6">
                  03
                </div>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  多言語対応・
                  <br />
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    無料で利用可能
                  </span>
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  複数の言語に対応し、基本機能は完全無料でご利用いただけます。語学学習のハードルを下げ、誰でも気軽に始められます。
                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gray-50 p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full h-48 bg-gradient-to-br from-gray-100 to-gray-200 rounded-2xl flex items-center justify-center relative overflow-hidden">
                    <div className="absolute inset-0 bg-gradient-to-br from-gray-500/20 to-gray-700/20"></div>
                    <svg className="w-24 h-24 text-gray-600 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section className="py-32 relative overflow-hidden bg-gray-100">
        {/* 背景の装飾要素 */}
        <div className="absolute inset-0 opacity-40">
          <div className="absolute top-10 left-10 w-64 h-64 bg-gray-200 rounded-full blur-3xl"></div>
          <div className="absolute bottom-10 right-10 w-80 h-80 bg-gray-300 rounded-full blur-3xl"></div>
        </div>
        
        <div className="container mx-auto px-4 text-center relative z-10">
          <div className="max-w-5xl mx-auto">
            <h2 className="text-4xl md:text-5xl lg:text-6xl font-bold mb-8 text-gray-900 leading-tight tracking-tight">
              今すぐ語学学習を
              <br />
              <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                始めましょう
              </span>
            </h2>
            <p className="text-xl md:text-2xl lg:text-3xl text-gray-700 mb-16 max-w-3xl mx-auto font-medium leading-relaxed">
              Solo Speakで、あなたの語学学習を次のレベルへ
            </p>
            
            <div className="inline-flex items-center px-10 py-5 bg-gray-700 hover:bg-gray-800 rounded-2xl border border-gray-300 text-white transition-all duration-300 group cursor-pointer shadow-lg">
              <div className="w-8 h-8 mr-4 rounded-full bg-white flex items-center justify-center">
                <svg className="w-4 h-4 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                </svg>
              </div>
              <span className="font-bold text-xl group-hover:text-gray-100 transition-colors duration-300">
                今すぐはじめる
              </span>
            </div>
          </div>
        </div>
      </section>
      
      <Footer />
    </div>
  )
}
