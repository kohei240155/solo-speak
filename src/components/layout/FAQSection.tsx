import { useState } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface FAQSectionProps {
	visibleSections: Set<string>;
}

export default function FAQSection({ visibleSections }: FAQSectionProps) {
	const { t } = useTranslation("common");
	const [expandedFaq, setExpandedFaq] = useState<Set<number>>(new Set());

	const toggleFaq = (faqNumber: number) => {
		setExpandedFaq((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(faqNumber)) {
				newSet.delete(faqNumber);
			} else {
				newSet.add(faqNumber);
			}
			return newSet;
		});
	};

	return (
		<section
			id="faq-section"
			data-scroll-animation
			className={`py-16 md:py-32 bg-white relative transition-all duration-1000 ease-out ${
				visibleSections.has("faq-section")
					? "opacity-100 translate-y-0"
					: "opacity-0 translate-y-8"
			}`}
			style={{
				opacity: visibleSections.has("faq-section") ? 1 : 0,
				transform: visibleSections.has("faq-section")
					? "translateY(0)"
					: "translateY(32px)",
			}}
		>
			<div className="container mx-auto px-4 sm:px-8">
				<div className="text-center mb-12">
					<h2 className="text-2xl md:text-3xl lg:text-5xl font-bold text-gray-900 tracking-tight mb-6">
						{t("home.faq.title")}
					</h2>
					<div className="w-24 h-1 bg-gradient-to-r from-gray-600 to-gray-800 mx-auto rounded-full"></div>
				</div>

				<div className="max-w-4xl mx-auto space-y-6 px-4">
					{/* FAQ 1: フレーズ生成回数 */}
					<div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
						<button
							onClick={() => toggleFaq(1)}
							className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
						>
							<h3 className="text-lg md:text-xl font-bold text-gray-900 flex-1">
								{t("home.faq.q1.question")}
							</h3>
							<div className="ml-4 flex-shrink-0">
								<svg
									className={`w-6 h-6 text-gray-600 transition-transform duration-300 ease-in-out ${
										expandedFaq.has(1) ? "rotate-45" : "rotate-0"
									}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
						</button>
						<div
							className={`transition-all duration-500 ease-in-out overflow-hidden ${
								expandedFaq.has(1)
									? "max-h-96 opacity-100"
									: "max-h-0 opacity-0"
							}`}
						>
							<div className="px-8 pb-8 border-t border-gray-200">
								<p className="text-lg text-gray-700 font-medium mb-2 mt-4">
									{t("home.faq.q1.answer")}
								</p>
								<p className="text-base text-gray-600">
									{t("home.faq.q1.answerDetail")}
								</p>
							</div>
						</div>
					</div>

					{/* FAQ 2: リセット時刻 */}
					<div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
						<button
							onClick={() => toggleFaq(2)}
							className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
						>
							<h3 className="text-lg md:text-xl font-bold text-gray-900 flex-1">
								{t("home.faq.q2.question")}
							</h3>
							<div className="ml-4 flex-shrink-0">
								<svg
									className={`w-6 h-6 text-gray-600 transition-transform duration-300 ease-in-out ${
										expandedFaq.has(2) ? "rotate-45" : "rotate-0"
									}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
						</button>
						<div
							className={`transition-all duration-500 ease-in-out overflow-hidden ${
								expandedFaq.has(2)
									? "max-h-96 opacity-100"
									: "max-h-0 opacity-0"
							}`}
						>
							<div className="px-8 pb-8 border-t border-gray-200">
								<p className="text-lg text-gray-700 font-medium mb-2 mt-4">
									{t("home.faq.q2.answer")}
								</p>
								<p className="text-base text-gray-600">
									{t("home.faq.q2.answerDetail")}
								</p>
							</div>
						</div>
					</div>

					{/* FAQ 3: 使用料 */}
					<div className="bg-white rounded-2xl border border-gray-200 shadow-lg overflow-hidden">
						<button
							onClick={() => toggleFaq(3)}
							className="w-full p-8 text-left flex items-center justify-between hover:bg-gray-50 transition-colors duration-200"
						>
							<h3 className="text-lg md:text-xl font-bold text-gray-900 flex-1">
								{t("home.faq.q3.question")}
							</h3>
							<div className="ml-4 flex-shrink-0">
								<svg
									className={`w-6 h-6 text-gray-600 transition-transform duration-300 ease-in-out ${
										expandedFaq.has(3) ? "rotate-45" : "rotate-0"
									}`}
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
										d="M12 4v16m8-8H4"
									/>
								</svg>
							</div>
						</button>
						<div
							className={`transition-all duration-500 ease-in-out overflow-hidden ${
								expandedFaq.has(3)
									? "max-h-96 opacity-100"
									: "max-h-0 opacity-0"
							}`}
						>
							<div className="px-8 pb-8 border-t border-gray-200">
								<p className="text-lg text-gray-700 font-medium mb-2 mt-4">
									{t("home.faq.q3.answer")}
								</p>
								<p className="text-base text-gray-600">
									{t("home.faq.q3.answerDetail")}
								</p>
							</div>
						</div>
					</div>
				</div>
			</div>
		</section>
	);
}
