import Link from "next/link";
import Image from "next/image";
import { ArrowRight, UtensilsCrossed, Smartphone, PieChart, CheckCircle2, Percent, Bike, CreditCard, Check, Megaphone, Users, Palette } from "lucide-react";
import ContactSection from "@/components/ContactSection";
import FaqSection from "@/components/FaqSection";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-white font-sans text-stone-900 selection:bg-brand-200 selection:text-brand-950">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-stone-100 bg-white/80 backdrop-blur-md">
        <div className="container mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center">
            <Image src="/logo.png" alt="Pixeleats" width={140} height={40} className="h-10 w-auto" priority />
          </div>
          <nav className="hidden md:flex items-center gap-8">
            <a href="#funcionalidades" className="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors">Funcionalidades</a>
            <a href="#comparativo" className="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors">Diferenciais</a>
            <a href="#precos" className="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors">Planos</a>
            <a href="#contato" className="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors">Contato</a>
          </nav>
          <div className="flex items-center gap-4">
            <Link href="https://painel-pixelfood.vercel.app/login" className="text-sm font-medium text-stone-600 hover:text-brand-600 transition-colors">
              Entrar
            </Link>
            <Link href="https://painel-pixelfood.vercel.app/cadastro" className="text-sm font-medium bg-brand-600 text-white px-4 py-2 rounded-full hover:bg-brand-700 transition-all shadow-sm hover:shadow">
              Teste Grátis
            </Link>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative pt-16 pb-20 lg:pt-24 lg:pb-32 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-50/50 via-white to-white -z-10"></div>
          
          <div className="container mx-auto px-6 grid lg:grid-cols-2 gap-12 lg:gap-8 items-center">
            
            {/* Esquerda: Textos e Botões */}
            <div className="text-left max-w-2xl mx-auto lg:mx-0 pt-10">
              <h1 className="text-5xl md:text-6xl font-bold font-display tracking-tight text-stone-950 leading-[1.1] mb-6">
                O controle do seu restaurante <span className="text-brand-600">sem taxas abusivas</span>
              </h1>
              <p className="text-lg md:text-xl text-stone-600 mb-8 leading-relaxed pr-4">
                Gestão completa, delivery próprio e cardápio digital em um só lugar.<br className="hidden md:block"/>
                Você paga apenas uma mensalidade fixa, independente do seu faturamento.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center gap-4 mb-10">
                <Link href="https://painel-pixelfood.vercel.app/cadastro" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-brand-600 text-white px-8 py-4 rounded-full text-lg font-medium hover:bg-brand-700 transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5">
                  Teste grátis por 7 dias
                  <ArrowRight className="w-5 h-5" />
                </Link>
                <a href="#funcionalidades" className="flex items-center justify-center gap-2 w-full sm:w-auto bg-white border border-stone-200 text-stone-700 px-8 py-4 rounded-full text-lg font-medium hover:bg-stone-50 hover:border-stone-300 transition-all">
                  Ver funcionalidades
                </a>
              </div>
              
              {/* Badges Funcionalidades */}
              <div className="flex flex-wrap items-center gap-3 mb-8">
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-100 bg-white shadow-sm">
                  <Percent className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-stone-600"><strong className="text-brand-600 font-semibold">Sem taxas</strong> sobre pedidos</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-100 bg-white shadow-sm">
                  <Bike className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-stone-600"><strong className="text-brand-600 font-semibold">Delivery</strong> próprio</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-2 rounded-xl border border-stone-100 bg-white shadow-sm">
                  <CreditCard className="w-4 h-4 text-brand-600" />
                  <span className="text-sm text-stone-600"><strong className="text-brand-600 font-semibold">Cardápio</strong> digital</span>
                </div>
              </div>
              

            </div>
            
            {/* Direita: Imagens Mockups */}
            <div className="relative mt-10 lg:mt-0 w-full flex justify-center lg:justify-end">
               <div className="relative w-full max-w-[600px] aspect-[4/3] md:aspect-[16/10] lg:aspect-square flex items-center justify-center">
                  
                  {/* Fundo decorativo (opcional se a imagem já tiver sombra) */}
                  <div className="absolute inset-0 bg-brand-100 rounded-full blur-3xl opacity-30 z-0 scale-75 translate-y-10"></div>
                  
                  {/* Laptop */}
                  <div className="absolute w-[110%] md:w-full lg:w-[120%] lg:left-0 z-10 drop-shadow-2xl">
                    <Image 
                      src="/laptop.png" 
                      alt="Dashboard no Notebook" 
                      width={800} 
                      height={600} 
                      className="w-full h-auto object-contain" 
                      priority 
                    />
                  </div>
                  
                  {/* Mobile Phone (sobrepondo o laptop no canto direito) */}
                  <div className="absolute bottom-4 -right-2 md:bottom-2 md:-right-8 lg:bottom-6 lg:-right-4 w-[35%] md:w-[30%] lg:w-[35%] z-20 drop-shadow-2xl transition-transform hover:-translate-y-2 duration-500">
                    <Image 
                      src="/mobile.png" 
                      alt="Dashboard no Celular" 
                      width={300} 
                      height={600} 
                      className="w-full h-auto object-contain" 
                      priority 
                    />
                  </div>
               </div>
            </div>
            
          </div>
        </section>

        {/* Features Section */}
        <section id="funcionalidades" className="py-24 bg-white">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-brand-600 font-semibold tracking-wide uppercase text-sm mb-3">Tudo que você precisa</h2>
              <h3 className="text-3xl md:text-4xl font-bold font-display text-stone-950 mb-6">Uma plataforma completa para o seu negócio</h3>
              <p className="text-stone-600 text-lg">Centralize suas operações com ferramentas modernas que economizam seu tempo e dinheiro.</p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {/* Feature 1 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <Smartphone className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Cardápio Digital</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Crie e atualize seu cardápio em tempo real. Ofereça uma experiência de pedido via QR Code ou link direto pelo WhatsApp.
                </p>
              </div>
              
              {/* Feature 2 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <UtensilsCrossed className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Delivery Próprio</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Receba pedidos sem pagar comissões por venda. Tenha controle total dos seus clientes e fidelize mais fácil.
                </p>
              </div>
              
              {/* Feature 3 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <PieChart className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Gestão Completa</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Acompanhe vendas, gerencie pedidos, fluxo de caixa e relatórios detalhados em um único painel de controle.
                </p>
              </div>

              {/* Feature 4 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <Megaphone className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Campanhas de Marketing</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Crie promoções, cupons de desconto e ações focadas para atrair novos clientes e aumentar ainda mais suas vendas.
                </p>
              </div>

              {/* Feature 5 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <Users className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Dados dos Clientes</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Tenha acesso total às informações de quem compra de você. Conheça seu público e crie um relacionamento direto sem intermediários.
                </p>
              </div>

              {/* Feature 6 */}
              <div className="bg-stone-50 p-6 xl:p-8 rounded-2xl border border-stone-100 hover:border-brand-200 transition-colors group">
                <div className="w-14 h-14 bg-white rounded-xl shadow-sm border border-stone-100 flex items-center justify-center mb-6 group-hover:bg-brand-50 transition-colors">
                  <Palette className="w-7 h-7 text-brand-600" />
                </div>
                <h4 className="text-xl font-bold font-display text-stone-950 mb-3">Delivery Personalizado</h4>
                <p className="text-stone-600 leading-relaxed text-sm xl:text-base">
                  Deixe o aplicativo com a cara da sua marca. Personalize cores, adicione sua logo e tenha um ambiente exclusivo para o seu restaurante.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Comparativo Section */}
        <section id="comparativo" className="py-24 bg-stone-50">
          <div className="container mx-auto px-6">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-brand-600 font-semibold tracking-wide uppercase text-sm mb-3">Por que escolher a Pixeleats?</h2>
              <h3 className="text-3xl md:text-4xl font-bold font-display text-stone-950 mb-6">Chega de dividir seu lucro</h3>
              <p className="text-stone-600 text-lg">Entenda a diferença entre usar um aplicativo de marketplace comum e ter o seu próprio sistema de delivery.</p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-white rounded-3xl border border-stone-100 shadow-xl overflow-hidden">
              {/* Header da Tabela */}
              <div className="grid grid-cols-3 border-b border-stone-100">
                <div className="p-6 md:p-8 flex items-center justify-center bg-stone-50/50">
                  <span className="font-bold text-stone-400 text-sm uppercase tracking-wider">O que importa</span>
                </div>
                <div className="p-6 md:p-8 flex flex-col items-center justify-center border-l border-stone-100 bg-red-50/30">
                  <span className="font-bold text-red-900 md:text-xl text-center">Apps Comuns</span>
                  <span className="text-xs text-red-500 font-medium mt-1">(Marketplaces de entrega)</span>
                </div>
                <div className="p-6 md:p-8 flex flex-col items-center justify-center border-l border-brand-100 bg-brand-50">
                  <img src="/logo.png" alt="Pixeleats" className="h-6 md:h-8 object-contain mb-1" />
                </div>
              </div>

              {/* Linha 1 */}
              <div className="grid grid-cols-3 border-b border-stone-100">
                <div className="p-4 md:p-6 flex items-center bg-stone-50/50">
                  <span className="font-semibold text-stone-700 text-sm md:text-base">Taxas por pedido</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-stone-100 text-center gap-2">
                  <span className="text-stone-600 text-sm md:text-base font-medium">Até 27% do valor</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-brand-100 bg-brand-50/30 text-center gap-2">
                  <span className="text-brand-700 font-bold text-sm md:text-base">0% (Zero taxas)</span>
                </div>
              </div>

              {/* Linha 2 */}
              <div className="grid grid-cols-3 border-b border-stone-100">
                <div className="p-4 md:p-6 flex items-center bg-stone-50/50">
                  <span className="font-semibold text-stone-700 text-sm md:text-base">Dados dos Clientes</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-stone-100 text-center gap-2">
                  <span className="text-stone-600 text-sm md:text-base font-medium">Ficam ocultos para você</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-brand-100 bg-brand-50/30 text-center gap-2">
                  <span className="text-brand-700 font-bold text-sm md:text-base">O cliente é seu (Nome, Whats)</span>
                </div>
              </div>

              {/* Linha 3 */}
              <div className="grid grid-cols-3 border-b border-stone-100">
                <div className="p-4 md:p-6 flex items-center bg-stone-50/50">
                  <span className="font-semibold text-stone-700 text-sm md:text-base">Recebimento</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-stone-100 text-center gap-2">
                  <span className="text-stone-600 text-sm md:text-base font-medium">Demora de 7 a 30 dias</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-brand-100 bg-brand-50/30 text-center gap-2">
                  <span className="text-brand-700 font-bold text-sm md:text-base">Na hora (Pix via MercadoPago)</span>
                </div>
              </div>

              {/* Linha 4 */}
              <div className="grid grid-cols-3">
                <div className="p-4 md:p-6 flex items-center bg-stone-50/50">
                  <span className="font-semibold text-stone-700 text-sm md:text-base">Fortalecimento da Marca</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-stone-100 text-center gap-2">
                  <span className="text-stone-600 text-sm md:text-base font-medium">Você divulga o app deles</span>
                </div>
                <div className="p-4 md:p-6 flex flex-col items-center justify-center border-l border-brand-100 bg-brand-50/30 text-center gap-2">
                  <span className="text-brand-700 font-bold text-sm md:text-base">Você fortalece a SUA marca</span>
                </div>
              </div>

            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section id="precos" className="py-24 bg-stone-950 text-white relative overflow-hidden">
          <div className="absolute top-0 right-0 w-[800px] h-[800px] bg-brand-900/40 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
          
          <div className="container mx-auto px-6 relative z-10">
            <div className="text-center max-w-3xl mx-auto mb-16">
              <h2 className="text-brand-400 font-semibold tracking-wide uppercase text-sm mb-3">Preço Justo</h2>
              <h3 className="text-3xl md:text-4xl font-bold font-display mb-6">Cresça sem limites</h3>
              <p className="text-stone-400 text-lg">Sem pegadinhas, sem taxas sobre pedidos. Pague apenas a mensalidade da plataforma e fique com todo o lucro.</p>
            </div>
            
            <div className="max-w-4xl mx-auto bg-stone-900 border border-stone-800 rounded-3xl overflow-hidden flex flex-col md:flex-row">
              <div className="flex-1 p-10 md:p-12">
                <h4 className="text-2xl font-bold mb-2">Plano Completo</h4>
                <p className="text-stone-400 mb-8">Acesso a todas as ferramentas que seu restaurante precisa.</p>
                
                <ul className="space-y-4 mb-8">
                  {[
                    "Zero taxas sobre pedidos (0%)",
                    "Pedidos ilimitados mensais",
                    "Cardápio digital via QR Code e link",
                    "Painel de gestão administrativa e relatórios",
                    "Suporte prioritário via WhatsApp"
                  ].map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <CheckCircle2 className="w-6 h-6 text-brand-400 shrink-0" />
                      <span className="text-stone-300">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
              
              <div className="w-full md:w-80 bg-stone-800/50 p-10 md:p-12 flex flex-col justify-center border-l border-stone-800">
                <div className="mb-8 space-y-6">
                  {/* Plano Mensal */}
                  <div>
                    <span className="text-stone-400 text-xs font-bold uppercase tracking-wider">Plano Mensal</span>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-3xl font-bold">R$ 99,90</span>
                      <span className="text-stone-400 text-sm">/mês</span>
                    </div>
                  </div>
                  
                  <div className="h-px w-full bg-stone-800"></div>

                  {/* Plano Anual */}
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-brand-400 text-xs font-bold uppercase tracking-wider">Plano Anual</span>
                      <span className="bg-brand-500/20 text-brand-400 text-[10px] font-bold px-2 py-0.5 rounded-full">-20% OFF</span>
                    </div>
                    <div className="mt-1 flex items-baseline gap-1">
                      <span className="text-4xl font-bold text-white">R$ 79,90</span>
                      <span className="text-stone-400 text-sm">/mês</span>
                    </div>
                    <span className="text-xs text-stone-500 mt-2 block">Cobrado anualmente (R$ 958,80)</span>
                  </div>
                </div>
                
                <Link href="https://painel-pixelfood.vercel.app/cadastro" className="w-full flex items-center justify-center gap-2 text-center bg-brand-600 text-white py-4 rounded-xl font-medium hover:bg-brand-500 transition-colors shadow-lg shadow-brand-900/20">
                  Começar Teste Grátis de 7 Dias
                </Link>
                <p className="text-center text-stone-500 text-xs mt-4">Sem compromisso. Cancele a qualquer momento.</p>
              </div>
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <FaqSection />

        {/* Contato Section */}
        <ContactSection />
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-stone-200 py-12">
        <div className="container mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex items-center">
              <Image src="/logo.png" alt="Pixeleats" width={120} height={35} className="h-9 w-auto" />
            </div>
            
            <p className="text-stone-500 text-sm">
              &copy; {new Date().getFullYear()} Pixeleats. Todos os direitos reservados. Uma empresa do grupo <a href="https://pixeloo.com.br/" target="_blank" rel="noopener noreferrer" className="hover:text-brand-600 transition-colors underline">Pixeloo</a>.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
