import React from "react";

interface ScrollableContainerProps {
	children: React.ReactNode;
	className?: string;
	style?: React.CSSProperties;
}

export default function ScrollableContainer({
	children,
	className = "",
	style = {},
}: ScrollableContainerProps) {
	return (
		<div
			className={`${className} [&::-webkit-scrollbar]:hidden`}
			style={{
				...style,
				scrollbarWidth: "none",
				msOverflowStyle: "none",
			}}
		>
			{children}
		</div>
	);
}
