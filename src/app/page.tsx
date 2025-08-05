'use client'

import { useRedirect } from '@/hooks/navigation/useRedirect'
import { useTranslation } from '@/hooks/ui/useTranslation'
import Footer from '@/components/layout/Footer'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useState, useEffect } from 'react'
import Image from 'next/image'
import { RiSpeakLine } from 'react-icons/ri'
import { HiMiniSpeakerWave } from 'react-icons/hi2'
import { PiHandTapLight } from 'react-icons/pi'
import { useTextToSpeech } from '@/hooks/ui/useTextToSpeech'

export default function Home() {
  const { loading } = useRedirect()
  const { t, isLoading: isLoadingTranslation } = useTranslation('common')
  const [showSplash, setShowSplash] = useState(true)
  const [fadeOut, setFadeOut] = useState(false)
  const [showContent, setShowContent] = useState(false)
  const [isDemoActive, setIsDemoActive] = useState(false)
  const [showTranslation, setShowTranslation] = useState(false)
  const [readingCount, setReadingCount] = useState(0)
  const [countCooldown, setCountCooldown] = useState(0)
  const [showQuizTranslation, setShowQuizTranslation] = useState(false)
  
  // TTS機能の初期化
  const { isPlaying, error: ttsError, playText } = useTextToSpeech({
    languageCode: 'en'
  })

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

  // カウントダウンの管理
  useEffect(() => {
    let timer: NodeJS.Timeout
    if (countCooldown > 0) {
      timer = setTimeout(() => {
        setCountCooldown(countCooldown - 1)
      }, 1000)
    }
    return () => clearTimeout(timer)
  }, [countCooldown])

  // カウントボタンクリック時の処理
    const handleCountClick = () => {
    if (countCooldown > 0) return;
    
    if (readingCount < 10) {
      setReadingCount(prev => prev + 1)
      setCountCooldown(1000)
      setTimeout(() => setCountCooldown(0), 1000)
    }
  }

  const handleSoundClick = async () => {
    try {
      await playText("How long have you been living in Japan?")
    } catch (error) {
      console.error('TTS playback failed:', error)
    }
  }

  const handleQuizHandClick = () => {
    setShowQuizTranslation(true)
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
          <div className="max-w-6xl mx-auto">
            <div className="grid lg:grid-cols-[2fr_1fr] gap-6 lg:gap-8 items-start">
              {/* 左側: テキストコンテンツ */}
              <div className="text-center lg:text-left max-w-4xl mx-auto lg:mx-0">
                {/* メインタイトル */}
                <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold text-gray-900 mb-8 leading-tight tracking-tight">
                  <span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
                    スピーキングアプリの<br />決定版
                  </span>
                </h1>
                
                {/* 特徴リスト */}
                <div className="bg-white backdrop-blur-sm rounded-xl p-6 border border-gray-200 shadow-lg mb-8 max-w-md mx-auto lg:mx-0">
                  <div className="space-y-4">
                    <div className="flex items-center justify-center lg:justify-start text-left">
                      <svg className="w-5 h-5 text-gray-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-lg md:text-xl text-gray-800 font-medium">
                        AIが自然なフレーズを生成
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start text-left">
                      <svg className="w-5 h-5 text-gray-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-lg md:text-xl text-gray-800 font-medium">
                        徹底的な音読学習をサポート
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-center lg:justify-start text-left">
                      <svg className="w-5 h-5 text-gray-600 mr-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      <span className="text-lg md:text-xl text-gray-800 font-medium">
                        クイズ機能を使って瞬発力をチェック
                      </span>
                    </div>
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
                      width={450}
                      height={550}
                      className="w-96 h-auto md:w-[28rem] drop-shadow-2xl rounded-2xl"
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
                <div className="bg-gradient-to-br from-white to-gray-50 p-8 rounded-2xl shadow-2xl border border-gray-200">
                  <div className="w-full max-w-lg mx-auto space-y-3">
                    {/* 入力フィールド */}
                    <div className="relative">
                      <div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-semibold text-lg">日本にはどのぐらい住んでいるの？</span>
                          <div className="flex items-center space-x-2">
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
                          isDemoActive ? 'animate-pulse cursor-not-allowed opacity-75' : ''
                        }`}
                        style={{ 
                          backgroundColor: isDemoActive ? '#9ca3af' : '#616161', 
                          boxShadow: isDemoActive ? '0 0 8px rgba(156, 163, 175, 0.2)' : '0 0 8px rgba(97, 97, 97, 0.2)' 
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
                        disabled={isDemoActive || showTranslation}
                      >
                        <div className="flex items-center justify-center">
                          {isDemoActive && (
                            <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                          )}
                          AI Suggest
                        </div>
                      </button>
                    </div>
                    {/* 下向き矢印 - 翻訳表示完了時に表示 */}
                    {showTranslation && (
                      <div className="flex justify-center">
                        <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                      </div>
                    )}
                    
                    {/* 結果表示 */}
                    <div className={`relative transition-all duration-500 ${showTranslation ? 'opacity-100 transform translate-y-0' : 'opacity-0 transform translate-y-4'}`}>
                      <div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                        <div className="flex items-center justify-between">
                          <span className="text-gray-900 font-semibold text-lg">How long have you been living in Japan?</span>
                          <div className="flex items-center space-x-2">
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
                  1つのフレーズに対して1日10回、合計50回を目安に口から自然に出てくるまで徹底的に音読します。                </p>
              </div>
              <div className="lg:w-1/2">
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full max-w-md mx-auto">
                    {/* フレーズ表示エリア */}
                    <div className="mb-8">
                      <div className="flex items-start space-x-4 mb-6">
                        {/* フレーズテキスト */}
                        <div className="flex-1">
                          <div className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                            How long have you been living in Japan?
                          </div>
                          <div className="text-base text-gray-600 leading-relaxed">
                            日本にはどのぐらい住んでいるの？
                          </div>
                        </div>
                      </div>
                      
                      {/* カウント表示 */}
                      <div className="flex items-center text-sm text-gray-600 mb-4">
                        <RiSpeakLine className="w-4 h-4 mr-1 flex-shrink-0" />
                        <span className={`break-words ${readingCount >= 10 ? 'font-bold' : ''}`}>Today: {readingCount}</span>
                        <span className={`break-words ml-4 ${(readingCount + 40) >= 50 ? 'font-bold' : ''}`}>Total: {readingCount + 40}</span>
                      </div>
                    </div>

                    {/* カウントボタン */}
                    <div className="flex justify-center">
                      {readingCount >= 10 ? (
                        <div className="bg-green-50 border border-green-200 rounded-lg p-6 w-full max-w-xs">
                          <div className="flex items-center justify-center mb-2">
                            <svg className="w-6 h-6 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                            <span className="text-green-700 font-semibold">目標達成！</span>
                          </div>
                          <p className="text-green-600 text-sm text-center">
                            10回の音読が完了しました
                          </p>
                        </div>
                      ) : (
                        <div className="flex items-center gap-0">
                          <button
                            onClick={handleCountClick}
                            disabled={countCooldown > 0}
                            className={`flex flex-col items-center outline-none transition-all duration-300 p-8 w-56 ${
                              countCooldown > 0 ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
                            }`}
                          >
                            <div className={`w-[60px] h-[40px] bg-transparent rounded-full flex items-center justify-center mb-2 ${
                              countCooldown > 0 ? 'opacity-50' : ''
                            }`}>
                              <svg className={`w-10 h-10 ${
                                countCooldown > 0 ? 'text-gray-400' : 'text-gray-600'
                              }`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <span className={`font-medium text-base ${
                              countCooldown > 0 ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {countCooldown > 0 ? 'Wait...' : 'Count'}
                            </span>
                          </button>
                          <div className="w-px h-[152px] bg-gray-300"></div>
                          <button
                            onClick={handleSoundClick}
                            disabled={isPlaying}
                            className={`flex flex-col items-center outline-none transition-all duration-300 p-8 w-56 ${
                              isPlaying ? 'cursor-not-allowed opacity-50' : 'cursor-pointer hover:bg-gray-50'
                            }`}
                          >
                            <div className="w-[60px] h-[40px] bg-transparent rounded-full flex items-center justify-center mb-2">
                              <HiMiniSpeakerWave className={`w-10 h-10 ${
                                isPlaying ? 'text-gray-400' : 'text-gray-600'
                              }`} />
                            </div>
                            <span className={`font-medium text-base ${
                              isPlaying ? 'text-gray-400' : 'text-gray-900'
                            }`}>
                              {isPlaying ? 'Playing...' : 'Sound'}
                            </span>
                          </button>
                        </div>
                      )}
                    </div>
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
                <div className="bg-white p-12 rounded-3xl shadow-xl border border-gray-200">
                  <div className="w-full max-w-md mx-auto">
                    {/* フレーズ表示エリア */}
                    <div className="mb-8">
                      {/* 母国語の翻訳（メイン表示） */}
                      <div className="mb-6">
                        <div className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                          日本にはどのぐらい住んでいるの？
                        </div>
                      </div>
                      
                      {/* 学習言語のフレーズ - タップで表示 */}
                      <div className="min-h-[4rem] flex items-start mb-6">
                        <div className={`text-base md:text-xl text-gray-600 break-words w-full leading-relaxed font-medium transition-all duration-1000 ease-out ${
                          showQuizTranslation 
                            ? 'opacity-100 transform translate-y-0' 
                            : 'opacity-0 transform translate-y-4'
                        }`}>
                          {showQuizTranslation ? 'How long have you been living in Japan?' : ''}
                        </div>
                      </div>
                    </div>

                    {/* 中央のアイコン表示エリア */}
                    <div className="flex justify-center items-center">
                      <div 
                        className="cursor-pointer rounded-full p-4 transition-colors hover:bg-gray-100"
                        onClick={handleQuizHandClick}
                      >
                        <PiHandTapLight className="w-12 h-12 text-gray-400" />
                      </div>
                    </div>
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
