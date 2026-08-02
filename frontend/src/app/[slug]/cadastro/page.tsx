/* eslint-disable @typescript-eslint/no-explicit-any, react-hooks/set-state-in-effect, @next/next/no-img-element, react/no-unescaped-entities, @typescript-eslint/no-unused-vars, @typescript-eslint/ban-ts-comment */

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Mail, Lock, Eye, EyeOff, User } from "lucide-react";
import { apiFetch } from "@/lib/api";
import { useUserStore } from "@/store/userStore";

export default function CadastroPage() {
  const params = useParams();
  const slug = params?.slug as string;

  const router = useRouter();
  const login = useUserStore(state => state.login);
  
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !email || !password) return;
    
    setLoading(true);
    setError("");

    try {
      const res = await apiFetch("http://127.0.0.1:4000/api/auth/customer/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password })
      });
      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }

      login({
        id: data.customer.id,
        name: data.customer.name,
        email: data.customer.email,
        phone: data.customer.phone || "",
        token: data.token
      });
      
      router.push(`/${slug}/`);
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex-1 flex flex-col min-h-screen bg-white">
      {/* Header */}
      <header className="px-6 py-4 flex items-center">
        <button onClick={() => router.push(`/${slug}`)} className="w-10 h-10 flex items-center justify-center -ml-2 text-stone-900 rounded-full hover:bg-stone-50 active:scale-95 transition-all">
          <ArrowLeft className="w-6 h-6" />
        </button>
      </header>

      <div className="flex-1 px-6 pb-8 flex flex-col mt-4">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Criar Conta 🚀</h1>
        <p className="text-stone-500 mb-8 font-medium">Junte-se a nós e peça suas comidas favoritas.</p>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          {/* Name Input */}
          <div className="flex flex-col gap-1.5">
            <label className="text-sm font-bold text-stone-700 ml-1">Nome Completo</label>
            <div className="relative flex items-center">
              <div className="absolute left-4 text-stone-400">
                <User className="w-5 h-5" />
              </div>
              <input 
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full bg-stone-50 text-[16px] border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                required
              />
            </div>
          </div>

          {/* Email Input */}
          <div className="flex flex-col gap-1.5 mt-2">
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
                className="w-full bg-stone-50 text-[16px] border border-stone-200 rounded-2xl py-4 pl-12 pr-4 text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
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
                className="w-full bg-stone-50 text-[16px] border border-stone-200 rounded-2xl py-4 pl-12 pr-12 text-stone-900 outline-none focus:border-brand-500 focus:bg-white transition-all font-medium"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-4 text-stone-400 p-1 hover:text-stone-600"
              >
                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
              </button>
            </div>
          </div>

          {error && (
            <div className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg mt-2">
              {error}
            </div>
          )}

          {/* Register Button */}
          <button 
            type="submit"
            disabled={loading}
            className="w-full bg-brand-500 text-white rounded-full py-4 font-bold shadow-lg shadow-brand-500/30 active:scale-[0.98] transition-all mt-4 disabled:opacity-70 disabled:pointer-events-none"
          >
            {loading ? "Criando conta..." : "Criar Conta"}
          </button>
        </form>



        {/* Login Link */}
        <div className="mt-auto pt-8 flex justify-center text-sm font-medium">
          <span className="text-stone-500">Já tem uma conta? </span>
          <Link href={`/${slug}/login`} className="text-brand-500 font-bold ml-1 hover:underline">
            Entrar
          </Link>
        </div>
      </div>
    </main>
  );
}
