"use client";

import Image from "next/image";
import Link from "next/link";
import { useTranslation } from "@/hooks/ui/useTranslation";

export default function Footer() {
  const { t } = useTranslation("common");

  return (
    <footer className="bg-white border-t border-gray-200 mt-auto block">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-col md:flex-row md:justify-between md:items-start">
            {/* ロゴセクション */}
            <div className="mb-6 md:mb-0">
              <div className="flex items-center">
                <Image
                  src="/images/logo/Solo Speak Icon.png"
                  alt="Solo Speak"
                  width={40}
                  height={40}
                  className="mr-3"
                />
                <span className="text-xl font-bold text-gray-800">
                  Solo Speak
                </span>
              </div>
              <p className="text-gray-600 mt-2 text-sm max-w-xs">
                {t("footer.description")}
              </p>
            </div>

            {/* リンクセクション */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-8 md:ml-auto">
              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  {t("footer.sections.service")}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <Link
                      href="/"
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t("footer.links.about")}
                    </Link>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  {t("footer.sections.legal")}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="/terms"
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t("footer.links.terms")}
                    </a>
                  </li>
                  <li>
                    <a
                      href="/privacy"
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t("footer.links.privacy")}
                    </a>
                  </li>
                </ul>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-gray-800 mb-3">
                  {t("footer.sections.support")}
                </h3>
                <ul className="space-y-2">
                  <li>
                    <a
                      href="https://forms.gle/M9qBSGfiJCVWqmjE8"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-gray-600 hover:text-gray-800 transition-colors"
                    >
                      {t("footer.links.contact")}
                    </a>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          {/* コピーライト */}
          <div className="border-t border-gray-200 mt-4 pt-4">
            <p className="text-sm text-gray-500 text-center">
              © {new Date().getFullYear()} Solo Speak. {t("footer.copyright")}
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
