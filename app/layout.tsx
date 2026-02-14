import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "48hr Hotel Booking - Soft Launch",
  description: "Experience the unforgettable stay with 48hr Hotel Booking. Join us for our soft launch and be the first to explore our exclusive offers and seamless booking experience. Don't miss out on the chance to turn unsold rooms into unforgettable stays!",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning={true}>
      <head>
        {/* Preload images for home page */}
        <link rel="preload" href="/STC_logo.svg" as="image" fetchPriority="high" />
        <link rel="preload" href="/48hr_logo.svg" as="image" fetchPriority="high" />
        {/* Preload agenda images used on first navigation to /adenda */}
        <link rel="preload" href="/3Desktop.png" as="image" media="(min-width: 1024px)" fetchPriority="high" />
        <link rel="preload" href="/3Mobile.png" as="image" media="(max-width: 1023px)" fetchPriority="high" />
        {/* Preload custom font used on the home hero (OdenaGlamour) */}
        <link rel="preload" href="/font/OdenaGlamour-BF6625f66aead7f.woff2" as="font" type="font/woff2" crossOrigin="anonymous" />
      </head>

      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
