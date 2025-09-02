'use client';

import { useEffect, useState } from 'react';

interface WindowWithOpera extends Window {
  opera?: unknown;
}

const InAppBrowserDetector = () => {
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    const detectInAppBrowser = () => {
      const userAgent = (navigator.userAgent || navigator.vendor || (window as WindowWithOpera).opera || '') as string;
      
      // Twitter/X アプリ内ブラウザの検出
      const isTwitter = /Twitter/.test(userAgent) || /TwitterAndroid/.test(userAgent);
      
      // Instagram アプリ内ブラウザの検出
      const isInstagram = /Instagram/.test(userAgent);
      
      // LINE アプリ内ブラウザの検出
      const isLine = /Line/.test(userAgent) || /Line\//.test(userAgent);
      
      // WeChat アプリ内ブラウザの検出
      const isWeChat = /MicroMessenger/.test(userAgent);
      
      // Facebook アプリ内ブラウザの検出
      const isFacebook = /FBAN/.test(userAgent) || /FBAV/.test(userAgent);
      
      // その他のアプリ内ブラウザの検出パターン
      const isWebView = /wv/.test(userAgent);
      const isInApp = isTwitter || isInstagram || isLine || isWeChat || isFacebook || isWebView;
      
      return isInApp;
    };

    const inApp = detectInAppBrowser();
    
    if (inApp) {
      // 少し遅延させてからプロンプトを表示
      const timer = setTimeout(() => {
        setShowPrompt(true);
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, []);

  const openInExternalBrowser = () => {
    const currentUrl = window.location.href;
    
    // モバイルデバイスの場合
    if (/Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent)) {
      // iOS の場合
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        // Safari で開く
        window.open(`x-web-search://?${currentUrl}`, '_blank');
        // fallback
        setTimeout(() => {
          window.open(currentUrl, '_blank');
        }, 1000);
      } else {
        // Android の場合、デフォルトブラウザで開く
        const intent = `intent://${currentUrl.replace(/https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`;
        window.location.href = intent;
        
        // Chrome が利用できない場合のfallback
        setTimeout(() => {
          window.open(currentUrl, '_blank');
        }, 1000);
      }
    } else {
      // デスクトップの場合
      window.open(currentUrl, '_blank');
    }
    
    setShowPrompt(false);
  };

  const dismissPrompt = () => {
    setShowPrompt(false);
  };

  if (!showPrompt) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full p-6">
        <div className="text-center">
          <div className="mb-4">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-yellow-100">
              <svg
                className="h-6 w-6 text-yellow-600"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 15.5c-.77.833.192 2.5 1.732 2.5z"
                />
              </svg>
            </div>
          </div>
          
          <h3 className="text-lg font-medium text-gray-900 mb-2">
            ブラウザでの表示を推奨
          </h3>
          
          <p className="text-sm text-gray-500 mb-6">
            アプリ内ブラウザではGoogleログインが正常に動作しない場合があります。外部ブラウザで開くことをお勧めします。
          </p>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={openInExternalBrowser}
              className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-blue-600 text-base font-medium text-white hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 sm:text-sm"
            >
              外部ブラウザで開く
            </button>
            
            <button
              onClick={dismissPrompt}
              className="w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 sm:text-sm"
            >
              このまま続ける
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default InAppBrowserDetector;
