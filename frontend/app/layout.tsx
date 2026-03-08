import type { Metadata } from "next";
import {Inter, Roboto_Mono} from "next/font/google";
import Script from "next/script";
import "./globals.css";

const inter = Inter({
  variable: "--app-font-sans",
  subsets: ["latin"],
});

const mono = Roboto_Mono({
  variable: "--app-font-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "HomeToHome.Ai",
  description: "HomeToHome primary application",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Open+Sans:ital,wght@0,300;0,400;0,500;0,600;0,700;1,400&family=Playfair+Display:wght@400;600;700&display=swap"
          rel="stylesheet"
        />
        <link
          rel="stylesheet"
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css"
        />
      </head>
      <body className={`${inter.variable} ${mono.variable} antialiased bg-[#F0F4FA] text-[#202124] h-screen overflow-hidden`}>
        <Script src="https://cdn.tailwindcss.com" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
