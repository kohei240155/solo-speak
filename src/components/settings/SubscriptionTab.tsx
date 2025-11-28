"use client";

import { useState, useEffect } from "react";
import { api } from "@/utils/api";
import { toast } from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/hooks/api";
import { useAuth } from "@/contexts/AuthContext";
import LoadingSpinner from "@/components/common/LoadingSpinner";
import { useTranslation } from "@/hooks/ui/useTranslation";
import BaseModal from "@/components/common/BaseModal";

interface SubscriptionInfo {
	isActive: boolean;
	status?: string;
	currentPeriodEnd?: string;
	productId?: string;
}

interface SubscriptionStatus {
	hasStripeCustomer: boolean;
	subscription: SubscriptionInfo;
	serverTime?: string;
	serverTimezone?: string;
}

export default function SubscriptionTab() {
	const { t } = useTranslation("common");
	const { user } = useAuth();
	const queryClient = useQueryClient();
	const [subscriptionStatus, setSubscriptionStatus] =
		useState<SubscriptionStatus | null>(null);
	const [isLoading, setIsLoading] = useState(true);
	const [isProcessing, setIsProcessing] = useState(false);
	const [showCancelModal, setShowCancelModal] = useState(false);

	// サブスクリプション状態を取得
	useEffect(() => {
		const fetchSubscriptionStatus = async () => {
			try {
				const response = await api.get<SubscriptionStatus>(
					"/api/stripe/subscription",
				);
				setSubscriptionStatus(response);
			} catch {
				toast.error(t("subscription.fetchError"));
			} finally {
				setIsLoading(false);
			}
		};

		fetchSubscriptionStatus();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []); // 依存関係配列を空にして初回のみ実行

	// URLパラメータをチェックして決済成功時の処理
	useEffect(() => {
		const urlParams = new URLSearchParams(window.location.search);
		if (urlParams.get("success") === "true") {
			// React Queryキャッシュを無効化して最新データを取得
			if (user?.id) {
				queryClient.invalidateQueries({
					queryKey: queryKeys.remainingGenerations(user.id),
				});
			}

			// URLパラメータをクリア
			const newUrl =
				window.location.pathname +
				window.location.search.replace(/[?&]success=true/, "");
			window.history.replaceState({}, "", newUrl);
		}
	}, [user?.id, queryClient]);

	// サブスクリプション開始
	const handleSubscribe = async () => {
		setIsProcessing(true);
		try {
			const response = await api.post<{ checkoutUrl: string }>(
				"/api/stripe/checkout",
			);

			if (!response || !response.checkoutUrl) {
				throw new Error("Invalid response from checkout API");
			}

			// Stripeチェックアウトページにリダイレクト
			window.location.href = response.checkoutUrl;
		} catch {
			toast.error(t("subscription.checkoutError"));
			setIsProcessing(false);
		}
	};

	// サブスクリプション退会モーダルを開く
	const handleOpenCancelModal = () => {
		setShowCancelModal(true);
	};

	// サブスクリプション退会実行
	const handleConfirmCancel = async () => {
		setShowCancelModal(false);
		setIsProcessing(true);

		try {
			const response = await api.post<{ success: boolean; message: string }>(
				"/api/stripe/cancel",
			);

			if (response && response.success) {
				toast.success(t("subscription.cancelSuccess"));

				// サブスクリプション状態を再取得
				const statusResponse = await api.get<SubscriptionStatus>(
					"/api/stripe/subscription",
				);
				setSubscriptionStatus(statusResponse);

				// React Queryキャッシュを無効化して生成回数データを更新
				if (user?.id) {
					await queryClient.invalidateQueries({
						queryKey: queryKeys.remainingGenerations(user.id),
					});
				}

				// カスタムイベントを発火してページ全体に通知
				window.dispatchEvent(new CustomEvent("subscriptionCanceled"));
			} else {
				throw new Error("Failed to cancel subscription");
			}
		} catch {
			toast.error(t("subscription.cancelError"));
		} finally {
			setIsProcessing(false);
		}
	};

	if (isLoading) {
		return (
			<div
				className="flex justify-center items-center"
				style={{ height: "400px" }}
			>
				<LoadingSpinner message="Loading..." />
			</div>
		);
	}

	const isSubscribed = subscriptionStatus?.subscription.isActive || false;
	const subscriptionStatus_status = subscriptionStatus?.subscription.status;
	const subscriptionEndDate = subscriptionStatus?.subscription.currentPeriodEnd
		? subscriptionStatus.subscription.currentPeriodEnd
		: null;

	// サブスクリプション状態の表示テキストを決定
	const getStatusDisplayText = () => {
		if (!isSubscribed) {
			return "No Subscribe";
		}

		// 解約済みの場合
		if (subscriptionStatus_status === "canceled") {
			return "Basic Plan (Canceled)";
		}

		return "Basic Plan";
	};

	// 次回請求日の表示用フォーマット（日付とStripeのタイムゾーン）
	const formatNextBillingDate = (date: Date) => {
		const utcDate = new Date(date);

		// UTC時間での日付表示
		const formattedDate = utcDate.toLocaleDateString("en-US", {
			year: "numeric",
			month: "short",
			day: "numeric",
			timeZone: "UTC",
		});

		// StripeのタイムゾーンはUTC
		return `${formattedDate} (UTC)`;
	};

	return (
		<div className="space-y-6">
			{/* Current Status */}
			<div>
				<h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
					{t("subscription.status")}
				</h2>
				<div>
					<input
						type="text"
						value={getStatusDisplayText()}
						readOnly
						tabIndex={-1}
						style={{ pointerEvents: "none" }}
						className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-default"
					/>
				</div>
			</div>

			{/* Next Billing Date - 独立したセクション */}
			{isSubscribed && (
				<div>
					<h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
						{subscriptionStatus_status === "canceled"
							? t("subscription.expiresOn")
							: t("subscription.nextBillingDate")}
					</h2>
					<input
						type="text"
						value={
							subscriptionEndDate
								? formatNextBillingDate(new Date(subscriptionEndDate))
								: "Loading billing date..."
						}
						readOnly
						tabIndex={-1}
						style={{ pointerEvents: "none" }}
						className="w-full px-3 py-2 border border-gray-300 rounded-md bg-gray-50 text-gray-500 cursor-default"
					/>
				</div>
			)}

			{/* Plans */}
			<div>
				<h2 className="text-gray-900 mb-4 text-lg md:text-xl font-bold">
					{t("subscription.plans")}
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

					<div className="space-y-2" style={{ marginBottom: "180px" }}>
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
						disabled={
							isProcessing ||
							(isSubscribed && subscriptionStatus_status === "canceled")
						}
						className="w-full text-white py-2 px-4 rounded-md transition-colors duration-200 disabled:opacity-50"
						style={{ backgroundColor: "#616161" }}
						onMouseEnter={(e) => {
							if (
								!isProcessing &&
								!(isSubscribed && subscriptionStatus_status === "canceled")
							) {
								e.currentTarget.style.backgroundColor = "#525252";
							}
						}}
						onMouseLeave={(e) => {
							if (
								!isProcessing &&
								!(isSubscribed && subscriptionStatus_status === "canceled")
							) {
								e.currentTarget.style.backgroundColor = "#616161";
							}
						}}
					>
						{isProcessing
							? "Processing..."
							: isSubscribed
								? subscriptionStatus_status === "canceled"
									? "Subscription Canceled"
									: "Cancel Subscription"
								: "Get Started"}
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
					<p className="text-gray-700">{t("subscription.cancelConfirm")}</p>

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
	);
}
