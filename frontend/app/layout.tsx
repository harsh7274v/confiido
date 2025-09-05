import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { AuthProvider } from "./contexts/AuthContext";
import { TimeoutProvider } from "./contexts/TimeoutContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Lumina - Connect with Experts",
  description: "Book 1-on-1 calls with industry experts, mentors, and professionals. Monetize your expertise and connect with people who need your guidance.",
  keywords: "expert consultation, 1-on-1 calls, mentorship, professional services, booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
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
