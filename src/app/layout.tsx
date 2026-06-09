import type { Metadata, Viewport } from "next";
import { Noto_Sans_Sinhala } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const sinhala = Noto_Sans_Sinhala({
  subsets: ["sinhala", "latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-sinhala",
  display: "swap",
});

const APP_NAME = "බත්පත";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: { default: `${APP_NAME} · Bathpatha`, template: `%s · ${APP_NAME}` },
  description: "Boarding house meal tracker — record meals and track what you owe.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: { telephone: false },
  icons: {
    icon: "/icons/icon-192.png",
    apple: "/icons/apple-icon.png",
  },
};

export const viewport: Viewport = {
  themeColor: "#ea7317",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="si" suppressHydrationWarning>
      <body className={`${sinhala.variable} font-sans`}>
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
