import { useState, useCallback, useEffect } from "react";
import { RiSpeakLine } from "react-icons/ri";
import { HiMiniSpeakerWave } from "react-icons/hi2";
import { useTranslation } from "@/hooks/ui/useTranslation";
import { useTextToSpeech } from "@/hooks/ui/useTextToSpeech";
import { getDemoSample } from "@/constants/app-config";
import { useLanguage } from "@/contexts/LanguageContext";

interface SpeakingDemoProps {
  visibleSections: Set<string>;
}

export default function SpeakingDemo({ visibleSections }: SpeakingDemoProps) {
  const { t } = useTranslation("common");
  const { locale } = useLanguage();
  const [readingCount, setReadingCount] = useState(0);
  const [countCooldown, setCountCooldown] = useState(0);

  // TTS機能の初期化 - デモサンプルに基づいて言語を決定
  const demoSample = getDemoSample(locale);
  const { isPlaying, playText } = useTextToSpeech({
    languageCode: demoSample.voiceLanguage,
  });

  // カウントダウンの管理
  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (countCooldown > 0) {
      timer = setTimeout(() => {
        setCountCooldown((prev) => prev - 1);
      }, 1000);
    }
    return () => {
      if (timer) {
        clearTimeout(timer);
      }
    };
  }, [countCooldown]);

  // カウントボタンクリック時の処理
  const handleCountClick = useCallback(() => {
    if (countCooldown > 0) return;

    if (readingCount < 10) {
      setReadingCount((prev) => prev + 1);
      setCountCooldown(1); // 1秒のクールダウンを設定
    }
  }, [countCooldown, readingCount]);

  const handleSoundClick = async () => {
    try {
      await playText(demoSample.text);
    } catch {
      // TTS playback failed
    }
  };

  return (
    <div
      id="feature-2"
      data-scroll-animation
      className={`flex flex-col lg:flex-row-reverse items-center gap-8 transition-all duration-1000 ease-out mx-0 lg:mx-auto max-w-none lg:max-w-7xl ${
        visibleSections.has("feature-2")
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-8"
      }`}
      style={{
        opacity: visibleSections.has("feature-2") ? 1 : 0,
        transform: visibleSections.has("feature-2")
          ? "translateY(0)"
          : "translateY(32px)",
      }}
    >
      <div className="lg:w-1/2 space-y-8">
        <div
          className="inline-flex items-center justify-center w-16 h-16 text-white rounded-2xl text-2xl font-bold mb-6"
          style={{ backgroundColor: "#616161" }}
        >
          {t("home.solutions.feature2.number")}
        </div>
        <h3 className="text-2xl md:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
          {t("home.solutions.feature2.title")
            .split("\n")
            .map((line, index) => (
              <span key={index}>
                {line}
                {index <
                  t("home.solutions.feature2.title").split("\n").length - 1 && (
                  <br />
                )}
              </span>
            ))}
        </h3>
        <p className="text-gray-600 text-lg md:text-xl leading-relaxed font-medium">
          {t("home.solutions.feature2.description")}
        </p>
      </div>
      <div className="lg:w-1/2">
        <div className="bg-white p-6 sm:p-8 md:p-12 rounded-3xl shadow-xl border border-gray-200 mx-0">
          <div className="w-full max-w-none lg:max-w-lg mx-auto">
            {/* フレーズ表示エリア */}
            <div className="mb-6 md:mb-8">
              <div className="flex items-start space-x-4 mb-6">
                {/* フレーズテキスト */}
                <div className="flex-1">
                  <div className="text-lg md:text-xl font-semibold text-gray-900 mb-2 leading-relaxed">
                    {t("home.solutions.feature2.demo.input")}
                  </div>
                  <div className="text-base text-gray-600 leading-relaxed">
                    {t("home.solutions.feature2.demo.output")}
                  </div>
                </div>
              </div>

              {/* カウント表示 */}
              <div className="flex items-center text-sm text-gray-600 mb-4">
                <RiSpeakLine className="w-4 h-4 mr-1 flex-shrink-0" />
                <span
                  className={`break-words ${readingCount >= 10 ? "font-bold" : ""}`}
                >
                  {t("home.solutions.feature2.demo.todayLabel")} {readingCount}
                </span>
                <span
                  className={`break-words ml-4 ${readingCount + 40 >= 50 ? "font-bold" : ""}`}
                >
                  {t("home.solutions.feature2.demo.totalLabel")}{" "}
                  {readingCount + 40}
                </span>
              </div>
            </div>

            {/* カウントボタン */}
            <div className="flex justify-center">
              {readingCount >= 10 ? (
                <div className="bg-green-50 border border-green-200 rounded-lg p-6 w-full max-w-xs">
                  <div className="flex items-center justify-center mb-2">
                    <svg
                      className="w-6 h-6 text-green-500 mr-2"
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
                    <span className="text-green-700 font-semibold">
                      {t("home.solutions.feature2.demo.goalAchieved")}
                    </span>
                  </div>
                  <p className="text-green-600 text-sm text-center">
                    {t("home.solutions.feature2.demo.goalAchievedMessage")}
                  </p>
                </div>
              ) : (
                <div className="flex items-center gap-4 w-full max-w-sm">
                  <button
                    onClick={handleCountClick}
                    disabled={countCooldown > 0}
                    style={{
                      WebkitTapHighlightColor: "transparent",
                      touchAction: "manipulation",
                      WebkitUserSelect: "none",
                      userSelect: "none",
                    }}
                    className={`flex flex-col items-center outline-none transition-all duration-300 p-4 md:p-8 flex-1 ${
                      countCooldown > 0
                        ? "cursor-not-allowed opacity-50 pointer-events-none"
                        : "cursor-pointer active:scale-95"
                    }`}
                  >
                    <div
                      className={`w-[40px] h-[30px] md:w-[60px] md:h-[40px] bg-transparent rounded-full flex items-center justify-center mb-2 ${
                        countCooldown > 0 ? "opacity-50" : ""
                      }`}
                    >
                      <svg
                        className={`w-8 h-8 md:w-10 md:h-10 ${
                          countCooldown > 0 ? "text-gray-400" : "text-gray-600"
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M12 9v3m0 0v3m0-3h3m-3 0H9m12 0a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                    </div>
                    <span
                      className={`font-medium text-sm md:text-base ${
                        countCooldown > 0 ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {countCooldown > 0 ? "Wait..." : "Count"}
                    </span>
                  </button>
                  <div className="w-px h-[120px] md:h-[152px] bg-gray-300 mx-2"></div>
                  <button
                    onClick={handleSoundClick}
                    disabled={isPlaying}
                    className={`flex flex-col items-center outline-none transition-all duration-300 p-4 md:p-8 flex-1 ${
                      isPlaying
                        ? "cursor-not-allowed opacity-50"
                        : "cursor-pointer"
                    }`}
                  >
                    <div className="w-[40px] h-[30px] md:w-[60px] md:h-[40px] bg-transparent rounded-full flex items-center justify-center mb-2">
                      <HiMiniSpeakerWave
                        className={`w-8 h-8 md:w-10 md:h-10 ${
                          isPlaying ? "text-gray-400" : "text-gray-600"
                        }`}
                      />
                    </div>
                    <span
                      className={`font-medium text-sm md:text-base ${
                        isPlaying ? "text-gray-400" : "text-gray-900"
                      }`}
                    >
                      {isPlaying ? "Playing..." : "Sound"}
                    </span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
