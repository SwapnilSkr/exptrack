import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ExpTrack Vault - Personal Finance, Multi-Currency & Subscriptions Tracker",
  description: "Ultra-fast personal finance, wallet management, multi-currency ledger, category budgets, and recurring subscriptions tracker.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
  openGraph: {
    title: "ExpTrack Vault - Personal Finance & Multi-Currency Tracker",
    description: "Track accounts, multi-currency expenses, category budgets, and recurring subscriptions in real-time.",
    siteName: "ExpTrack Vault",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
