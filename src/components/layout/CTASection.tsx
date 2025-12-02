import { useTranslation } from "@/hooks/ui/useTranslation";

interface CTASectionProps {
	visibleSections: Set<string>;
	onGetStartedClick: () => void;
}

export default function CTASection({
	visibleSections,
	onGetStartedClick,
}: CTASectionProps) {
	const { t } = useTranslation("landing");

	return (
		<section
			id="cta-section"
			data-scroll-animation
			className={`py-16 md:py-32 relative overflow-hidden bg-gray-100 transition-all duration-1000 ease-out ${
				visibleSections.has("cta-section")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
			style={{
				opacity: visibleSections.has("cta-section") ? 1 : 0,
				transform: visibleSections.has("cta-section")
					? "translateY(0)"
					: "translateY(32px)",
			}}
		>
			{/* 背景の装飾要素 */}
			<div className="absolute inset-0 opacity-40">
				<div className="absolute top-10 left-10 w-64 h-64 bg-gray-200 rounded-full blur-3xl"></div>
				<div className="absolute bottom-10 right-10 w-80 h-80 bg-gray-300 rounded-full blur-3xl"></div>
			</div>

			<div className="container mx-auto px-4 sm:px-8 text-center relative z-10">
				<div className="max-w-5xl mx-auto">
					<h2 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-8 text-gray-900 leading-tight tracking-tight">
						{t("home.cta.title")
							.split("\n")
							.map((line, index) => (
								<span key={index}>
									{index === 0 && line}
									{index === 1 && (
										<span className="bg-gradient-to-r from-gray-700 to-gray-900 bg-clip-text text-transparent">
											{line}
										</span>
									)}
									{index === 0 && <br />}
								</span>
							))}
					</h2>
					<p className="text-xl md:text-2xl lg:text-3xl text-gray-700 mb-16 max-w-3xl mx-auto font-medium leading-relaxed px-4">
						{t("home.cta.subtitle")}
					</p>

					<div
						className="inline-flex items-center px-10 py-5 rounded-2xl border border-gray-300 text-white transition-all duration-300 group cursor-pointer shadow-lg"
						style={{ backgroundColor: "#616161" }}
						onMouseEnter={(e) => {
							e.currentTarget.style.backgroundColor = "#525252";
						}}
						onMouseLeave={(e) => {
							e.currentTarget.style.backgroundColor = "#616161";
						}}
						onClick={onGetStartedClick}
					>
						<span className="font-bold text-xl group-hover:text-gray-100 transition-colors duration-300">
							{t("home.cta.button")}
						</span>
					</div>
				</div>
			</div>
		</section>
	);
}
