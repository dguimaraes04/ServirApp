/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { AdminDashboard } from './views/AdminDashboard';
import { VolunteerApp } from './views/VolunteerApp';

// Tipos baseados na nova estrutura do banco
type Role = 'manager' | 'leader' | 'volunteer' | null;

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [profileLoading, setProfileLoading] = useState(false);

  const fetchProfile = async (userId: string) => {
    setProfileLoading(true);
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', userId)
        .single();
      
      if (error) {
        console.error('Erro ao buscar perfil:', error);
      } else if (data) {
        setRole(data.role as Role);
      }
    } finally {
      setProfileLoading(false);
      setIsInitializing(false);
    }
  };

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      if (session) {
        fetchProfile(session.user.id);
      } else {
        setIsInitializing(false);
      }
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (!session) {
        setRole(null);
      } else {
        // Quando loga, busca o perfil
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  if (isInitializing || profileLoading) {
    return (
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mb-4" />
        <p className="text-slate-gray font-medium animate-pulse text-sm tracking-wide">Carregando seu perfil...</p>
      </div>
    );
  }

  if (!session) {
    return <Auth />;
  }

  // Roteamento Oficial (Baseado no Banco de Dados real!)
  if (role === 'manager' || role === 'leader') {
    return <AdminDashboard />;
  } 
  
  if (role === 'volunteer') {
    return <VolunteerApp />;
  }

  // Fallback caso a role não tenha sido carregada ou deu algum erro de RLS
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 text-3xl">
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Perfil Incompleto</h1>
      <p className="text-slate-gray mb-8 max-w-sm">
        Não conseguimos identificar o seu perfil de usuário. Se você acabou de se cadastrar, verifique se preencheu tudo corretamente ou faça login novamente.
      </p>
      <button 
        onClick={() => supabase.auth.signOut()}
        className="px-6 py-3 bg-navy-800 text-white rounded-xl font-bold hover:bg-navy-700 transition-colors border border-navy-700"
      >
        Sair da Conta
      </button>
    </div>
  );
}
