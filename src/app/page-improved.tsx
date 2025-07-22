import { Metadata } from 'next'
import { Suspense } from 'react'
import Footer from '@/components/Footer'
import AuthCheck from '@/components/AuthCheck'
import LoadingSpinner from '@/components/LoadingSpinner'

export const metadata: Metadata = {
  title: 'Solo Speak - Language Learning Application',
  description: '音声認識技術を活用して、一人でも楽しく効果的に語学学習ができるWebアプリケーション',
  keywords: ['語学学習', 'フレーズ暗記', '音声認識', 'language learning'],
}

// 静的コンテンツを Server Component として分離
function HeroSection() {
  return (
    <section 
      id="hero" 
      className="py-20 md:py-32 bg-white"
    >
      <div className="container mx-auto px-4 text-center">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 leading-tight">
            あなたの
            <span className="text-blue-600">フレーズ暗記</span>
            を<br />
            サポートします
          </h1>
          <p className="text-xl md:text-2xl text-gray-600 mb-8 max-w-3xl mx-auto">
            音声認識技術を活用して、一人でも楽しく効果的に語学学習ができるWebアプリケーション
          </p>
          <div className="text-center mb-12">
            <div className="inline-flex items-center px-4 py-2 bg-blue-50 rounded-full border border-blue-200">
              <svg className="w-5 h-5 text-blue-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd"/>
              </svg>
              <p className="text-blue-700 font-medium">
                始めるには、右上のログインボタンをクリック
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}

function FeaturesSection() {
  return (
    <section 
      id="features" 
      className="py-20 bg-gray-50"
    >
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl font-bold text-gray-900 mb-4">
            主な機能
          </h2>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Solo Speakが提供する豊富な学習機能で、効果的な語学学習を実現しましょう
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8 mb-16">
          {/* フレーズ管理 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">フレーズ管理</h3>
            <p className="text-gray-600">
              学習したいフレーズを簡単に登録・管理。カテゴリ別の整理も可能
            </p>
          </div>

          {/* 音声認識練習 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">音声認識練習</h3>
            <p className="text-gray-600">
              高精度な音声認識技術で発音をチェック。正確な発音を身につけよう
            </p>
          </div>

          {/* クイズ学習 */}
          <div className="text-center">
            <div className="w-16 h-16 bg-blue-600 rounded-lg flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
              </svg>
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">クイズ学習</h3>
            <p className="text-gray-600">
              ゲーム感覚で楽しく学習。記憶の定着を促進するクイズ機能
            </p>
          </div>
        </div>
      </div>
    </section>
  )
}

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-50">
      <HeroSection />
      <FeaturesSection />
      
      {/* 認証状態が必要な部分のみクライアントサイド */}
      <Suspense fallback={<LoadingSpinner message="Loading..." />}>
        <AuthCheck />
      </Suspense>
      
      <Footer />
    </div>
  )
}
