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

  // サブスクリプション退会
  const handleCancelSubscription = async () => {
    if (!confirm('サブスクリプションを退会しますか？現在の請求期間の終了時に自動的にキャンセルされます。')) {
      return
    }

    setIsProcessing(true)
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/stripe/cancel')
      console.log('Cancel response:', response)
      
      if (response && response.success) {
        toast.success(response.message || 'サブスクリプションのキャンセルが完了しました')
        // サブスクリプション状態を再取得
        const statusResponse = await api.get<SubscriptionStatus>('/api/stripe/subscription')
        setSubscriptionStatus(statusResponse)
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error('サブスクリプションのキャンセルに失敗しました')
    } finally {
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
              onClick={handleCancelSubscription}
              disabled={isProcessing}
              className="px-6 py-2 text-white rounded-md transition-colors duration-200 disabled:opacity-50"
              style={{ backgroundColor: '#dc2626' }}
              onMouseEnter={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = '#b91c1c'
                }
              }}
              onMouseLeave={(e) => {
                if (!isProcessing) {
                  e.currentTarget.style.backgroundColor = '#dc2626'
                }
              }}
            >
              {isProcessing ? '処理中...' : '退会する'}
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
            onClick={isSubscribed ? handleCancelSubscription : handleSubscribe}
            disabled={isProcessing}
            className="w-full text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
            style={{ backgroundColor: isSubscribed ? '#dc2626' : '#616161' }}
            onMouseEnter={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = isSubscribed ? '#b91c1c' : '#525252'
              }
            }}
            onMouseLeave={(e) => {
              if (!isProcessing) {
                e.currentTarget.style.backgroundColor = isSubscribed ? '#dc2626' : '#616161'
              }
            }}
          >
            {isProcessing 
              ? '処理中...' 
              : isSubscribed 
                ? '退会する' 
                : 'Get Started'
            }
          </button>
        </div>
      </div>
    </div>
  )
}
