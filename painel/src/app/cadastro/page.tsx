"use client";

import { Store, ArrowRight, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function CadastroPage() {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

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
      router.push("/login");
    } catch (err) {
      setError("Erro de conexão");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-stone-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Decorativo */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-500/10 blur-[120px] rounded-full pointer-events-none" />
      
      {/* Botão Voltar (Fixo no topo esquerdo) */}
      <Link href="/login" className="absolute top-6 left-6 md:top-8 md:left-8 z-50 text-stone-400 hover:text-white transition-all flex items-center gap-2 font-bold bg-stone-900/50 px-4 py-2.5 rounded-xl backdrop-blur-md border border-stone-800 hover:bg-stone-800 hover:scale-105">
        <ArrowLeft className="w-5 h-5" />
        <span className="hidden sm:inline">Voltar</span>
      </Link>

      <div className="w-full max-w-[480px] relative z-10 mt-8">

        {/* Logo */}
        <div className="flex flex-col items-center justify-center mb-10 text-center">
          <div className="w-16 h-16 bg-brand-500 rounded-2xl flex items-center justify-center text-white mb-6 shadow-2xl shadow-brand-500/30">
            <Store className="w-8 h-8" />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tight mb-2">Seja Parceiro</h1>
          <p className="text-stone-400 font-medium">Cadastre seu restaurante e fature mais.</p>
        </div>

        {/* Card de Cadastro */}
        <div className="bg-stone-900/80 backdrop-blur-xl rounded-[2rem] p-8 border border-stone-800 shadow-2xl">
          <form onSubmit={handleRegister} className="flex flex-col gap-5">
            
            <div>
              <label className="block text-sm font-bold text-stone-300 mb-2 pl-1">Nome do Restaurante</label>
              <input 
                required
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-brand-500 focus:bg-stone-900 transition-all placeholder:text-stone-600"
                placeholder="Ex: Burger King"
              />
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-300 mb-2 pl-1">E-mail corporativo</label>
              <input 
                required
                type="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-brand-500 focus:bg-stone-900 transition-all placeholder:text-stone-600"
                placeholder="contato@restaurante.com"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div>
                <label className="block text-sm font-bold text-stone-300 mb-2 pl-1">CPF ou CNPJ</label>
                <input 
                  required
                  type="text" 
                  value={cpfCnpj}
                  onChange={(e) => setCpfCnpj(e.target.value)}
                  className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-brand-500 focus:bg-stone-900 transition-all placeholder:text-stone-600"
                  placeholder="Apenas números"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-stone-300 mb-2 pl-1">WhatsApp</label>
                <input 
                  required
                  type="text" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-brand-500 focus:bg-stone-900 transition-all placeholder:text-stone-600"
                  placeholder="(00) 00000-0000"
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-bold text-stone-300 mb-2 pl-1">Senha</label>
              <input 
                required
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full bg-stone-950/50 border border-stone-800 rounded-xl px-4 py-3.5 text-sm font-medium text-white outline-none focus:border-brand-500 focus:bg-stone-900 transition-all placeholder:text-stone-600"
                placeholder="••••••••"
              />
            </div>

            {error && (
              <p className="text-red-500 text-sm font-bold text-center bg-red-500/10 py-2 rounded-lg">{error}</p>
            )}

            <button 
              type="submit"
              disabled={isLoading}
              className="w-full bg-brand-500 text-white rounded-xl py-3.5 mt-2 font-bold hover:bg-brand-600 transition-all active:scale-95 shadow-lg shadow-brand-500/25 flex items-center justify-center gap-2 group disabled:opacity-70 disabled:pointer-events-none"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>
                  Criar Conta
                  <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
