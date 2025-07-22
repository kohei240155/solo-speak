'use client'

import { useEffect } from 'react'

export default function ViewportFix() {
  useEffect(() => {
    // Safari iOS でのビューポート問題を修正
    function fixViewportHeight() {
      const vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', `${vh}px`);
    }

    // 初期設定
    fixViewportHeight();

    // イベントリスナーの設定
    const handleResize = () => fixViewportHeight();
    const handleOrientationChange = () => {
      setTimeout(() => fixViewportHeight(), 100);
    };

    const handleFocusIn = (e: Event) => {
      const target = e.target as HTMLElement;
      if (target && (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.tagName === 'SELECT')) {
        // フォーカス時の処理（必要に応じて拡張）
      }
    };

    const handleFocusOut = () => {
      setTimeout(() => {
        fixViewportHeight();
        window.scrollTo(0, 0);
      }, 300);
    };

    // イベントリスナーの追加
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleOrientationChange);
    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);

    // クリーンアップ
    return () => {
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleOrientationChange);
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, []);

  return null; // このコンポーネントは何も描画しない
}
