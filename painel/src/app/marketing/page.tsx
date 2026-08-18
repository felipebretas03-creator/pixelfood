"use client";
import { Ticket, Plus, Copy, Trash2, Power, Star, Save, X } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';
import { showToast } from '@/store/toastStore';

export default function MarketingPage() {
  const [coupons, setCoupons] = useState<any[]>([]);
  const [loyalty, setLoyalty] = useState({ active: false, pointsPerReal: 1, pointsToReward: 100, rewardValue: 15, rewardType: 'DISCOUNT', rewardText: '' });

  useEffect(() => {
    apiFetch('/api/coupons').then(res => res.json()).then(setCoupons).catch(console.error);
    apiFetch('/api/loyalty').then(res => res.json()).then(setLoyalty).catch(console.error);
  }, []);

  // Coupon Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [couponToDelete, setCouponToDelete] = useState<string | null>(null);
  const [formData, setFormData] = useState({ code: '', type: 'PERCENTAGE', value: '', limit: '', ruleType: 'ALL', ruleCategory: 'Hambúrguer', oncePerCustomer: false });

  const toggleStatus = async (id: string, currentActive: boolean) => {
    try {
      const res = await apiFetch(`/api/coupons/${id}/status`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !currentActive })
      });
      const updated = await res.json();
      setCoupons(prev => prev.map(c => c.id === id ? updated : c));
    } catch (e) { console.error(e); }
  };

  const confirmDelete = async () => {
    if (!couponToDelete) return;
    try {
      await apiFetch(`/api/coupons/${couponToDelete}`, { method: 'DELETE' });
      setCoupons(prev => prev.filter(c => c.id !== couponToDelete));
      setCouponToDelete(null);
    } catch (e) { console.error(e); }
  };

  const handleSaveCoupon = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const newValue = parseFloat(formData.value.replace(',', '.'));
    const newLimit = parseInt(formData.limit, 10);
    
    if (formData.type !== 'DELIVERY' && (isNaN(newValue) || newValue <= 0)) {
      return showToast("Valor inválido", 'error');
    }

    const newCouponPayload = {
      code: formData.code.toUpperCase().replace(/\s+/g, ''),
      type: formData.type,
      value: formData.type === 'DELIVERY' ? 0 : newValue,
      active: true,
      usageLimit: isNaN(newLimit) || newLimit <= 0 ? null : newLimit,
      used: 0,
      ruleType: formData.ruleType,
      ruleCategory: formData.ruleCategory,
      oncePerCustomer: formData.oncePerCustomer
    };

    try {
      const res = await apiFetch('/api/coupons', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newCouponPayload)
      });
      const newCoupon = await res.json();
      setCoupons(prev => [newCoupon, ...prev]);
      setIsModalOpen(false);
      setFormData({ code: '', type: 'PERCENTAGE', value: '', limit: '', ruleType: 'ALL', ruleCategory: 'Hambúrguer', oncePerCustomer: false });
    } catch (e) {
      showToast('Erro ao salvar cupom', 'error');
    }
  };

  const saveLoyalty = async (newLoyalty: any) => {
    setLoyalty(newLoyalty);
    try {
      await apiFetch('/api/loyalty', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newLoyalty)
      });
    } catch (e) { console.error(e); }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Marketing</h1>
          <p className="text-stone-500 font-medium mt-1">Crie cupons de desconto para atrair mais vendas.</p>
        </div>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-brand-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Cupom
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => (
          <div key={coupon.id} className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 relative overflow-hidden group">
            {/* Status indicator */}
            <div className={`absolute top-0 left-0 w-full h-1.5 ${coupon.active ? 'bg-brand-500' : 'bg-stone-300'}`} />
            
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${coupon.active ? 'bg-brand-50 text-brand-500' : 'bg-stone-100 text-stone-400'}`}>
                  <Ticket className="w-6 h-6" />
                </div>
                <div>
                  <h3 className="font-black text-xl tracking-tight text-stone-900">{coupon.code}</h3>
                  <div className="flex items-center flex-wrap gap-2 mt-1">
                    <p className="text-sm font-medium text-stone-500">
                      {coupon.type === 'PERCENTAGE' ? `${coupon.value}% de desconto` : 
                       coupon.type === 'FIXED' ? `R$ ${coupon.value.toFixed(2).replace('.', ',')} de desconto` : 
                       'Frete Grátis'}
                    </p>
                    {coupon.ruleType === 'SPECIFIC' && (
                      <span className="bg-stone-100 text-stone-600 px-2 py-0.5 rounded ml-1 text-xs font-bold border border-stone-200">
                        Só {coupon.ruleCategory}
                      </span>
                    )}
                    {coupon.oncePerCustomer && (
                      <span className="bg-amber-50 text-amber-600 px-2 py-0.5 rounded ml-1 text-xs font-bold border border-amber-100">
                        1x por cliente
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-stone-50 rounded-2xl p-4 mb-6">
              <div className="flex justify-between text-sm mb-1">
                <span className="font-semibold text-stone-600">Usos</span>
                <span className="font-bold text-stone-900">{coupon.used} {coupon.usageLimit ? `/ ${coupon.usageLimit}` : '(Ilimitado)'}</span>
              </div>
              <div className="w-full bg-stone-200 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full ${coupon.active ? 'bg-brand-500' : 'bg-stone-400'}`} 
                  style={{ width: coupon.usageLimit ? `${(coupon.used / coupon.usageLimit) * 100}%` : '100%' }}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button 
                onClick={() => toggleStatus(coupon.id, coupon.active)}
                className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-bold transition-all border ${
                  coupon.active ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-brand-200 text-brand-600 bg-brand-50 hover:bg-brand-100'
                }`}
              >
                <Power className="w-4 h-4" />
                {coupon.active ? 'Pausar' : 'Ativar'}
              </button>
              <button 
                onClick={() => {
                  navigator.clipboard.writeText(coupon.code);
                  showToast("Código copiado!", 'success');
                }}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-stone-100 text-stone-500 hover:text-stone-900 hover:bg-stone-200 transition-colors"
                title="Copiar código"
              >
                <Copy className="w-4 h-4" />
              </button>
              <button 
                onClick={() => setCouponToDelete(coupon.id)}
                className="w-10 h-10 flex items-center justify-center rounded-xl bg-red-50 text-red-500 hover:text-white hover:bg-red-500 transition-colors"
                title="Excluir cupom"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Programa de Fidelidade */}
      <div className="mt-8 bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6 relative overflow-hidden">
        <div className={`absolute top-0 left-0 w-1.5 h-full ${loyalty.active ? 'bg-amber-500' : 'bg-stone-300'}`} />
        
        <div className="flex items-center justify-between pl-4">
          <div className="flex items-center gap-3">
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${loyalty.active ? 'bg-amber-50 text-amber-500' : 'bg-stone-100 text-stone-400'}`}>
              <Star className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-black text-stone-900">Programa de Fidelidade</h2>
              <p className="text-stone-500 text-sm font-medium mt-0.5">Recompense clientes recorrentes com pontos a cada pedido.</p>
            </div>
          </div>
          <button 
            onClick={() => saveLoyalty({ ...loyalty, active: !loyalty.active })}
            className={`px-4 py-2.5 rounded-xl text-sm font-bold transition-all border flex items-center gap-2 ${
              loyalty.active ? 'border-amber-200 text-amber-600 bg-amber-50 hover:bg-amber-100' : 'border-stone-200 text-stone-600 bg-stone-50 hover:bg-stone-100'
            }`}
          >
            <Power className="w-4 h-4" />
            {loyalty.active ? 'Programa Ativo' : 'Programa Pausado'}
          </button>
        </div>

        <div className="pl-4 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
            <label className="block text-sm font-bold text-stone-700 mb-3">Acúmulo de Pontos</label>
            <div className="flex items-center gap-2">
              <span className="text-stone-500 font-bold">R$ 1,00 =</span>
              <input 
                type="number" 
                value={loyalty.pointsPerReal}
                onChange={(e) => saveLoyalty({ ...loyalty, pointsPerReal: Number(e.target.value) })}
                className="w-20 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-amber-500 transition-all text-center"
              />
              <span className="text-stone-500 font-bold">Ponto(s)</span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100">
            <label className="block text-sm font-bold text-stone-700 mb-3">Meta para Resgate</label>
            <div className="flex items-center gap-2">
              <input 
                type="number" 
                value={loyalty.pointsToReward}
                onChange={(e) => saveLoyalty({ ...loyalty, pointsToReward: Number(e.target.value) })}
                className="w-24 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-amber-500 transition-all text-center"
              />
              <span className="text-stone-500 font-bold">Pontos</span>
            </div>
          </div>

          <div className="bg-stone-50 rounded-2xl p-5 border border-stone-100 flex flex-col gap-3">
            <div className="flex justify-between items-center mb-1">
              <label className="block text-sm font-bold text-stone-700">Recompensa</label>
              <select 
                value={loyalty.rewardType || 'DISCOUNT'}
                onChange={(e) => saveLoyalty({ ...loyalty, rewardType: e.target.value })}
                className="bg-white border border-stone-200 rounded-lg px-2 py-1 text-xs font-bold text-stone-600 outline-none focus:border-amber-500"
              >
                <option value="DISCOUNT">Desconto</option>
                <option value="PRODUCT">Brinde</option>
              </select>
            </div>
            
            {(!loyalty.rewardType || loyalty.rewardType === 'DISCOUNT') ? (
              <div className="flex items-center gap-2">
                <span className="text-stone-500 font-bold">R$</span>
                <input 
                  type="number" 
                  value={loyalty.rewardValue}
                  onChange={(e) => saveLoyalty({ ...loyalty, rewardValue: Number(e.target.value) })}
                  className="w-24 bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-bold outline-none focus:border-amber-500 transition-all text-center"
                />
                <span className="text-stone-500 font-bold">off</span>
              </div>
            ) : (
              <div className="flex flex-col gap-1">
                <input 
                  type="text" 
                  placeholder="Ex: 1 Refri 2L"
                  value={loyalty.rewardText || ''}
                  onChange={(e) => saveLoyalty({ ...loyalty, rewardText: e.target.value })}
                  className="w-full bg-white border border-stone-200 rounded-xl px-3 py-2 text-sm font-medium outline-none focus:border-amber-500 transition-all"
                />
              </div>
            )}
          </div>
        </div>

        <div className="flex justify-end pl-4 mt-2">
          <button className="bg-stone-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-stone-800 transition-all flex items-center gap-2 shadow-sm text-sm">
            <Save className="w-4 h-4" />
            Salvar Regras
          </button>
        </div>
      </div>

      {/* Modal Novo Cupom */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-md shadow-2xl flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-black text-stone-900">Novo Cupom</h2>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveCoupon} className="flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Código do Cupom</label>
                <div className="relative">
                  <Ticket className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
                  <input 
                    required
                    type="text" 
                    value={formData.code}
                    onChange={(e) => setFormData({...formData, code: e.target.value.toUpperCase()})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl pl-12 pr-4 py-3 text-sm font-black text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all uppercase tracking-widest placeholder:font-medium placeholder:tracking-normal"
                    placeholder="Ex: QUEROPIZZA"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5">Tipo de Desconto</label>
                  <select 
                    value={formData.type}
                    onChange={(e) => setFormData({...formData, type: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="PERCENTAGE">Porcentagem (%)</option>
                    <option value="FIXED">Valor Fixo (R$)</option>
                    <option value="DELIVERY">Frete Grátis</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5">
                    {formData.type === 'PERCENTAGE' ? 'Desconto (%)' : formData.type === 'FIXED' ? 'Desconto (R$)' : 'Valor (R$)'}
                  </label>
                  <input 
                    required={formData.type !== 'DELIVERY'}
                    disabled={formData.type === 'DELIVERY'}
                    type="number" 
                    step="0.01"
                    min="0"
                    value={formData.type === 'DELIVERY' ? '' : formData.value}
                    onChange={(e) => setFormData({...formData, value: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    placeholder={formData.type === 'PERCENTAGE' ? '15' : '10.00'}
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-700 mb-1.5">Limite de Usos Totais</label>
                <input 
                  required
                  type="number" 
                  min="1"
                  value={formData.limit}
                  onChange={(e) => setFormData({...formData, limit: e.target.value})}
                  className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                  placeholder="Ex: 100"
                />
              </div>

              <div className="flex items-center gap-3">
                <label className="relative inline-flex items-center cursor-pointer">
                  <input 
                    type="checkbox" 
                    className="sr-only peer" 
                    checked={formData.oncePerCustomer}
                    onChange={(e) => setFormData({...formData, oncePerCustomer: e.target.checked})}
                  />
                  <div className="w-11 h-6 bg-stone-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-stone-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-brand-500"></div>
                </label>
                <div>
                  <p className="text-sm font-bold text-stone-700">Limitar 1 uso por cliente</p>
                  <p className="text-xs text-stone-500 font-medium">O cliente não poderá usar o mesmo cupom duas vezes.</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 border-t border-stone-100 pt-5 mt-1">
                <div>
                  <label className="block text-sm font-bold text-stone-700 mb-1.5">Aplicável a</label>
                  <select 
                    value={formData.ruleType}
                    onChange={(e) => setFormData({...formData, ruleType: e.target.value})}
                    className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                  >
                    <option value="ALL">Todo o Cardápio</option>
                    <option value="SPECIFIC">Categoria Específica</option>
                  </select>
                </div>
                {formData.ruleType === 'SPECIFIC' ? (
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">Qual Categoria?</label>
                    <select 
                      value={formData.ruleCategory}
                      onChange={(e) => setFormData({...formData, ruleCategory: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                    >
                      {['Hambúrguer', 'Porções', 'Combos', 'Bebidas', 'Sobremesas'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>
                ) : (
                  <div className="flex flex-col justify-center">
                    <p className="text-xs font-medium text-stone-400 mt-8">O desconto será válido no valor total do carrinho.</p>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-3 mt-4 pt-6 border-t border-stone-100">
                <button 
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 bg-stone-100 text-stone-600 px-6 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
                >
                  Criar Cupom
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {couponToDelete && (
        <div className="fixed inset-0 bg-stone-900/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="w-12 h-12 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-stone-900 mb-2">Excluir Cupom</h2>
            <p className="text-stone-500 mb-8 text-sm leading-relaxed">
              Tem certeza que deseja excluir este cupom permanentemente? Esta ação não pode ser desfeita.
            </p>
            <div className="flex gap-3">
              <button 
                onClick={() => setCouponToDelete(null)}
                className="flex-1 px-4 py-3 bg-stone-100 hover:bg-stone-200 text-stone-700 font-bold rounded-xl transition-colors"
              >
                Cancelar
              </button>
              <button 
                onClick={confirmDelete}
                className="flex-1 px-4 py-3 bg-red-500 hover:bg-red-600 text-white font-bold rounded-xl shadow-lg shadow-red-500/30 transition-all active:scale-95"
              >
                Sim, excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
