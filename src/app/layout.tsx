import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import Header from "@/components/layout/Header";
import SecondaryNavigation from "@/components/navigation/SecondaryNavigation";
import ViewportFix from "@/components/common/ViewportFix";
import ServiceWorkerRegistration from "@/components/common/ServiceWorkerRegistration";
import { SettingsRedirect } from "@/components/auth/SettingsRedirect";
import AuthApiConnection from "@/components/auth/AuthApiConnection";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solo Speak",
  description: "Language learning application",
  manifest: "/manifest.json",
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: '32x32', type: 'image/x-icon' },
      { url: '/images/logo/Solo Speak Icon.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/images/logo/Solo Speak Icon.png', sizes: '180x180', type: 'image/png' },
    ],
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "Solo Speak",
  },
  formatDetection: {
    telephone: false,
  },
  other: {
    "mobile-web-app-capable": "yes",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
  themeColor: "#1f2937",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col bg-gray-100 text-gray-900 font-sans`}
        style={{ fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif' }}
      >
        <ViewportFix />
        <ServiceWorkerRegistration />
        <AuthProvider>
          <AuthApiConnection />
          <SettingsRedirect />
          <Header />
          <SecondaryNavigation />
          <main className="flex-1">
            {children}
          </main>
        </AuthProvider>
      </body>
    </html>
  );
}
