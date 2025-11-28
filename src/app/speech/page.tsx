"use client";

import { useAuthGuard } from "@/hooks/auth/useAuthGuard";
import LoadingSpinner from "@/components/common/LoadingSpinner";

export default function SpeechPage() {
	const { user, loading: authLoading } = useAuthGuard();

	if (authLoading) {
		return <LoadingSpinner withHeaderOffset />;
	}

	if (!user) {
		return null;
	}

	return (
		<div className="min-h-screen">
			<div className="max-w-6xl mx-auto pt-[18px] pb-8 px-3 sm:px-4 md:px-6">
				{/* Speech タイトル */}
				<div className="flex justify-between items-center mb-[18px]">
					<h1 className="text-gray-900 text-2xl md:text-3xl font-bold">
						Speech
					</h1>
				</div>

				{/* コンテンツエリア */}
				<div className="bg-white rounded-lg shadow-md p-4 sm:p-6">
					<div className="text-center py-8">
						<p className="text-gray-600 text-lg">
							Speech page content will be implemented here.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
