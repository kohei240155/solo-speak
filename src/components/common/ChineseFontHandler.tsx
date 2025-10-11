"use client";

import { useLanguage } from "@/contexts/LanguageContext";
import { useEffect } from "react";

export default function ChineseFontHandler() {
  const { locale } = useLanguage();

  useEffect(() => {
    if (locale === "zh") {
      // 中国語選択時のみbodyにフォントを適用
      document.body.style.fontFamily =
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "PingFang SC", "Microsoft YaHei", "SimHei", sans-serif';
    } else {
      // 他の言語の場合は元のフォントに戻す
      document.body.style.fontFamily =
        'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
    }
  }, [locale]);

  return null; // UIは表示しない
}
