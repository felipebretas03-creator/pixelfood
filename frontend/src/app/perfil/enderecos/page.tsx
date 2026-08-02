"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { ArrowLeft, MapPin, Plus, Trash2, Home, Briefcase, Check } from "lucide-react";
import { useRouter } from "next/navigation";
import { useUserStore } from "@/store/userStore";
import { useState, useEffect } from "react";
import { AddressModal } from "@/components/AddressModal";

export default function EnderecosPage() {
  const router = useRouter();
  const { isAuthenticated, address: defaultAddress, setAddress } = useUserStore();
  const [mounted, setMounted] = useState(false);
  
  const [enderecos, setEnderecos] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const fetchAddresses = async () => {
    setLoading(true);
    try {
      const res = await apiFetch('http://127.0.0.1:4000/api/customer/addresses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setEnderecos(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setMounted(true);
    if (isAuthenticated) {
      fetchAddresses();
    }
  }, [isAuthenticated]);

  if (!mounted) return null;
  
  if (!isAuthenticated) {
    router.push("/login");
    return null;
  }

  const handleDelete = async (id: string) => {
    if (confirm("Tem certeza que deseja remover este endereço?")) {
      try {
        await apiFetch(`http://127.0.0.1:4000/api/customer/addresses/${id}`, { method: 'DELETE' });
        setEnderecos(enderecos.filter(e => e.id !== id));
      } catch (e) {
        console.error("Erro ao deletar");
      }
    }
  };

  const handleSetDefault = (endereco: any) => {
    setAddress({
      street: endereco.street,
      number: endereco.number,
      neighborhood: endereco.neighborhood,
      city: endereco.city,
      state: endereco.state,
      lat: endereco.lat,
      lon: endereco.lon
    });
  };

  return (
    <main className="flex-1 flex flex-col bg-stone-50 min-h-screen pb-24">
      <header className="px-6 py-4 flex items-center bg-white sticky top-0 z-10 border-b border-stone-100 shadow-sm">
        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900">
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="flex-1 text-center text-xl font-bold text-stone-900 pr-8">Endereços</h1>
      </header>

      <div className="flex-1 p-6 max-w-2xl mx-auto w-full flex flex-col gap-4">
        {loading ? (
           <div className="text-center py-10 text-stone-500 font-medium">Carregando endereços...</div>
        ) : enderecos.length === 0 ? (
          <div className="flex flex-col gap-4">
            <div className="text-center py-10 bg-white rounded-3xl border border-stone-100 shadow-[0_4px_24px_rgba(0,0,0,0.02)]">
              <MapPin className="w-12 h-12 text-stone-200 mx-auto mb-4" />
              <p className="text-stone-500 font-medium">Nenhum endereço salvo.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {enderecos.map(endereco => {
              const isSelected = defaultAddress?.street === endereco.street && defaultAddress?.number === endereco.number;
              
              return (
                <div key={endereco.id} className={`bg-white rounded-3xl p-5 border shadow-sm flex flex-col gap-4 transition-colors ${isSelected ? 'border-brand-500 shadow-brand-500/10' : 'border-stone-100'}`}>
                  <div className="flex gap-4 items-start">
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center shrink-0 ${isSelected ? 'bg-brand-50 text-brand-500' : 'bg-stone-50 text-stone-500'}`}>
                      <MapPin className="w-6 h-6" />
                    </div>
                    <div className="flex-1">
                      <div className="flex justify-between items-start mb-1">
                        <div className="flex items-center gap-2">
                          {endereco.label && (
                            <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-md">
                              {endereco.label}
                            </span>
                          )}
                          <h3 className="font-bold text-stone-900 text-lg">
                            {endereco.street}, {endereco.number}
                          </h3>
                        </div>
                      </div>
                      <p className="text-stone-500 text-sm">{endereco.neighborhood ? `${endereco.neighborhood}, ` : ''}{endereco.city}</p>
                    </div>
                  </div>
                  
                  <div className="h-px bg-stone-100 w-full" />
                  
                  <div className="flex justify-between items-center">
                    <button 
                      onClick={() => handleSetDefault(endereco)}
                      className={`text-sm font-bold flex items-center gap-2 ${isSelected ? 'text-brand-500' : 'text-stone-500 hover:text-stone-700'}`}
                    >
                      {isSelected ? (
                        <><Check className="w-4 h-4" /> Selecionado</>
                      ) : (
                        "Usar este endereço"
                      )}
                    </button>
                    
                    <button 
                      onClick={() => handleDelete(endereco.id)}
                      className="w-10 h-10 rounded-full flex items-center justify-center text-red-400 hover:bg-red-50 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}

        <button onClick={() => setIsModalOpen(true)} className="mt-4 flex items-center justify-center gap-2 border-2 border-dashed border-brand-200 text-brand-500 font-bold bg-brand-50 hover:bg-brand-100 rounded-3xl p-5 transition-colors group">
          <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center shadow-sm group-hover:scale-110 transition-transform">
            <Plus className="w-5 h-5" />
          </div>
          Adicionar Novo Endereço
        </button>
      </div>

      <AddressModal 
        isOpen={isModalOpen} 
        onClose={() => {
          setIsModalOpen(false);
          fetchAddresses();
        }} 
      />
    </main>
  );
}
