import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { TimeoutProvider } from "./contexts/TimeoutContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Confiido - Connect with Experts",
  description: "Book 1-on-1 calls with industry experts, mentors, and professionals. Monetize your expertise and connect with people who need your guidance.",
  keywords: "expert consultation, 1-on-1 calls, mentorship, professional services, booking platform",
  manifest: '/manifest.json',
  icons: {
    icon: [
      { url: '/icons/icon-16x16.png', sizes: '16x16', type: 'image/png' },
      { url: '/icons/icon-32x32.png', sizes: '32x32', type: 'image/png' },
    ],
    apple: [
      { url: '/icons/icon-152x152.png', sizes: '152x152', type: 'image/png' },
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
    ],
    other: [
      { rel: 'icon', url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { rel: 'icon', url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#9333ea" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="default" />
        <meta name="apple-mobile-web-app-title" content="Confiido" />
      </head>
      <body className={inter.className} suppressHydrationWarning>
        <AuthProvider>
          <TimeoutProvider>
            <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
              {children}
            </div>
          </TimeoutProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
