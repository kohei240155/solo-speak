const CACHE_NAME = `solo-speak-v${Date.now()}`;
const urlsToCache = [
  '/',
  '/favicon.ico',
];

// インストール時：即座にアクティブ化し、新しいキャッシュを作成
self.addEventListener('install', (event) => {
  console.log('[SW] Installing new service worker');
  // 新しいバージョンがインストールされたら即座にアクティブ化
  self.skipWaiting();
  
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => {
        console.log('[SW] Cache opened:', CACHE_NAME);
        return cache.addAll(urlsToCache).catch((error) => {
          console.warn('[SW] Cache addAll failed:', error);
        });
      })
  );
});

// アクティベート時：古いキャッシュをすべて削除
self.addEventListener('activate', (event) => {
  console.log('[SW] Activating new service worker');
  
  event.waitUntil(
    caches.keys().then((cacheNames) => {
      console.log('[SW] Available caches:', cacheNames);
      const deletePromises = cacheNames.map((cacheName) => {
        if (cacheName !== CACHE_NAME) {
          console.log('[SW] Deleting old cache:', cacheName);
          return caches.delete(cacheName);
        }
      }).filter(Boolean);
      
      return Promise.all(deletePromises);
    }).then(() => {
      console.log('[SW] Old caches cleared');
      // 新しいサービスワーカーがすべてのクライアントを制御するようにする
      return self.clients.claim();
    }).then(() => {
      console.log('[SW] Claimed all clients');
      // すべてのクライアントに強制更新を通知
      return self.clients.matchAll();
    }).then((clients) => {
      console.log('[SW] Notifying clients to update, count:', clients.length);
      clients.forEach((client) => {
        client.postMessage({ 
          type: 'FORCE_UPDATE',
          timestamp: Date.now(),
          cacheCleared: true
        });
      });
    })
  );
});

// クライアントからのメッセージを処理
self.addEventListener('message', (event) => {
  console.log('[SW] Received message:', event.data);
  
  if (event.data && event.data.type === 'SKIP_WAITING') {
    console.log('[SW] Skipping waiting as requested by client');
    self.skipWaiting();
  }
});

self.addEventListener('fetch', (event) => {
  // HTML文書のリクエストは常にネットワークから取得（キャッシュを回避）
  if (event.request.mode === 'navigate' || event.request.destination === 'document') {
    console.log('[SW] Document request, bypassing cache:', event.request.url);
    event.respondWith(
      fetch(event.request).catch(() => {
        // ネットワークエラー時のフォールバック
        return caches.match('/');
      })
    );
    return;
  }

  // 静的アセット（CSS、JS、フォント）の処理
  if (event.request.method === 'GET') {
    const url = new URL(event.request.url);
    
    // Next.jsの静的アセットは常にネットワークから取得
    if (url.pathname.includes('/_next/static/') || 
        url.pathname.includes('/_next/webpack-runtime') ||
        url.pathname.endsWith('.css') ||
        url.pathname.endsWith('.js') ||
        url.pathname.endsWith('.woff') ||
        url.pathname.endsWith('.woff2')) {
      console.log('[SW] Static asset, bypassing cache:', event.request.url);
      event.respondWith(
        fetch(event.request).catch(() => {
          // ネットワークエラー時にキャッシュから取得を試行
          return caches.match(event.request);
        })
      );
      return;
    }
  }

  // その他のリクエストは通常通り処理
  if (event.request.method === 'GET') {
    event.respondWith(
      caches.match(event.request)
        .then((response) => {
          // Cache hit - return response
          if (response) {
            return response;
          }
          return fetch(event.request);
        })
        .catch(() => {
          // Fallback for offline
          if (event.request.destination === 'document') {
            return caches.match('/');
          }
        })
    );
  }
});
