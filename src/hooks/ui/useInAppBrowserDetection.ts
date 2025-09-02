'use client';

import { useState, useEffect } from 'react';

interface WindowWithOpera extends Window {
  opera?: unknown;
}

export const useInAppBrowserDetection = () => {
  const [isInAppBrowser, setIsInAppBrowser] = useState(false);

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

    setIsInAppBrowser(detectInAppBrowser());
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
  };

  return { isInAppBrowser, openInExternalBrowser };
};
