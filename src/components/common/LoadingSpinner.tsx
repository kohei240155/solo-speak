interface LoadingSpinnerProps {
	size?: "sm" | "md" | "lg";
	message?: string;
	className?: string;
	fullScreen?: boolean;
	withHeaderOffset?: boolean;
	minHeight?: string;
}

export default function LoadingSpinner({
	size = "md",
	message = "Loading...",
	className = "",
	fullScreen = false,
	withHeaderOffset = false,
	minHeight,
}: LoadingSpinnerProps) {
	const sizeClasses = {
		sm: "h-4 w-4",
		md: "h-8 w-8",
		lg: "h-12 w-12",
	};

	const spinner = (
		<div
			className={`text-center flex flex-col justify-center ${className}`}
			style={minHeight ? { minHeight } : undefined}
		>
			<div>
				<div
					className={`animate-spin rounded-full border-b-2 border-gray-600 mx-auto ${sizeClasses[size]}`}
				></div>
				{message && <p className="mt-2 text-gray-600 text-sm">{message}</p>}
			</div>
		</div>
	);

	if (fullScreen) {
		return (
			<div className="min-h-screen flex justify-center bg-gray-50 pt-8">
				{spinner}
			</div>
		);
	}

	if (withHeaderOffset) {
		return (
			<div className="min-h-screen flex justify-center bg-gray-50 pt-32">
				{spinner}
			</div>
		);
	}

	return spinner;
}
