"use client";
import { Search, Star, Award, TrendingUp } from 'lucide-react';
import { useState, useEffect } from 'react';
import { apiFetch } from '@/lib/api';

export default function ClientesPage() {
  const [search, setSearch] = useState('');
  const [customers, setCustomers] = useState<any[]>([]);

  useEffect(() => {
    apiFetch('/api/customers')
      .then(res => res.json())
      .then(data => setCustomers(data))
      .catch(console.error);
  }, []);

  const filteredCustomers = customers.filter(c => 
    c.name.toLowerCase().includes(search.toLowerCase()) || 
    (c.phone && c.phone.includes(search))
  );

  const avgTicket = customers.length > 0 
    ? customers.reduce((acc, c) => acc + c.totalSpent, 0) / customers.length 
    : 0;

  const topCustomer = customers.length > 0 ? customers[0] : null;

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-stone-900 tracking-tight">Clientes CRM</h1>
          <p className="text-stone-500 font-medium mt-1">Gerencie sua base de clientes, fidelidade e LTV.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-blue-50 text-blue-500 rounded-full flex items-center justify-center">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-stone-500 text-sm font-medium mb-1">Ticket Médio Geral</h3>
            <p className="text-2xl font-bold text-stone-900">
              R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(avgTicket)}
            </p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-full flex items-center justify-center">
            <Star className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-stone-500 text-sm font-medium mb-1">Clientes Cadastrados</h3>
            <p className="text-2xl font-bold text-stone-900">{customers.length}</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-6 shadow-sm border border-stone-100 flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center">
            <Award className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-stone-500 text-sm font-medium mb-1">Top Cliente (LTV)</h3>
            <p className="text-lg font-bold text-stone-900 truncate">
              {topCustomer ? topCustomer.name : '-'}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-stone-100 flex flex-col gap-6">
        <div className="flex items-center justify-between">
          <div className="relative w-80">
            <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-stone-400" />
            <input 
              type="text" 
              placeholder="Buscar por nome ou telefone..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-full pl-11 pr-4 py-2.5 text-sm font-medium outline-none focus:border-brand-500 focus:bg-white transition-all"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-stone-100 text-stone-400 text-sm">
                <th className="font-semibold py-3 px-4">Nome</th>
                <th className="font-semibold py-3 px-4">Telefone</th>
                <th className="font-semibold py-3 px-4">Pedidos</th>
                <th className="font-semibold py-3 px-4">Gasto Total (LTV)</th>
                <th className="font-semibold py-3 px-4">Último Pedido</th>
                <th className="font-semibold py-3 px-4">Pontos Fidelidade</th>
              </tr>
            </thead>
            <tbody>
              {filteredCustomers.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center p-8 text-stone-500 font-medium">
                    Nenhum cliente encontrado.
                  </td>
                </tr>
              )}
              {filteredCustomers.map(customer => (
                <tr key={customer.id} className="border-b border-stone-50 hover:bg-stone-50/50 transition-colors">
                  <td className="p-4 font-bold text-stone-900">{customer.name}</td>
                  <td className="p-4 text-stone-600 font-medium">{customer.phone}</td>
                  <td className="p-4 font-bold text-stone-900">{customer.ordersCount}</td>
                  <td className="p-4 font-bold text-brand-600">R$ {new Intl.NumberFormat('pt-BR', { minimumFractionDigits: 2 }).format(customer.totalSpent)}</td>
                  <td className="p-4 text-stone-500 text-sm font-medium">
                    {customer.orders && customer.orders[0] ? new Date(customer.orders[0].createdAt).toLocaleDateString('pt-BR') : '-'}
                  </td>
                  <td className="p-4 font-bold text-amber-500 flex items-center gap-1">
                    <Star className="w-4 h-4 fill-amber-500" />
                    {customer.loyaltyPts}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
