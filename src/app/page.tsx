'use client'

import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useRef, useState } from 'react'

export default function Home() {
  const { loading } = useAuth()
  const [visibleSections, setVisibleSections] = useState<Set<string>>(new Set())
  const sectionRefs = useRef<{ [key: string]: HTMLElement | null }>({})

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisibleSections(prev => new Set([...prev, entry.target.id]))
          }
        })
      },
      { threshold: 0.1 }
    )

    Object.values(sectionRefs.current).forEach(ref => {
      if (ref) observer.observe(ref)
    })

    return () => observer.disconnect()
  }, [])

  const setRef = (id: string) => (el: HTMLElement | null) => {
    sectionRefs.current[id] = el
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: '#F5F5F5' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-2 text-gray-600">読み込み中...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#F5F5F5' }}>
      {/* ヒーローセクション */}
      <section 
        id="hero" 
        ref={setRef('hero')}
        className={`py-20 md:py-32 transition-all duration-1000 ${
          visibleSections.has('hero') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
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
              <p className="text-lg text-gray-500 mb-6">
                始めるには、右上のログインボタンをクリックしてください
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 機能紹介セクション */}
      <section 
        id="features" 
        ref={setRef('features')}
        className={`py-20 bg-white transition-all duration-1000 delay-200 ${
          visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              こんなことができるようになります
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8 max-w-6xl mx-auto">
            <div className={`bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-700 delay-300 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                音声認識による発音練習
              </h3>
              <p className="text-gray-600 text-center">
                最新の音声認識技術を使って、正確な発音を身につけることができます。
              </p>
            </div>

            <div className={`bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-700 delay-500 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                クイズ形式での学習
              </h3>
              <p className="text-gray-600 text-center">
                楽しいクイズ形式で、覚えたフレーズを定着させることができます。
              </p>
            </div>

            <div className={`bg-gray-50 p-8 rounded-lg shadow-md transition-all duration-700 delay-700 ${
              visibleSections.has('features') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
            }`}>
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-6 mx-auto">
                <svg className="w-8 h-8 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-4 text-center">
                学習進捗の記録・管理
              </h3>
              <p className="text-gray-600 text-center">
                あなたの学習状況を可視化し、継続的な学習をサポートします。
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* 特徴セクション */}
      <section 
        id="benefits" 
        ref={setRef('benefits')}
        className={`py-20 transition-all duration-1000 delay-300 ${
          visibleSections.has('benefits') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
        style={{ backgroundColor: '#F5F5F5' }}
      >
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-6">
              Solo Speakが選ばれる理由
            </h2>
          </div>
          
          <div className="max-w-4xl mx-auto space-y-12">
            <div className={`flex flex-col md:flex-row items-center gap-8 transition-all duration-700 delay-400 ${
              visibleSections.has('benefits') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="md:w-1/2">
                <div className="w-12 h-12 bg-blue-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  01
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  一人でも続けられる学習システム
                </h3>
                <p className="text-gray-600">
                  音声認識技術により、一人でも発音練習ができます。相手を必要とせず、自分のペースで学習を進められます。
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="w-full h-32 bg-blue-100 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex flex-col md:flex-row-reverse items-center gap-8 transition-all duration-700 delay-600 ${
              visibleSections.has('benefits') ? 'opacity-100 translate-x-0' : 'opacity-0 translate-x-10'
            }`}>
              <div className="md:w-1/2">
                <div className="w-12 h-12 bg-green-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  02
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  効果的な記憶定着システム
                </h3>
                <p className="text-gray-600">
                  クイズ形式の学習により、覚えたフレーズを長期記憶に定着させます。繰り返し学習で確実にスキルアップできます。
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="w-full h-32 bg-green-100 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            <div className={`flex flex-col md:flex-row items-center gap-8 transition-all duration-700 delay-800 ${
              visibleSections.has('benefits') ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-10'
            }`}>
              <div className="md:w-1/2">
                <div className="w-12 h-12 bg-purple-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4">
                  03
                </div>
                <h3 className="text-2xl font-semibold text-gray-900 mb-4">
                  多言語対応・無料で利用可能
                </h3>
                <p className="text-gray-600">
                  複数の言語に対応し、基本機能は完全無料でご利用いただけます。語学学習のハードルを下げ、誰でも気軽に始められます。
                </p>
              </div>
              <div className="md:w-1/2">
                <div className="bg-white p-6 rounded-lg shadow-md">
                  <div className="w-full h-32 bg-purple-100 rounded-lg flex items-center justify-center">
                    <svg className="w-16 h-16 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA セクション */}
      <section 
        id="cta" 
        ref={setRef('cta')}
        className={`py-20 bg-gray-900 text-white transition-all duration-1000 delay-500 ${
          visibleSections.has('cta') ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'
        }`}
      >
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-3xl md:text-4xl font-bold mb-6">
            今すぐ語学学習を始めましょう
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Solo Speakで、あなたの語学学習を次のレベルへ
          </p>
          <div className="text-center">
            <p className="text-gray-300 mb-4">
              右上のログインボタンをクリックして始める
            </p>
          </div>
        </div>
      </section>
    </div>
  )
}
