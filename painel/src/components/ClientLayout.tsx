"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LayoutDashboard, ShoppingBag, UtensilsCrossed, Users, Ticket, Settings, Store, MonitorPlay, LogOut, Link as LinkIcon, CheckCircle2, ShieldAlert } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/store/authStore";
import { useRouter } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/pedidos", label: "Pedidos", icon: ShoppingBag },
  { href: "/cardapio", label: "Cardápio", icon: UtensilsCrossed },
  { href: "/clientes", label: "Clientes", icon: Users },
  { href: "/marketing", label: "Marketing", icon: Ticket },
  { href: "/configuracoes", label: "Configurações", icon: Settings },
  { href: "/aovivo", label: "Modo TV", icon: MonitorPlay },
];

export default function ClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [isStoreOpen, setIsStoreOpen] = useState(true);
  const { isAuthenticated, logout, tenant } = useAuthStore();
  const [mounted, setMounted] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setMounted(true);

    
    // Unlock Audio Context on first click anywhere in the dashboard
    const unlockAudio = () => {
      try {
        const w = window as any;
        if (!w.__audioInstance) {
          w.__audioInstance = new Audio('/notification.mp3');
          w.__audioInstance.volume = 1.0;
          w.__audioInstance.load();
        }
      } catch (e) {}
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);

    const checkHydration = () => {
      if (useAuthStore.persist.hasHydrated()) {
        setIsHydrated(true);
      } else {
        setTimeout(checkHydration, 50);
      }
    };
    checkHydration();

    return () => document.removeEventListener('click', unlockAudio);
  }, []);

  // Fetch initial store settings
  useEffect(() => {
    if (isAuthenticated && isHydrated) {
      apiFetch('/api/settings')
        .then(res => res.json())
        .then(data => {
          if (data && typeof data.isOpen === 'boolean') {
            setIsStoreOpen(data.isOpen);
          }
        })
        .catch(console.error);
    }
  }, [isAuthenticated, isHydrated]);

  const toggleStoreStatus = async () => {
    const newState = !isStoreOpen;
    setIsStoreOpen(newState); // optimistic update
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        body: JSON.stringify({ isOpen: newState })
      });
    } catch (error) {
      console.error("Erro ao alterar status da loja", error);
      setIsStoreOpen(!newState); // revert on error
    }
  };

  useEffect(() => {
    let timeout: NodeJS.Timeout;
    if (mounted && isHydrated && !isAuthenticated && pathname !== '/login' && pathname !== '/cadastro') {
      timeout = setTimeout(() => {
        router.push('/login');
      }, 50);
    }
    return () => clearTimeout(timeout);
  }, [mounted, isHydrated, isAuthenticated, pathname, router]);

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCopyLink = () => {
    const deliveryLink = `https://pixelfood-app.vercel.app/${tenant?.slug || ''}`; 
    navigator.clipboard.writeText(deliveryLink);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!mounted || !isHydrated) return null;
  if (!isAuthenticated && pathname !== '/login' && pathname !== '/cadastro') return null;

  // Se for painel master, o layout será delegado para app/master/layout.tsx
  if (pathname?.startsWith('/master')) {
    return <>{children}</>;
  }

  return (
    <>
      {/* Top Navigation Bar */}
      {(pathname !== "/aovivo" && pathname !== "/login" && pathname !== "/cadastro") && (
        <header className="bg-white border-b border-stone-200 sticky top-0 z-50 shadow-sm">
          <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
            {/* Logo and Mobile Actions */}
            <div className="flex items-center flex-1 justify-between md:justify-start md:mr-8 md:flex-none">
              <div className="flex items-center gap-3">
                <img src="/logo.png" alt="PixelFood" className="h-8 w-auto object-contain" />
              </div>
              
              {/* Copiar Link - Mobile */}
              {!tenant?.isMaster && (
                <button 
                  onClick={handleCopyLink}
                className="md:hidden flex items-center justify-center w-9 h-9 rounded-full bg-stone-100 text-stone-600 hover:bg-stone-200 active:bg-stone-300 transition-colors"
                title="Copiar link do delivery"
              >
                {copied ? (
                  <CheckCircle2 className="w-4 h-4 text-green-500" />
                ) : (
                  <LinkIcon className="w-4 h-4" />
                )}
              </button>
              )}
            </div>

            {/* Navigation Links - Desktop */}
            <nav className="hidden md:flex flex-1 items-center gap-2">
              {(tenant?.isMaster ? [] : NAV_ITEMS).map((item) => {
                const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
                return (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isActive 
                        ? "bg-brand-50 text-brand-600" 
                        : "text-stone-500 hover:text-stone-900 hover:bg-stone-50"
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    {item.label}
                  </Link>
                );
              })}
            </nav>

            {/* Right Side Actions - Desktop */}
            <div className="hidden md:flex items-center gap-6">
              {!tenant?.isMaster && (
                <>
                  <button 
                onClick={handleCopyLink}
                className="flex items-center gap-2 bg-stone-100 hover:bg-stone-200 text-stone-700 px-3 py-1.5 rounded-lg text-sm font-semibold transition-colors border border-stone-200"
                title="Copiar link do delivery"
              >
                {copied ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-green-500" />
                    <span className="text-green-600">Copiado!</span>
                  </>
                ) : (
                  <>
                    <LinkIcon className="w-4 h-4" />
                    <span>Copiar Link</span>
                  </>
                )}
              </button>

              <div className="flex items-center gap-3">
                <span className={`text-sm font-bold ${isStoreOpen ? 'text-green-600' : 'text-stone-400'}`}>
                  {isStoreOpen ? 'Loja Aberta' : 'Loja Fechada'}
                </span>
                <button 
                  onClick={toggleStoreStatus}
                  className={`relative w-14 h-8 rounded-full transition-colors duration-300 ${isStoreOpen ? 'bg-green-500' : 'bg-stone-200'}`}
                >
                  <div className={`absolute top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-all duration-300 ${isStoreOpen ? 'left-7' : 'left-1'}`} />
                </button>
              </div>
              </>
              )}

              <button type="button" onClick={handleLogout} className="w-10 h-10 bg-stone-100 hover:bg-red-50 rounded-full flex items-center justify-center cursor-pointer border border-stone-200 transition-colors group" title="Sair do sistema">
                <span className="font-bold text-sm text-stone-600 group-hover:hidden pointer-events-none">
                  {tenant?.name ? tenant.name.substring(0, 2).toUpperCase() : 'MF'}
                </span>
                <LogOut className="w-4 h-4 text-red-500 hidden group-hover:block ml-1 pointer-events-none" />
              </button>
            </div>
          </div>
        </header>
      )}

      {/* Mobile Bottom Navigation */}
      {(pathname !== "/aovivo" && pathname !== "/login" && pathname !== "/cadastro" && !tenant?.isMaster) && (
        <nav className="md:hidden fixed bottom-0 left-0 w-full bg-white border-t border-stone-200 shadow-[0_-4px_24px_rgba(0,0,0,0.02)] flex items-center justify-around px-1 py-2 pb-[env(safe-area-inset-bottom,1rem)] z-[9999]">
          {NAV_ITEMS.filter(i => ["Dashboard", "Pedidos", "Cardápio", "Clientes", "Configurações"].includes(i.label)).map((item) => {
            const isActive = pathname === item.href || (item.href !== "/" && pathname?.startsWith(item.href));
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${
                  isActive ? "text-brand-500" : "text-stone-400 hover:text-stone-900"
                }`}
              >
                <item.icon className="w-5 h-5 pointer-events-none" strokeWidth={isActive ? 2.5 : 2} />
                <span className="text-[10px] font-medium tracking-wide truncate w-full text-center pointer-events-none">{item.label}</span>
              </Link>
            );
          })}
        </nav>
      )}

      {/* Main Content Area */}
      <main className={(pathname === "/aovivo" || pathname === "/login" || pathname === "/cadastro") ? "flex-1 w-full" : "flex-1 max-w-[1400px] w-full mx-auto px-6 py-8 pb-24 md:pb-8"}>
        {children}
      </main>
    </>
  );
}
