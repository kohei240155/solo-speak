"use client";

import { useState, useEffect, ReactNode } from "react";

interface FadeInProps {
	children: ReactNode;
	className?: string;
}

/**
 * コンテンツをふわっとフェードインさせるコンポーネント
 */
export default function FadeIn({ children, className = "" }: FadeInProps) {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// マウント後に少し遅延させてからアニメーション開始
		const timer = requestAnimationFrame(() => {
			setIsVisible(true);
		});
		return () => cancelAnimationFrame(timer);
	}, []);

	return (
		<div
			className={className}
			style={{
				opacity: isVisible ? 1 : 0,
				transform: isVisible ? "translateY(0)" : "translateY(8px)",
				transition: "opacity 0.3s ease-out, transform 0.3s ease-out",
			}}
		>
			{children}
		</div>
	);
}
