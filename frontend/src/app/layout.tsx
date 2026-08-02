/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/Toaster";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const outfit = Outfit({
  variable: "--font-outfit",
  subsets: ["latin"],
});

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export const metadata: Metadata = {
  title: "Foodu - Sistema Premium de Delivery",
  description: "Acompanhe seus pedidos, escolha seus pratos e receba em casa com a melhor experiência.",
};

import { BottomNavigation } from "@/components/BottomNavigation";

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  let settings = null;
  try {
    const res = await fetch('http://127.0.0.1:4000/api/settings', { cache: 'no-store' });
    if (res.ok) {
      settings = await res.json();
    }
  } catch (err) {}

  return (
    <html
      lang="pt-BR"
      className={`${inter.variable} ${outfit.variable} h-full antialiased font-sans`}
    >
      <head>
        {settings?.primaryColor && (
          <style dangerouslySetInnerHTML={{__html: `
            :root {
              --color-brand-50: ${settings.primaryColor}15;
              --color-brand-100: ${settings.primaryColor}30;
              --color-brand-200: ${settings.primaryColor}50;
              --color-brand-500: ${settings.primaryColor};
              --color-brand-600: ${settings.primaryColor};
            }
          `}} />
        )}
      </head>
      <body className="min-h-full flex flex-col bg-white text-stone-900 selection:bg-brand-200">
        {children}
        <Toaster />
        <BottomNavigation />
      </body>
    </html>
  );
}
