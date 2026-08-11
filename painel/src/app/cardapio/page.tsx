"use client";
/* eslint-disable @next/next/no-img-element */
import { useState, useEffect } from 'react';
import { Plus, Search, Edit2, Trash2, X, Image as ImageIcon, Upload, Layers } from 'lucide-react';
import { apiFetch } from '@/lib/api';

interface ProductModifierOption {
  name: string;
  price: number;
}

interface ProductModifierGroup {
  name: string;
  min: number;
  max: number;
  options: ProductModifierOption[];
}

interface Product {
  id: string;
  name: string;
  description?: string;
  category: string;
  price: number;
  active: boolean;
  image: string;
  modifiers?: ProductModifierGroup[];
}

interface Category {
  id: string;
  name: string;
  icon: string;
  order: number;
}

export default function CardapioPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [activeCategory, setActiveCategory] = useState('Todos');
  const [search, setSearch] = useState('');

  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'detalhes' | 'opcoes'>('detalhes');
  
  // Category Modal State
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryIcon, setNewCategoryIcon] = useState('🍽️');
  const AVAILABLE_ICONS = ['🍔', '🍕', '🌭', '🥪', '🌮', '🌯', '🥙', '🥗', '🍝', '🍜', '🍲', '🍛', '🍣', '🍱', '🍤', '🥩', '🍗', '🍖', '🥟', '🍟', '🥞', '🧇', '🧀', '🥐', '🥖', '🥨', '🥯', '🍰', '🎂', '🧁', '🥧', '🍩', '🍪', '🍫', '🍬', '🍭', '🍧', '🍨', '🍦', '☕', '🍵', '🥤', '🧋', '🧃', '🧉', '🍺', '🍻', '🥂', '🍷', '🍹', '🍽️'];

  // Form State
  const [formData, setFormData] = useState({ 
    name: '', 
    description: '',
    category: 'Hambúrguer', 
    price: '', 
    image: '',
    modifiers: [] as ProductModifierGroup[]
  });

  // Delete Confirmation State
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  const fetchProducts = async () => {
    try {
      const res = await apiFetch('/api/products');
      const data = await res.json();
      setProducts(data);
    } catch (e) {
      console.error(e);
    }
  };

  const fetchCategories = async () => {
    try {
      const res = await apiFetch('/api/categories');
      const data = await res.json();
      setCategories(data);
      if (data.length > 0 && !formData.category) {
        setFormData(prev => ({ ...prev, category: data[0].name }));
      }
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchCategories();
  }, []);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setFormData(prev => ({ ...prev, image: reader.result as string }));
      };
      reader.readAsDataURL(file);
    }
  };

  const toggleStock = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;
    
    // Optimistic UI
    setProducts(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
    
    try {
      await apiFetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !product.active })
      });
    } catch (e) {
      console.error(e);
      fetchProducts(); // Revert on error
    }
  };

  const confirmDelete = (id: string) => {
    setDeleteConfirmId(id);
  };

  const executeDelete = async () => {
    if (deleteConfirmId) {
      try {
        await apiFetch(`/api/products/${deleteConfirmId}`, {
          method: 'DELETE'
        });
        setProducts(prev => prev.filter(p => p.id !== deleteConfirmId));
        setDeleteConfirmId(null);
      } catch (e) {
        console.error(e);
      }
    }
  };

  const openModal = (product?: Product) => {
    if (product) {
      setEditingProduct(product);
      setFormData({
        name: product.name,
        description: product.description || '',
        category: product.category,
        price: product.price.toString(),
        image: product.image,
        modifiers: product.modifiers ? JSON.parse(JSON.stringify(product.modifiers)) : []
      });
    } else {
      setEditingProduct(null);
      setFormData({ name: '', description: '', category: categories.length > 0 ? categories[0].name : '', price: '', image: '', modifiers: [] });
    }
    setActiveTab('detalhes');
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const priceNumber = parseFloat(formData.price.replace(',', '.'));
    if (isNaN(priceNumber)) return alert("Preço inválido");

    const payload = {
      name: formData.name,
      category: formData.category,
      price: priceNumber,
      image: formData.image || 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=150',
      modifiers: formData.modifiers.map(m => ({
        name: m.name,
        min: m.min,
        max: m.max,
        options: m.options.map(o => ({
          name: o.name,
          price: o.price
        }))
      }))
    };

    try {
      if (editingProduct) {
        await apiFetch(`/api/products/${editingProduct.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
      } else {
        await apiFetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ ...payload, active: true })
        });
      }
      fetchProducts();
      closeModal();
    } catch (error) {
      alert("Erro ao salvar produto");
    }
  };

  // --- Modifiers Helpers ---
  const addModifierGroup = () => {
    setFormData(prev => ({
      ...prev,
      modifiers: [...prev.modifiers, { name: '', min: 0, max: 1, options: [] }]
    }));
  };

  const updateModifierGroup = (index: number, field: string, value: any) => {
    const newMods = [...formData.modifiers];
    newMods[index] = { ...newMods[index], [field]: value };
    setFormData({ ...formData, modifiers: newMods });
  };

  const removeModifierGroup = (index: number) => {
    const newMods = [...formData.modifiers];
    newMods.splice(index, 1);
    setFormData({ ...formData, modifiers: newMods });
  };

  const addModifierOption = (groupIndex: number) => {
    const newMods = [...formData.modifiers];
    newMods[groupIndex].options.push({ name: '', price: 0 });
    setFormData({ ...formData, modifiers: newMods });
  };

  const updateModifierOption = (groupIndex: number, optionIndex: number, field: string, value: any) => {
    const newMods = [...formData.modifiers];
    newMods[groupIndex].options[optionIndex] = { 
      ...newMods[groupIndex].options[optionIndex], 
      [field]: value 
    };
    setFormData({ ...formData, modifiers: newMods });
  };

  const removeModifierOption = (groupIndex: number, optionIndex: number) => {
    const newMods = [...formData.modifiers];
    newMods[groupIndex].options.splice(optionIndex, 1);
    setFormData({ ...formData, modifiers: newMods });
  };
  // -------------------------

  const filteredProducts = products.filter(p => {
    if (activeCategory !== 'Todos' && p.category !== activeCategory) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  });

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Cardápio</h1>
          <p className="text-stone-500 font-medium mt-1">Gerencie seus produtos, preços, opções e adicionais.</p>
        </div>
        <button 
          onClick={() => openModal()}
          className="bg-brand-500 text-white px-6 py-3 rounded-full font-bold shadow-lg shadow-brand-500/20 hover:bg-brand-600 transition-all flex items-center gap-2 active:scale-95"
        >
          <Plus className="w-5 h-5" />
          Novo Produto
        </button>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
        {/* Filters Bar */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2 overflow-x-auto hide-scrollbar items-center">
            <button 
              onClick={() => setActiveCategory('Todos')}
              className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                activeCategory === 'Todos' ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
              }`}
            >
              Todos
            </button>
            {categories.map(cat => (
              <button 
                key={cat.id}
                onClick={() => setActiveCategory(cat.name)}
                className={`px-4 py-2 rounded-full text-sm font-semibold whitespace-nowrap transition-colors ${
                  activeCategory === cat.name ? 'bg-stone-900 text-white' : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                }`}
              >
                {cat.name}
              </button>
            ))}
            <button 
              onClick={() => setIsCategoryModalOpen(true)}
              className="w-9 h-9 rounded-full bg-stone-50 border border-stone-200 text-stone-400 hover:bg-stone-100 hover:text-stone-900 flex items-center justify-center flex-shrink-0 transition-colors ml-1 shadow-sm"
              title="Nova Categoria"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="relative w-72">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar produto..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        {/* Products Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-sm">
                <th className="font-semibold py-3 px-4 w-16">Foto</th>
                <th className="font-semibold py-3 px-4">Produto</th>
                <th className="font-semibold py-3 px-4">Categoria</th>
                <th className="font-semibold py-3 px-4">Preço</th>
                <th className="font-semibold py-3 px-4">Estoque</th>
                <th className="font-semibold py-3 px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(prod => (
                <tr key={prod.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4">
                    <img src={prod.image} alt={prod.name} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                  </td>
                  <td className="p-4 font-bold text-stone-900">{prod.name}</td>
                  <td className="p-4 text-stone-500 text-sm font-medium">{prod.category}</td>
                  <td className="p-4 font-bold text-stone-900">
                    R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(prod.price)}
                  </td>
                  <td className="p-4">
                    <button 
                      onClick={() => toggleStock(prod.id)}
                      className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${prod.active ? 'bg-green-500' : 'bg-stone-200'}`}
                    >
                      <div className={`absolute top-1 bg-white w-4 h-4 rounded-full shadow-sm transition-all duration-300 ${prod.active ? 'left-7' : 'left-1'}`} />
                    </button>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        type="button"
                        onClick={() => openModal(prod)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-brand-500 hover:bg-brand-50 transition-colors active:scale-95"
                        title="Editar"
                      >
                        <Edit2 className="w-4 h-4 pointer-events-none" />
                      </button>
                      <button 
                        type="button"
                        onClick={() => confirmDelete(prod.id)}
                        className="w-8 h-8 flex items-center justify-center rounded-lg text-stone-400 hover:text-red-500 hover:bg-red-50 transition-colors active:scale-95"
                        title="Excluir"
                      >
                        <Trash2 className="w-4 h-4 pointer-events-none" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-12 text-stone-400 font-medium">
                    Nenhum produto encontrado.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-2xl shadow-2xl flex flex-col max-h-[90vh]">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-2xl font-black text-stone-900">
                {editingProduct ? 'Editar Produto' : 'Novo Produto'}
              </h2>
              <button 
                onClick={closeModal} 
                className="w-8 h-8 flex items-center justify-center rounded-full text-stone-400 hover:text-stone-900 hover:bg-stone-100 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs */}
            <div className="flex items-center gap-4 border-b border-stone-100 mb-6 shrink-0">
              <button 
                className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'detalhes' ? 'border-brand-500 text-brand-500' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                onClick={() => setActiveTab('detalhes')}
              >
                Detalhes Básicos
              </button>
              <button 
                className={`py-2 px-4 font-bold border-b-2 transition-colors ${activeTab === 'opcoes' ? 'border-brand-500 text-brand-500' : 'border-transparent text-stone-500 hover:text-stone-800'}`}
                onClick={() => setActiveTab('opcoes')}
              >
                Opções e Adicionais
              </button>
            </div>

            <form onSubmit={handleSave} className="flex flex-col flex-1 overflow-hidden">
              <div className="flex-1 overflow-y-auto pr-2 hide-scrollbar">
                {/* Aba Detalhes */}
                <div className={activeTab === 'detalhes' ? 'flex flex-col gap-4' : 'hidden'}>
                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">Nome do Produto</label>
                    <input 
                      required
                      type="text" 
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                      placeholder="Ex: X-Bacon Supremo"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1.5">Categoria</label>
                      <select 
                        value={formData.category}
                        onChange={(e) => setFormData({...formData, category: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all appearance-none cursor-pointer"
                      >
                        {categories.map(c => (
                          <option key={c.id} value={c.name}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-stone-700 mb-1.5">Preço Base (R$)</label>
                      <input 
                        required
                        type="number" 
                        step="0.01"
                        min="0"
                        value={formData.price}
                        onChange={(e) => setFormData({...formData, price: e.target.value})}
                        className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
                        placeholder="25.90"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-1.5">Descrição do Produto</label>
                    <textarea 
                      value={formData.description}
                      onChange={(e) => setFormData({...formData, description: e.target.value})}
                      className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all resize-none h-24"
                      placeholder="Ingredientes, detalhes e informações sobre o prato..."
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-stone-700 mb-2">Foto do Produto</label>
                    <div className="flex items-center gap-4">
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="w-16 h-16 rounded-2xl object-cover shadow-sm border border-stone-200" />
                      ) : (
                        <div className="w-16 h-16 bg-stone-50 border-2 border-dashed border-stone-300 rounded-2xl flex items-center justify-center">
                          <ImageIcon className="w-6 h-6 text-stone-400" />
                        </div>
                      )}
                      <label className="bg-white border border-stone-200 text-stone-700 px-4 py-2.5 rounded-xl text-sm font-bold hover:bg-stone-50 transition-colors cursor-pointer flex items-center gap-2 shadow-sm">
                        <Upload className="w-4 h-4" />
                        Escolher Imagem
                        <input 
                          type="file" 
                          accept="image/*"
                          onChange={handleImageUpload}
                          className="hidden"
                        />
                      </label>
                    </div>
                  </div>
                </div>

                {/* Aba Opções e Adicionais */}
                <div className={activeTab === 'opcoes' ? 'flex flex-col gap-6' : 'hidden'}>
                  <div className="flex items-center justify-between">
                    <p className="text-sm text-stone-500">Crie opções como "Tamanho", "Sabores", ou "Adicionais Extras".</p>
                    <button 
                      type="button" 
                      onClick={addModifierGroup}
                      className="bg-brand-50 text-brand-600 px-4 py-2 rounded-full font-bold text-sm hover:bg-brand-100 transition-colors"
                    >
                      + Novo Grupo
                    </button>
                  </div>

                  {formData.modifiers.length === 0 ? (
                    <div className="text-center py-10 bg-stone-50 border border-stone-100 rounded-2xl border-dashed">
                      <Layers className="w-10 h-10 text-stone-300 mx-auto mb-2" />
                      <p className="text-stone-500 font-medium">Nenhum adicional configurado.</p>
                    </div>
                  ) : (
                    formData.modifiers.map((group, gIdx) => (
                      <div key={gIdx} className="border border-stone-200 rounded-2xl p-4 bg-stone-50/50">
                        <div className="flex items-start justify-between mb-4">
                          <div className="flex-1 grid grid-cols-12 gap-3 mr-4">
                            <div className="col-span-6">
                              <label className="block text-xs font-bold text-stone-600 mb-1">Nome do Grupo</label>
                              <input 
                                required
                                type="text" 
                                value={group.name}
                                onChange={(e) => updateModifierGroup(gIdx, 'name', e.target.value)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                                placeholder="Ex: Escolha o Sabor"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs font-bold text-stone-600 mb-1">Mínimo</label>
                              <input 
                                type="number" min="0" 
                                value={group.min}
                                onChange={(e) => updateModifierGroup(gIdx, 'min', parseInt(e.target.value) || 0)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                              />
                            </div>
                            <div className="col-span-3">
                              <label className="block text-xs font-bold text-stone-600 mb-1">Máximo</label>
                              <input 
                                type="number" min="1" 
                                value={group.max}
                                onChange={(e) => updateModifierGroup(gIdx, 'max', parseInt(e.target.value) || 1)}
                                className="w-full bg-white border border-stone-200 rounded-lg px-3 py-2 text-sm outline-none focus:border-brand-500"
                              />
                            </div>
                          </div>
                          <button 
                            type="button" 
                            onClick={() => removeModifierGroup(gIdx)}
                            className="w-8 h-8 flex mt-5 items-center justify-center rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Opções do Grupo */}
                        <div className="bg-white rounded-xl border border-stone-200 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-bold text-stone-500 uppercase tracking-wide">Opções (Itens)</span>
                            <button 
                              type="button" 
                              onClick={() => addModifierOption(gIdx)}
                              className="text-brand-500 text-xs font-bold hover:underline"
                            >
                              + Adicionar Item
                            </button>
                          </div>
                          
                          <div className="flex flex-col gap-2">
                            {group.options.map((opt, oIdx) => (
                              <div key={oIdx} className="flex gap-3 items-center">
                                <input 
                                  required
                                  type="text" 
                                  value={opt.name}
                                  onChange={(e) => updateModifierOption(gIdx, oIdx, 'name', e.target.value)}
                                  className="flex-1 bg-stone-50 border border-stone-200 rounded-lg px-3 py-1.5 text-sm outline-none focus:border-brand-500"
                                  placeholder="Ex: Cheddar"
                                />
                                <div className="relative w-28">
                                  <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-stone-400 text-xs font-bold">R$</span>
                                  <input 
                                    type="number" step="0.01" min="0"
                                    value={opt.price}
                                    onChange={(e) => updateModifierOption(gIdx, oIdx, 'price', parseFloat(e.target.value) || 0)}
                                    className="w-full bg-stone-50 border border-stone-200 rounded-lg pl-8 pr-2 py-1.5 text-sm outline-none focus:border-brand-500"
                                  />
                                </div>
                                <button 
                                  type="button" 
                                  onClick={() => removeModifierOption(gIdx, oIdx)}
                                  className="text-stone-300 hover:text-red-500 p-1"
                                >
                                  <X className="w-4 h-4" />
                                </button>
                              </div>
                            ))}
                            {group.options.length === 0 && (
                              <p className="text-xs text-stone-400 italic">Nenhuma opção inserida.</p>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3 mt-4 pt-4 border-t border-stone-100 shrink-0">
                <button 
                  type="button"
                  onClick={closeModal}
                  className="flex-1 bg-stone-100 text-stone-600 px-6 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-1 bg-brand-500 text-white px-6 py-3 rounded-xl font-bold hover:bg-brand-600 transition-colors shadow-sm shadow-brand-500/20"
                >
                  {editingProduct ? 'Salvar Alterações' : 'Criar Produto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Nova Categoria */}
      {isCategoryModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[60] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col">
            <h2 className="text-xl font-black text-stone-900 mb-4">Nova Categoria</h2>
            <form onSubmit={async (e) => {
              e.preventDefault();
              if (newCategoryName.trim()) {
                try {
                  const res = await apiFetch('/api/categories', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ 
                      name: newCategoryName.trim(),
                      icon: newCategoryIcon 
                    })
                  });
                  const newCat = await res.json();
                  setCategories(prev => [...prev, newCat]);
                  setNewCategoryName('');
                  setNewCategoryIcon('🍽️');
                  setIsCategoryModalOpen(false);
                } catch (err) {
                  alert("Erro ao salvar categoria");
                }
              }
            }}>
              <label className="block text-sm font-bold text-stone-700 mb-1.5">Ícone</label>
              <div className="grid grid-cols-7 gap-2 h-40 overflow-y-auto hide-scrollbar mb-4 bg-stone-50 p-2 rounded-xl border border-stone-200">
                {AVAILABLE_ICONS.map(icon => (
                  <button
                    key={icon}
                    type="button"
                    onClick={() => setNewCategoryIcon(icon)}
                    className={`text-2xl w-10 h-10 flex items-center justify-center rounded-lg transition-transform ${newCategoryIcon === icon ? 'bg-brand-500 text-white scale-110 shadow-md' : 'hover:bg-stone-200 hover:scale-105'}`}
                  >
                    {icon}
                  </button>
                ))}
              </div>

              <label className="block text-sm font-bold text-stone-700 mb-1.5">Nome da Categoria</label>
              <input 
                autoFocus
                required
                type="text" 
                value={newCategoryName}
                onChange={(e) => setNewCategoryName(e.target.value)}
                placeholder="Ex: Bebidas, Sobremesas..."
                className="w-full bg-stone-50 border border-stone-200 rounded-xl px-4 py-3 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all mb-6"
              />
              <div className="flex gap-2">
                <button 
                  type="button" 
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="flex-1 px-4 py-3 bg-stone-100 text-stone-600 rounded-xl font-bold text-sm hover:bg-stone-200"
                >
                  Cancelar
                </button>
                <button 
                  type="submit" 
                  className="flex-1 px-4 py-3 bg-brand-500 text-white rounded-xl font-bold text-sm shadow-sm hover:bg-brand-600"
                >
                  Salvar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deleteConfirmId && (
        <div className="fixed inset-0 bg-stone-900/60 backdrop-blur-sm flex items-center justify-center z-[70] p-4">
          <div className="bg-white rounded-3xl p-6 w-full max-w-sm shadow-2xl flex flex-col items-center text-center">
            <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mb-4">
              <Trash2 className="w-8 h-8" />
            </div>
            <h2 className="text-xl font-black text-stone-900 mb-2">Excluir Produto</h2>
            <p className="text-stone-500 text-sm font-medium mb-6">
              Tem certeza que deseja remover este produto do cardápio? Essa ação não pode ser desfeita.
            </p>
            <div className="flex items-center gap-3 w-full">
              <button 
                onClick={() => setDeleteConfirmId(null)}
                className="flex-1 bg-stone-100 text-stone-600 py-3 rounded-xl font-bold hover:bg-stone-200 transition-colors text-sm"
              >
                Cancelar
              </button>
              <button 
                onClick={executeDelete}
                className="flex-1 bg-red-500 text-white py-3 rounded-xl font-bold hover:bg-red-600 transition-colors text-sm shadow-sm shadow-red-500/20"
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
