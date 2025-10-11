import { useState } from "react";
import { PiHandTapLight } from "react-icons/pi";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface QuizDemoProps {
  visibleSections: Set<string>;
}

export default function QuizDemo({ visibleSections }: QuizDemoProps) {
  const { t } = useTranslation("common");
  const [showQuizTranslation, setShowQuizTranslation] = useState(false);

  const handleQuizHandClick = () => {
    setShowQuizTranslation(true);
  };

  return (
    <div
      id="feature-3"
      data-scroll-animation
      className={`flex flex-col lg:flex-row items-center gap-8 transition-all duration-1000 ease-out mx-0 lg:mx-auto max-w-none lg:max-w-7xl ${
        visibleSections.has("feature-3")
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{
        opacity: visibleSections.has("feature-3") ? 1 : 0,
        transform: visibleSections.has("feature-3")
          ? "translateY(0)"
          : "translateY(32px)",
      }}
    >
      <div className="lg:w-1/2 space-y-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 text-white rounded-2xl text-2xl font-bold mb-6"
          style={{ backgroundColor: "#616161" }}
        >
          {t("home.solutions.feature3.number")}
        </div>
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {t("home.solutions.feature3.title")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("home.solutions.feature3.title").split("\n").length - 1 && (
                  <br />
                )}
              </span>
            ))}
        </h3>
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
          {t("home.solutions.feature3.description")}
        </p>
      </div>
      <div className="lg:w-1/2">
        <div className="bg-white p-6 sm:p-9 md:p-12 rounded-3xl shadow-xl border border-gray-200 mx-0">
          <div className="w-full max-w-none lg:max-w-lg mx-auto">
            {/* フレーズ表示エリア */}
            <div className="mb-4 md:mb-8">
              {/* 母国語の翻訳（メイン表示） */}
              <div className="mb-4">
                <div className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                  {t("home.solutions.feature3.demo.output")}
                </div>
              </div>

              {/* 学習言語のフレーズ - タップで表示 */}
              <div className="min-h-[5rem] flex items-start mb-4 overflow-hidden">
                <div className="w-full relative">
                  {/* 常に表示される透明なプレースホルダー（レイアウト固定用） */}
                  <div className="text-base md:text-xl leading-relaxed font-medium opacity-0 pointer-events-none">
                    {t("home.solutions.feature3.demo.input")}
                  </div>
                  {/* 実際に表示されるテキスト */}
                  <div
                    className={`text-base md:text-xl text-gray-600 break-words leading-relaxed font-medium transition-all duration-1000 ease-out absolute top-0 left-0 w-full ${
                      showQuizTranslation
                        ? "opacity-100 transform translate-y-0"
                        : "opacity-0 transform translate-y-4"
                    }`}
                  >
                    {showQuizTranslation
                      ? t("home.solutions.feature3.demo.input")
                      : ""}
                  </div>
                </div>
              </div>
            </div>

            {/* 中央のアイコン表示エリア */}
            <div className="flex justify-center items-center">
              <div
                className="cursor-pointer rounded-full p-4 transition-colors hover:bg-gray-100"
                onClick={handleQuizHandClick}
              >
                <PiHandTapLight className="w-12 h-12 text-gray-400" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
