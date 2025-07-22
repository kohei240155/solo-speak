import { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'About - Solo Speak',
  description: 'Solo Speakは、一人でも楽しく効果的に語学学習ができるWebアプリケーションです。音声認識技術を活用した発音練習からクイズまで、様々な学習方法をご提供しています。',
  keywords: ['Solo Speak', 'について', '語学学習', 'アプリ概要'],
}

export default function AboutPage() {
  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-6">Solo Speakについて</h1>
      
      <div className="prose prose-lg max-w-none">
        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">Solo Speakとは</h2>
          <p className="text-gray-600 mb-4">
            Solo Speakは、一人でも楽しく効果的に語学学習ができるWebアプリケーションです。
            音声認識技術を活用して、発音練習からクイズまで、様々な学習方法をご提供しています。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">主な機能</h2>
          <ul className="list-disc list-inside text-gray-600 space-y-2">
            <li>フレーズの登録・管理</li>
            <li>音声認識による発音練習</li>
            <li>クイズ形式での学習</li>
            <li>学習進捗の記録・管理</li>
            <li>多言語対応</li>
          </ul>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">開発の目的</h2>
          <p className="text-gray-600 mb-4">
            語学学習において「話す」練習は非常に重要ですが、一人では練習しにくいという課題があります。
            Solo Speakは、この課題を解決し、誰でも気軽に発音練習ができる環境を提供することを目的として開発されました。
          </p>
        </section>

        <section className="mb-8">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">技術仕様</h2>
          <div className="bg-gray-50 p-6 rounded-lg">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">使用技術</h3>
            <ul className="list-disc list-inside text-gray-600 space-y-1">
              <li>Next.js 15 (App Router)</li>
              <li>TypeScript</li>
              <li>Supabase (認証・データベース)</li>
              <li>Prisma (ORM)</li>
              <li>Tailwind CSS</li>
              <li>Web Speech API</li>
            </ul>
          </div>
        </section>
      </div>
    </div>
  )
}
