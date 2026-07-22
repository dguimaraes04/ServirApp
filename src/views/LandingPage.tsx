import { useState, useRef, useEffect, ReactNode } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  CalendarCheck, Music, Megaphone, Heart, ChevronDown, Check, Star, 
  Church, Menu, X, ArrowRight, XCircle, Users, Zap, Shield, Globe, MessageCircle, Sun, Moon
} from 'lucide-react';
import { useTheme } from '../contexts/ThemeContext';

interface LandingPageProps {
  onNavigateToApp: () => void;
}

function AnimatedSection({ children, delay = 0, className = '', ...rest }: { children: ReactNode, delay?: number, className?: string, [key: string]: any }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-100px" }}
      transition={{ duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function FAQItem({ question, answer }: { question: string, answer: string }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="border border-navy-800 hover:border-navy-700 transition-colors duration-300 bg-navy-900/40 backdrop-blur-sm rounded-xl overflow-hidden mb-4 group">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex justify-between items-center p-6 text-left focus:outline-none"
      >
        <span className="font-display font-medium text-lg text-slate-light group-hover:text-accent-cyan transition-colors">{question}</span>
        <motion.div
          animate={{ rotate: isOpen ? 180 : 0 }}
          transition={{ duration: 0.3 }}
          className="text-accent-cyan flex-shrink-0 ml-4"
        >
          <ChevronDown size={20} />
        </motion.div>
      </button>
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.3, ease: "easeInOut" }}
          >
            <div className="p-6 pt-0 text-slate-gray leading-relaxed text-base">
              {answer}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function LandingPage({ onNavigateToApp }: LandingPageProps) {
  const { theme, toggleTheme } = useTheme();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    setMobileMenuOpen(false);
    const el = document.getElementById(id);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-navy-950 text-slate-light font-sans selection:bg-accent-cyan/30 selection:text-white overflow-x-hidden relative">
      
      {/* Background Gradients */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-cyan/5 blur-[150px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[150px]" />
      </div>

      {/* 1. NAVBAR */}
      <nav className={`fixed top-0 w-full z-50 transition-all duration-300 ${
        scrolled ? 'bg-navy-950/80 backdrop-blur-xl border-b border-navy-800/50 py-3' : 'bg-transparent py-5'
      }`}>
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex justify-between items-center">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img 
              src={theme === 'dark' ? '/church_logo_dark.svg' : '/church_logo_light.svg'} 
              alt="Church+" 
              className="h-8 w-auto object-contain transition-all" 
            />
          </div>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('recursos')} className="text-sm font-medium text-slate-light hover:text-accent-cyan transition-colors">Recursos</button>
            <button onClick={() => scrollToSection('como-funciona')} className="text-sm font-medium text-slate-light hover:text-accent-cyan transition-colors">Como Funciona</button>
            <button onClick={() => scrollToSection('faq')} className="text-sm font-medium text-slate-light hover:text-accent-cyan transition-colors">FAQ</button>
          </div>

          <div className="hidden md:flex items-center gap-4">
            <button
              onClick={toggleTheme}
              className="p-2 rounded-xl text-slate-gray hover:text-slate-light hover:bg-navy-800 transition-colors"
              title="Alternar tema"
            >
              {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
            </button>
            <button 
              onClick={onNavigateToApp}
              className="bg-accent-cyan/10 hover:bg-accent-cyan/20 text-accent-cyan border border-accent-cyan/30 px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-300 shadow-[0_0_15px_rgba(100,255,218,0.1)] hover:shadow-[0_0_25px_rgba(100,255,218,0.2)]"
            >
              Começar Grátis
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button 
            className="md:hidden text-slate-light"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Nav */}
        <AnimatePresence>
          {mobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="absolute top-full left-0 w-full bg-navy-900 border-b border-navy-800 shadow-2xl md:hidden"
            >
              <div className="flex flex-col p-6 gap-4">
                <button onClick={() => scrollToSection('recursos')} className="text-left text-base font-medium text-slate-light p-2 hover:bg-navy-800 rounded-lg">Recursos</button>
                <button onClick={() => scrollToSection('como-funciona')} className="text-left text-base font-medium text-slate-light p-2 hover:bg-navy-800 rounded-lg">Como Funciona</button>
                <button onClick={() => scrollToSection('faq')} className="text-left text-base font-medium text-slate-light p-2 hover:bg-navy-800 rounded-lg">FAQ</button>
                <button 
                  onClick={onNavigateToApp}
                  className="mt-4 bg-accent-cyan text-navy-950 px-5 py-3 rounded-xl text-base font-bold text-center w-full"
                >
                  Começar Grátis
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* Main Content */}
      <main className="relative z-10">
        
        {/* 2. HERO SECTION */}
        <section className="pt-32 pb-20 md:pt-48 md:pb-32 px-6 md:px-12 max-w-7xl mx-auto flex flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="max-w-4xl"
          >
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent-cyan/10 border border-accent-cyan/20 text-accent-cyan text-xs font-semibold uppercase tracking-wider mb-8">
              <span className="w-2 h-2 rounded-full bg-accent-cyan animate-pulse"></span>
              A nova forma de gerir ministérios
            </div>
            
            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-extrabold text-white leading-[1.1] mb-6 tracking-tight">
              Chega de escala no WhatsApp. <br className="hidden md:block"/>
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-accent-cyan to-blue-400">Gerencie os voluntários</span> da sua igreja.
            </h1>
            
            <p className="text-lg md:text-xl text-slate-gray mb-10 max-w-3xl mx-auto leading-relaxed">
              O Church+ é a plataforma de gestão de voluntários para igreja que substitui planilhas, grupos bagunçados e ligações de última hora por escalas inteligentes, setlists organizados e comunicação centralizada — tudo em um só painel.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
              <button 
                onClick={onNavigateToApp}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-accent-cyan hover:bg-accent-cyan/90 text-navy-950 px-8 py-4 rounded-xl text-base font-bold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_10px_40px_-10px_rgba(100,255,218,0.5)]"
              >
                Comece seu Teste Grátis <ArrowRight size={18} />
              </button>
              <button 
                onClick={() => scrollToSection('recursos')}
                className="w-full sm:w-auto flex items-center justify-center gap-2 bg-transparent hover:bg-navy-800 text-slate-light border border-navy-700 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300"
              >
                Ver Recursos
              </button>
            </div>
            
            <div className="flex flex-col items-center justify-center gap-2">
              <div className="flex items-center gap-1 text-[#FBBF24]">
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
                <Star size={16} fill="currentColor" />
              </div>
              <p className="text-sm text-slate-gray font-medium">
                Usado por <span className="text-slate-light">+200 igrejas</span> que já abandonaram a escala no WhatsApp.
              </p>
            </div>
          </motion.div>
        </section>

        {/* 3. PAIN/PROBLEM SECTION */}
        <section className="py-24 bg-navy-900/20 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Sua equipe merece mais do que <br className="hidden md:block"/>
                <span className="text-slate-gray">planilhas e grupos de WhatsApp</span>
              </h2>
            </AnimatedSection>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-16">
              {[
                { icon: <XCircle className="text-red-400" size={24}/>, text: "Escala feita no papel ou no Excel que ninguém consulta" },
                { icon: <MessageCircle className="text-red-400" size={24}/>, text: "Grupo do WhatsApp lotado de mensagens e figurinhas" },
                { icon: <Users className="text-red-400" size={24}/>, text: "Voluntário que não apareceu porque não sabia que estava escalado" },
                { icon: <Music className="text-red-400" size={24}/>, text: "Tom do louvor definido na hora do culto" },
                { icon: <Zap className="text-red-400" size={24}/>, text: "Você, líder, gastando horas toda semana" },
              ].map((item, idx) => (
                <AnimatedSection key={idx} delay={idx * 0.1}>
                  <div className="bg-navy-900/50 backdrop-blur-lg border border-navy-800 rounded-2xl p-6 flex items-start gap-4 h-full hover:border-navy-700 transition-colors">
                    <div className="mt-1 bg-red-400/10 p-2 rounded-lg shrink-0">
                      {item.icon}
                    </div>
                    <p className="text-slate-light font-medium text-lg">{item.text}</p>
                  </div>
                </AnimatedSection>
              ))}
            </div>
            
            <AnimatedSection delay={0.4} className="text-center">
              <div className="inline-block bg-accent-cyan/10 border border-accent-cyan/20 rounded-2xl p-6 md:p-8 max-w-3xl mx-auto shadow-[0_0_30px_rgba(100,255,218,0.05)]">
                <p className="text-xl md:text-2xl font-display text-white">
                  O problema não é falta de compromisso.<br/>
                  <span className="text-accent-cyan font-bold">O problema é falta de ferramenta.</span>
                </p>
              </div>
            </AnimatedSection>
          </div>
        </section>

        {/* 4. FEATURES SECTION */}
        <section id="recursos" className="py-32 relative">
          <div className="max-w-7xl mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Tudo o que sua igreja precisa <br className="hidden md:block"/>
                em <span className="text-accent-cyan">uma plataforma</span>
              </h2>
            </AnimatedSection>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              {/* Feature 1 */}
              <AnimatedSection delay={0.1}>
                <div className="bg-navy-900/40 backdrop-blur-xl border border-navy-800 rounded-3xl p-8 hover:bg-navy-900/60 transition-all duration-300 group h-full flex flex-col">
                  <div className="bg-accent-cyan/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-accent-cyan group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(100,255,218,0.2)]">
                    <CalendarCheck size={28} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Escalas Automáticas e Inteligentes</h3>
                  <p className="text-slate-gray mb-8 flex-grow text-lg">Crie escalas em segundos. O sistema avisa os voluntários automaticamente, e eles confirmam ou recusam a participação com um clique direto pelo app.</p>
                  <div className="bg-navy-950/50 rounded-xl p-4 border border-navy-800/50">
                    <span className="text-xs font-bold text-accent-cyan uppercase tracking-wider block mb-1">Resultado:</span>
                    <span className="text-slate-light text-sm">Fim dos furos na escala e previsibilidade 100% para os cultos.</span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Feature 2 */}
              <AnimatedSection delay={0.2}>
                <div className="bg-navy-900/40 backdrop-blur-xl border border-navy-800 rounded-3xl p-8 hover:bg-navy-900/60 transition-all duration-300 group h-full flex flex-col">
                  <div className="bg-blue-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-blue-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(59,130,246,0.2)]">
                    <Music size={28} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Gestão do Ministério de Louvor</h3>
                  <p className="text-slate-gray mb-8 flex-grow text-lg">Monte setlists com tom, BPM e links do YouTube/Spotify. Acesse o repertório da igreja de qualquer lugar, organizando ensaios e apresentações.</p>
                  <div className="bg-navy-950/50 rounded-xl p-4 border border-navy-800/50">
                    <span className="text-xs font-bold text-blue-400 uppercase tracking-wider block mb-1">Resultado:</span>
                    <span className="text-slate-light text-sm">Banda alinhada antes mesmo do ensaio começar.</span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Feature 3 */}
              <AnimatedSection delay={0.3}>
                <div className="bg-navy-900/40 backdrop-blur-xl border border-navy-800 rounded-3xl p-8 hover:bg-navy-900/60 transition-all duration-300 group h-full flex flex-col">
                  <div className="bg-purple-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-purple-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(168,85,247,0.2)]">
                    <Megaphone size={28} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Mural de Avisos Centralizado</h3>
                  <p className="text-slate-gray mb-8 flex-grow text-lg">Comunique-se com toda a igreja, apenas com líderes ou com um ministério específico. Notificações diretas que não se perdem no feed de mensagens.</p>
                  <div className="bg-navy-950/50 rounded-xl p-4 border border-navy-800/50">
                    <span className="text-xs font-bold text-purple-400 uppercase tracking-wider block mb-1">Resultado:</span>
                    <span className="text-slate-light text-sm">Informação chega a quem importa, sem ruídos.</span>
                  </div>
                </div>
              </AnimatedSection>

              {/* Feature 4 */}
              <AnimatedSection delay={0.4}>
                <div className="bg-navy-900/40 backdrop-blur-xl border border-navy-800 rounded-3xl p-8 hover:bg-navy-900/60 transition-all duration-300 group h-full flex flex-col">
                  <div className="bg-rose-500/10 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 text-rose-400 group-hover:scale-110 transition-transform shadow-[0_0_15px_rgba(244,63,94,0.2)]">
                    <Heart size={28} />
                  </div>
                  <h3 className="text-2xl font-display font-bold text-white mb-4">Ministério Kids e Recepção</h3>
                  <p className="text-slate-gray mb-8 flex-grow text-lg">Não é só para o louvor. Organize a escala do ministério infantil, portaria, diaconato, mídia e intercessão com a mesma facilidade.</p>
                  <div className="bg-navy-950/50 rounded-xl p-4 border border-navy-800/50">
                    <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block mb-1">Resultado:</span>
                    <span className="text-slate-light text-sm">Todos os departamentos operando com excelência.</span>
                  </div>
                </div>
              </AnimatedSection>
            </div>
          </div>
        </section>

        {/* 5. HOW IT WORKS SECTION */}
        <section id="como-funciona" className="py-24 bg-navy-900/20 relative overflow-hidden">
          <div className="max-w-7xl mx-auto px-6 md:px-12 relative z-10">
            <AnimatedSection className="text-center mb-20">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Como funciona: <span className="text-accent-cyan">3 passos</span> para<br className="hidden md:block"/> transformar sua gestão
              </h2>
            </AnimatedSection>

            <div className="relative max-w-4xl mx-auto">
              {/* Connecting Line (Desktop) */}
              <div className="hidden md:block absolute top-12 left-[10%] right-[10%] h-0.5 bg-navy-800 z-0">
                <motion.div 
                  className="h-full bg-gradient-to-r from-accent-cyan to-blue-500"
                  initial={{ width: "0%" }}
                  whileInView={{ width: "100%" }}
                  viewport={{ once: true, margin: "-100px" }}
                  transition={{ duration: 1.5, delay: 0.5 }}
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-12 relative z-10">
                {/* Step 1 */}
                <AnimatedSection delay={0.2} className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-navy-950 border-4 border-navy-800 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-accent-cyan/20 blur-md"></div>
                    <span className="text-3xl font-display font-bold text-accent-cyan">1</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Cadastre sua igreja</h3>
                  <p className="text-slate-gray">Crie a conta da sua igreja em menos de 2 minutos. Sem necessidade de cartão de crédito para testar.</p>
                </AnimatedSection>

                {/* Step 2 */}
                <AnimatedSection delay={0.4} className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-navy-950 border-4 border-navy-800 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-blue-500/20 blur-md"></div>
                    <span className="text-3xl font-display font-bold text-blue-400">2</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Organize equipes</h3>
                  <p className="text-slate-gray">Convide seus líderes, crie os ministérios (Louvor, Kids, Mídia, etc) e adicione os voluntários.</p>
                </AnimatedSection>

                {/* Step 3 */}
                <AnimatedSection delay={0.6} className="flex flex-col items-center text-center">
                  <div className="w-24 h-24 rounded-full bg-navy-950 border-4 border-navy-800 flex items-center justify-center mb-6 relative">
                    <div className="absolute inset-0 rounded-full bg-purple-500/20 blur-md"></div>
                    <span className="text-3xl font-display font-bold text-purple-400">3</span>
                  </div>
                  <h3 className="text-xl font-bold text-white mb-3">Monte as escalas</h3>
                  <p className="text-slate-gray">Distribua as funções para os próximos cultos e publique. Todos são notificados instantaneamente.</p>
                </AnimatedSection>
              </div>
            </div>

            <AnimatedSection delay={0.8} className="mt-20 text-center">
              <p className="text-lg text-slate-light mb-8">
                Em menos de 10 minutos, sua igreja sai do caos do grupo de WhatsApp<br className="hidden md:block"/> para um sistema profissional.
              </p>
              <button 
                onClick={onNavigateToApp}
                className="bg-navy-800 hover:bg-navy-700 text-white border border-navy-600 px-8 py-4 rounded-xl text-base font-semibold transition-all duration-300"
              >
                Criar conta da minha igreja agora
              </button>
            </AnimatedSection>
          </div>
        </section>

        {/* 6. FAQ SECTION */}
        <section id="faq" className="py-32 relative">
          <div className="max-w-3xl mx-auto px-6 md:px-12">
            <AnimatedSection className="text-center mb-16">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Perguntas frequentes sobre<br className="hidden md:block"/>
                <span className="text-slate-gray">gestão de voluntários</span>
              </h2>
            </AnimatedSection>

            <AnimatedSection delay={0.2}>
              <FAQItem 
                question="Como fazer escala de culto de forma simples?" 
                answer="Com o Church+, basta selecionar a data do culto, escolher o ministério e arrastar os voluntários disponíveis para suas respectivas funções (ex: Bateria, Vocais, Recepção). O sistema já alerta se houver choque de horários e notifica o voluntário na hora."
              />
              <FAQItem 
                question="O Church+ funciona para igrejas pequenas?" 
                answer="Sim! O Church+ foi desenhado para escalar com sua necessidade. Mesmo que sua igreja tenha apenas 20 voluntários, a organização visual, o controle de repertório e as confirmações automáticas poupam horas preciosas do pastor e dos líderes locais."
              />
              <FAQItem 
                question="Como organizar o ministério de louvor e a setlist do culto?" 
                answer="Temos um módulo específico para música. Você cadastra as músicas da sua igreja com BPM e tom. Ao montar a escala, você cria a Setlist do dia, adiciona as músicas e todos os escalados (músicos e técnicos de som/projeção) já têm acesso prévio ao repertório e aos links de referência."
              />
              <FAQItem 
                question="Como o Church+ é diferente de usar um grupo de WhatsApp?" 
                answer="O WhatsApp é feito para conversa, não gestão. No WhatsApp, avisos se perdem, mensagens somem no fluxo, e é difícil saber quem realmente leu e confirmou presença. O Church+ centraliza a informação estruturada: o voluntário abre o app e vê exatamente quando e onde ele deve estar, sem poluição visual."
              />
              <FAQItem 
                question="Os voluntários precisam baixar um aplicativo pesado?" 
                answer="Não. O Church+ é acessível diretamente pelo navegador (celular ou computador) como uma plataforma web rápida e otimizada, funcionando perfeitamente sem consumir a memória do dispositivo do seu voluntário."
              />
            </AnimatedSection>
          </div>
        </section>

        {/* 7. FINAL CTA SECTION */}
        <section className="py-24 relative overflow-hidden">
          <div className="absolute inset-0 z-0">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[80%] rounded-full bg-accent-cyan/10 blur-[120px]" />
          </div>

          <div className="max-w-5xl mx-auto px-6 md:px-12 relative z-10">
            <AnimatedSection className="bg-gradient-to-b from-navy-800/80 to-navy-900/80 backdrop-blur-xl border border-navy-700/50 rounded-3xl p-10 md:p-16 text-center shadow-2xl">
              <h2 className="text-3xl md:text-5xl font-display font-bold text-white mb-6">
                Sua igreja organizada começa com uma decisão
              </h2>
              <p className="text-xl text-slate-light mb-10 max-w-2xl mx-auto leading-relaxed">
                Pare de perder tempo cobrando escalas e organizando planilhas. Foque no pastoreio e deixe a gestão com o Church+.
              </p>
              
              <button 
                onClick={onNavigateToApp}
                className="inline-flex items-center justify-center gap-2 bg-accent-cyan hover:bg-accent-cyan/90 text-navy-950 px-10 py-5 rounded-xl text-lg font-bold transition-all duration-300 transform hover:-translate-y-1 hover:shadow-[0_15px_40px_-10px_rgba(100,255,218,0.6)] mb-10 w-full sm:w-auto"
              >
                Teste o Church+ Grátis por 14 Dias <ArrowRight size={20} />
              </button>

              <div className="flex flex-wrap justify-center gap-x-8 gap-y-4 text-sm font-medium text-slate-gray">
                <span className="flex items-center gap-2"><Check size={16} className="text-accent-cyan" /> Cadastro em 2 min</span>
                <span className="flex items-center gap-2"><Check size={16} className="text-accent-cyan" /> Sem cartão de crédito</span>
                <span className="flex items-center gap-2"><Check size={16} className="text-accent-cyan" /> Suporte em Português</span>
                <span className="flex items-center gap-2"><Shield size={16} className="text-accent-cyan" /> Dados Seguros</span>
                <span className="flex items-center gap-2"><Globe size={16} className="text-accent-cyan" /> 100% Web</span>
              </div>
            </AnimatedSection>
          </div>
        </section>

      </main>

      {/* 8. FOOTER */}
      <footer className="bg-navy-950 border-t border-navy-900 py-12 relative z-10">
        <div className="max-w-7xl mx-auto px-6 md:px-12 flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <img 
              src={theme === 'dark' ? '/church_logo_dark.svg' : '/church_logo_light.svg'} 
              alt="Church+" 
              className="h-7 w-auto object-contain transition-all" 
            />
          </div>
          
          <div className="text-slate-gray text-sm">
            © {new Date().getFullYear()} Church+. Todos os direitos reservados.
          </div>
          
          <div className="flex gap-6">
            <a href="#" className="text-sm text-slate-gray hover:text-accent-cyan transition-colors">Termos de Uso</a>
            <a href="#" className="text-sm text-slate-gray hover:text-accent-cyan transition-colors">Política de Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
