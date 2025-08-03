'use client';

import { useEffect } from 'react';

export default function ServiceWorkerRegistration() {
  useEffect(() => {
    if (
      typeof window !== 'undefined' &&
      'serviceWorker' in navigator &&
      process.env.NODE_ENV === 'production'
    ) {
      navigator.serviceWorker.register('/sw.js')
        .then((registration) => {
          // Service worker registered successfully
        })
        .catch((registrationError) => {
          // Service worker registration failed
        });
    }
  }, []);

  return null;
}
