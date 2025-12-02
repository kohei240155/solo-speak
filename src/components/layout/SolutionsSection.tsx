import { useTranslation } from "@/hooks/ui/useTranslation";
import AIDemo from "./AIDemo";
import SpeakingDemo from "./SpeakingDemo";
import QuizDemo from "./QuizDemo";

interface SolutionsSectionProps {
	visibleSections: Set<string>;
}

export default function SolutionsSection({
	visibleSections,
}: SolutionsSectionProps) {
	const { t } = useTranslation("landing");

	return (
		<section
			id="solutions-section"
			data-scroll-animation
			className={`py-16 md:py-32 relative overflow-hidden bg-gray-50 transition-all duration-1000 ease-out ${
				visibleSections.has("solutions-section")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
			style={{
				opacity: visibleSections.has("solutions-section") ? 1 : 0,
				transform: visibleSections.has("solutions-section")
					? "translateY(0)"
					: "translateY(32px)",
			}}
		>
			<div className="container mx-auto px-4 sm:px-8">
				<div className="text-center mb-12">
					<h2 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6">
						<span className="lg:hidden">
							{t("home.solutions.title.mobile")}
						</span>
						<span className="hidden lg:block">
							{t("home.solutions.title.desktop")}
						</span>
					</h2>
				</div>

				<div className="max-w-none lg:max-w-7xl mx-auto space-y-24 px-2 sm:px-4">
					{/* AI生成機能デモ */}
					<AIDemo visibleSections={visibleSections} />

					{/* 発話練習デモ */}
					<SpeakingDemo visibleSections={visibleSections} />

					{/* クイズ機能デモ */}
					<QuizDemo visibleSections={visibleSections} />
				</div>
			</div>
		</section>
	);
}
