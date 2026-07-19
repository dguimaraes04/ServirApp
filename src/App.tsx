/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Auth } from './components/Auth';
import { AdminDashboard } from './views/AdminDashboard';
import { VolunteerApp } from './views/VolunteerApp';

// Tipos baseados na nova estrutura do banco
type Role = 'manager' | 'leader' | 'volunteer' | null;

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

export default function App() {
  const [session, setSession] = useState<any>(null);
  const [isInitializing, setIsInitializing] = useState(true);
  const [role, setRole] = useState<Role>(null);
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileError, setProfileError] = useState(false);

  const fetchProfile = useCallback(async (userId: string, retries = 10, delayMs = 500) => {
    setProfileLoading(true);
    setProfileError(false);

    for (let attempt = 1; attempt <= retries; attempt++) {
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('role')
          .eq('id', userId)
          .single();

        if (data?.role) {
          setRole(data.role as Role);
          setProfileLoading(false);
          setIsInitializing(false);
          return;
        }

        if (error && error.code !== 'PGRST116') {
          // PGRST116 = row not found — esperado enquanto o trigger cria o perfil
          console.error('Erro ao buscar perfil:', error);
        }
      } catch (e) {
        console.error('Exceção ao buscar perfil:', e);
      }

      if (attempt < retries) {
        await sleep(delayMs);
      }
    }

    // Esgotou todas as tentativas
    setProfileError(true);
    setProfileLoading(false);
    setIsInitializing(false);
  }, []);

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
        setProfileError(false);
      } else {
        fetchProfile(session.user.id);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchProfile]);

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

  // Roteamento baseado no cargo do banco de dados
  if (role === 'manager' || role === 'leader') {
    return <AdminDashboard />;
  }

  if (role === 'volunteer') {
    return <VolunteerApp />;
  }

  // Fallback: perfil não encontrado após todas as tentativas
  return (
    <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center p-6 text-center">
      <div className="w-16 h-16 bg-red-500/10 text-red-500 rounded-2xl flex items-center justify-center mb-6 text-3xl">
        ⚠️
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Perfil Incompleto</h1>
      <p className="text-slate-gray mb-8 max-w-sm">
        {profileError
          ? 'Não conseguimos carregar seu perfil. Isso pode acontecer logo após o cadastro. Aguarde alguns segundos e tente novamente.'
          : 'Não conseguimos identificar o seu perfil de usuário. Verifique se preencheu tudo corretamente ou faça login novamente.'}
      </p>
      <div className="flex flex-col gap-3 w-full max-w-xs">
        <button
          onClick={() => session && fetchProfile(session.user.id)}
          className="px-6 py-3 bg-accent-cyan text-navy-950 rounded-xl font-bold hover:opacity-90 transition-opacity"
        >
          Tentar Novamente
        </button>
        <button
          onClick={() => supabase.auth.signOut()}
          className="px-6 py-3 bg-navy-800 text-white rounded-xl font-bold hover:bg-navy-700 transition-colors border border-navy-700"
        >
          Sair da Conta
        </button>
      </div>
    </div>
  );
}
