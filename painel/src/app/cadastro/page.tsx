"use client";

import { Store, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/store/authStore";

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const { login } = useAuthStore();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [cpfCnpj, setCpfCnpj] = useState("");
  const [phone, setPhone] = useState("");
  const [error, setError] = useState("");

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");
    try {
      const backendBase = process.env.NEXT_PUBLIC_API_URL || `http://${window.location.hostname}:4000`;
      const res = await fetch(`${backendBase}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password, cpfCnpj, phone }),
      });
      const data = await res.json();
      if (!res.ok) {
        setError(data.error || "Erro ao criar conta");
        return;
      }
      // Salva o token para que o usuário já esteja autenticado na tela de assinatura
      if (data.token && data.tenant) {
        login({
          tenant: {
            id: data.tenant.id,
            name: data.tenant.name,
            slug: data.tenant.slug,
            email: data.tenant.email,
            isMaster: false
          },
          token: data.token
        });
        localStorage.setItem("pixelfood_token", data.token);
        localStorage.setItem("pixelfood_user", JSON.stringify(data.tenant));
      }
      router.push("/assinatura");
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-50 flex flex-col justify-center items-center p-6">
      <div className="w-full max-w-md bg-white rounded-3xl p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-stone-100 relative">
        {/* Botão Voltar */}
        <Link href="/login" className="absolute top-8 left-8 text-stone-400 hover:text-brand-500 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </Link>

        {/* Logo */}
        <div className="flex flex-col items-center mb-8 mt-2">
          <img src="/logo.png" alt="Pixeleats" className="h-12 w-auto mb-2 object-contain" />
          <h1 className="text-stone-500 text-sm mt-1">Crie sua conta de Lojista</h1>
        </div>

        <form onSubmit={handleRegister} className="flex flex-col gap-4">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">Nome do Restaurante</label>
            <input 
              required
              type="text" 
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
              placeholder="Ex: Burger King"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">E-mail corporativo</label>
            <input 
              required
              type="email" 
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
              placeholder="contato@restaurante.com"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">CPF ou CNPJ</label>
              <input 
                required
                type="text" 
                value={cpfCnpj}
                onChange={(e) => setCpfCnpj(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
                placeholder="Apenas números"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">WhatsApp</label>
              <input 
                required
                type="text" 
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
                placeholder="(00) 00000-0000"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1.5 ml-1">Senha</label>
            <input 
              required
              type="password" 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-stone-50 border border-stone-200 rounded-2xl px-4 py-3.5 focus:outline-none focus:border-brand-500 focus:bg-white transition-colors text-[16px]"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <p className="text-red-500 text-sm font-bold text-center bg-red-50 py-2 rounded-lg mt-1">{error}</p>
          )}

          <button 
            type="submit"
            disabled={isLoading}
            className="w-full bg-brand-500 text-white rounded-xl py-3.5 font-bold hover:bg-brand-600 active:bg-brand-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-4"
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Criar Conta
                <ArrowRight className="w-5 h-5" />
              </>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-stone-100 flex flex-col items-center gap-2">
          <p className="text-stone-500 text-sm font-medium">Já tem uma conta?</p>
          <Link href="/login" className="text-brand-500 font-bold hover:underline transition-all">
            Fazer login
          </Link>
        </div>
      </div>
    </div>
  );
}
