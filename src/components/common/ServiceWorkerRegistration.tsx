'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    // 即座にキャッシュをクリア（アプリ起動時）
    if ('caches' in window) {
      caches.keys().then((cacheNames) => {
        console.log('[App] Available caches:', cacheNames);
        // すべてのキャッシュを削除（デプロイ後の不整合を防ぐ）
        const deletePromises = cacheNames.map((cacheName) => {
          console.log('[App] Deleting cache:', cacheName);
          return caches.delete(cacheName);
        });
        
        return Promise.all(deletePromises);
      }).then(() => {
        console.log('[App] All caches cleared on startup');
      }).catch((error) => {
        console.error('[App] Cache clearing failed:', error);
      });
    }

    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      // サービスワーカーからのメッセージをリッスン
      navigator.serviceWorker.addEventListener('message', (event) => {
        if (event.data && event.data.type === 'FORCE_UPDATE') {
          // 少し遅延を入れてからリロードを実行
          setTimeout(() => {
            window.location.reload();
          }, 1000);
        }
      });

      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Service worker registered successfully
          
          // 新しいサービスワーカーが利用可能になったらリロードを実行
          registration.addEventListener('updatefound', () => {
            const newWorker = registration.installing;
            if (newWorker) {
              newWorker.addEventListener('statechange', () => {
                if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  // 新しいバージョンが利用可能 - リロードを実行
                  setTimeout(() => {
                    window.location.reload();
                  }, 1000);
                }
              });
            }
          });

          // 定期的にアップデートをチェック
          setInterval(() => {
            registration.update();
          }, 60000); // 1分ごとにチェック
        })
        .catch(() => {
          // Service worker registration failed
        });
    }
  }, []);

  return null;
}
