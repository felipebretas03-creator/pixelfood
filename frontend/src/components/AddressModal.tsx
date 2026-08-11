"use client";
import { apiFetch } from '@/lib/api';
/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

import { useState, useEffect } from "react";
import { X, MapPin, Navigation, Search, Loader2, Plus, Check } from "lucide-react";
import { useUserStore } from "@/store/userStore";

interface AddressModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AddressModal({ isOpen, onClose }: AddressModalProps) {
  const { setAddress, address: currentAddress, isAuthenticated } = useUserStore();
  
  const [loadingGps, setLoadingGps] = useState(false);
  const [gpsError, setGpsError] = useState("");
  
  const [streetData, setStreetData] = useState<any>(null);
  const [houseNumber, setHouseNumber] = useState("");
  const [addressLabel, setAddressLabel] = useState("");
  
  // mode: 'list' | 'search' | 'number'
  const [mode, setMode] = useState<'list'|'search'|'number'>('search');
  
  const [manualAddress, setManualAddress] = useState("");
  
  const [savedAddresses, setSavedAddresses] = useState<any[]>([]);
  const [loadingAddresses, setLoadingAddresses] = useState(false);
  const [savingAddress, setSavingAddress] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (isAuthenticated) {
        setMode('list');
        fetchAddresses();
      } else {
        setMode('search');
      }
    }
  }, [isOpen, isAuthenticated]);

  const fetchAddresses = async () => {
    setLoadingAddresses(true);
    try {
      const res = await apiFetch('/api/customer/addresses');
      const data = await res.json();
      if (Array.isArray(data)) {
        setSavedAddresses(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoadingAddresses(false);
    }
  };

  const handleSelectSaved = (addr: any) => {
    setAddress({
      street: addr.street,
      number: addr.number,
      neighborhood: addr.neighborhood || "",
      city: addr.city || "",
      state: addr.state || "",
      lat: addr.lat,
      lon: addr.lon
    });
    closeAndReset();
  };

  const handleGetLocation = () => {
    setGpsError("");
    setLoadingGps(true);

    if (!navigator.geolocation) {
      setGpsError("Seu navegador não suporta geolocalização.");
      setLoadingGps(false);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        try {
          const response = await apiFetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}&zoom=18&addressdetails=1`
          );
          const data = await response.json();
          
          if (data && data.address) {
            const road = data.address.road || data.address.pedestrian || data.address.street || "Rua Desconhecida";
            const neighborhood = data.address.suburb || data.address.neighbourhood || "";
            const city = data.address.city || data.address.town || "";
            const state = data.address.state || "";

            setStreetData({
              street: road,
              neighborhood,
              city,
              state,
              lat: latitude,
              lon: longitude
            });
            setMode('number');
          } else {
            setGpsError("Não foi possível encontrar o endereço para essa localização.");
          }
        } catch (error) {
          setGpsError("Erro ao conectar com o serviço de mapas.");
        } finally {
          setLoadingGps(false);
        }
      },
      (error) => {
        setGpsError("Permissão negada ou erro ao obter localização.");
        setLoadingGps(false);
      },
      { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 }
    );
  };

  const saveToDatabase = async (addressData: any) => {
    if (!isAuthenticated) return;
    setSavingAddress(true);
    try {
      await apiFetch('/api/customer/addresses', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(addressData)
      });
    } catch (e) {
      console.error("Erro ao salvar endereço no banco", e);
    } finally {
      setSavingAddress(false);
    }
  };

  const handleConfirmNumber = async () => {
    if (!houseNumber.trim()) return;
    
    const newAddress = {
      street: streetData.street,
      number: houseNumber,
      neighborhood: streetData.neighborhood,
      city: streetData.city,
      state: streetData.state,
      lat: streetData.lat,
      lon: streetData.lon,
      label: addressLabel,
      isDefault: true
    };

    setAddress(newAddress);
    if (isAuthenticated) await saveToDatabase(newAddress);
    
    closeAndReset();
  };

  const handleManualSubmit = async () => {
    if (!manualAddress.trim()) return;
    
    const newAddress = {
      street: manualAddress,
      number: "S/N",
      isDefault: true
    };
    
    setAddress(newAddress);
    if (isAuthenticated) await saveToDatabase(newAddress);
    
    closeAndReset();
  };

  const closeAndReset = () => {
    onClose();
    setTimeout(() => {
      setMode(isAuthenticated ? 'list' : 'search');
      setHouseNumber("");
      setAddressLabel("");
      setStreetData(null);
      setGpsError("");
      setManualAddress("");
    }, 300);
  };

  if (!isOpen) return null;

  return (
    <div style={{ zIndex: 99999 }} className={`fixed inset-0 flex items-end justify-center ${isOpen ? 'pointer-events-auto' : 'pointer-events-none'}`}>
      <div 
        className={`absolute inset-0 bg-stone-900/60 backdrop-blur-sm transition-opacity duration-300 ${isOpen ? 'opacity-100' : 'opacity-0'}`}
        onClick={closeAndReset}
      />

      <div 
        className={`w-full bg-white rounded-t-[40px] shadow-2xl relative z-10 flex flex-col max-h-[90vh] transition-transform duration-300 ${isOpen ? 'translate-y-0' : 'translate-y-full'}`}
      >
        <button 
          onClick={closeAndReset}
          className="absolute top-6 right-6 z-20 w-10 h-10 bg-stone-100 rounded-full flex items-center justify-center text-stone-600 hover:bg-stone-200 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-8 pt-10 pb-12 overflow-y-auto">
          {mode === 'list' && (
            <>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Meus Endereços</h2>
              <p className="text-stone-500 mb-6 text-sm">Onde você quer receber seu pedido hoje?</p>

              {loadingAddresses ? (
                <div className="flex justify-center items-center py-8">
                  <Loader2 className="w-8 h-8 animate-spin text-brand-500" />
                </div>
              ) : (
                <div className="flex flex-col gap-3 mb-6">
                  {savedAddresses.map((addr) => {
                    const isSelected = currentAddress?.street === addr.street && currentAddress?.number === addr.number;
                    return (
                      <button 
                        key={addr.id}
                        onClick={() => handleSelectSaved(addr)}
                        className={`flex items-center gap-4 p-4 rounded-2xl border transition-all ${isSelected ? 'border-brand-500 bg-brand-50' : 'border-stone-200 hover:border-stone-300'}`}
                      >
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${isSelected ? 'bg-brand-500 text-white' : 'bg-stone-100 text-stone-500'}`}>
                          <MapPin className="w-5 h-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="flex items-center gap-2 mb-1">
                            {addr.label && (
                              <span className="px-2 py-0.5 bg-stone-100 text-stone-600 text-[10px] font-bold uppercase rounded-md">
                                {addr.label}
                              </span>
                            )}
                            <h4 className="font-bold text-stone-900">{addr.street}, {addr.number}</h4>
                          </div>
                          <p className="text-xs text-stone-500 line-clamp-1">{addr.neighborhood ? `${addr.neighborhood}, ` : ''}{addr.city}</p>
                        </div>
                        {isSelected && (
                          <Check className="w-5 h-5 text-brand-500" />
                        )}
                      </button>
                    );
                  })}
                  {savedAddresses.length === 0 && (
                    <div className="text-center py-6 text-stone-500 font-medium text-sm border-2 border-dashed border-stone-200 rounded-2xl">
                      Nenhum endereço salvo.
                    </div>
                  )}
                </div>
              )}

              <button 
                onClick={() => setMode('search')}
                className="w-full bg-brand-50 text-brand-600 border border-brand-100 rounded-2xl p-4 flex items-center justify-center gap-2 font-bold hover:bg-brand-100 transition-colors active:scale-[0.98]"
              >
                <Plus className="w-5 h-5" />
                Adicionar Novo Endereço
              </button>
            </>
          )}

          {mode === 'search' && (
            <>
              <h2 className="text-2xl font-bold text-stone-900 mb-2">Onde você está?</h2>
              <p className="text-stone-500 mb-8 text-sm">Adicione seu endereço para ver o tempo de entrega exato e a taxa.</p>
              
              <button 
                onClick={handleGetLocation}
                disabled={loadingGps}
                className="w-full bg-brand-50 text-brand-600 border border-brand-100 rounded-2xl p-4 flex items-center gap-4 mb-6 hover:bg-brand-100 transition-colors active:scale-[0.98]"
              >
                <div className="w-10 h-10 rounded-full bg-white flex items-center justify-center shadow-sm">
                  {loadingGps ? (
                    <Loader2 className="w-5 h-5 text-brand-500 animate-spin" />
                  ) : (
                    <Navigation className="w-5 h-5 text-brand-500" />
                  )}
                </div>
                <div className="flex flex-col text-left">
                  <span className="font-bold">Usar minha localização atual</span>
                  <span className="text-xs text-brand-500/80">Ativar GPS</span>
                </div>
              </button>

              {gpsError && (
                <div className="mb-6 p-3 bg-red-50 text-red-500 text-xs rounded-xl font-medium border border-red-100">
                  {gpsError}
                </div>
              )}

              <div className="flex items-center gap-4 mb-6">
                <div className="h-px bg-stone-100 flex-1"></div>
                <span className="text-xs font-bold text-stone-300 uppercase tracking-widest">OU</span>
                <div className="h-px bg-stone-100 flex-1"></div>
              </div>

              <div className="relative flex items-center w-full mb-4">
                <Search className="w-5 h-5 text-stone-400 absolute left-4" />
                <input 
                  type="text" 
                  value={manualAddress}
                  onChange={(e) => setManualAddress(e.target.value)}
                  placeholder="Digite seu endereço e número..." 
                  className="w-full pl-12 pr-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-medium text-base"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleManualSubmit();
                  }}
                />
              </div>
              <button 
                onClick={handleManualSubmit}
                disabled={!manualAddress.trim() || savingAddress}
                className="w-full bg-stone-900 text-white rounded-2xl py-4 font-bold disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] transition-transform flex justify-center items-center gap-2"
              >
                {savingAddress ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Confirmar Endereço Manual'}
              </button>

              {isAuthenticated && (
                <button 
                  onClick={() => setMode('list')}
                  className="w-full mt-4 text-stone-400 font-bold text-sm py-2"
                >
                  Voltar para Meus Endereços
                </button>
              )}
            </>
          )}
          
          {mode === 'number' && (
            <>
              <div className="flex items-center gap-3 mb-6">
                <div className="w-12 h-12 bg-brand-100 rounded-full flex items-center justify-center">
                  <MapPin className="w-6 h-6 text-brand-500" />
                </div>
                <div>
                  <h3 className="text-stone-400 text-xs uppercase font-bold tracking-wider mb-1">Rua Encontrada</h3>
                  <p className="font-bold text-lg text-stone-900 leading-tight">{streetData?.street}</p>
                </div>
              </div>

              <h2 className="text-xl font-bold text-stone-900 mb-2">Qual o número do local?</h2>
              <p className="text-stone-500 mb-6 text-sm">Precisamos do número para a entrega.</p>
              
              <div className="flex flex-col gap-4 mb-6">
                <input 
                  type="text" 
                  value={houseNumber}
                  onChange={(e) => setHouseNumber(e.target.value)}
                  placeholder="Número (Ex: 123, S/N)" 
                  autoFocus
                  className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-bold text-lg text-center"
                />

                <input 
                  type="text" 
                  value={addressLabel}
                  onChange={(e) => setAddressLabel(e.target.value)}
                  placeholder="Apelido (Ex: Casa, Trabalho)" 
                  className="w-full px-4 py-4 bg-stone-50 border border-stone-200 rounded-2xl text-stone-800 placeholder-stone-400 focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-all font-bold text-lg text-center"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleConfirmNumber();
                  }}
                />
              </div>
              
              <button 
                onClick={handleConfirmNumber}
                disabled={!houseNumber.trim() || savingAddress}
                className="w-full bg-brand-500 text-white rounded-2xl py-4 font-bold disabled:opacity-50 disabled:active:scale-100 active:scale-[0.98] transition-transform shadow-lg shadow-brand-500/30 flex justify-center items-center gap-2"
              >
                {savingAddress ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Salvar Endereço'}
              </button>
              
              <button 
                onClick={() => setMode('search')}
                className="w-full mt-4 text-stone-400 font-bold text-sm py-2"
              >
                Voltar
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
