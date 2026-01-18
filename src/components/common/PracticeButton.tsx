import { ReactNode } from "react";

interface PracticeButtonProps {
	children: ReactNode;
	onClick: () => void;
	disabled?: boolean;
	isLoading?: boolean;
	loadingContent?: ReactNode; // カスタムローディングコンテンツ
	variant?: "primary" | "secondary" | "danger";
	className?: string;
}

// バウンスドットアニメーション（エクスポート用）
export function BounceDots() {
	return (
		<span className="flex gap-1">
			<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
			<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
			<span className="w-1.5 h-1.5 bg-white rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
		</span>
	);
}

export default function PracticeButton({
	children,
	onClick,
	disabled = false,
	isLoading = false,
	loadingContent,
	variant = "primary",
	className = "",
}: PracticeButtonProps) {
	const baseStyles = "w-full h-12 rounded-2xl font-medium transition-all duration-200 active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed";

	const variantStyles =
		variant === "primary"
			? "bg-gray-900 text-white hover:bg-gray-800 shadow-[0_2px_6px_rgba(0,0,0,0.2)]"
			: variant === "danger"
				? "bg-red-500 text-white hover:bg-red-600 shadow-[0_2px_6px_rgba(239,68,68,0.3)]"
				: "bg-white border border-gray-300 text-gray-600 hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.08)]";

	const spinnerStyles =
		variant === "primary" || variant === "danger"
			? "border-white/30 border-t-white"
			: "border-gray-400 border-t-transparent";

	const defaultLoadingContent = (
		<span className={`inline-block w-5 h-5 border-2 ${spinnerStyles} rounded-full animate-spin`} />
	);

	return (
		<button
			onClick={onClick}
			disabled={disabled || isLoading}
			className={`${baseStyles} ${variantStyles} ${className}`}
		>
			{isLoading ? (loadingContent || defaultLoadingContent) : children}
		</button>
	);
}
