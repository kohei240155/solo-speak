'use client'

import { useState, useEffect } from 'react'
import { api } from '@/utils/api'
import { toast } from 'react-hot-toast'
import { mutate } from 'swr'
import LoadingSpinner from '@/components/common/LoadingSpinner'
import { useTranslation } from '@/hooks/ui/useTranslation'
import BaseModal from '@/components/common/BaseModal'

interface SubscriptionInfo {
  isActive: boolean
  status?: string
  currentPeriodEnd?: string
  productId?: string
}

interface SubscriptionStatus {
  hasStripeCustomer: boolean
  subscription: SubscriptionInfo
  serverTime?: string
  serverTimezone?: string
}

export default function SubscriptionTab() {
  const { t } = useTranslation('common')
  const [subscriptionStatus, setSubscriptionStatus] = useState<SubscriptionStatus | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [isProcessing, setIsProcessing] = useState(false)
  const [showCancelModal, setShowCancelModal] = useState(false)

  // サブスクリプション状態を取得
  useEffect(() => {
    const fetchSubscriptionStatus = async () => {
      try {
        const response = await api.get<SubscriptionStatus>('/api/stripe/subscription')
        setSubscriptionStatus(response)
      } catch (error) {
        console.error('Error fetching subscription status:', error)
        toast.error(t('subscription.fetchError'))
      } finally {
        setIsLoading(false)
      }
    }

    fetchSubscriptionStatus()
  }, [t])

  // サブスクリプション開始
  const handleSubscribe = async () => {
    setIsProcessing(true)
    try {
      const response = await api.post<{ checkoutUrl: string }>('/api/stripe/checkout')
      
      if (!response || !response.checkoutUrl) {
        throw new Error('Invalid response from checkout API')
      }
      
      // Stripeチェックアウトページにリダイレクト
      window.location.href = response.checkoutUrl
    } catch (error) {
      console.error('Error creating checkout session:', error)
      toast.error(t('subscription.checkoutError'))
      setIsProcessing(false)
    }
  }

  // サブスクリプション退会モーダルを開く
  const handleOpenCancelModal = () => {
    setShowCancelModal(true)
  }

  // サブスクリプション退会実行
  const handleConfirmCancel = async () => {
    setShowCancelModal(false)
    setIsProcessing(true)
    
    try {
      const response = await api.post<{ success: boolean; message: string }>('/api/stripe/cancel')
      
      if (response && response.success) {
        toast.success(t('subscription.cancelSuccess'))
        
        // サブスクリプション状態を再取得
        const statusResponse = await api.get<SubscriptionStatus>('/api/stripe/subscription')
        setSubscriptionStatus(statusResponse)
        
        // SWRキャッシュをクリアして生成回数データを更新
        await mutate('/api/user/phrase-generations')
        
        // カスタムイベントを発火してページ全体に通知
        window.dispatchEvent(new CustomEvent('subscriptionCanceled'))
        
      } else {
        throw new Error('Failed to cancel subscription')
      }
    } catch (error) {
      console.error('Error canceling subscription:', error)
      toast.error(t('subscription.cancelError'))
    } finally {
      setIsProcessing(false)
    }
  }

  if (isLoading) {
    return (
      <div className="flex justify-center items-center" style={{ height: '400px' }}>
        <LoadingSpinner message="Loading subscription information..." />
      </div>
    )
  }

  const isSubscribed = subscriptionStatus?.subscription.isActive || false
  const subscriptionEndDate = subscriptionStatus?.subscription.currentPeriodEnd 
    ? subscriptionStatus.subscription.currentPeriodEnd
    : null

  // 次回請求日の表示用フォーマット（日付のみ）
  const formatNextBillingDate = (date: Date) => {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    })
  }

  // デバッグログを追加
  console.log('SubscriptionTab render data:', {
    subscriptionStatus,
    isSubscribed,
    subscriptionEndDate,
    hasCurrentPeriodEnd: !!subscriptionStatus?.subscription.currentPeriodEnd,
    rawCurrentPeriodEnd: subscriptionStatus?.subscription.currentPeriodEnd,
    parsedDate: subscriptionEndDate ? new Date(subscriptionEndDate) : null,
    formattedDate: subscriptionEndDate ? formatNextBillingDate(new Date(subscriptionEndDate)) : null
  })

  return (
    <div className="space-y-6">
      {/* Current Status */}
      <div>
        <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
          Current Status
        </h2>
        <div>
          <input
            type="text"
            value={isSubscribed ? `Basic Plan` : "No Subscribe"}
            readOnly
            tabIndex={-1}
            style={{ pointerEvents: 'none' }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-default"
          />
        </div>
      </div>

      {/* Next Billing Date - 独立したセクション */}
      {isSubscribed && subscriptionEndDate && (
        <div>
          <h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
            Next Billing Date
          </h2>
          <input
            type="text"
            value={formatNextBillingDate(new Date(subscriptionEndDate))}
            readOnly
            tabIndex={-1}
            style={{ pointerEvents: 'none' }}
            className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-default"
          />
        </div>
      )}

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
            onClick={isSubscribed ? handleOpenCancelModal : handleSubscribe}
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
              ? 'Processing...' 
              : isSubscribed 
                ? 'Cancel Subscription' 
                : 'Get Started'
            }
          </button>
        </div>
      </div>

      {/* Cancel Subscription Confirmation Modal */}
      <BaseModal
        isOpen={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        title="Cancel Subscription"
      >
        <div className="space-y-4">
          <p className="text-gray-700">
            {t('subscription.cancelConfirm')}
          </p>
          
          <div className="flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => setShowCancelModal(false)}
              className="px-4 py-2 text-gray-600 bg-gray-100 rounded-md hover:bg-gray-200 transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmCancel}
              className="px-4 py-2 text-white bg-red-600 rounded-md hover:bg-red-700 transition-colors"
            >
              Confirm Cancellation
            </button>
          </div>
        </div>
      </BaseModal>
    </div>
  )
}
