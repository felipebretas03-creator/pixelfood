"use client";

import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Store, Loader2 } from 'lucide-react';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const { login } = useAuthStore();
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:4000`;
      const apiUrl = `${backendBase}/api/auth/login`;
      const res = await fetch(apiUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || 'Erro ao fazer login');
        return;
      }

      login({
        restaurant: {
          id: data.id,
          name: data.name,
          slug: data.slug,
          email: data.email
        },
        token: data.token
      });
      router.push('/');
    } catch (err: any) {
      setError('Erro de conexão com o servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mb-4 shadow-lg shadow-brand-500/20">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">PainelPixel</h1>
          <p className="text-stone-500 text-sm mt-1">Acesso do Lojista</p>
        </div>

        <div className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">E-mail</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
              placeholder="seu@email.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">Senha</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg">{error}</p>
          )}

          <button
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brand-500 text-white rounded-xl py-3.5 font-bold hover:bg-brand-600 active:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Entrar no Painel'}
          </button>
        </div>

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col items-center gap-2">
          <p className="text-stone-500 text-sm font-medium">Não tem uma conta?</p>
          <Link href="/cadastro" className="text-brand-500 font-bold hover:underline transition-all">
            Criar conta de Restaurante
          </Link>
        </div>
      </div>
    </div>
  );
}
