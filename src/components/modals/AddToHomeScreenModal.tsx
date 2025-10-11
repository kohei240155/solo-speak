import BaseModal from "../common/BaseModal";
import {
  AiOutlineCaretRight,
  AiFillApple,
  AiFillAndroid,
} from "react-icons/ai";
import { useTranslation } from "@/hooks/ui/useTranslation";

interface AddToHomeScreenModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AddToHomeScreenModal({
  isOpen,
  onClose,
}: AddToHomeScreenModalProps) {
  const { t } = useTranslation("common");

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} width="500px">
      {/* カスタムタイトル */}
      <div className="mb-6">
        <h2 className="text-xl md:text-2xl font-bold text-gray-900 mb-4">
          <span
            className="px-1 relative text-gray-800 inline-block"
            style={{
              background:
                "linear-gradient(180deg, transparent 50%, #fde047 50%)",
              animation: "slideInFromBottom 1.2s ease-out 0.3s both",
            }}
          >
            {t("addToHomeScreen.title")}
          </span>
        </h2>
        <p
          className="text-gray-600 text-base leading-relaxed"
          style={{
            animation: "fadeInSlideUp 0.8s ease-out 0.6s both",
          }}
        >
          {t("addToHomeScreen.description")}
        </p>
      </div>

      {/* アニメーション定義 */}
      <style jsx>{`
        @keyframes slideInFromBottom {
          0% {
            transform: translateY(30px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeInSlideUp {
          0% {
            transform: translateY(20px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
        @keyframes fadeInStagger {
          0% {
            transform: translateY(15px);
            opacity: 0;
          }
          100% {
            transform: translateY(0);
            opacity: 1;
          }
        }
      `}</style>

      <div className="mb-6">
        <div
          className="space-y-6"
          style={{
            animation: "fadeInStagger 0.8s ease-out 0.9s both",
          }}
        >
          {/* Safari (iOS) の説明 */}
          <div>
            <div className="flex items-center mb-3">
              <AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
              <AiFillApple className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Safari (iOS)
              </h3>
            </div>
            <div className="ml-5 pr-4 space-y-2">
              <p className="text-gray-700 leading-relaxed">
                <strong>1.</strong> {t("addToHomeScreen.safari.step1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.</strong> {t("addToHomeScreen.safari.step2")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.</strong> {t("addToHomeScreen.safari.step3")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.</strong> {t("addToHomeScreen.safari.step4")}
              </p>
            </div>
          </div>

          {/* Android Chrome の説明 */}
          <div>
            <div className="flex items-center mb-3">
              <AiOutlineCaretRight className="w-4 h-4 mr-1 text-gray-600" />
              <AiFillAndroid className="w-5 h-5 mr-2 text-gray-600" />
              <h3 className="text-lg font-semibold text-gray-900">
                Android Chrome
              </h3>
            </div>
            <div className="ml-5 pr-4 space-y-2">
              <p className="text-gray-700 leading-relaxed">
                <strong>1.</strong> {t("addToHomeScreen.android.step1")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>2.</strong> {t("addToHomeScreen.android.step2")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>3.</strong> {t("addToHomeScreen.android.step3")}
              </p>
              <p className="text-gray-700 leading-relaxed">
                <strong>4.</strong> {t("addToHomeScreen.android.step4")}
              </p>
            </div>
          </div>
        </div>
      </div>
      <div
        className="flex justify-end"
        style={{
          animation: "fadeInSlideUp 0.6s ease-out 1.2s both",
        }}
      >
        <button
          onClick={onClose}
          className="bg-white border py-2 px-6 rounded-md font-medium hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-all duration-200"
          style={{
            borderColor: "#616161",
            color: "#616161",
          }}
        >
          Close
        </button>
      </div>
    </BaseModal>
  );
}
