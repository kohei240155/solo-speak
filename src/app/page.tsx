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
  const [isDemoActive, setIsDemoActive] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [readingCount, setReadingCount] = useState(0)

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

  // カウントボタンクリック時の処理
  const handleCountClick = () => {
    if (readingCount < 10) {
      setReadingCount(readingCount + 1)
    }
  }
  const handleAISuggestClick = () => {
    if (isDemoActive) return // 既に実行中なら何もしない
    
    setIsDemoActive(true)
    setShowTranslation(false)
    
    // 3秒後にローディング停止、翻訳表示
    setTimeout(() => {
      setIsDemoActive(false)
      setShowTranslation(true)
    }, 3000)
  }

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
      <section className="py-16 md:py-20 lg:py-24 flex items-center justify-center relative overflow-hidden">
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
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    スピーキングアプリの<br />決定版
                  </span>
                </h1>
                
                {/* 特徴リスト */}
                <div className="space-y-4 mb-8">
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      AIが自然なフレーズを生成
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      フレーズが自然に口から出るまで徹底的な音読をサポート
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-center lg:justify-start text-left bg-white/80 backdrop-blur-sm rounded-xl p-4 border border-gray-200 shadow-lg">
                    <div className="w-2 h-2 bg-gradient-to-r from-gray-500 to-gray-700 rounded-full mr-4 flex-shrink-0"></div>
                    <span className="text-lg md:text-xl text-gray-800 font-medium">
                      クイズ機能を使って定着度をチェック
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
      </section>

      {/* 機能紹介セクション */}
      <section className="py-16 bg-gray-50 relative">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
              {t('home.features.title')}
            </h2>
            <div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-800 mx-auto rounded-full"></div>
          </div>
          
                    <div className="max-w-4xl mx-auto space-y-8">
            {/* お悩み 1 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center mt-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed">
                  {t('home.features.speechRecognition.title')}
                </p>
              </div>
            </div>

            {/* お悩み 2 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center mt-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
                <p className="text-lg md:text-xl text-gray-800 font-medium leading-relaxed">
                  {t('home.features.quiz.title')}
                </p>
              </div>
            </div>

            {/* お悩み 3 */}
            <div className="bg-white p-8 rounded-2xl shadow-lg border border-gray-200">
              <div className="flex items-start gap-4">
                <div className="w-6 h-6 bg-gray-700 rounded flex items-center justify-center mt-1 flex-shrink-0">
                  <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd"/>
                  </svg>
                </div>
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
            <div className="inline-block px-10 py-6 bg-gray-700 rounded-2xl mb-6">
              <h2 className="text-3xl md:text-4xl lg:text-5xl font-bold text-white tracking-tight">
                \ これらの悩みをSolo Speakが解決します /
              </h2>
            </div>
          </div>
          
          <div className="max-w-7xl mx-auto space-y-32">
            {/* 特徴 1 */}
            <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-20">
              <div className="lg:w-1/2 space-y-8">
                <div className="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-gray-600 to-gray-800 text-white rounded-2xl text-2xl font-bold mb-6">
                  01
                </div>
                <h3 className="text-3xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                  「言えなかったフレーズ」をAIが即生成
                  <br />
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  言えなかったフレーズを、AIが自然な表現で翻訳します。
                  フレーズはアプリ内で一元管理できるので、アプリやノートに書き残す手間も不要です。
                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gradient-to-br from-gray-50 to-gray-100 p-8 rounded-2xl shadow-2xl border border-gray-200">
                  <div className="w-full max-w-sm mx-auto space-y-3">
                    {/* 入力フィールド */}
                    <div className="relative">
                      <div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-semibold text-lg">なんで日本にきたの？</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-gray-400 rounded-full animate-pulse"></div>
                            <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                      {/* 下向き矢印 */}
                      <div className="flex justify-center mt-4">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                      </div>
                    </div>
                    
                    {/* 生成ボタン */}
                    <div className="flex justify-center py-1">
                      <button 
                        className={`text-white py-3 w-full rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 ${
                          isDemoActive ? 'animate-pulse' : ''
                        }`}
                        style={{ 
                          backgroundColor: '#616161', 
                          boxShadow: isDemoActive ? '0 0 15px rgba(97, 97, 97, 0.4)' : '0 0 8px rgba(97, 97, 97, 0.2)' 
                        }}
                        onMouseEnter={(e) => {
                          if (!isDemoActive) {
                            e.currentTarget.style.backgroundColor = '#525252'
                            e.currentTarget.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.1)'
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (!isDemoActive) {
                            e.currentTarget.style.backgroundColor = '#616161'
                            e.currentTarget.style.boxShadow = '0 0 8px rgba(97, 97, 97, 0.2)'
                          }
                        }}
                        onClick={handleAISuggestClick}
                      >
                        <div className="flex items-center justify-center">
                          {isDemoActive && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          AI Suggest
                        </div>
                      </button>
                    </div>
                    {/* 下向き矢印 */}
                    <div className="flex justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                      </svg>
                    </div>
                    
                    {/* 結果表示 */}
                    <div className={`relative transition-all duration-500 ${showTranslation ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                      <div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-semibold text-lg">What brought you to Japan?</span>
                          <div className="flex items-center space-x-2">
                            <div className="w-3 h-3 bg-green-400 rounded-full animate-pulse"></div>
                            <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                        </div>
                      </div>
                    </div>
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
                  音読回数カウント機能で
                  <br />
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    &ldquo;話せるまで&rdquo;徹底サポート
                  </span>
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  言語は「知った」だけでは話せません。
                  1つのフレーズに対して50回を目安に、口から自然に出てくるまで徹底的に音読します。                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-gray-50 p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full max-w-md mx-auto">
                    {/* フレーズ表示エリア */}
                    <div className="mb-8">
                      <div className="flex items-start space-x-4 mb-6">
                        {/* フレーズテキスト */}
                        <div className="flex-1">
                          <div className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                            How long have you been living in Vancouver?
                          </div>
                          <div className="text-base text-gray-600 leading-relaxed">
                            バンクーバーにはどのぐらい住んでいるの？
                          </div>
                        </div>
                      </div>
                      
                      {/* カウント表示 */}
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        {/* 話している人のアイコン */}
                        <div className="w-4 h-4 mr-2 flex-shrink-0">
                          <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8.228 9c.549-1.165 2.03-2 3.772-2 2.21 0 4 1.343 4 3 0 1.4-1.278 2.575-3.006 2.907-.542.104-.994.54-.994 1.093m0 3h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span className={`${readingCount >= 10 ? 'font-bold text-green-600' : ''}`}>
                          Count: {readingCount}/10
                        </span>
                      </div>
                    </div>

                    {/* カウントボタン */}
                    <div className="flex justify-center">
                      <button
                        onClick={handleCountClick}
                        disabled={readingCount >= 10}
                        className={`flex flex-col items-center focus:outline-none transition-all duration-300 rounded-lg p-6 w-32 ${
                          readingCount >= 10 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-100'
                        }`}
                      >
                        <div className={`w-[60px] h-[40px] bg-white rounded-full flex items-center justify-center mb-2 shadow-md ${
                          readingCount >= 10 ? 'opacity-50' : ''
                        }`}>
                          <svg className={`w-10 h-10 ${
                            readingCount >= 10 ? 'text-gray-400' : 'text-gray-600'
                          }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                          </svg>
                        </div>
                        <span className={`font-medium text-base ${
                          readingCount >= 10 ? 'text-gray-400' : 'text-gray-900'
                        }`}>
                          {readingCount >= 10 ? 'Complete!' : 'Count'}
                        </span>
                      </button>
                    </div>

                    {/* 完了メッセージ */}
                    {readingCount >= 10 && (
                      <div className="mt-6 text-center">
                        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="text-green-700 font-semibold">目標達成！</span>
                          </div>
                          <p className="text-green-600 text-sm">
                            10回の音読が完了しました
                          </p>
                        </div>
                      </div>
                    )}
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
                  クイズ機能で「瞬発力」を
                  <br />
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    チェック
                  </span>
                </h3>
                <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
                  音読で記憶したフレーズが、実際の会話で使えるかどうか。
                  クイズ機能を使って覚えたフレーズを即答することで、記憶→反復→実践のサイクルを完成させます。
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
