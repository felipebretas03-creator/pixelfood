import { Toaster } from "@/components/Toaster";
import { BottomNavigation } from "@/components/BottomNavigation";
import { Metadata } from "next";

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const resolvedParams = await params;
  let title = "Delivery App";
  try {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${backendBase}/api/settings`, { 
      cache: 'no-store',
      headers: { 'x-restaurant-slug': resolvedParams.slug }
    });
    if (res.ok) {
      const settings = await res.json();
      if (settings?.storeName) {
        title = settings.storeName;
      }
    }
  } catch (err) {}
  
  return {
    title: title,
    description: `Faça seu pedido no ${title} com facilidade.`,
  };
}

export default async function SlugLayout({
  children,
  params,
}: Readonly<{
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}>) {
  const resolvedParams = await params;
  let settings = null;
  try {
    const backendBase = process.env.NEXT_PUBLIC_API_URL || '';
    const res = await fetch(`${backendBase}/api/settings`, { 
      cache: 'no-store',
      headers: { 'x-restaurant-slug': resolvedParams.slug }
    });
    if (res.ok) {
      settings = await res.json();
    }
  } catch (err) {}

  let safeColor = '#10b981';
  if (settings?.primaryColor) {
    safeColor = /^#[0-9A-Fa-f]{3}([0-9A-Fa-f]{3})?$/.test(settings.primaryColor)
      ? settings.primaryColor
      : '#10b981';
  }

  return (
    <div style={{
      '--color-brand-50': `${safeColor}15`,
      '--color-brand-100': `${safeColor}30`,
      '--color-brand-200': `${safeColor}50`,
      '--color-brand-500': safeColor,
      '--color-brand-600': safeColor,
    } as React.CSSProperties} className="flex flex-col min-h-screen w-full">
      {children}
      <Toaster />
      <BottomNavigation />
    </div>
  );
}
