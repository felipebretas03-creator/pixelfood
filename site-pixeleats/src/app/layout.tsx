import type { Metadata } from "next";
import { Inter, Outfit } from "next/font/google";
import "./globals.css";
import BackToTop from "@/components/BackToTop";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const outfit = Outfit({ subsets: ["latin"], variable: "--font-outfit" });

export const metadata: Metadata = {
  title: "Pixeleats - Delivery e Gestão em um só lugar",
  description: "SaaS completo para restaurantes sem taxas por pedido.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR" className="scroll-smooth">
      <body className={`${inter.variable} ${outfit.variable} font-sans`}>
        {children}
        <BackToTop />
      </body>
    </html>
  );
}
