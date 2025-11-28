"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";

export default function SecondaryNavigation() {
	const pathname = usePathname();

	// フレーズ関連のページとランキングページで表示
	const showSecondaryNav =
		pathname === "/phrase" ||
		pathname?.startsWith("/phrase/") ||
		pathname === "/speech" ||
		pathname === "/ranking";

	if (!showSecondaryNav) {
		return null;
	}

	return (
		<div className="bg-white sticky top-0 z-50">
			<div className="container mx-auto px-4">
				<div className="flex space-x-8 max-w-6xl mx-auto">
					<Link
						href="/phrase/list"
						className={`py-2 px-1 border-b-2 font-medium text-[15px] lg:text-[16px] ${
							pathname === "/phrase" || pathname?.startsWith("/phrase/")
								? "border-gray-900 text-gray-900"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						Phrase
					</Link>
					<Link
						href="/speech"
						className={`py-2 px-1 border-b-2 font-medium text-[15px] lg:text-[16px] ${
							pathname === "/speech"
								? "border-gray-900 text-gray-900"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						Speech
					</Link>
					<Link
						href="/ranking"
						className={`py-2 px-1 border-b-2 font-medium text-[15px] lg:text-[16px] ${
							pathname === "/ranking"
								? "border-gray-900 text-gray-900"
								: "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
						}`}
					>
						Ranking
					</Link>
				</div>
			</div>
		</div>
	);
}
