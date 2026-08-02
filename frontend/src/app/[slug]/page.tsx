"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { useState, useEffect } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";

import { Search, ArrowRight, MapPin, ChevronRight, Star, Clock, ShoppingBag, User, FileText, Ticket, Heart, CreditCard, Award, HelpCircle, Settings, LogOut, X, Bell } from "lucide-react";
import { ProductModal } from "@/components/ProductModal";
import { AddressModal } from "@/components/AddressModal";
import { NotificationsModal } from "@/components/NotificationsModal";
import { useUserStore } from "@/store/userStore";
import { useNotificationStore } from "@/store/notificationStore";
import { useCartStore } from "@/store/cartStore";

export default function Home() {
  const params = useParams();
  const slug = params?.slug as string;

  const [settings, setSettings] = useState<any>(null);
  const [selectedProduct, setSelectedProduct] = useState<any>(null);
  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [isNotificationsModalOpen, setIsNotificationsModalOpen] = useState(false);
  const [searchInput, setSearchInput] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isProfileDropdownOpen, setIsProfileDropdownOpen] = useState(false);
  
  const { address, userName, userPhoto, isAuthenticated, logout } = useUserStore();
  const unreadNotifications = useNotificationStore((state) => state.notifications.filter(n => !n.read).length);
  const cartItems = useCartStore(state => state.items);
  
  // Para evitar erro de hidratação mostrando endereço no server vs client,
  // vamos usar um estado montado.
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const [categories, setCategories] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    apiFetch('http://127.0.0.1:4000/api/settings')
      .then(res => res.json())
      .then(data => {
        setSettings(data);
        setIsLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setIsLoading(false);
      });

    apiFetch('http://127.0.0.1:4000/api/categories')
      .then(res => res.json())
      .then(data => setCategories(data))
      .catch(console.error);
  }, []);

  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('http://127.0.0.1:4000/api/products')
      .then(res => res.json())
      .then(data => {
        setProducts(data);
      })
      .catch(console.error);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
  };

  if (isLoading) {
    return (
      <main className="flex-1 flex flex-col min-h-screen bg-white items-center justify-center">
        <div className="w-10 h-10 border-4 border-stone-200 border-t-stone-800 rounded-full animate-spin"></div>
      </main>
    );
  }

  return (
    <main className="flex-1 flex flex-col pb-24 bg-white min-h-screen relative">
      {/* Global CSS for hide-scrollbar and dynamic brand color */}
      <style dangerouslySetInnerHTML={{__html: `
        .hide-scrollbar::-webkit-scrollbar { display: none; }
        .hide-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}} />

      {/* Desktop Header (Estilo iFood - Fixo no topo) */}
      <div className="hidden lg:flex sticky top-0 z-50 bg-white border-b border-stone-100 w-full h-20 items-center justify-between px-8 shadow-sm">
        <div className="flex items-center gap-6">
          {settings?.logoUrl ? (
            <img src={settings.logoUrl} alt="Logo" className="h-10 w-auto object-contain rounded-xl" />
          ) : (
            <div className="font-black text-brand-500 text-2xl tracking-tighter">
              {settings?.storeName || 'Foodu'}
            </div>
          )}
          
          <div className="flex items-center gap-2 cursor-pointer bg-stone-50 px-4 py-2 rounded-full hover:bg-stone-100 transition-colors" onClick={() => setIsAddressModalOpen(true)}>
             <MapPin className="w-4 h-4 text-brand-500" />
             <span className="text-sm font-semibold text-stone-700 truncate max-w-[200px]">
               {mounted ? (address ? `${address.street}, ${address.number}` : "Escolher endereço") : "..."}
             </span>
             <ChevronRight className="w-4 h-4 text-stone-400" />
          </div>
        </div>
        
        <div className="flex-1 max-w-xl mx-8">
          <form onSubmit={handleSearch} className="relative flex items-center w-full">
            <div className="absolute left-4 w-5 h-5 flex items-center justify-center">
              <Search className="w-4 h-4 text-stone-400" />
            </div>
            <input 
              type="text" 
              placeholder="Buscar itens e categorias..." 
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="w-full pl-12 pr-4 py-3 bg-stone-50 rounded-lg text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium text-sm border border-transparent focus:border-brand-500/30"
            />
          </form>
        </div>

        <div className="flex items-center gap-4">
          <Link href={`/${slug}/pedidos`} className="flex items-center gap-2 text-stone-700 hover:text-brand-500 transition-colors font-semibold text-sm">
             <FileText className="w-5 h-5" />
             Pedidos
          </Link>
          <div className="relative">
            {isAuthenticated ? (
              <button onClick={() => setIsProfileDropdownOpen(!isProfileDropdownOpen)} className="flex items-center gap-2 text-stone-700 hover:text-brand-500 transition-colors font-semibold text-sm">
                <User className="w-5 h-5" />
                {userName ? userName.split(' ')[0] : "Perfil"}
              </button>
            ) : (
              <Link href={`/${slug}/login`} className="flex items-center gap-2 text-stone-700 hover:text-brand-500 transition-colors font-semibold text-sm">
                <User className="w-5 h-5" />
                Entrar
              </Link>
            )}

            {isProfileDropdownOpen && isAuthenticated && (
              <div className="absolute top-12 right-0 w-80 bg-white rounded-2xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-stone-100 py-4 flex flex-col z-50">
                <div className="px-6 mb-2">
                  <h3 className="font-bold text-2xl text-stone-900">Olá, {userName ? userName.split(' ')[0] : ''}</h3>
                </div>
                
                {/* Promo Notification */}
                <div className="mx-4 mb-4 mt-2 bg-stone-50 rounded-xl p-4 flex items-start gap-3 relative">
                  <button className="absolute top-2 right-2 text-stone-400 hover:text-stone-600"><X className="w-4 h-4" /></button>
                  <div className="w-10 h-10 bg-brand-100 text-brand-500 rounded-lg flex items-center justify-center shrink-0">
                    <Bell className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="font-bold text-stone-800 text-sm">Ative as notificações</h4>
                    <p className="text-xs text-stone-500 mt-1 mb-2 leading-relaxed">Acompanhe de perto o andamento dos seus pedidos, promoções e novidades.</p>
                    <button className="text-brand-500 font-bold text-sm hover:underline">Ativar</button>
                  </div>
                </div>
                
                {/* Menu Items */}
                <div className="flex flex-col">
                  <Link href={`/${slug}/pedidos`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <FileText className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Pedidos
                  </Link>
                  <Link href={`/${slug}/perfil/cupons`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-brand-500 font-medium text-base">
                    <Ticket className="w-6 h-6 text-brand-500" strokeWidth={1.5} /> Meus Cupons
                  </Link>
                  <Link href={`/${slug}/perfil/favoritos`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <Heart className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Favoritos
                  </Link>

                  <Link href={`/${slug}/perfil/fidelidade`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <Award className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Fidelidade
                  </Link>
                  <Link href={`/${slug}/perfil/ajuda`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <HelpCircle className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Ajuda
                  </Link>
                  <Link href={`/${slug}/perfil/enderecos`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <MapPin className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Endereços
                  </Link>
                  <Link href={`/${slug}/perfil/dados`} className="flex items-center gap-4 px-6 py-3 hover:bg-stone-50 transition-colors text-stone-600 font-medium text-base">
                    <Settings className="w-6 h-6 text-stone-400" strokeWidth={1.5} /> Meus dados
                  </Link>
                  
                  <div className="h-px w-full bg-stone-100 my-2" />
                  
                  <button onClick={() => { logout(); setIsProfileDropdownOpen(false); }} className="flex items-center gap-4 px-6 py-3 hover:bg-red-50 transition-colors text-red-500 font-medium text-base w-full text-left">
                    <LogOut className="w-6 h-6 text-red-400" strokeWidth={1.5} /> Sair
                  </button>
                </div>
              </div>
            )}
          </div>
          <Link href={`/${slug}/carrinho`} className="flex items-center justify-center w-10 h-10 bg-brand-50 rounded-full text-brand-500 hover:bg-brand-100 transition-colors relative">
             <ShoppingBag className="w-5 h-5" />
             {mounted && cartItems.length > 0 && (
               <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
                 {cartItems.reduce((acc, item) => acc + item.quantity, 0)}
               </div>
             )}
          </Link>
        </div>
      </div>

      {/* Main Content Container (Limited width on Desktop) */}
      <div className="lg:max-w-6xl lg:mx-auto lg:w-full lg:px-8 w-full flex flex-col">

      {settings?.isOpen === false && (
        <div className="mx-4 mt-4 lg:mt-8 mb-2 bg-white border border-red-100 p-4 rounded-3xl shadow-[0_8px_30px_rgba(239,68,68,0.12)] z-30 flex items-center gap-4 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-1.5 h-full bg-red-500 rounded-l-3xl"></div>
          <div className="w-12 h-12 bg-red-50 text-red-500 rounded-2xl flex items-center justify-center shrink-0 ml-2 shadow-inner">
            <Clock className="w-6 h-6" strokeWidth={2.5} />
          </div>
          <div className="flex-1 pr-2">
            <h3 className="font-black text-red-600 text-base tracking-tight mb-0.5">Loja Fechada no momento</h3>
            <p className="text-stone-500 text-xs font-medium leading-relaxed">
              Você ainda pode consultar nosso cardápio. Volte em breve!
            </p>
          </div>
        </div>
      )}

      {/* Header Profile & Address (Mobile) */}
      <header className="px-6 pt-6 pb-4 flex lg:hidden items-center justify-between bg-white z-10">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-xl overflow-hidden bg-stone-100 flex-shrink-0 border border-stone-200 flex items-center justify-center">
            {settings?.logoUrl ? (
              <img src={settings.logoUrl} alt="Logo" className="w-full h-full object-cover" />
            ) : (
              <img src={`https://ui-avatars.com/api/?name=${settings?.storeName?.[0] || 'F'}&background=10b981&color=fff&size=128`} alt="Logo do Restaurante" className="w-full h-full object-cover" />
            )}
          </div>
          <div className="flex flex-col">
            <span className="text-xs text-stone-400 font-bold tracking-wider uppercase mb-0.5">
              {mounted ? `Olá, ${userName} 👋` : "Carregando..."}
            </span>
            <div 
              className="flex items-center gap-1 cursor-pointer"
              onClick={() => setIsAddressModalOpen(true)}
            >
              <span className="text-stone-800 font-semibold text-sm max-w-[220px] truncate">
                {mounted 
                  ? (address 
                      ? `${address.street}, ${address.number} - ${address.neighborhood || ''}, ${address.city || ''}`.replace(/ - , $/, '') 
                      : "Escolher endereço") 
                  : "Carregando..."}
              </span>
              <ChevronRight className="w-4 h-4 text-stone-800 flex-shrink-0" />
            </div>
          </div>
        </div>
        <button 
          onClick={() => setIsNotificationsModalOpen(true)}
          className="w-10 h-10 rounded-full border border-stone-200 flex items-center justify-center bg-white shadow-sm active:scale-95 transition-transform"
        >
          <div className="relative">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
              <path d="M13.73 21a2 2 0 0 1-3.46 0" />
            </svg>
            {mounted && unreadNotifications > 0 && (
              <div className="absolute top-0 right-0.5 w-2 h-2 bg-brand-500 rounded-full border-2 border-white" />
            )}
          </div>
        </button>
      </header>

      {/* Hero Section */}
      <section className="pt-0 pb-2 lg:mt-8 px-4 lg:px-0">
        <div className="w-full rounded-2xl lg:rounded-3xl bg-stone-900 text-white p-6 pt-6 lg:pt-8 relative overflow-hidden flex flex-col justify-center min-h-[160px] lg:min-h-[300px]">
          {/* Logo do Restaurante (Mobile) - removido o fixo absoluto, incorporado ao layout se não tiver banner */}
          
          {settings?.bannerUrl ? (
            <img 
              src={settings.bannerUrl} 
              alt="Banner Restaurante" 
              className="absolute inset-0 w-full h-full object-cover z-0"
            />
          ) : (
            <>
              <div className="z-10 w-2/3 relative px-2">
                <span className="inline-block px-3 py-1 bg-brand-500 text-white text-xs font-bold rounded-full mb-3 uppercase tracking-wider">
                  Entrega Rápida 🚀
                </span>
                <h2 className="text-3xl font-bold mb-3 leading-tight text-white">
                  Sua comida favorita na sua porta.
                </h2>
                <p className="text-stone-300 text-sm mb-5 font-medium leading-relaxed">
                  O melhor do nosso cardápio entregue quentinho no conforto da sua casa.
                </p>
                <button className="bg-brand-500 text-white px-6 py-3.5 rounded-full font-bold text-sm shadow-lg shadow-brand-500/40 hover:bg-brand-400 transition-colors">
                  Ver Cardápio
                </button>
              </div>
              
              {/* Imagem flutuante na direita */}
              <div className="absolute right-[-40px] top-1/2 transform -translate-y-1/2 w-48 h-48 lg:w-72 lg:h-72 z-0 opacity-40 lg:opacity-100">
                <img 
                  src="https://images.unsplash.com/photo-1550547660-d9450f859349?q=80&w=600&auto=format&fit=crop" 
                  alt="Delicious Burger" 
                  className="w-full h-full object-cover rounded-full border-8 border-stone-800 shadow-2xl"
                />
              </div>
              
              {/* Elementos decorativos */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-brand-500/20 rounded-full blur-3xl lg:blur-[80px]" />
            </>
          )}
        </div>
      </section>



      {/* Search Bar (Mobile) */}
      <div className="px-6 mt-4 lg:hidden">
        <form onSubmit={handleSearch} className="relative flex items-center w-full">
          <div className="absolute left-4 w-5 h-5 flex items-center justify-center">
            <Search className="w-5 h-5 text-stone-400" />
          </div>
          <input 
            type="text" 
            placeholder="Buscar no cardápio..." 
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full pl-12 pr-12 py-4 bg-stone-50 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:ring-1 focus:ring-brand-500 transition-all font-medium text-base"
          />
          <button type="submit" className="absolute right-3 w-8 h-8 flex items-center justify-center bg-brand-500 rounded-xl shadow-md shadow-brand-500/30 active:scale-95 transition-transform">
            <ArrowRight className="w-4 h-4 text-white" />
          </button>
        </form>
      </div>

      {/* Categories Grid */}
      <section className="mt-8 px-6 lg:px-0">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Categorias</h2>
        </div>
        <div className="grid grid-cols-4 lg:flex lg:flex-row lg:gap-6 lg:overflow-x-auto lg:pb-4 lg:hide-scrollbar gap-4">
          {categories.map((cat) => {
            const isActive = selectedCategory === cat.name;
            return (
              <div 
                key={cat.id} 
                onClick={() => setSelectedCategory(isActive ? null : cat.name)}
                className="flex flex-col items-center gap-2 cursor-pointer group"
              >
                <div className={`w-16 h-16 lg:w-20 lg:h-20 rounded-2xl flex items-center justify-center text-2xl lg:text-3xl transition-all duration-300 ${isActive ? 'bg-brand-500 text-white shadow-lg shadow-brand-500/30 scale-105' : 'bg-stone-50 group-hover:bg-brand-50'}`}>
                  {cat.icon}
                </div>
                <span className={`text-xs lg:text-sm font-bold text-center ${isActive ? 'text-brand-500' : 'text-stone-600'}`}>
                  {cat.name}
                </span>
              </div>
            );
          })}
        </div>
      </section>

      {/* Menu / Products Grouped by Category */}
      <section className="mt-8 px-6 lg:px-0 flex flex-col gap-10">
        {categories.map(cat => {
          if (selectedCategory && selectedCategory !== cat.name) return null;
          
          const term = searchInput.toLowerCase();
          const catProducts = products.filter(p => {
             if (p.category !== cat.name) return false;
             if (term) return p.name.toLowerCase().includes(term) || p.description.toLowerCase().includes(term);
             return true;
          });

          if (catProducts.length === 0) return null;

          return (
            <div key={cat.name} id={`category-${cat.name}`}>
              <h2 className="text-xl font-bold mb-4">{cat.name}</h2>
              <div className="flex flex-col lg:grid lg:grid-cols-2 lg:gap-6 gap-5">
                {catProducts.map((prod) => (
                  <div 
                    key={prod.id}
                    id={`product-${prod.id}`}
                    onClick={() => setSelectedProduct(prod)}
                    className="flex flex-row gap-4 lg:gap-6 items-center lg:items-stretch bg-white rounded-3xl lg:rounded-2xl p-3 lg:p-4 shadow-[0_4px_24px_rgba(0,0,0,0.04)] lg:shadow-sm border border-stone-50 lg:border-stone-200 text-left active:scale-[0.98] transition-transform cursor-pointer hover:border-brand-500 group"
                  >
                    <div className="w-24 h-24 lg:w-32 lg:h-32 rounded-2xl overflow-hidden flex-shrink-0 relative">
                      <img src={prod.image} alt={prod.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    </div>
                    <div className="flex-1 flex flex-col justify-center py-1">
                      <h3 className="font-bold text-stone-800 lg:text-stone-900 text-lg leading-tight mb-1">{prod.name}</h3>
                      <p className="text-xs lg:text-sm text-stone-400 lg:text-stone-500 font-medium mb-3 lg:mb-4 lg:line-clamp-2">{prod.description}</p>
                      <div className="flex items-center gap-4 mt-auto">
                        <span className="font-bold text-brand-500 text-lg">R$ {prod.price.toFixed(2).replace('.', ',')}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>

      </div> {/* Fim do Container Desktop */}

      <ProductModal 
        product={selectedProduct} 
        onClose={() => setSelectedProduct(null)} 
        isStoreOpen={settings?.isOpen ?? true}
      />

      <AddressModal 
        isOpen={isAddressModalOpen} 
        onClose={() => setIsAddressModalOpen(false)} 
      />

      <NotificationsModal 
        isOpen={isNotificationsModalOpen} 
        onClose={() => setIsNotificationsModalOpen(false)} 
      />
    </main>
  );
}
