import type { Metadata } from "next";
import { Geist, Geist_Mono, Noto_Sans_SC, Playwrite_IT_Moderna } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const notoSansSC = Noto_Sans_SC({
  variable: "--font-noto-sans-sc",
  subsets: ["latin"],
  weight: ["400", "500", "700"],
});

const playwrite = Playwrite_IT_Moderna({
  variable: "--font-playwrite",
  weight: "300",
});

export const metadata: Metadata = {
  title: "Pet Care Chat - 24/7 Pet Health Assistant",
  description: "Get instant answers to your pet care questions. Available 24/7 for all your pet health, nutrition, and behavior concerns.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${notoSansSC.variable} ${playwrite.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
