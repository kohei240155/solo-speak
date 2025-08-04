'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { toast } from 'react-hot-toast'

interface SubscriptionInfo {
  isActive: boolean
  status?: string
  currentPeriodEnd?: string
  productId?: string
}

interface SubscriptionStatus {
  hasStripeCustomer: boolean
  subscription: SubscriptionInfo
}

export default function SubscriptionTab() {
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)

  // サブスクリプション状態を取得
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await api.get<SubscriptionStatus>('/api/stripe/subscription')
        console.log('Subscription status response:', response)
        setSubscriptionStatus(response)
      } catch (error) {
        console.error('Error fetching subscription status:', error)
        toast.error('サブスクリプション状態の取得に失敗しました')
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [])

  // サブスクリプション開始
  const handleSubscribe = async () => {
    setIsProcessing(true)
    try {
      const response = await api.post<{ checkoutUrl: string }>('/api/stripe/checkout')
      console.log('Checkout response:', response)
      
      if (!response || !response.checkoutUrl) {
        throw new Error('Invalid response from checkout API')
      }
      
      // Stripeチェックアウトページにリダイレクト
      window.location.href = response.checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error('チェックアウトセッションの作成に失敗しました')
      setIsProcessing(false)
    }
  }

  // サブスクリプション管理（キャンセルなど）
  const handleManageSubscription = async () => {
    setIsProcessing(true)
    try {
      const response = await api.post<{ portalUrl: string }>('/api/stripe/portal')
      console.log('Portal response:', response)
      
      if (!response || !response.portalUrl) {
        throw new Error('Invalid response from portal API')
      }
      
      // Stripeカスタマーポータルにリダイレクト
      window.location.href = response.portalUrl
    } catch (error) {
      console.error('Error creating customer portal session:', error)
      toast.error('カスタマーポータルの作成に失敗しました')
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
        </div>
      </div>
    )
  }

  const isSubscribed = subscriptionStatus?.subscription.isActive || false
  const subscriptionEndDate = subscriptionStatus?.subscription.currentPeriodEnd 
    ? new Date(subscriptionStatus.subscription.currentPeriodEnd).toLocaleDateString('ja-JP')
    : null

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div>
        <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
          Current Status
        </h2>
        <div className="flex space-x-4">
          <div className="flex-1">
            <input
              type="text"
              value={isSubscribed ? `Basic Plan${subscriptionEndDate ? ` (次回更新: ${subscriptionEndDate})` : ''}` : "No Subscribe"}
              readOnly
              className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500"
            />
          </div>
          {isSubscribed && (
            <button
              type="button"
              onClick={handleManageSubscription}
              disabled={isProcessing}
              className="px-6 py-2 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#616161' }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = '#525252'
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = '#616161'
                }
              }}
            >
              {isProcessing ? '処理中...' : 'Manage'}
            </button>
          )}
        </div>
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
          Plans
        </h2>
        <div className="border border-gray-300 rounded-lg p-6">
          <h3 className="text-gray-900 mb-2 text-xl md:text-2xl font-bold">
            Basic
          </h3>
          <div className="mb-4">
            <p className="text-gray-700 text-sm md:text-base font-bold">
              JP ¥ 500 / Month
            </p>
            <hr className="mt-2 border-gray-300" />
          </div>
          
          <div className="space-y-2" style={{ marginBottom: '180px' }}>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                1日5回までAIがフレーズを生成
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                音読回数をカウントする機能の提供
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-700">•</span>
              <span className="text-gray-700 text-xs md:text-sm">
                フレーズの暗記を助けるクイズ機能の提供
              </span>
            </div>
          </div>

          <button
            type="button"
            onClick={isSubscribed ? handleManageSubscription : handleSubscribe}
            disabled={isProcessing}
            className="w-full text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: '#616161' }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#525252'
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = '#616161'
              }
            }}
          >
            {isProcessing 
              ? '処理中...' 
              : isSubscribed 
                ? 'Manage Subscription' 
                : 'Get Started'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
