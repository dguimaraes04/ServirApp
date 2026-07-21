import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Mail, Lock, AlertCircle, ArrowRight, ShieldCheck, Zap, Building, Key, User } from 'lucide-react';
import { supabase } from '../lib/supabase';

type AuthMode = 'login' | 'register_church' | 'register_volunteer';

export function Auth() {
  const [mode, setMode] = useState<AuthMode>('login');
  
  // Form fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [churchName, setChurchName] = useState('');
  const [inviteCode, setInviteCode] = useState('');

  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const generateInviteCode = () => {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
    let result = '';
    for (let i = 0; i < 6; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);
    setLoading(true);

    try {
      if (mode === 'login') {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } 
      
      else if (mode === 'register_church') {
        if (!churchName || !fullName) throw new Error('Preencha todos os campos.');
        
        // 1. Criar a Igreja no banco primeiro (RLS permite insert público)
        const newCode = generateInviteCode();
        const { data: churchData, error: churchError } = await supabase
          .from('churches')
          .insert({ name: churchName, invite_code: newCode })
          .select()
          .single();

        if (churchError) throw new Error('Erro ao criar a igreja. Tente novamente.');

        // 2. Criar o Usuário com os metadados (Trigger do Postgres cuidará de criar o Profile)
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'manager',
              church_id: churchData.id
            }
          }
        });

        if (authError) throw authError;
        // Force sign out so user lands on login screen cleanly (avoids profile-not-found race condition)
        await supabase.auth.signOut();
        setSuccessMsg(`✅ Igreja criada! Código de convite da sua igreja: ${newCode}. Agora faça login com o e-mail e senha que você acabou de criar.`);
        setMode('login');
      } 
      
      else if (mode === 'register_volunteer') {
        if (!inviteCode || !fullName) throw new Error('Preencha todos os campos.');

        // 1. Validar código de convite
        const { data: churchData, error: churchQueryError } = await supabase
          .from('churches')
          .select('id, name')
          .eq('invite_code', inviteCode.toUpperCase())
          .single();

        if (churchQueryError || !churchData) {
          throw new Error('Código de convite inválido ou igreja não encontrada.');
        }

        // 2. Criar o Usuário Voluntário
        const { error: authError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              full_name: fullName,
              role: 'volunteer',
              church_id: churchData.id
            }
          }
        });

        if (authError) throw authError;
        // Force sign out so user lands on login screen cleanly (avoids profile-not-found race condition)
        await supabase.auth.signOut();
        setSuccessMsg(`✅ Bem-vindo à ${churchData.name}! Conta criada. Agora faça login com o e-mail e senha que você acabou de criar.`);
        setMode('login');
      }
    } catch (err: any) {
      setError(err.message || 'Ocorreu um erro durante a autenticação.');
    } finally {
      setLoading(false);
    }
  };

  const changeMode = (newMode: AuthMode) => {
    setMode(newMode);
    setError(null);
    setSuccessMsg(null);
  };

  return (
    <div className="min-h-screen bg-navy-950 flex relative overflow-hidden">
      {/* Background Graphics */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-accent-cyan/10 blur-[120px]" />
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/10 blur-[120px]" />
      </div>

      <div className="flex-1 flex flex-col justify-center items-center px-4 py-8 z-10 w-full">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-md"
        >
          {/* Logo */}
          <div className="flex flex-col items-center mb-6">
            <div className="h-12 flex items-center justify-center my-4">
              <img src="/church_logo_dark.svg" alt="Church+" className="h-10 w-auto object-contain" />
            </div>
            <p className="text-slate-gray text-center font-medium text-sm md:text-base mb-4">Gestão inteligente para o corpo de Cristo.</p>
          </div>

          <div className="glass-card p-6 md:p-8 rounded-3xl border border-navy-800 bg-navy-900/60 backdrop-blur-2xl shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-accent-cyan to-transparent opacity-50" />
            
            {/* Header Text */}
            <div className="text-center mb-6">
              <h2 className="text-xl font-bold text-white mb-1">
                {mode === 'login' && 'Bem-vindo de volta'}
                {mode === 'register_church' && 'Cadastre sua Igreja'}
                {mode === 'register_volunteer' && 'Junte-se à sua Igreja'}
              </h2>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              
              {/* Nome Completo (Only Registration) */}
              {(mode === 'register_church' || mode === 'register_volunteer') && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Nome Completo</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <User className="h-5 w-5 text-slate-gray group-focus-within:text-accent-cyan transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm"
                      placeholder="João da Silva"
                    />
                  </div>
                </motion.div>
              )}

              {/* Nome da Igreja (Only Church Reg) */}
              {mode === 'register_church' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Nome da Igreja</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Building className="h-5 w-5 text-slate-gray group-focus-within:text-accent-cyan transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={churchName}
                      onChange={(e) => setChurchName(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm"
                      placeholder="Igreja Batista Central"
                    />
                  </div>
                </motion.div>
              )}

              {/* Código de Convite (Only Volunteer Reg) */}
              {mode === 'register_volunteer' && (
                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }}>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Código de Convite</label>
                  <div className="relative group">
                    <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                      <Key className="h-5 w-5 text-slate-gray group-focus-within:text-accent-cyan transition-colors" />
                    </div>
                    <input
                      type="text"
                      required
                      value={inviteCode}
                      onChange={(e) => setInviteCode(e.target.value)}
                      className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm uppercase"
                      placeholder="Ex: ABX92K"
                    />
                  </div>
                </motion.div>
              )}

              {/* Email (Always) */}
              <div>
                <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">E-mail</label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Mail className="h-5 w-5 text-slate-gray group-focus-within:text-accent-cyan transition-colors" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm"
                    placeholder="seu@email.com"
                  />
                </div>
              </div>

              {/* Senha (Always) */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] ml-1">Senha</label>
                  {mode === 'login' && <a href="#" className="text-[10px] text-accent-cyan font-bold hover:underline">Esqueceu?</a>}
                </div>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Lock className="h-5 w-5 text-slate-gray group-focus-within:text-accent-cyan transition-colors" />
                  </div>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="block w-full pl-11 pr-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm"
                    placeholder="••••••••"
                  />
                </div>
              </div>

              {/* Alerts */}
              <AnimatePresence>
                {error && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-start gap-3 overflow-hidden"
                  >
                    <AlertCircle className="h-5 w-5 text-red-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-red-400 leading-relaxed font-medium">{error}</p>
                  </motion.div>
                )}
                
                {successMsg && (
                  <motion.div 
                    initial={{ opacity: 0, height: 0, marginTop: 0 }}
                    animate={{ opacity: 1, height: 'auto', marginTop: 16 }}
                    exit={{ opacity: 0, height: 0, marginTop: 0 }}
                    className="bg-green-500/10 border border-green-500/20 rounded-xl p-3 flex items-start gap-3 overflow-hidden"
                  >
                    <Zap className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
                    <p className="text-xs text-green-400 leading-relaxed font-medium">{successMsg}</p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit Button */}
              <button
                type="submit"
                disabled={loading}
                className="w-full relative group overflow-hidden rounded-xl bg-accent-cyan text-navy-950 font-bold text-sm py-4 mt-2 transition-all hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] disabled:opacity-70 disabled:cursor-not-allowed"
              >
                <div className="absolute inset-0 bg-white/20 translate-y-full group-hover:translate-y-0 transition-transform duration-300 ease-out" />
                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" />
                  ) : (
                    <>
                      {mode === 'login' && 'Entrar no Sistema'}
                      {mode === 'register_church' && 'Finalizar Cadastro'}
                      {mode === 'register_volunteer' && 'Juntar-se à Igreja'}
                      <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                    </>
                  )}
                </span>
              </button>
            </form>

            {/* Alternância de Modos */}
            <div className="mt-8 pt-6 border-t border-navy-800/50 flex flex-col gap-3">
              {mode !== 'login' && (
                <button onClick={() => changeMode('login')} className="text-xs text-slate-gray hover:text-white transition-colors">
                  Já tem uma conta? <span className="text-accent-cyan font-bold">Faça login</span>
                </button>
              )}
              {mode !== 'register_church' && (
                <button onClick={() => changeMode('register_church')} className="text-xs text-slate-gray hover:text-white transition-colors">
                  É Pastor ou Gestor? <span className="text-accent-cyan font-bold">Cadastre sua Igreja</span>
                </button>
              )}
              {mode !== 'register_volunteer' && (
                <button onClick={() => changeMode('register_volunteer')} className="text-xs text-slate-gray hover:text-white transition-colors">
                  É Voluntário ou Líder? <span className="text-accent-cyan font-bold">Use um código de convite</span>
                </button>
              )}
            </div>
          </div>
          
          <p className="text-center text-xs text-slate-gray/60 mt-8 font-medium">
            © {new Date().getFullYear()} Church+. Todos os direitos reservados.
          </p>
        </motion.div>
      </div>
    </div>
  );
}
