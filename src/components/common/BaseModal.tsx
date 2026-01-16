"use client";

import Modal from "react-modal";
import { ReactNode, useEffect, useRef, useState } from "react";
import { MdClose } from "react-icons/md";

// React Modalのアプリルート要素を設定
if (typeof window !== "undefined") {
	Modal.setAppElement("body");
}

// モーダルの開数を管理するカウンター
let modalCounter = 0;
let originalBodyStyle: { overflow: string; paddingRight: string } | null = null;

export interface BaseModalProps {
	isOpen: boolean;
	onClose: () => void;
	children: ReactNode;
	title?: string;
	titleIcon?: React.ReactNode;
	width?: string;
	showCloseButton?: boolean;
	closeOnOverlayClick?: boolean;
	variant?: "white" | "gray";
	titleButton?: {
		icon: React.ComponentType<{ className?: string }>;
		onClick: () => void;
	};
}

export default function BaseModal({
	isOpen,
	onClose,
	children,
	title,
	titleIcon,
	width = "500px",
	showCloseButton = true,
	closeOnOverlayClick = true,
	variant = "white",
	titleButton,
}: BaseModalProps) {
	const prevIsOpenRef = useRef(false);
	const [isAnimated, setIsAnimated] = useState(false);

	// アニメーション制御
	useEffect(() => {
		if (isOpen) {
			// モーダルが開いた後、少し遅れてアニメーションを開始
			const timer = setTimeout(() => setIsAnimated(true), 10);
			return () => clearTimeout(timer);
		} else {
			setIsAnimated(false);
		}
	}, [isOpen]);

	// Escキーでモーダルを閉じる
	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && isOpen) {
				onClose();
			}
		};

		document.addEventListener("keydown", handleEscape);
		return () => document.removeEventListener("keydown", handleEscape);
	}, [isOpen, onClose]);

	// モーダル表示時に背景のスクロールを無効化（複数モーダル対応）
	useEffect(() => {
		const prevIsOpen = prevIsOpenRef.current;

		if (isOpen && !prevIsOpen) {
			// モーダルが開いた
			modalCounter++;

			if (modalCounter === 1) {
				// 最初のモーダルが開いたときのみ背景スクロールを無効化
				const scrollBarWidth =
					window.innerWidth - document.documentElement.clientWidth;
				originalBodyStyle = {
					overflow: document.body.style.overflow,
					paddingRight: document.body.style.paddingRight,
				};
				document.body.style.overflow = "hidden";
				document.body.style.paddingRight = `${scrollBarWidth}px`;
			}
		} else if (!isOpen && prevIsOpen) {
			// モーダルが閉じた
			modalCounter = Math.max(0, modalCounter - 1);

			if (modalCounter === 0 && originalBodyStyle) {
				// 最後のモーダルが閉じたときのみ背景スクロールを復元
				document.body.style.overflow = originalBodyStyle.overflow;
				document.body.style.paddingRight = originalBodyStyle.paddingRight;
				originalBodyStyle = null;
			}
		}

		prevIsOpenRef.current = isOpen;

		// クリーンアップ関数
		return () => {
			if (isOpen) {
				modalCounter = Math.max(0, modalCounter - 1);
				if (modalCounter === 0 && originalBodyStyle) {
					document.body.style.overflow = originalBodyStyle.overflow;
					document.body.style.paddingRight = originalBodyStyle.paddingRight;
					originalBodyStyle = null;
				}
			}
		};
	}, [isOpen]);

	const customStyles = {
		overlay: {
			backgroundColor: "rgba(97, 97, 97, 0.5)",
			zIndex: 50,
			display: "flex",
			alignItems: "center",
			justifyContent: "center",
			padding: "1rem",
			position: "fixed" as const,
			top: 0,
			left: 0,
			right: 0,
			bottom: 0,
			overflow: "hidden",
			opacity: isAnimated ? 1 : 0,
			transition: "opacity 300ms ease-out",
		},
		content: {
			position: "relative" as const,
			top: "auto",
			left: "auto",
			right: "auto",
			bottom: "auto",
			border: "none",
			borderRadius: "1.5rem",
			boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
			padding: 0,
			margin: 0,
			maxHeight: "90vh",
			overflow: "auto",
			backgroundColor: variant === "gray" ? "#f3f4f6" : "white",
			transform: isAnimated ? "translateY(0)" : "translateY(80px)",
			opacity: isAnimated ? 1 : 0,
			transition: "transform 400ms cubic-bezier(0.32, 0.72, 0, 1), opacity 300ms ease-out",
		},
	};

	return (
		<Modal
			isOpen={isOpen}
			onRequestClose={closeOnOverlayClick ? onClose : undefined}
			style={customStyles}
			contentLabel={title || "Modal"}
			shouldCloseOnEsc={true}
			shouldCloseOnOverlayClick={closeOnOverlayClick}
		>
			<div
				className={`relative rounded-3xl w-[90vw] sm:w-auto ${variant === "gray" ? "bg-gray-100" : "bg-white"}`}
				style={{
					maxWidth: `min(90vw, ${width})`,
					width: `min(90vw, ${width})`,
					overflowX: "hidden",
				}}
			>
				{/* 閉じるボタン */}
				{showCloseButton && (
					<button
						onClick={onClose}
						className="absolute top-4 right-4 z-10 text-gray-400 hover:text-gray-600 transition-colors"
					>
						<MdClose className="w-6 h-6" />
					</button>
				)}

				{/* タイトル付きの場合のヘッダー */}
				{title && (
					<div className="p-6 pb-0">
						<div className="flex items-center pr-8">
							{titleIcon && (
								<span className="mr-2 flex items-center">{titleIcon}</span>
							)}
							<h2 className="text-xl md:text-2xl font-bold text-gray-900">
								{title}
							</h2>
							{titleButton && (
								<button
									onClick={titleButton.onClick}
									className="text-gray-500 hover:text-gray-700 transition-colors ml-4 flex items-center"
								>
									<titleButton.icon className="w-6 h-6" />
								</button>
							)}
						</div>
					</div>
				)}

				{/* コンテンツ */}
				<div className={title ? "p-6 pt-4" : "p-6"}>{children}</div>
			</div>
		</Modal>
	);
}
