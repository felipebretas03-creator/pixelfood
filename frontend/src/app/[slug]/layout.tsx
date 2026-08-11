import { Toaster } from "@/components/Toaster";
import { BottomNavigation } from "@/components/BottomNavigation";

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

  return (
    <>
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
      {children}
      <Toaster />
      <BottomNavigation />
    </>
  );
}
