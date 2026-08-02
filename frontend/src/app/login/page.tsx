/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

export default function LoginPage() {
  const router = useRouter();
  const login = useUserStore(state => state.login);
  
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("http://127.0.0.1:4000/api/auth/customer/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password })
      });
      const data = await res.json();
      
      if (!res.ok) {
        setError(data.error || "Erro ao fazer login");
        return;
      }

      login({
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || "",
        token: data.token
      });
      
      router.push("/");
    } catch (err: any) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center">
        <button onClick={() => router.push('/')} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900 rounded-full hover:bg-stone-50 active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 px-6 pb-8 flex flex-col mt-4">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Bem-vindo de volta! 👋</h1>
        <p className="text-stone-500 mb-8 font-medium">Faça login na sua conta para continuar.</p>

        <div className="flex flex-col gap-4">
          {/* Email Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">E-mail</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400">
                <Mail className="w-5 h-5" />
              </div>
              <input 
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-[16px] text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Password Input */}
          <div className="flex flex-col gap-1.5 mt-2">
            <label className="text-sm font-bold text-stone-700 ml-1">Senha</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400">
                <Lock className="w-5 h-5" />
              </div>
              <input 
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl py-4 pl-12 pr-12 text-[16px] text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-stone-400 hover:text-stone-600 transition-colors"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          <div className="flex justify-end mt-1 mb-6">
            <button type="button" className="text-brand-500 text-sm font-bold hover:underline">
              Esqueceu a senha?
            </button>
          </div>

          {error && (
            <div className="bg-red-50 text-red-500 text-sm font-medium py-3 px-4 rounded-xl border border-red-100 mt-2">
              {error}
            </div>
          )}

          {/* Login Button */}
          <button 
            type="button"
            onClick={handleLogin}
            disabled={loading}
            className="w-full bg-brand-500 text-white font-bold py-4 rounded-2xl mt-4 hover:bg-brand-600 active:bg-brand-700 transition-all disabled:opacity-50 flex items-center justify-center gap-2 shadow-sm"
          >
            {loading ? (
              <div className="w-6 h-6 border-2 border-white/20 border-t-white rounded-full animate-spin" />
            ) : (
              "Entrar"
            )}
          </button>
        </div>



        {/* Register Button */}
        <div className="mt-auto pt-8 flex flex-col gap-3">
          <p className="text-center text-sm text-stone-500 font-medium">Novo por aqui?</p>
          <Link 
            href="/cadastro" 
            className="w-full bg-stone-100 text-stone-900 rounded-full py-4 font-bold flex items-center justify-center hover:bg-stone-200 active:scale-[0.98] transition-all"
          >
            Criar Nova Conta
          </Link>
        </div>
      </div>
    </main>
  );
}
