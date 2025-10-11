import { useState, useEffect } from "react";

export const useScrollAnimation = () => {
  const [visibleSections, setVisibleSections] = useState(
    new Set(["hero-section"]),
  );

  useEffect(() => {
    const handleScroll = () => {
      const sections = [
        "features-section",
        "solutions-section",
        "feature-1",
        "feature-2",
        "feature-3",
        "faq-section",
        "cta-section",
      ];

      sections.forEach((sectionId) => {
        const element = document.getElementById(sectionId);
        if (element) {
          const rect = element.getBoundingClientRect();
          const isVisible = rect.top < window.innerHeight * 0.8;

          if (isVisible) {
            setVisibleSections((prev) => new Set([...prev, sectionId]));
          }
        }
      });
    };

    window.addEventListener("scroll", handleScroll);
    // 初回チェック
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return visibleSections;
};
