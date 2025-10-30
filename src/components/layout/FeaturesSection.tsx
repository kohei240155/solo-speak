import { useTranslation } from "@/hooks/ui/useTranslation";

interface FeaturesSectionProps {
	visibleSections: Set<string>;
}

export default function FeaturesSection({
	visibleSections,
}: FeaturesSectionProps) {
	const { t } = useTranslation("common");

	return (
		<section
			id="features-section"
			data-scroll-animation
			className={`py-16 bg-white relative transition-all duration-1000 ease-out delay-200 ${
				visibleSections.has("features-section")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
		>
			<div className="container mx-auto px-4 sm:px-8">
				<div className="text-center mb-8">
					<h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 tracking-tight">
						{t("home.features.title")}
					</h2>
					<div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-800 mx-auto rounded-full"></div>
				</div>

				<div className="max-w-5xl mx-auto space-y-6 px-2 sm:px-4">
					{/* お悩み 1 */}
					<div
						className={`bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 transition-all duration-1000 ease-out transform overflow-hidden hover:shadow-xl hover:scale-105 ${
							visibleSections.has("features-section")
								? "opacity-100 translate-y-0"
								: "opacity-0 translate-y-12"
						}`}
						style={{
							transitionDelay: "400ms",
							transform: visibleSections.has("features-section")
								? "translateY(0) scale(1)"
								: "translateY(48px) scale(0.95)",
							backdropFilter: "blur(8px)",
							boxShadow: visibleSections.has("features-section")
								? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
								: "0 0 0 rgba(0, 0, 0, 0)",
						}}
					>
						<div className="flex items-start gap-4">
							<div
								className={`w-6 h-6 rounded flex items-center justify-center mt-1 flex-shrink-0 transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-16"
								}`}
								style={{ backgroundColor: "#616161", transitionDelay: "600ms" }}
							>
								<svg
									className="w-4 h-4 text-white"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<p
								className={`text-lg md:text-xl text-gray-800 font-medium leading-relaxed transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-20"
								}`}
								style={{ transitionDelay: "700ms" }}
							>
								{t("home.features.speechRecognition.title")}
							</p>
						</div>
					</div>

					{/* お悩み 2 */}
					<div
						className={`bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 transition-all duration-1000 ease-out transform overflow-hidden hover:shadow-xl hover:scale-105 ${
							visibleSections.has("features-section")
								? "opacity-100 translate-y-0"
								: "opacity-0 translate-y-12"
						}`}
						style={{
							transitionDelay: "600ms",
							transform: visibleSections.has("features-section")
								? "translateY(0) scale(1)"
								: "translateY(48px) scale(0.95)",
							backdropFilter: "blur(8px)",
							boxShadow: visibleSections.has("features-section")
								? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
								: "0 0 0 rgba(0, 0, 0, 0)",
						}}
					>
						<div className="flex items-start gap-4">
							<div
								className={`w-6 h-6 rounded flex items-center justify-center mt-1 flex-shrink-0 transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-16"
								}`}
								style={{ backgroundColor: "#616161", transitionDelay: "800ms" }}
							>
								<svg
									className="w-4 h-4 text-white"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<p
								className={`text-lg md:text-xl text-gray-800 font-medium leading-relaxed transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-20"
								}`}
								style={{ transitionDelay: "900ms" }}
							>
								{t("home.features.quiz.title")}
							</p>
						</div>
					</div>

					{/* お悩み 3 */}
					<div
						className={`bg-gradient-to-r from-gray-50 to-gray-100 p-4 sm:p-6 md:p-8 rounded-2xl shadow-lg border border-gray-200 transition-all duration-1000 ease-out transform overflow-hidden hover:shadow-xl hover:scale-105 ${
							visibleSections.has("features-section")
								? "opacity-100 translate-y-0"
								: "opacity-0 translate-y-12"
						}`}
						style={{
							transitionDelay: "800ms",
							transform: visibleSections.has("features-section")
								? "translateY(0) scale(1)"
								: "translateY(48px) scale(0.95)",
							backdropFilter: "blur(8px)",
							boxShadow: visibleSections.has("features-section")
								? "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)"
								: "0 0 0 rgba(0, 0, 0, 0)",
						}}
					>
						<div className="flex items-start gap-4">
							<div
								className={`w-6 h-6 rounded flex items-center justify-center mt-1 flex-shrink-0 transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-16"
								}`}
								style={{
									backgroundColor: "#616161",
									transitionDelay: "1000ms",
								}}
							>
								<svg
									className="w-4 h-4 text-white"
									fill="currentColor"
									viewBox="0 0 20 20"
								>
									<path
										fillRule="evenodd"
										d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
										clipRule="evenodd"
									/>
								</svg>
							</div>
							<p
								className={`text-lg md:text-xl text-gray-800 font-medium leading-relaxed transition-all duration-1000 ease-out ${
									visibleSections.has("features-section")
										? "opacity-100 translate-x-0"
										: "opacity-0 -translate-x-20"
								}`}
								style={{ transitionDelay: "1100ms" }}
							>
								{t("home.features.progress.title")}
							</p>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
