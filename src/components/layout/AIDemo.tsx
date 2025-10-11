import { useState, useCallback } from "react";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface AIDemoProps {
  visibleSections: Set<string>;
}

export default function AIDemo({ visibleSections }: AIDemoProps) {
  const { t } = useTranslation("common");
  const [isDemoActive, setIsDemoActive] = useState(false);
  const [showTranslation, setShowTranslation] = useState(false);

  const handleAISuggestClick = useCallback(() => {
    if (isDemoActive) return; // 既に実行中なら何もしない

    setIsDemoActive(true);
    setShowTranslation(false);

    // 1.5秒後にローディング停止、翻訳表示
    setTimeout(() => {
      setIsDemoActive(false);
      setShowTranslation(true);
    }, 1500);
  }, [isDemoActive]);

  return (
    <div
      id="feature-1"
      data-scroll-animation
      className={`flex flex-col lg:flex-row items-center gap-8 transition-all duration-1000 ease-out mx-0 lg:mx-auto max-w-none lg:max-w-7xl ${
        visibleSections.has("feature-1")
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{
        opacity: visibleSections.has("feature-1") ? 1 : 0,
        transform: visibleSections.has("feature-1")
          ? "translateY(0)"
          : "translateY(32px)",
      }}
    >
      <div className="lg:w-1/2 space-y-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 text-white rounded-2xl text-2xl font-bold mb-6"
          style={{ backgroundColor: "#616161" }}
        >
          {t("home.solutions.feature1.number")}
        </div>
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {t("home.solutions.feature1.title")}
          <br />
        </h3>
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
          {t("home.solutions.feature1.description")}
        </p>
      </div>
      <div className="lg:w-1/2">
        <div className="bg-gradient-to-br from-white to-gray-50 p-6 sm:p-8 md:p-8 rounded-2xl shadow-2xl border border-gray-200 mx-0">
          <div className="w-full max-w-none lg:max-w-xl mx-auto space-y-3">
            {/* 入力フィールド */}
            <div className="relative">
              <div className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300">
                <div className="flex items-center justify-between">
                  <span className="text-gray-900 font-semibold text-lg">
                    {t("home.solutions.feature1.demo.input")}
                  </span>
                  <div className="flex items-center space-x-2">
                    <svg
                      className="w-5 h-5 text-gray-400"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
                      />
                    </svg>
                  </div>
                </div>
              </div>
              {/* 下向き矢印 */}
              <div className="flex justify-center mt-4">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            </div>

            {/* 生成ボタン */}
            <div className="flex justify-center py-1">
              <button
                className={`text-white py-3 w-full rounded-md font-medium focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-300 ${
                  isDemoActive
                    ? "animate-pulse cursor-not-allowed opacity-75"
                    : ""
                }`}
                style={{
                  backgroundColor: isDemoActive ? "#9ca3af" : "#616161",
                  boxShadow: isDemoActive
                    ? "0 0 8px rgba(156, 163, 175, 0.2)"
                    : "0 0 8px rgba(97, 97, 97, 0.2)",
                }}
                onMouseEnter={(e) => {
                  if (!isDemoActive) {
                    e.currentTarget.style.backgroundColor = "#525252";
                    e.currentTarget.style.boxShadow =
                      "0 6px 20px rgba(0, 0, 0, 0.1)";
                  }
                }}
                onMouseLeave={(e) => {
                  if (!isDemoActive) {
                    e.currentTarget.style.backgroundColor = "#616161";
                    e.currentTarget.style.boxShadow =
                      "0 0 8px rgba(97, 97, 97, 0.2)";
                  }
                }}
                onClick={handleAISuggestClick}
                disabled={isDemoActive || showTranslation}
              >
                <div className="flex items-center justify-center">
                  {isDemoActive && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  )}
                  AI Suggest
                </div>
              </button>
            </div>
            {/* 下向き矢印 - 翻訳表示完了時に表示 */}
            {showTranslation && (
              <div className="flex justify-center">
                <svg
                  className="w-5 h-5 text-gray-400"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M19 14l-7 7m0 0l-7-7m7 7V3"
                  />
                </svg>
              </div>
            )}

            {/* 結果表示 - 3つの翻訳 */}
            <div
              className={`relative transition-all duration-500 ${showTranslation ? "opacity-100 transform translate-y-0" : "opacity-0 transform translate-y-4"}`}
            >
              <div className="space-y-3">
                {(() => {
                  // 個別のキーで各翻訳を取得
                  const output1 = t("home.solutions.feature1.demo.outputs.0");
                  const output2 = t("home.solutions.feature1.demo.outputs.1");
                  const output3 = t("home.solutions.feature1.demo.outputs.2");

                  const outputs = [output1, output2, output3];

                  return outputs.map((output: string, index: number) => (
                    <div
                      key={index}
                      className="bg-white border-2 border-gray-300 rounded-xl px-6 py-4 shadow-lg hover:shadow-xl transition-all duration-300"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-gray-900 font-semibold text-lg">
                          {output}
                        </span>
                        <div className="flex items-center space-x-2">
                          {index === 0 && (
                            <svg
                              className="w-5 h-5 text-green-400"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                              />
                            </svg>
                          )}
                        </div>
                      </div>
                    </div>
                  ));
                })()}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
