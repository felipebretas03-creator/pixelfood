'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/authStore';
import { 
  LayoutDashboard, 
  Store, 
  Activity, 
  MessageSquare,
  LogOut,
  Package
} from 'lucide-react';

const MASTER_NAV = [
  { label: 'Dashboard', href: '/master', icon: LayoutDashboard },
  { label: 'Lojas', href: '/master/lojas', icon: Store },
  { label: 'Planos', href: '/master/planos', icon: Package },
  { label: 'Auditoria', href: '/master/auditoria', icon: Activity },
  { label: 'Comunicados', href: '/master/comunicados', icon: MessageSquare },
];

export default function MasterLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { tenant, logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  // Se não for master, não renderiza (proteção extra no client)
  if (tenant && !tenant.isMaster) {
    if (typeof window !== 'undefined') router.push('/');
    return null;
  }

  return (
    <div className={`min-h-screen flex flex-col ${pathname === '/master' ? 'bg-stone-950 text-stone-300' : 'bg-stone-50 text-stone-900'}`}>
      {/* Top Header */}
      <header className="bg-stone-900 text-white border-b border-stone-800 sticky top-0 z-50 shadow-sm">
        <div className="max-w-[1400px] mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <img src="/logo.png" alt="Pixeleats" className="h-8 w-auto object-contain brightness-0 invert" />
            <span className="px-2 py-1 bg-red-500/20 text-red-400 text-xs font-bold uppercase tracking-wider rounded-md border border-red-500/20">
              Master
            </span>
          </div>

          <nav className="hidden md:flex flex-1 items-center gap-2 ml-10">
            {MASTER_NAV.map((item) => {
              const isActive = pathname === item.href || (item.href !== '/master' && pathname?.startsWith(item.href));
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    isActive 
                      ? "bg-white/10 text-white" 
                      : "text-stone-400 hover:text-white hover:bg-white/5"
                  }`}
                >
                  <item.icon className="w-4 h-4" />
                  {item.label}
                </Link>
              );
            })}
          </nav>

          <div className="flex items-center gap-6">
            <button 
              onClick={handleLogout} 
              className="flex items-center gap-2 text-stone-400 hover:text-white transition-colors text-sm font-semibold"
            >
              <LogOut className="w-4 h-4" />
              Sair
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Bottom Navigation */}
      <nav className="md:hidden fixed bottom-0 left-0 w-full bg-stone-900 border-t border-stone-800 flex items-center justify-around px-1 py-2 pb-[env(safe-area-inset-bottom,1rem)] z-[9999]">
        {MASTER_NAV.map((item) => {
          const isActive = pathname === item.href || (item.href !== '/master' && pathname?.startsWith(item.href));
          return (
            <Link 
              key={item.href} 
              href={item.href}
              className={`flex flex-col items-center justify-center w-16 gap-1 transition-colors ${
                isActive ? "text-white" : "text-stone-500 hover:text-stone-300"
              }`}
            >
              <item.icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
              <span className="text-[10px] font-medium tracking-wide truncate w-full text-center">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      {/* Main Content Area */}
      <main className={`flex-1 flex flex-col max-w-[1400px] w-full mx-auto pb-24 md:pb-8 ${pathname === '/master' ? 'px-4 py-6 md:px-8 md:py-10' : 'px-6 py-8'}`}>
        <div className="flex-1 w-full">
          {children}
        </div>
        
        <footer className="w-full text-center py-6 mt-auto text-stone-400 text-xs md:text-sm">
          &copy; {new Date().getFullYear()} Pixeleats. Todos os direitos reservados. Uma empresa do grupo <a href="https://pixeloo.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-stone-900 transition-colors underline">Pixeloo</a>.
        </footer>
      </main>
    </div>
  );
}
