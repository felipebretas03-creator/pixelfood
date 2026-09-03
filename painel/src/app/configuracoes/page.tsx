"use client";
import { Save, Upload, Palette, Bike, Store, Check, Power, Loader2, Trash, Plus, LogOut, Camera, CreditCard, Info, ExternalLink, Clock } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import { apiFetch } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import { showToast } from '@/store/toastStore';

export default function ConfiguracoesPage() {
  const [storeName, setStoreName] = useState('Pixeleats Delivery');
  const [primaryColor, setPrimaryColor] = useState('#22c55e');
  const [deliveryType, setDeliveryType] = useState('fixed');
  const [deliveryFee, setDeliveryFee] = useState('5.00');
  const [isOpen, setIsOpen] = useState(true);
  const [logoUrl, setLogoUrl] = useState('');
  const [bannerUrl, setBannerUrl] = useState('');
  const [mpAccessToken, setMpAccessToken] = useState('');
  const [mpPublicKey, setMpPublicKey] = useState('');
  
  const [acceptPix, setAcceptPix] = useState(true);
  const [acceptCreditCardOnline, setAcceptCreditCardOnline] = useState(true);
  const [acceptCardMachine, setAcceptCardMachine] = useState(true);
  const [acceptCash, setAcceptCash] = useState(true);
  
  const [neighborhoods, setNeighborhoods] = useState<any[]>([]);
  const [newCity, setNewCity] = useState('');
  const [newNeighborhood, setNewNeighborhood] = useState('');
  const [newFee, setNewFee] = useState('');
  
  const [businessHours, setBusinessHours] = useState<any>({
    sunday: { isOpen: false, is24Hours: false, open: "18:00", close: "23:00" },
    monday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    tuesday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    wednesday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    thursday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    friday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
    saturday: { isOpen: true, is24Hours: false, open: "18:00", close: "23:00" },
  });
  
  const [isSaving, setIsSaving] = useState(false);
  const [isSaved, setIsSaved] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState('');
  const [isCanceling, setIsCanceling] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const bannerInputRef = useRef<HTMLInputElement>(null);

  const router = useRouter();
  const { logout } = useAuthStore();

  const handleLogout = () => {
    logout();
    router.push('/login');
  };

  const handleCancelSubscription = async () => {
    if (!cancelReason.trim()) {
      showToast('Por favor, informe o motivo do cancelamento.', 'error');
      return;
    }
    
    setIsCanceling(true);
    try {
      const res = await apiFetch('/api/subscription/cancel', {
        method: 'POST',
        body: JSON.stringify({ reason: cancelReason })
      });
      
      const data = await res.json();
      
      if (data.success) {
        showToast('Assinatura cancelada com sucesso.', 'success');
        window.location.href = '/assinatura';
      } else {
        showToast(data.error || 'Erro ao cancelar assinatura.', 'error');
        setIsCanceling(false);
      }
    } catch (error) {
      console.error(error);
      showToast('Erro de conexão.', 'error');
      setIsCanceling(false);
    }
  };

  useEffect(() => {
    apiFetch('/api/settings')
      .then(res => res.json())
      .then(data => {
        if (data) {
          setStoreName(data.storeName);
          setPrimaryColor(data.primaryColor);
          setDeliveryType(data.deliveryType);
          setDeliveryFee(data.deliveryFee.toFixed(2));
          setIsOpen(data.isOpen);
          if (data.logoUrl) setLogoUrl(data.logoUrl);
          if (data.bannerUrl) setBannerUrl(data.bannerUrl);
          if (data.mpAccessToken) setMpAccessToken(data.mpAccessToken);
          if (data.mpPublicKey) setMpPublicKey(data.mpPublicKey);
          
          if (data.acceptPix !== undefined) setAcceptPix(data.acceptPix);
          if (data.acceptCreditCardOnline !== undefined) setAcceptCreditCardOnline(data.acceptCreditCardOnline);
          if (data.acceptCardMachine !== undefined) setAcceptCardMachine(data.acceptCardMachine);
          if (data.acceptCash !== undefined) setAcceptCash(data.acceptCash);
          if (data.businessHours) {
            setBusinessHours((prev: any) => ({ ...prev, ...data.businessHours }));
          }
        }
      })
      .catch(console.error);

    apiFetch('/api/neighborhoods')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setNeighborhoods(data);
        } else {
          setNeighborhoods([]);
        }
      })
      .catch(console.error);
  }, []);

  const handleSave = async () => {
    setIsSaving(true);
    setIsSaved(false);
    
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          primaryColor,
          deliveryType,
          deliveryFee: parseFloat(deliveryFee) || 0,
          isOpen,
          mpAccessToken,
          mpPublicKey,
          acceptPix,
          acceptCreditCardOnline,
          acceptCardMachine,
          acceptCash,
          businessHours
        })
      });
      setIsSaved(true);
      setTimeout(() => setIsSaved(false), 3000);
    } catch (e) {
      console.error(e);
      showToast('Erro ao salvar configurações', 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleToggleStoreStatus = async () => {
    const newStatus = !isOpen;
    setIsOpen(newStatus); // Optimistic update
    
    try {
      await apiFetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          storeName,
          primaryColor,
          deliveryType,
          deliveryFee: parseFloat(deliveryFee) || 0,
          isOpen: newStatus
        })
      });
    } catch (e) {
      console.error(e);
      setIsOpen(!newStatus); // Revert on error
      showToast('Erro ao alterar status da loja', 'error');
    }
  };

  const handleAddNeighborhood = async () => {
    if (!newCity || !newFee) return showToast('Preencha a cidade e o valor do frete', 'error');
    try {
      const res = await apiFetch('/api/neighborhoods', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ city: newCity, neighborhood: newNeighborhood, fee: newFee })
      });
      if (res.ok) {
        const added = await res.json();
        setNeighborhoods([...neighborhoods, added]);
        setNewNeighborhood('');
        setNewFee('');
      } else {
        showToast('Erro ao adicionar bairro', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão', 'error');
    }
  };

  const handleDeleteNeighborhood = async (id: string) => {
    try {
      const res = await apiFetch(`/api/neighborhoods/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setNeighborhoods(neighborhoods.filter(n => n.id !== id));
      }
    } catch (err) {
      showToast('Erro ao excluir bairro', 'error');
    }
  };

  const handleUploadLogo = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const { convertToWebP } = await import('@/lib/imageConverter');
      file = await convertToWebP(file);
    } catch (err) {
      console.error("Erro ao converter logo para WebP", err);
    }
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const res = await apiFetch('/api/settings/logo', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setLogoUrl(data.logoUrl);
      } else {
        showToast(data.error || 'Erro ao subir imagem', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão ao enviar imagem', 'error');
    } finally {
      setIsUploading(false);
    }
  };

  const handleUploadBanner = async (e: React.ChangeEvent<HTMLInputElement>) => {
    let file = e.target.files?.[0];
    if (!file) return;

    setIsUploadingBanner(true);
    try {
      const { convertToWebP } = await import('@/lib/imageConverter');
      // Banners podem ser maiores, então 1200x800
      file = await convertToWebP(file, 1200, 800);
    } catch (err) {
      console.error("Erro ao converter banner para WebP", err);
    }
    const formData = new FormData();
    formData.append('banner', file);

    try {
      const res = await apiFetch('/api/settings/banner', {
        method: 'POST',
        body: formData
      });
      const data = await res.json();
      if (res.ok) {
        setBannerUrl(data.bannerUrl);
      } else {
        showToast(data.error || 'Erro ao subir banner', 'error');
      }
    } catch (err) {
      showToast('Erro de conexão ao enviar banner', 'error');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 w-full">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Configurações</h1>
          <p className="text-stone-500 font-medium mt-1">Ajuste a aparência do app e as regras de entrega.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={isSaving}
          className={`px-6 py-3 rounded-full font-bold shadow-lg transition-all flex items-center gap-2 active:scale-95 text-white disabled:opacity-80 disabled:pointer-events-none ${
            isSaved ? 'bg-emerald-500 shadow-emerald-500/20 hover:bg-emerald-600' : 'bg-brand-500 shadow-brand-500/20 hover:bg-brand-600'
          }`}
        >
          {isSaving ? (
            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
          ) : isSaved ? (
            <Check className="w-5 h-5" />
          ) : (
            <Save className="w-5 h-5" />
          )}
          {isSaving ? 'Salvando...' : isSaved ? 'Salvo com sucesso!' : 'Salvar Alterações'}
        </button>
      </div>

      {/* Mobile Only: Account Actions */}
      <div className="md:hidden bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
        <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
          <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center">
            <Power className="w-5 h-5" />
          </div>
          <h2 className="font-bold text-lg text-stone-900">Conta e Sistema</h2>
        </div>

        <div className="flex flex-col gap-5">
          <button 
            type="button"
            onClick={handleToggleStoreStatus}
            className="flex items-center justify-between bg-stone-50 p-4 rounded-2xl border border-stone-100 w-full text-left touch-action-manipulation active:scale-[0.98] transition-transform"
          >
            <div className="pointer-events-none">
              <span className="block font-bold text-stone-900 text-base">Status da Loja</span>
              <span className="block text-xs font-medium text-stone-500 mt-0.5">Defina se a loja está recebendo pedidos</span>
            </div>
            <div 
              className={`relative w-14 h-8 rounded-full transition-colors duration-300 pointer-events-none shrink-0 ${isOpen ? 'bg-green-500' : 'bg-stone-300'}`}
            >
              <div className={`absolute top-1 bg-white w-6 h-6 rounded-full shadow-sm transition-all duration-300 ${isOpen ? 'left-7' : 'left-1'}`} />
            </div>
          </button>

          <button 
            type="button"
            onClick={handleLogout} 
            className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 px-4 py-4 rounded-2xl font-bold w-full transition-colors active:scale-95 touch-action-manipulation"
          >
            <LogOut className="w-5 h-5 pointer-events-none" />
            <span className="pointer-events-none">Sair do sistema</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Aparência (White Label) */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center">
              <Palette className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-stone-900">Aparência do App</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Nome do Restaurante</label>
              <input 
                type="text" 
                value={storeName}
                onChange={(e) => setStoreName(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Logotipo</label>
              <div className="flex items-center gap-4">
                <div className="w-16 h-16 bg-stone-100 border-2 border-dashed border-stone-300 rounded-2xl flex items-center justify-center overflow-hidden">
                  {logoUrl ? (
                    <img src={logoUrl} alt="Logo" className="w-full h-full object-cover" />
                  ) : (
                    <Store className="w-6 h-6 text-stone-400" />
                  )}
                </div>
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  ref={fileInputRef} 
                  onChange={handleUploadLogo} 
                />
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="bg-white border border-stone-200 text-stone-700 px-4 py-2 rounded-lg text-sm font-bold hover:bg-stone-50 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploading ? 'Enviando...' : 'Trocar Imagem'}
                </button>
              </div>
            </div>

            <div className="pt-4 border-t border-stone-100">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <label className="block text-sm font-bold text-stone-900">Banner Principal</label>
                  <p className="text-xs text-stone-500 mt-0.5">Essa imagem fica no topo do seu cardápio, tanto no celular quanto no computador.</p>
                </div>
                
                <input 
                  type="file" 
                  accept="image/png, image/jpeg, image/webp" 
                  className="hidden" 
                  ref={bannerInputRef} 
                  onChange={handleUploadBanner} 
                />
                
                <button 
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="bg-brand-50 text-brand-700 border border-brand-100 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-brand-100 active:scale-95 transition-all flex items-center gap-2 disabled:opacity-70"
                >
                  {isUploadingBanner ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                  {isUploadingBanner ? 'Enviando...' : 'Enviar Arte (1200x400)'}
                </button>
              </div>

              <div className="w-full h-32 bg-stone-100 border-2 border-dashed border-stone-300 rounded-3xl flex items-center justify-center overflow-hidden relative shadow-inner">
                {bannerUrl ? (
                  <img src={bannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 text-stone-400">
                    <Store className="w-8 h-8 mb-1 opacity-50" />
                    <span className="text-sm font-bold">Área do Banner</span>
                    <span className="text-xs font-medium opacity-70">1200 x 400 pixels</span>
                  </div>
                )}
              </div>
            </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Cor Principal</label>
                <div className="flex items-center gap-3">
                  <input 
                    type="color" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-12 h-12 rounded-xl cursor-pointer border-0 p-0 overflow-hidden"
                  />
                  <input 
                    type="text" 
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-24 bg-stone-50 border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all uppercase"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Status da Loja</label>
                <button 
                  onClick={() => setIsOpen(!isOpen)}
                  className={`w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold transition-colors ${isOpen ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-100 border border-emerald-200' : 'bg-red-50 text-red-600 hover:bg-red-100 border border-red-200'}`}
                >
                  <Power className="w-5 h-5" />
                  {isOpen ? 'Loja Aberta' : 'Loja Fechada'}
                </button>
              </div>
            </div>
        </div>

        {/* Horários de Funcionamento */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-stone-900">Horários de Funcionamento</h2>
          </div>

          <div className="flex flex-col gap-2">
            <p className="text-sm text-stone-500 mb-2">Configure os dias e horários em que seu restaurante atende.</p>
            {Object.entries({
              sunday: "Domingo",
              monday: "Segunda-feira",
              tuesday: "Terça-feira",
              wednesday: "Quarta-feira",
              thursday: "Quinta-feira",
              friday: "Sexta-feira",
              saturday: "Sábado"
            }).map(([key, label]) => {
              const config = businessHours[key];
              return (
                <div key={key} className="flex flex-col bg-white p-3 rounded-xl border border-stone-200 shadow-sm hover:border-brand-200 transition-colors gap-2">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2.5">
                      <label className="relative inline-flex items-center cursor-pointer shrink-0">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={config.isOpen}
                          onChange={(e) => setBusinessHours({ ...businessHours, [key]: { ...config, isOpen: e.target.checked } })}
                        />
                        <div className="w-9 h-5 bg-stone-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                      <span className={`font-bold text-sm ${config.isOpen ? 'text-stone-900' : 'text-stone-400'}`}>{label}</span>
                    </div>
                    {config.isOpen && config.is24Hours && (
                      <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-0.5 rounded-md uppercase tracking-wide border border-brand-100">24h</span>
                    )}
                  </div>

                  {config.isOpen && (
                    <div className="flex items-center justify-between pl-6">
                      <label className="flex items-center gap-1.5 cursor-pointer text-xs font-bold text-stone-600 hover:text-stone-900 transition-colors">
                        <input 
                          type="checkbox"
                          checked={config.is24Hours}
                          onChange={(e) => setBusinessHours({ ...businessHours, [key]: { ...config, is24Hours: e.target.checked } })}
                          className="w-3.5 h-3.5 rounded text-brand-500 border-stone-300 focus:ring-brand-500"
                        />
                        24 Horas
                      </label>

                      {!config.is24Hours && (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input 
                            type="time" 
                            value={config.open}
                            onChange={(e) => setBusinessHours({ ...businessHours, [key]: { ...config, open: e.target.value } })}
                            className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-700 outline-none focus:border-brand-500 focus:bg-white transition-all w-[90px] text-center"
                          />
                          <span className="text-stone-400 text-[10px] font-bold uppercase tracking-wider">até</span>
                          <input 
                            type="time" 
                            value={config.close}
                            onChange={(e) => setBusinessHours({ ...businessHours, [key]: { ...config, close: e.target.value } })}
                            className="bg-stone-50 border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-700 outline-none focus:border-brand-500 focus:bg-white transition-all w-[90px] text-center"
                          />
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Frete e Entrega */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-stone-100 text-stone-500 rounded-xl flex items-center justify-center">
              <Bike className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-stone-900">Frete e Entrega</h2>
          </div>

          <div className="flex flex-col gap-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Tipo de Cobrança</label>
              <select 
                value={deliveryType}
                onChange={(e) => setDeliveryType(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
              >
                <option value="fixed">Valor Fixo Único</option>
                <option value="distance">Por KM de Distância</option>
                <option value="neighborhood">Por Bairros Específicos</option>
                <option value="free">Entrega Grátis</option>
              </select>
            </div>

            {deliveryType === 'neighborhood' ? (
              <div className="flex flex-col gap-4 border border-stone-200 rounded-2xl p-5 bg-stone-50/50">
                <div className="flex flex-col gap-2">
                  <h3 className="font-bold text-stone-900">Bairros e Taxas</h3>
                  <p className="text-xs text-stone-500 mb-2">Cadastre os bairros onde você entrega e o valor do frete para cada um.</p>
                </div>

                {Array.isArray(neighborhoods) && neighborhoods.map(n => (
                  <div key={n.id} className="flex items-center justify-between bg-white p-3 rounded-xl border border-stone-200 shadow-sm">
                    <div className="flex flex-col">
                      <span className="font-bold text-sm text-stone-800">{n.neighborhood || 'Toda a cidade'}</span>
                      <span className="text-xs text-stone-500">{n.city}</span>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold text-brand-600">R$ {Number(n.fee).toFixed(2)}</span>
                      <button onClick={() => handleDeleteNeighborhood(n.id)} className="text-stone-400 hover:text-red-500 transition-colors">
                        <Trash className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
                {(!Array.isArray(neighborhoods) || neighborhoods.length === 0) && (
                  <div className="text-center py-4 text-stone-400 text-sm">Nenhum bairro cadastrado.</div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-12 gap-3 mt-4 border-t border-stone-200 pt-4">
                  <div className="md:col-span-4">
                    <input 
                      type="text" placeholder="Cidade"
                      value={newCity} onChange={e => setNewCity(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="md:col-span-4">
                    <input 
                      type="text" placeholder="Bairro (Opcional)"
                      value={newNeighborhood} onChange={e => setNewNeighborhood(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="md:col-span-3">
                    <input 
                      type="number" placeholder="Valor R$" step="0.50"
                      value={newFee} onChange={e => setNewFee(e.target.value)}
                      className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div className="md:col-span-1 flex items-end">
                    <button onClick={handleAddNeighborhood} className="w-full h-[38px] bg-brand-500 text-white rounded-xl flex items-center justify-center hover:bg-brand-600">
                      <Plus className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            ) : deliveryType !== 'free' ? (
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Valor da Entrega (R$)</label>
                <input 
                  type="number" 
                  value={deliveryFee}
                  onChange={(e) => setDeliveryFee(e.target.value)}
                  step="0.50"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            ) : null}

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Raio Máximo (KM)</label>
                <input 
                  type="number" 
                  defaultValue="8"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-2">Pedido Mínimo (R$)</label>
                <input 
                  type="number" 
                  defaultValue="20.00"
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Métodos de Pagamento */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-emerald-50 text-emerald-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-stone-900">Formas de Pagamento Aceitas</h2>
          </div>

          <div className="grid grid-cols-1 gap-4">
            <label className="flex items-center justify-between p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900">PIX Automático</span>
                <span className="text-xs text-stone-500">QR Code gerado no final do pedido</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: acceptPix ? '#22c55e' : '#e5e7eb' }}>
                <input type="checkbox" className="opacity-0 w-0 h-0" checked={acceptPix} onChange={(e) => setAcceptPix(e.target.checked)} />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${acceptPix ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900">Cartão de Crédito Online</span>
                <span className="text-xs text-stone-500">Pagamento direto no app via Mercado Pago</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: acceptCreditCardOnline ? '#22c55e' : '#e5e7eb' }}>
                <input type="checkbox" className="opacity-0 w-0 h-0" checked={acceptCreditCardOnline} onChange={(e) => setAcceptCreditCardOnline(e.target.checked)} />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${acceptCreditCardOnline ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900">Cartão na Entrega</span>
                <span className="text-xs text-stone-500">Motoboy leva a maquininha</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: acceptCardMachine ? '#22c55e' : '#e5e7eb' }}>
                <input type="checkbox" className="opacity-0 w-0 h-0" checked={acceptCardMachine} onChange={(e) => setAcceptCardMachine(e.target.checked)} />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${acceptCardMachine ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>

            <label className="flex items-center justify-between p-4 border border-stone-200 rounded-xl cursor-pointer hover:bg-stone-50 transition-colors">
              <div className="flex flex-col">
                <span className="font-bold text-stone-900">Dinheiro</span>
                <span className="text-xs text-stone-500">Pagamento no ato da entrega</span>
              </div>
              <div className="relative inline-block w-12 h-6 rounded-full transition-colors duration-200 ease-in-out" style={{ backgroundColor: acceptCash ? '#22c55e' : '#e5e7eb' }}>
                <input type="checkbox" className="opacity-0 w-0 h-0" checked={acceptCash} onChange={(e) => setAcceptCash(e.target.checked)} />
                <span className={`absolute left-1 top-1 bg-white w-4 h-4 rounded-full transition-transform duration-200 ease-in-out ${acceptCash ? 'translate-x-6' : 'translate-x-0'}`} />
              </div>
            </label>
          </div>
        </div>

        {/* Integração Mercado Pago */}
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6 lg:col-span-3">
          <div className="flex items-center gap-3 border-b border-stone-100 pb-4">
            <div className="w-10 h-10 bg-brand-50 text-brand-500 rounded-xl flex items-center justify-center">
              <CreditCard className="w-5 h-5" />
            </div>
            <h2 className="font-bold text-lg text-stone-900">Integração Mercado Pago (Automático)</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Access Token</label>
              <input 
                type="text" 
                value={mpAccessToken}
                onChange={(e) => setMpAccessToken(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-stone-500 mt-1">Usado para aprovar pedidos no servidor.</p>
            </div>
            <div>
              <label className="block text-sm font-bold text-stone-700 mb-2">Public Key</label>
              <input 
                type="text" 
                value={mpPublicKey}
                onChange={(e) => setMpPublicKey(e.target.value)}
                placeholder="APP_USR-..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
              />
              <p className="text-xs text-stone-500 mt-1">Usado para abrir o formulário seguro no aplicativo.</p>
            </div>
          </div>

          {/* Guia de Configuração Mercado Pago */}
          <div className="mt-2 bg-stone-50 border border-stone-200 rounded-2xl p-5">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 text-brand-500">
                <Info className="w-5 h-5" />
              </div>
              <div className="flex-1">
                <h3 className="font-bold text-stone-900 text-sm mb-3">Como encontrar suas chaves de API?</h3>
                <ol className="text-sm text-stone-600 flex flex-col gap-2 list-decimal list-inside">
                  <li>
                    Acesse o <a href="https://www.mercadopago.com.br/developers/panel" target="_blank" rel="noopener noreferrer" className="text-brand-500 font-bold hover:underline inline-flex items-center gap-1">Painel de Desenvolvedor do Mercado Pago <ExternalLink className="w-3 h-3" /></a> e faça login.
                  </li>
                  <li>No menu superior, clique em <strong>"Integrações"</strong> e depois em <strong>"Criar aplicação"</strong> (ou selecione uma existente).</li>
                  <li>Na tela seguinte, responda assim:
                    <ul className="list-disc list-inside ml-4 mt-1 space-y-1 text-stone-500">
                      <li>Qual tipo de solução? <strong>Pagamentos online</strong></li>
                      <li>Como você criou a loja? <strong>Desenvolvimento próprio</strong></li>
                      <li>Qual produto quer integrar? <strong>Checkout Bricks</strong></li>
                    </ul>
                  </li>
                  <li>No menu lateral da sua aplicação, clique em <strong>"Credenciais de Produção"</strong>.</li>
                  <li>Copie a <strong>Public Key</strong> e o <strong>Access Token</strong> gerados e cole nos campos acima.</li>
                </ol>
                <div className="mt-4 text-xs bg-amber-50 text-amber-700 border border-amber-200 p-3 rounded-xl font-medium">
                  <strong>Importante:</strong> Para que o PIX Automático funcione, o Mercado Pago fará um aviso (Webhook) para o seu servidor. Isso só vai funcionar quando a sua loja estiver online na internet.
                </div>
              </div>
            </div>
          </div>
          
          {/* Danger Zone */}
          <div className="mt-12 bg-red-50 border border-red-200 rounded-2xl p-6">
            <h3 className="font-bold text-red-900 text-lg mb-2">Zona de Perigo</h3>
            <p className="text-sm text-red-700 mb-6">Ao cancelar sua assinatura, sua loja sairá do ar imediatamente e você perderá acesso ao painel. Esta ação não pode ser desfeita automaticamente.</p>
            <button
              onClick={() => setShowCancelModal(true)}
              className="bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-xl font-medium transition-colors text-sm"
            >
              Cancelar Assinatura
            </button>
          </div>
        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl relative">
            <button 
              onClick={() => !isCanceling && setShowCancelModal(false)}
              className="absolute top-6 right-6 text-stone-400 hover:text-stone-600 transition-colors"
              disabled={isCanceling}
            >
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>
            </button>
            
            <h3 className="text-2xl font-bold text-stone-900 mb-2">Cancelar Assinatura?</h3>
            <p className="text-stone-500 text-sm mb-6">Sentimos muito em ver você partir. Por favor, nos conte o motivo do cancelamento para podermos melhorar (obrigatório).</p>
            
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="Ex: Encerrei as atividades do restaurante..."
              className="w-full bg-stone-50 border border-stone-200 rounded-xl p-4 text-sm font-medium outline-none focus:border-red-500 focus:bg-white transition-all resize-none h-32 mb-6"
              disabled={isCanceling}
            />
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 bg-stone-100 hover:bg-stone-200 text-stone-700 px-4 py-3 rounded-xl font-medium transition-colors"
                disabled={isCanceling}
              >
                Voltar
              </button>
              <button
                onClick={handleCancelSubscription}
                disabled={isCanceling || !cancelReason.trim()}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-3 rounded-xl font-medium transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {isCanceling && <Loader2 className="w-4 h-4 animate-spin" />}
                Confirmar Cancelamento
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
