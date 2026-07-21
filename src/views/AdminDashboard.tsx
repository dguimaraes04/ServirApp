import React, { useState, useMemo, ReactNode, useEffect, useRef } from 'react';
import { 
  LayoutDashboard, 
  Users, 
  BookOpen, 
  Calendar, 
  Settings,
  Bell,
  Search,
  Plus,
  AlertTriangle,
  Clock,
  ArrowUpRight,
  ChevronRight,
  MessageCircle,
  Menu,
  ShieldCheck,
  Zap,
  User,
  Building,
  Trash2,
  XCircle,
  Crown,
  UserMinus,
  Music,
  ExternalLink,
  Youtube,
  Pencil,
  X,
  Camera,
  CalendarDays,
  ChevronLeft
} from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip,
  CartesianGrid
} from 'recharts';
import { Volunteer, Ministry, Event, Schedule } from '../types';
import { MOCK_VOLUNTEERS, MOCK_MINISTRIES, MOCK_EVENTS, MOCK_SCHEDULES } from '../mockData';
import { formatDateTime, checkConflicts } from '../utils';
import { supabase } from '../lib/supabase';

type View = 'dashboard' | 'volunteers' | 'ministries' | 'schedule' | 'songs' | 'profile';

const PIE_DATA = [
  { name: 'Mídia e Tech', value: 35, color: '#64FFDA' },
  { name: 'Recepção', value: 25, color: '#0EA5E9' },
  { name: 'Kids', value: 25, color: '#A855F7' },
  { name: 'Louvor', value: 15, color: '#F43F5E' },
];

const GROWTH_DATA = [
  { name: 'Mês 1', value: 20 },
  { name: 'Mês 2', value: 35 },
  { name: 'Mês 3', value: 75 },
  { name: 'Mês 4', value: 90 },
  { name: 'Mês 5', value: 120 },
  { name: 'Mês 6', value: 160 },
];

export function AdminDashboard() {
  const [currentView, setCurrentView] = useState<View>('dashboard');
  const [volunteers] = useState<Volunteer[]>(MOCK_VOLUNTEERS);
  const [events] = useState<Event[]>(MOCK_EVENTS);
  const [schedules, setSchedules] = useState<Schedule[]>(MOCK_SCHEDULES);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [leadMinistries, setLeadMinistries] = useState<string[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [currentUserProfile, setCurrentUserProfile] = useState<any>(null);

  useEffect(() => {
    checkPermissions();
  }, []);

  const checkPermissions = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session) {
      const { data: profile } = await supabase.from('profiles').select('*').eq('id', session.user.id).single();
      if (profile) {
        setUserRole(profile.role);
        setCurrentUserProfile(profile);
      }
      setCurrentUserId(session.user.id);

      if (profile?.role === 'leader') {
        const { data: leadMins } = await supabase
          .from('ministry_leaders')
          .select('ministry:ministries(name)')
          .eq('profile_id', session.user.id);
        
        if (leadMins) {
          const names = leadMins.map((m: any) => m.ministry.name.toLowerCase());
          setLeadMinistries(names);
        }
      }
    }
  };

  const isWorshipOrMediaLeader = useMemo(() => {
    const keywords = ['louvor', 'musica', 'música', 'worship', 'som', 'mídia', 'midia', 'comunicação', 'comunicacao'];
    return leadMinistries.some(name => keywords.some(k => name.includes(k)));
  }, [leadMinistries]);

  const canSeeSongs = userRole === 'manager' || isWorshipOrMediaLeader;

  const pendingConfirms = useMemo(() => schedules.filter(s => s.status === 'pending').length, [schedules]);

  return (
    <div className="flex h-screen bg-navy-950 text-slate-light font-sans antialiased overflow-hidden">
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-40 lg:hidden"
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 border-r border-navy-800 bg-navy-950 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-12">
            <div className="flex items-center gap-3">
              <div className="w-36 h-12 flex items-center justify-start overflow-hidden relative">
                <img src="/church_full.png" alt="Church+" className="w-full h-full object-contain scale-175 -ml-4" />
              </div>
            </div>
            <button className="lg:hidden text-slate-gray" onClick={() => setSidebarOpen(false)}>
              <Menu />
            </button>
          </div>

          <nav className="space-y-2">
            <NavItem 
              icon={<LayoutDashboard size={20} />} 
              label="Dashboard" 
              active={currentView === 'dashboard'} 
              onClick={() => { setCurrentView('dashboard'); setSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Calendar size={20} />} 
              label="Escalas" 
              active={currentView === 'schedule'} 
              onClick={() => { setCurrentView('schedule'); setSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<Users size={20} />} 
              label="Voluntários" 
              active={currentView === 'volunteers'} 
              onClick={() => { setCurrentView('volunteers'); setSidebarOpen(false); }} 
            />
            <NavItem 
              icon={<BookOpen size={20} />} 
              label="Ministérios" 
              active={currentView === 'ministries'} 
              onClick={() => { setCurrentView('ministries'); setSidebarOpen(false); }} 
            />
            {canSeeSongs && (
              <NavItem 
                icon={<Music size={20} />} 
                label="Louvor" 
                active={currentView === 'songs'} 
                onClick={() => { setCurrentView('songs'); setSidebarOpen(false); }} 
              />
            )}
          </nav>
        </div>

        <div className="mt-auto p-8 border-t border-navy-800">
          <NavItem icon={<Settings size={20} />} label="Configurações" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 border-b border-navy-800 bg-navy-900/50 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 relative z-10">
          <div className="flex items-center gap-4">
            <Menu className="lg:hidden text-slate-gray cursor-pointer" onClick={() => setSidebarOpen(true)} />
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray" size={18} />
              <input 
                type="text" 
                placeholder="Busca inteligente..." 
                className="w-full bg-navy-950/50 border border-navy-800 rounded-xl py-2.5 pl-12 pr-4 text-sm focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-white placeholder:text-slate-gray/50"
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-accent-cyan/10 border border-accent-cyan/20 rounded-full">
              <div className="w-1.5 h-1.5 rounded-full bg-accent-cyan animate-pulse"></div>
              <span className="text-[10px] font-bold text-accent-cyan uppercase tracking-widest">Sistema Operante</span>
            </div>
            
            <button className="relative p-2 text-slate-gray hover:text-accent-cyan transition-colors">
              <Bell size={22} />
              {pendingConfirms > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full border-2 border-navy-900"></span>
              )}
            </button>
            
            <div 
              className="h-10 w-10 rounded-xl bg-navy-800 border-2 border-navy-700 p-0.5 hover:border-accent-cyan transition-all cursor-pointer relative group"
              onClick={() => setCurrentView('profile')}
            >
              <div className="w-full h-full rounded-lg bg-gradient-to-tr from-accent-cyan to-blue-500 flex items-center justify-center text-navy-950 font-bold text-xs overflow-hidden">
                {currentUserProfile?.avatar_url ? (
                  <img src={currentUserProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUserProfile?.full_name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="absolute top-full right-0 mt-2 w-max px-3 py-1.5 bg-navy-800 border border-navy-700 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all">
                <p className="text-xs text-white font-medium">Meu Perfil</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar bg-navy-900/40">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentView}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -15 }}
              transition={{ duration: 0.3, ease: "circOut" }}
            >
              {currentView === 'dashboard' && <DashboardView />}
              {currentView === 'schedule' && <ScheduleView canSeeSongs={canSeeSongs} />}
              {currentView === 'volunteers' && <VolunteersView />}
              {currentView === 'ministries' && <MinistriesView />}
              {currentView === 'songs' && canSeeSongs && <SongsView />}
              {currentView === 'profile' && (
                <ProfileView 
                  userId={currentUserId} 
                  profile={currentUserProfile}
                  onProfileUpdate={setCurrentUserProfile}
                  onLogout={() => supabase.auth.signOut()} 
                />
              )}
            </motion.div>
          </AnimatePresence>
        </div>
      </main>
    </div>
  );
}

function NavItem({ icon, label, active, onClick }: { icon: ReactNode, label: string, active?: boolean, onClick?: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`nav-link w-full ${active ? 'nav-link-active' : ''}`}
    >
      <span className={active ? 'text-accent-cyan' : 'text-slate-gray'}>{icon}</span>
      <span className={active ? 'text-white' : 'text-slate-gray'}>{label}</span>
      {active && <motion.div layoutId="nav-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-accent-cyan shadow-[0_0_10px_#64FFDA]" />}
    </button>
  );
}

// Reusing views components from App.tsx
function DashboardView() {
  const [churchName, setChurchName] = useState('');
  const [churchId, setChurchId] = useState('');
  const [stats, setStats] = useState({ volunteers: 0 });
  const [nextEvents, setNextEvents] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [calendarDate, setCalendarDate] = useState(new Date());
  const [eventDates, setEventDates] = useState<Set<string>>(new Set());

  // Modal de criação de evento
  const [selectedDate, setSelectedDate] = useState('');
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState('');
  const [newEventTime, setNewEventTime] = useState('09:00');
  const [newEventDescription, setNewEventDescription] = useState('');
  const [isCreatingEvent, setIsCreatingEvent] = useState(false);

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('church_id')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profile) {
      setChurchId(profile.church_id);
      const [
        { count: volCount },
        { data: upcomingEvents },
        { data: mins },
        { data: church },
        { data: allEvents }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('church_id', profile.church_id),
        supabase.from('events').select('*').eq('church_id', profile.church_id).gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(5),
        supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name'),
        supabase.from('churches').select('name').eq('id', profile.church_id).single(),
        supabase.from('events').select('date').eq('church_id', profile.church_id)
      ]);

      setStats({ volunteers: volCount || 0 });
      setNextEvents(upcomingEvents || []);
      setMinistries(mins || []);
      if (church) setChurchName(church.name || '');
      if (allEvents) {
        const dates = new Set(allEvents.map((e: any) => e.date.split('T')[0]));
        setEventDates(dates as Set<string>);
      }
    }
    setLoading(false);
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setNewEventTitle('');
    setNewEventTime('09:00');
    setNewEventDescription('');
    setIsEventModalOpen(true);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !churchId) return;
    setIsCreatingEvent(true);

    const dateTime = `${selectedDate}T${newEventTime}:00`;
    const { error } = await supabase.from('events').insert({
      church_id: churchId,
      title: newEventTitle.trim(),
      description: newEventDescription.trim() || null,
      date: dateTime,
    });

    if (!error) {
      setIsEventModalOpen(false);
      await fetchDashboardData();
    } else {
      alert('Erro ao criar evento: ' + error.message);
    }
    setIsCreatingEvent(false);
  };

  const getDaysInMonth = (date: Date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    return { firstDay, daysInMonth };
  };

  const { firstDay, daysInMonth } = getDaysInMonth(calendarDate);
  const today = new Date();
  const monthNames = ['Janeiro','Fevereiro','Março','Abril','Maio','Junho','Julho','Agosto','Setembro','Outubro','Novembro','Dezembro'];
  const dayNames = ['D','S','T','Q','Q','S','S'];

  const formatSelectedDate = (str: string) => {
    if (!str) return '';
    const [y, m, d] = str.split('-');
    return `${d}/${m}/${y}`;
  };

  if (loading) {
    return (
      <div className="flex justify-center p-12">
        <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <header>
        <p className="text-[10px] font-black text-slate-gray uppercase tracking-[0.25em] mb-1">Painel da Igreja</p>
        <h2 className="text-3xl sm:text-4xl font-display font-black text-white tracking-tighter leading-none">
          {churchName || 'Sua Igreja'}
        </h2>
      </header>

      {/* Stat: Volunteers */}
      <div className="glass-card p-6 flex items-center gap-6 border-accent-cyan/20">
        <div className="w-14 h-14 rounded-2xl bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center flex-shrink-0">
          <Users size={26} className="text-accent-cyan" />
        </div>
        <div>
          <p className="text-[10px] font-black text-slate-gray uppercase tracking-widest mb-1">Total de Voluntários</p>
          <p className="text-5xl font-display font-black text-white leading-none">{stats.volunteers}</p>
        </div>
        <div className="ml-auto text-right hidden sm:block">
          <p className="text-[10px] text-slate-gray uppercase tracking-widest">Membros ativos</p>
          <p className="text-xs text-accent-cyan font-bold mt-1">na sua igreja</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Calendar */}
        <section className="glass-card p-6">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-base font-display font-black text-white uppercase tracking-tight flex items-center gap-2">
              <CalendarDays size={18} className="text-accent-cyan" /> Calendário
            </h3>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() - 1, 1))}
                className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-gray hover:text-white transition-all"
              >
                <ChevronLeft size={14} />
              </button>
              <span className="text-sm font-black text-white w-32 text-center">
                {monthNames[calendarDate.getMonth()]} {calendarDate.getFullYear()}
              </span>
              <button
                onClick={() => setCalendarDate(new Date(calendarDate.getFullYear(), calendarDate.getMonth() + 1, 1))}
                className="w-7 h-7 rounded-lg bg-navy-800 hover:bg-navy-700 flex items-center justify-center text-slate-gray hover:text-white transition-all"
              >
                <ChevronRight size={14} />
              </button>
            </div>
          </div>

          <p className="text-[10px] text-slate-gray mb-3 flex items-center gap-1.5">
            <Plus size={10} className="text-accent-cyan" />
            Clique em um dia para criar um evento
          </p>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {dayNames.map((d, i) => (
              <div key={i} className="text-center text-[10px] font-black text-slate-gray uppercase py-1">{d}</div>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1">
            {Array.from({ length: firstDay }).map((_, i) => (
              <div key={`empty-${i}`} />
            ))}
            {Array.from({ length: daysInMonth }).map((_, i) => {
              const day = i + 1;
              const dateStr = `${calendarDate.getFullYear()}-${String(calendarDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
              const isToday = day === today.getDate() && calendarDate.getMonth() === today.getMonth() && calendarDate.getFullYear() === today.getFullYear();
              const hasEvent = eventDates.has(dateStr);
              return (
                <button
                  key={day}
                  onClick={() => handleDayClick(dateStr)}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold relative transition-all cursor-pointer group ${
                    isToday
                      ? 'bg-accent-cyan text-navy-950 shadow-[0_0_12px_rgba(100,255,218,0.4)] hover:shadow-[0_0_20px_rgba(100,255,218,0.6)]'
                      : hasEvent
                      ? 'bg-navy-800 text-white border border-accent-cyan/30 hover:border-accent-cyan/70 hover:bg-navy-700'
                      : 'text-slate-gray hover:bg-navy-800 hover:text-white'
                  }`}
                >
                  {day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-accent-cyan" />
                  )}
                  {!hasEvent && !isToday && (
                    <span className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                      <Plus size={10} className="text-accent-cyan absolute top-0.5 right-0.5" />
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </section>

        {/* Próximos Cultos */}
        <section className="glass-card p-6">
          <h3 className="text-base font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mb-5">
            <Clock size={18} className="text-accent-cyan" /> Próximos Cultos
          </h3>
          <div className="space-y-3">
            {nextEvents.length === 0 ? (
              <div className="py-10 text-center border-2 border-dashed border-navy-800 rounded-2xl">
                <Calendar size={24} className="text-slate-gray mx-auto mb-2 opacity-30" />
                <p className="text-slate-gray text-sm italic">Nenhum evento agendado.</p>
                <p className="text-[10px] text-slate-gray mt-1">Clique em um dia no calendário para criar.</p>
              </div>
            ) : (
              nextEvents.map(event => {
                const d = new Date(event.date);
                return (
                  <div key={event.id} className="flex items-center gap-4 p-3 bg-navy-900/60 border border-navy-800 rounded-2xl hover:border-accent-cyan/30 transition-all group">
                    <div className="w-11 h-11 bg-navy-800 rounded-xl flex flex-col items-center justify-center border border-navy-700 group-hover:border-accent-cyan/40 transition-all flex-shrink-0">
                      <span className="text-[9px] font-black text-accent-cyan uppercase leading-none">
                        {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-base font-black text-white leading-tight">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-accent-cyan transition-colors truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-gray truncate">{event.description || 'Sem descrição'}</p>
                    </div>
                    <ChevronRight size={16} className="text-navy-700 group-hover:text-accent-cyan transition-all flex-shrink-0" />
                  </div>
                );
              })
            )}
          </div>
        </section>
      </div>

      {/* Ministérios */}
      <section>
        <h3 className="text-base font-display font-black text-white uppercase tracking-tight flex items-center gap-2 mb-4">
          <BookOpen size={18} className="text-accent-cyan" /> Ministérios
        </h3>
        {ministries.length === 0 ? (
          <p className="text-slate-gray text-sm italic">Nenhum ministério cadastrado.</p>
        ) : (
          <div className="flex flex-wrap gap-3">
            {ministries.map(m => (
              <div
                key={m.id}
                className="flex items-center gap-2.5 px-4 py-2.5 rounded-xl border bg-navy-900/60 hover:bg-navy-800/60 transition-all"
                style={{ borderColor: `${m.color}40` }}
              >
                <div className="w-2.5 h-2.5 rounded-full shadow-[0_0_6px_currentColor]" style={{ backgroundColor: m.color, color: m.color }} />
                <span className="text-sm font-bold text-white">{m.name}</span>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Modal: Criar Evento */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => setIsEventModalOpen(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0, y: 16 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: 16 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-6 md:p-8 w-full max-w-md relative"
            >
              {/* Header */}
              <div className="flex items-start justify-between mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-7 h-7 rounded-lg bg-accent-cyan/10 border border-accent-cyan/20 flex items-center justify-center">
                      <CalendarDays size={14} className="text-accent-cyan" />
                    </div>
                    <span className="text-[10px] font-black text-accent-cyan uppercase tracking-widest">Novo Evento</span>
                  </div>
                  <h3 className="text-2xl font-display font-black text-white tracking-tighter">
                    {formatSelectedDate(selectedDate)}
                  </h3>
                </div>
                <button
                  onClick={() => setIsEventModalOpen(false)}
                  className="p-2 text-slate-gray hover:text-white transition-colors"
                >
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                    Título do Evento *
                  </label>
                  <input
                    type="text"
                    required
                    autoFocus
                    value={newEventTitle}
                    onChange={e => setNewEventTitle(e.target.value)}
                    placeholder="Ex: Culto de Domingo, Ensaio, Célula..."
                    className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 transition-all text-sm"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                    Horário
                  </label>
                  <input
                    type="time"
                    value={newEventTime}
                    onChange={e => setNewEventTime(e.target.value)}
                    className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan/50 transition-all text-sm [color-scheme:dark]"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                    Descrição <span className="normal-case font-medium">(opcional)</span>
                  </label>
                  <textarea
                    value={newEventDescription}
                    onChange={e => setNewEventDescription(e.target.value)}
                    placeholder="Observações, local, informações adicionais..."
                    rows={3}
                    className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 transition-all text-sm resize-none"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-gray hover:text-white hover:bg-navy-800 transition-colors"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingEvent || !newEventTitle.trim()}
                    className="flex-1 py-3 rounded-xl bg-accent-cyan text-navy-950 font-black text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {isCreatingEvent ? (
                      <><div className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" /> Criando...</>
                    ) : (
                      <><Plus size={16} /> Criar Evento</>
                    )}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}



function VolunteersView() {
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [volunteerMinistries, setVolunteerMinistries] = useState<any[]>([]);
  const [inviteCode, setInviteCode] = useState<string>('');
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  
  const [selectedVolunteer, setSelectedVolunteer] = useState<any>(null);
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [selectedMinistries, setSelectedMinistries] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [myId, setMyId] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: profile } = await supabase.from('profiles').select('church_id, role').eq('id', sessionData.session.user.id).single();
      
      if (profile) {
        setMyId(sessionData.session.user.id);
        setCurrentUserRole(profile.role);
        // Fetch Invite Code
        const { data: church } = await supabase.from('churches').select('invite_code').eq('id', profile.church_id).single();
        if (church) setInviteCode(church.invite_code);

        // Fetch Volunteers
        const { data: vols } = await supabase.from('profiles').select('*').eq('church_id', profile.church_id).order('full_name');
        if (vols) setVolunteers(vols);

        // Fetch Ministries
        const { data: mins } = await supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name');
        if (mins) setMinistries(mins);

        // Fetch Volunteer Ministries
        const { data: volMins } = await supabase.from('volunteer_ministries').select('*');
        if (volMins) setVolunteerMinistries(volMins);
      }
    }
    setLoading(false);
  };

  const openVolunteerModal = (volunteer: any) => {
    setSelectedVolunteer(volunteer);
    setSelectedRole(volunteer.role);
    // Find ministries this volunteer is part of
    const assigned = volunteerMinistries
      .filter(vm => vm.volunteer_id === volunteer.id)
      .map(vm => vm.ministry_id);
    setSelectedMinistries(assigned);
  };

  const toggleMinistry = (ministryId: string) => {
    if (selectedMinistries.includes(ministryId)) {
      setSelectedMinistries(selectedMinistries.filter(id => id !== ministryId));
    } else {
      setSelectedMinistries([...selectedMinistries, ministryId]);
    }
  };

  const saveVolunteer = async () => {
    if (!selectedVolunteer) return;
    setIsSubmitting(true);

    try {
      // 1. Update Role in profiles table - Only if it changed and user is manager
      if (selectedRole !== selectedVolunteer.role) {
        if (currentUserRole !== 'manager') {
          alert('Apenas o pastor pode alterar cargos.');
          return;
        }
        const { error: roleError } = await supabase.from('profiles').update({ role: selectedRole }).eq('id', selectedVolunteer.id);
        if (roleError) throw roleError;
      }

      // 2. Update volunteer_ministries
      // First, delete existing ones for this volunteer
      const { error: delError } = await supabase.from('volunteer_ministries').delete().eq('volunteer_id', selectedVolunteer.id);
      if (delError) {
        console.error('Erro ao remover ministérios antigos:', delError);
        throw delError;
      }
      
      // Then insert new ones
      if (selectedMinistries.length > 0) {
        const inserts = selectedMinistries.map(mId => ({
          volunteer_id: selectedVolunteer.id,
          ministry_id: mId
        }));
        const { error: insError } = await supabase.from('volunteer_ministries').insert(inserts);
        if (insError) {
          console.error('Erro ao associar novos ministérios:', insError);
          throw insError;
        }
      }

      await fetchData(); // Refresh data
      setSelectedVolunteer(null); // Close modal
      alert('Alterações salvas com sucesso!');
    } catch (error: any) {
      console.error(error);
      alert('Erro ao salvar: ' + (error.message || 'Erro desconhecido. Verifique as permissões.'));
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">Corpo de Voluntários</h2>
          <p className="text-slate-gray text-sm sm:text-base">Gerencie os membros e seus papéis ministeriais.</p>
        </div>
        
        {inviteCode && (
          <div className="flex items-center gap-3 bg-navy-800/80 px-4 py-2 rounded-xl border border-accent-cyan/30">
            <span className="text-xs text-slate-gray font-bold uppercase tracking-widest">Código da Igreja:</span>
            <span className="text-lg font-black text-accent-cyan tracking-widest">{inviteCode}</span>
          </div>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : volunteers.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Membro</h3>
          <p className="text-slate-gray">Envie o código {inviteCode} para sua equipe se cadastrar.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {volunteers.map(v => {
            const vMins = volunteerMinistries.filter(vm => vm.volunteer_id === v.id).map(vm => ministries.find(m => m.id === vm.ministry_id)).filter(Boolean);
            const isMe = v.id === myId;
            
            return (
              <div key={v.id} onClick={() => openVolunteerModal(v)} className={`glass-card p-6 group hover:border-accent-cyan transition-all cursor-pointer flex flex-col items-center text-center relative overflow-hidden ${isMe ? 'ring-2 ring-accent-cyan ring-inset border-accent-cyan/50 shadow-[0_0_20px_rgba(100,255,218,0.15)]' : ''}`}>
                <div className="absolute top-0 right-0 p-3 flex flex-col items-end gap-1">
                  {isMe && (
                    <span className="text-[8px] font-black bg-accent-cyan text-navy-950 px-2 py-0.5 rounded-full mb-1 shadow-[0_0_10px_rgba(100,255,218,0.5)] animate-pulse">VOCÊ</span>
                  )}
                  <span className={`text-[9px] uppercase font-black tracking-widest px-2 py-1 rounded-md ${v.role === 'manager' ? 'bg-purple-500/20 text-purple-400' : v.role === 'leader' ? 'bg-blue-500/20 text-blue-400' : 'bg-slate-800 text-slate-400'}`}>
                    {v.role === 'manager' ? 'Gerente' : v.role === 'leader' ? 'Líder' : 'Voluntário'}
                  </span>
                </div>
                
                <div className="relative mb-4 mt-2">
                  <div className="w-20 h-20 rounded-3xl bg-navy-700 flex items-center justify-center text-2xl font-black text-accent-cyan border border-navy-600 group-hover:scale-105 transition-transform overflow-hidden shadow-xl">
                    {v.full_name?.charAt(0) || '?'}
                  </div>
                </div>
                <h4 className="font-display font-bold text-white text-lg mb-1 group-hover:text-accent-cyan transition-colors line-clamp-1 w-full">{v.full_name}</h4>
                
                <div className="flex flex-wrap justify-center gap-1.5 mt-4 min-h-[28px]">
                  {vMins.map((m: any) => (
                    <span key={m.id} className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: `${m.color}20`, color: m.color, border: `1px solid ${m.color}40` }}>
                      {m.name}
                    </span>
                  ))}
                  {vMins.length === 0 && <span className="text-[10px] text-slate-500 italic">Sem ministério</span>}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Editar Voluntário */}
      <AnimatePresence>
        {selectedVolunteer && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-md relative max-h-[90vh] flex flex-col"
            >
              <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-1 line-clamp-1">{selectedVolunteer.full_name}</h3>
              <p className="text-slate-gray text-sm mb-6">Gerencie o nível de acesso e vínculos.</p>

              <div className="overflow-y-auto custom-scrollbar flex-1 pr-2 space-y-6">
                {/* Nível de Acesso - Só aparece para Gerentes */}
                {currentUserRole === 'manager' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-3">Nível de Acesso</label>
                    <div className="space-y-2">
                      <button onClick={() => setSelectedRole('volunteer')} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selectedRole === 'volunteer' ? 'bg-navy-800 border-accent-cyan' : 'bg-navy-900 border-navy-800 hover:border-navy-700'}`}>
                        <div className="flex items-center gap-3"><User size={18} className={selectedRole === 'volunteer' ? 'text-accent-cyan' : 'text-slate-gray'} /><span className="text-sm font-bold text-white">Voluntário</span></div>
                        {selectedRole === 'volunteer' && <div className="w-2 h-2 rounded-full bg-accent-cyan" />}
                      </button>
                      <button onClick={() => setSelectedRole('leader')} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selectedRole === 'leader' ? 'bg-navy-800 border-blue-400' : 'bg-navy-900 border-navy-800 hover:border-navy-700'}`}>
                        <div className="flex items-center gap-3"><ShieldCheck size={18} className={selectedRole === 'leader' ? 'text-blue-400' : 'text-slate-gray'} /><span className="text-sm font-bold text-white">Líder</span></div>
                        {selectedRole === 'leader' && <div className="w-2 h-2 rounded-full bg-blue-400" />}
                      </button>
                      <button onClick={() => setSelectedRole('manager')} className={`w-full flex items-center justify-between p-3 rounded-xl border ${selectedRole === 'manager' ? 'bg-navy-800 border-purple-400' : 'bg-navy-900 border-navy-800 hover:border-navy-700'}`}>
                        <div className="flex items-center gap-3"><Building size={18} className={selectedRole === 'manager' ? 'text-purple-400' : 'text-slate-gray'} /><span className="text-sm font-bold text-white">Gerente (Admin)</span></div>
                        {selectedRole === 'manager' && <div className="w-2 h-2 rounded-full bg-purple-400" />}
                      </button>
                    </div>
                  </div>
                )}

                {/* Ministérios */}
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-3">Ministérios</label>
                  {ministries.length === 0 ? (
                    <p className="text-sm text-slate-500 italic">Nenhum ministério cadastrado na igreja.</p>
                  ) : (
                    <div className="space-y-2">
                      {ministries.map(m => {
                        const isSelected = selectedMinistries.includes(m.id);
                        return (
                          <button key={m.id} onClick={() => toggleMinistry(m.id)} className={`w-full flex items-center justify-between p-3 rounded-xl border transition-all ${isSelected ? 'bg-navy-800 border-accent-cyan/50' : 'bg-navy-900 border-navy-800 hover:border-navy-700'}`}>
                            <div className="flex items-center gap-3">
                              <div className="w-3 h-3 rounded-full" style={{ backgroundColor: m.color }} />
                              <span className="text-sm font-bold text-white">{m.name}</span>
                            </div>
                            <div className={`w-5 h-5 rounded flex items-center justify-center border ${isSelected ? 'bg-accent-cyan border-accent-cyan' : 'border-navy-600'}`}>
                              {isSelected && <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className="w-3.5 h-3.5 text-navy-950 font-bold" strokeWidth="3"><polyline points="20 6 9 17 4 12" /></svg>}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-3 pt-6 mt-2 border-t border-navy-800">
                <button type="button" onClick={() => setSelectedVolunteer(null)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white hover:bg-navy-800 transition-colors">Cancelar</button>
                <button type="button" onClick={saveVolunteer} disabled={isSubmitting} className="flex-1 btn-primary text-sm">
                  {isSubmitting ? 'Salvando...' : 'Salvar'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const PREDEFINED_MINISTRIES = [
  {
    name: 'Mídia & Comunicação',
    description: 'Responsável pela transmissão ao vivo, fotografia, redes sociais, projeção e design visual.',
    color: '#0EA5E9'
  },
  {
    name: 'Louvor & Adoração',
    description: 'Equipe de músicos, vocalistas, sonoplastia e direção musical dos cultos.',
    color: '#A855F7'
  },
  {
    name: 'Ministério Kids',
    description: 'Cuidado, ensino bíblico infantil, recreação e discipulado de crianças.',
    color: '#F43F5E'
  },
  {
    name: 'Recepção & Integração',
    description: 'Acolhimento de membros e visitantes, orientação física e suporte no hall de entrada.',
    color: '#34D399'
  },
  {
    name: 'Intercessão & Oração',
    description: 'Equipe dedicada à oração pastoral, intercessão pré/pós culto e aconselhamento de oração.',
    color: '#FBBF24'
  },
  {
    name: 'Ação Social',
    description: 'Projetos beneficentes, distribuição de cestas básicas, visitas a asilos/hospitais e caridade.',
    color: '#64FFDA'
  },
  {
    name: 'Teatro & Artes Cênicas',
    description: 'Expressão artística, peças teatrais, dança e apresentações artísticas especiais.',
    color: '#EC4899'
  },
  {
    name: 'Infraestrutura & Apoio',
    description: 'Logística de cultos, segurança, limpeza, organização e suporte geral do templo.',
    color: '#64748B'
  }
];

function MinistriesView() {
  const [ministries, setMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [churchId, setChurchId] = useState<string>('');
  const [currentUserRole, setCurrentUserRole] = useState<string>('');

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [color, setColor] = useState('#64FFDA');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [creationMode, setCreationMode] = useState<'preset' | 'custom'>('preset');
  const [selectedPresetIndex, setSelectedPresetIndex] = useState<number>(0);

  const openCreateModal = () => {
    setCreationMode('preset');
    setSelectedPresetIndex(0);
    setName(PREDEFINED_MINISTRIES[0].name);
    setDescription(PREDEFINED_MINISTRIES[0].description);
    setColor(PREDEFINED_MINISTRIES[0].color);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setName('');
    setDescription('');
    setColor('#64FFDA');
  };

  const handleSelectPreset = (index: number) => {
    setSelectedPresetIndex(index);
    setName(PREDEFINED_MINISTRIES[index].name);
    setDescription(PREDEFINED_MINISTRIES[index].description);
    setColor(PREDEFINED_MINISTRIES[index].color);
  };

  const handleModeChange = (mode: 'preset' | 'custom') => {
    setCreationMode(mode);
    if (mode === 'preset') {
      handleSelectPreset(selectedPresetIndex);
    } else {
      setName('');
      setDescription('');
      setColor('#64FFDA');
    }
  };

  // Gestão de Membros
  const [managingMinistry, setManagingMinistry] = useState<any>(null);
  const [members, setMembers] = useState<any[]>([]);
  const [allChurchVolunteers, setAllChurchVolunteers] = useState<any[]>([]);
  const [loadingMembers, setLoadingMembers] = useState(false);
  const [selectedNewMember, setSelectedNewMember] = useState<string>('');

  const PRESET_COLORS = ['#64FFDA', '#0EA5E9', '#A855F7', '#F43F5E', '#FBBF24', '#34D399'];

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMembers = async (ministryId: string) => {
    setLoadingMembers(true);
    try {
      const [leadersRes, volunteersRes] = await Promise.all([
        supabase
          .from('ministry_leaders')
          .select('profiles:profile_id(id, full_name, role, avatar_url)')
          .eq('ministry_id', ministryId),
        supabase
          .from('volunteer_ministries')
          .select('profiles:volunteer_id(id, full_name, role, avatar_url)')
          .eq('ministry_id', ministryId)
      ]);

      const leaders = (leadersRes.data || []).map((l: any) => ({ ...l.profiles, type: 'Líder' }));
      const volunteers = (volunteersRes.data || []).map((v: any) => ({ ...v.profiles, type: 'Voluntário' }));

      // Remove duplicates (if someone is leader and volunteer)
      const combined = [...leaders];
      volunteers.forEach(v => {
        if (!combined.find(c => c.id === v.id)) combined.push(v);
      });

      setMembers(combined);
    } catch (err) {
      console.error('Erro ao buscar membros:', err);
    } finally {
      setLoadingMembers(false);
    }
  };

  const fetchAllChurchVolunteers = async () => {
    if (!churchId) return;
    const { data } = await supabase
      .from('profiles')
      .select('id, full_name')
      .eq('church_id', churchId)
      .order('full_name');
    if (data) setAllChurchVolunteers(data);
  };

  const handleAddMember = async () => {
    if (!selectedNewMember || !managingMinistry) return;
    
    try {
      const { error } = await supabase
        .from('volunteer_ministries')
        .insert({
          volunteer_id: selectedNewMember,
          ministry_id: managingMinistry.id
        });
        
      if (error) throw error;
      
      setSelectedNewMember('');
      fetchMembers(managingMinistry.id);
    } catch (err) {
      console.error('Erro ao adicionar membro:', err);
      alert('Erro ao adicionar membro.');
    }
  };

  const handleRemoveMember = async (memberId: string) => {
    if (!managingMinistry) return;
    
    if (!window.confirm('Deseja realmente remover este membro do ministério?')) return;

    try {
      // 1. If leader, demote first to handle profiles.role sync
      const member = members.find(m => m.id === memberId);
      if (member && member.type === 'Líder') {
        await handleToggleLeader(memberId, true);
      }

      // 2. Remove from volunteer_ministries
      await supabase
        .from('volunteer_ministries')
        .delete()
        .eq('volunteer_id', memberId)
        .eq('ministry_id', managingMinistry.id);

      // Refresh
      fetchMembers(managingMinistry.id);
    } catch (err) {
      console.error('Erro ao remover membro:', err);
    }
  };

  const handleToggleLeader = async (memberId: string, isCurrentlyLeader: boolean) => {
    if (!managingMinistry) return;
    
    try {
      if (isCurrentlyLeader) {
        // Demote from this ministry
        await supabase
          .from('ministry_leaders')
          .delete()
          .eq('profile_id', memberId)
          .eq('ministry_id', managingMinistry.id);
          
        // Check if user is leader in any OTHER ministry
        const { data: otherLeaders } = await supabase
          .from('ministry_leaders')
          .select('id')
          .eq('profile_id', memberId);
          
        if (!otherLeaders || otherLeaders.length === 0) {
          // No other leadership roles, set back to volunteer (unless they are manager)
          const { data: profile } = await supabase.from('profiles').select('role').eq('id', memberId).single();
          if (profile && profile.role !== 'manager') {
            await supabase.from('profiles').update({ role: 'volunteer' }).eq('id', memberId);
          }
        }
      } else {
        // Promote to leader of this ministry
        await supabase
          .from('ministry_leaders')
          .insert({
            profile_id: memberId,
            ministry_id: managingMinistry.id
          });
          
        // Ensure user has 'leader' role globally (unless they are already manager)
        const { data: profile } = await supabase.from('profiles').select('role').eq('id', memberId).single();
        if (profile && profile.role === 'volunteer') {
          await supabase.from('profiles').update({ role: 'leader' }).eq('id', memberId);
        }
      }
      // Refresh list
      fetchMembers(managingMinistry.id);
    } catch (err) {
      console.error('Erro ao alternar liderança:', err);
    }
  };

  useEffect(() => {
    fetchMinistries();
  }, []);

  const fetchMinistries = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: profile } = await supabase.from('profiles').select('church_id, role').eq('id', sessionData.session.user.id).single();
      if (profile) {
        setChurchId(profile.church_id);
        setCurrentUserRole(profile.role);
        
        let query = supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name');
        
        if (profile.role === 'leader') {
          const { data: myMins } = await supabase.from('ministry_leaders').select('ministry_id').eq('profile_id', sessionData.session.user.id);
          if (myMins) {
            const ids = myMins.map((m: any) => m.ministry_id);
            query = query.in('id', ids);
          }
        }

        const { data } = await query;
        if (data) setMinistries(data);
      }
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !churchId) return;
    setIsSubmitting(true);
    
    const { error } = await supabase.from('ministries').insert({
      church_id: churchId,
      name,
      description,
      color
    });

    if (!error) {
      handleCloseModal();
      fetchMinistries();
    } else {
      console.error(error);
    }
    setIsSubmitting(false);
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">Ministérios</h2>
          <p className="text-slate-gray text-sm">Organize as equipes e áreas de atuação.</p>
        </div>
        {currentUserRole === 'manager' && (
          <button 
            onClick={openCreateModal}
            className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
          >
            <Plus size={18} /> Criar Ministério
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : ministries.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-slate-gray mb-4">
            <BookOpen size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Ministério Encontrado</h3>
          <p className="text-slate-gray mb-6 max-w-sm">Comece criando os ministérios da sua igreja para poder organizar as escalas e os voluntários.</p>
          <button onClick={openCreateModal} className="btn-primary text-sm px-6 py-2">Criar o Primeiro</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
          {ministries.map(m => (
            <div key={m.id} className="glass-card overflow-hidden group hover:border-accent-cyan/30 transition-all">
              <div className="h-2 bg-navy-800 w-full relative">
                <div className="h-full shadow-[0_0_10px_currentColor]" style={{ backgroundColor: m.color, width: '100%', color: m.color }} />
              </div>
              <div className="p-6 sm:p-8">
                <div className="flex justify-between items-start mb-4 sm:mb-6">
                  <h4 className="font-display font-black text-xl sm:text-2xl text-white group-hover:text-accent-cyan transition-colors line-clamp-1">{m.name}</h4>
                  {currentUserRole === 'manager' && (
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm(`Deseja realmente excluir o ministério ${m.name}?`)) {
                          supabase.from('ministries').delete().eq('id', m.id).then(() => fetchMinistries());
                        }
                      }}
                      className="p-2 text-slate-gray hover:text-red-500 transition-colors opacity-0 group-hover:opacity-100"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
                <p className="text-xs sm:text-sm text-slate-gray mb-6 sm:mb-8 leading-relaxed line-clamp-2 min-h-[40px]">{m.description || 'Sem descrição'}</p>
                <div className="flex justify-between items-center pt-4 border-t border-navy-800">
                   <span className="text-[10px] uppercase font-bold text-slate-gray tracking-widest">Ações</span>
                   <button 
                     onClick={() => { 
                       setManagingMinistry(m); 
                       fetchMembers(m.id);
                       fetchAllChurchVolunteers();
                     }}
                     className="text-xs text-accent-cyan hover:text-white font-bold transition-colors"
                   >
                     Gerenciar Membros
                   </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal de Criação */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-md relative overflow-hidden"
            >
              <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-4">Novo Ministério</h3>
              
              {/* Seletor de Tipo de Criação */}
              <div className="flex bg-navy-950/60 p-1 rounded-xl border border-navy-800 mb-5">
                <button
                  type="button"
                  onClick={() => handleModeChange('preset')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${creationMode === 'preset' ? 'bg-navy-800 text-accent-cyan shadow-sm font-black' : 'text-slate-gray hover:text-white'}`}
                >
                  Predefinidos
                </button>
                <button
                  type="button"
                  onClick={() => handleModeChange('custom')}
                  className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all cursor-pointer ${creationMode === 'custom' ? 'bg-navy-800 text-accent-cyan shadow-sm font-black' : 'text-slate-gray hover:text-white'}`}
                >
                  Personalizado
                </button>
              </div>

              <form onSubmit={handleCreate} className="space-y-4">
                {creationMode === 'preset' && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Escolha uma opção</label>
                    <div className="grid grid-cols-2 gap-2 max-h-[160px] overflow-y-auto pr-1 custom-scrollbar mb-2 bg-navy-950/20 p-2 rounded-xl border border-navy-800/50">
                      {PREDEFINED_MINISTRIES.map((preset, index) => {
                        const isSelected = selectedPresetIndex === index;
                        return (
                          <button
                            key={preset.name}
                            type="button"
                            onClick={() => handleSelectPreset(index)}
                            className={`flex items-center gap-2.5 p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-navy-800 border-accent-cyan shadow-[0_0_10px_rgba(100,255,218,0.15)]'
                                : 'bg-navy-950/40 border-navy-800 hover:border-navy-700'
                            }`}
                          >
                            <div className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: preset.color }} />
                            <span className="text-[11px] font-bold text-white truncate">{preset.name}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                    {creationMode === 'preset' ? 'Nome (Edite se desejar)' : 'Nome'}
                  </label>
                  <input type="text" required value={name} onChange={e => setName(e.target.value)} placeholder="Ex: Mídia e Tech" className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Descritivo</label>
                  <textarea value={description} onChange={e => setDescription(e.target.value)} placeholder="Responsáveis pela transmissão, som e projeção..." rows={3} className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 focus:bg-navy-950 transition-all text-sm resize-none" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-3 ml-1">Cor Temática</label>
                  <div className="flex flex-wrap gap-3">
                    {PRESET_COLORS.map(c => (
                      <button 
                        key={c} type="button" onClick={() => setColor(c)}
                        className={`w-8 h-8 rounded-full border-2 transition-all cursor-pointer ${color === c ? 'border-white scale-110 shadow-[0_0_15px_currentColor]' : 'border-transparent hover:scale-110'}`}
                        style={{ backgroundColor: c, color: c }}
                      />
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={handleCloseModal} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white hover:bg-navy-800 transition-colors cursor-pointer">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary text-sm cursor-pointer">
                    {isSubmitting ? 'Salvando...' : 'Criar Ministério'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Gestão de Membros */}
      <AnimatePresence>
        {managingMinistry && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-2xl relative overflow-hidden flex flex-col max-h-[85vh]"
            >
              <div className="flex justify-between items-start mb-6">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <div className="w-3 h-3 rounded-full shadow-[0_0_8px_currentColor]" style={{ backgroundColor: managingMinistry.color, color: managingMinistry.color }} />
                    <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest">{managingMinistry.name}</span>
                  </div>
                  <h3 className="text-2xl font-display font-black text-white tracking-tighter">Gestão de Equipe</h3>
                </div>
                <button 
                  onClick={() => setManagingMinistry(null)}
                  className="p-2 text-slate-gray hover:text-white transition-colors"
                >
                  <XCircle size={24} />
                </button>
              </div>

              {/* Adicionar Novo Membro */}
              <div className="mb-8 p-4 bg-navy-900/50 rounded-2xl border border-navy-800 flex flex-col sm:flex-row gap-3">
                <div className="flex-1">
                  <select 
                    value={selectedNewMember}
                    onChange={(e) => setSelectedNewMember(e.target.value)}
                    className="w-full bg-navy-950 border border-navy-700 text-white text-sm rounded-xl px-4 py-2.5 focus:border-accent-cyan transition-colors outline-none"
                  >
                    <option value="">Selecionar voluntário para adicionar...</option>
                    {allChurchVolunteers
                      .filter(v => !members.find(m => m.id === v.id))
                      .map(v => (
                        <option key={v.id} value={v.id}>{v.full_name}</option>
                      ))
                    }
                  </select>
                </div>
                <button 
                  onClick={handleAddMember}
                  disabled={!selectedNewMember}
                  className="btn-primary py-2.5 px-6 text-sm flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  <Plus size={18} /> Adicionar
                </button>
              </div>

              <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
                {loadingMembers ? (
                  <div className="flex justify-center py-12">
                    <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
                  </div>
                ) : members.length === 0 ? (
                  <div className="text-center py-12 bg-navy-900/50 rounded-2xl border border-dashed border-navy-800">
                    <p className="text-slate-gray">Nenhum membro vinculado a este ministério ainda.</p>
                  </div>
                ) : (
                  <div className="space-y-2">
                    {/* Desktop: Table Header */}
                    <div className="hidden sm:grid grid-cols-[1fr_auto_auto] gap-4 px-4 py-2">
                      <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest">Membro</span>
                      <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest">Função</span>
                      <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest text-right pr-2">Ações</span>
                    </div>

                    {members.map(member => (
                      <div
                        key={member.id}
                        className="bg-navy-900/50 border border-navy-800 rounded-2xl p-4 hover:border-navy-700 transition-all"
                      >
                        {/* Mobile layout: stacked */}
                        <div className="flex items-start justify-between gap-3">
                          {/* Avatar + Name */}
                          <div className="flex items-center gap-3 flex-1 min-w-0">
                            <div className="w-10 h-10 flex-shrink-0 rounded-xl bg-navy-800 flex items-center justify-center text-accent-cyan font-bold border border-navy-700 overflow-hidden">
                              {member.avatar_url
                                ? <img src={member.avatar_url} alt="" className="w-full h-full object-cover" />
                                : member.full_name?.charAt(0)
                              }
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-bold text-white truncate">{member.full_name}</p>
                              <div className="flex items-center gap-2 mt-1 flex-wrap">
                                <span className={`text-[10px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md ${
                                  member.type === 'Líder' 
                                    ? 'bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/20' 
                                    : 'bg-slate-800 text-slate-400 border border-slate-700'
                                }`}>
                                  {member.type}
                                </span>
                                <span className="text-[10px] text-slate-gray">
                                  {member.role === 'manager' ? 'Administrador' : 'Voluntário'}
                                </span>
                              </div>
                            </div>
                          </div>

                          {/* Action Buttons — always visible */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => handleToggleLeader(member.id, member.type === 'Líder')}
                              title={member.type === 'Líder' ? 'Remover Liderança' : 'Promover a Líder'}
                              className={`p-2.5 rounded-xl transition-all ${
                                member.type === 'Líder'
                                  ? 'text-red-400 bg-red-500/10 hover:bg-red-500/20'
                                  : 'text-accent-cyan bg-accent-cyan/10 hover:bg-accent-cyan/20'
                              }`}
                            >
                              {member.type === 'Líder' ? <UserMinus size={18} /> : <Crown size={18} />}
                            </button>
                            <button
                              onClick={() => handleRemoveMember(member.id)}
                              title="Remover do Ministério"
                              className="p-2.5 rounded-xl text-slate-gray bg-navy-800 hover:text-red-400 hover:bg-red-500/10 transition-all"
                            >
                              <Trash2 size={18} />
                            </button>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="mt-8 pt-6 border-t border-navy-800 flex justify-end">
                <button 
                  onClick={() => setManagingMinistry(null)}
                  className="px-6 py-2.5 rounded-xl bg-navy-800 text-white font-bold text-sm hover:bg-navy-700 transition-colors border border-navy-700"
                >
                  Fechar Painel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function ScheduleView({ canSeeSongs }: { canSeeSongs: boolean }) {
  const [events, setEvents] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [schedules, setSchedules] = useState<any[]>([]);
  const [scheduleVolunteers, setScheduleVolunteers] = useState<any[]>([]);
  const [volunteers, setVolunteers] = useState<any[]>([]);
  const [volunteerMinistries, setVolunteerMinistries] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentUserRole, setCurrentUserRole] = useState<string>('');
  const [churchId, setChurchId] = useState<string>('');

  // Modais
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [isScheduleModalOpen, setIsScheduleModalOpen] = useState(false);
  
  // Novo Evento
  const [eventTitle, setEventTitle] = useState('');
  const [eventDate, setEventDate] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [isSubmittingEvent, setIsSubmittingEvent] = useState(false);

  // Gestão de Escala
  const [selectedEvent, setSelectedEvent] = useState<any>(null);
  const [selectedMinistry, setSelectedMinistry] = useState<any>(null);
  const [isSubmittingSchedule, setIsSubmittingSchedule] = useState(false);
  const [selectedVolsForSchedule, setSelectedVolsForSchedule] = useState<{volunteer_id: string, role_function: string}[]>([]);

  const louvorMin = useMemo(() => {
    return ministries.find(m => {
      const name = m.name.toLowerCase();
      return name.includes('louvor') || name.includes('música') || name.includes('musica') || name.includes('worship');
    });
  }, [ministries]);
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [selectedSongsForSchedule, setSelectedSongsForSchedule] = useState<any[]>([]);
  const [scheduleSongs, setScheduleSongs] = useState<any[]>([]);
  const [leadMinistriesIds, setLeadMinistriesIds] = useState<string[]>([]);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: profile } = await supabase.from('profiles').select('church_id, role').eq('id', sessionData.session.user.id).single();
      if (profile) {
        setChurchId(profile.church_id);
        setCurrentUserRole(profile.role);

        // Fetch everything
        const [
          { data: evs },
          { data: mins },
          { data: schs },
          { data: schVols },
          { data: vols },
          { data: volMins },
          { data: songs },
          { data: schSongs }
        ] = await Promise.all([
          supabase.from('events').select('*').eq('church_id', profile.church_id).order('date', { ascending: true }),
          supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name'),
          supabase.from('schedules').select('*'),
          supabase.from('schedule_volunteers').select('*'),
          supabase.from('profiles').select('*').eq('church_id', profile.church_id).order('full_name'),
          supabase.from('volunteer_ministries').select('*'),
          supabase.from('songs').select('*').eq('church_id', profile.church_id).order('title'),
          supabase.from('schedule_songs').select('*, songs(*)')
        ]);

        if (evs) setEvents(evs);
        if (mins) setMinistries(mins);
        if (schs) setSchedules(schs);
        if (schVols) setScheduleVolunteers(schVols);
        if (vols) setVolunteers(vols);
        if (volMins) setVolunteerMinistries(volMins);
        if (songs) setAllSongs(songs);
        if (schSongs) setScheduleSongs(schSongs);
        else setScheduleSongs([]);

        if (profile.role === 'leader') {
          const { data: myMins } = await supabase
            .from('ministry_leaders')
            .select('ministry_id')
            .eq('profile_id', sessionData.session.user.id);
          if (myMins) setLeadMinistriesIds(myMins.map(m => m.ministry_id));
        }
      }
    }
    setLoading(false);
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!eventTitle || !eventDate) return;
    setIsSubmittingEvent(true);
    
    try {
      const { error } = await supabase.from('events').insert({
        church_id: churchId,
        title: eventTitle,
        date: eventDate,
        description: eventDescription
      });
      
      if (error) {
        console.error('Erro ao criar evento:', error);
        alert('Erro ao criar evento: ' + error.message);
      } else {
        setIsEventModalOpen(false);
        setEventTitle('');
        setEventDate('');
        setEventDescription('');
        await fetchData();
      }
    } catch (err: any) {
      console.error('Erro inesperado:', err);
      alert('Erro inesperado ao criar evento.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const openScheduleModal = async (event: any, ministry: any) => {
    setSelectedEvent(event);
    setSelectedMinistry(ministry);
    
    const schedule = schedules.find(s => s.event_id === event.id && s.ministry_id === ministry.id);
    if (schedule) {
      const vols = scheduleVolunteers
        .filter(sv => sv.schedule_id === schedule.id)
        .map(sv => ({ volunteer_id: sv.volunteer_id, role_function: sv.role_function }));
      setSelectedVolsForSchedule(vols);

      // Buscar setlist
      const { data: songs } = await supabase
        .from('schedule_songs')
        .select('*, songs(*)')
        .eq('schedule_id', schedule.id)
        .order('order_index');
      if (songs) {
        setSelectedSongsForSchedule(songs.map(ss => ss.songs));
      } else {
        setSelectedSongsForSchedule([]);
      }
    } else {
      setSelectedVolsForSchedule([]);
      setSelectedSongsForSchedule([]);
    }
    setIsScheduleModalOpen(true);
  };

  const toggleVolunteerInSchedule = (volunteerId: string) => {
    if (selectedVolsForSchedule.some(v => v.volunteer_id === volunteerId)) {
      setSelectedVolsForSchedule(selectedVolsForSchedule.filter(v => v.volunteer_id !== volunteerId));
    } else {
      setSelectedVolsForSchedule([...selectedVolsForSchedule, { volunteer_id: volunteerId, role_function: '' }]);
    }
  };

  const updateRoleFunction = (volunteerId: string, func: string) => {
    setSelectedVolsForSchedule(selectedVolsForSchedule.map(v => 
      v.volunteer_id === volunteerId ? { ...v, role_function: func } : v
    ));
  };

  const handleSaveSchedule = async () => {
    setIsSubmittingSchedule(true);
    try {
      // 1. Get or Create Schedule
      let scheduleId;
      const existing = schedules.find(s => s.event_id === selectedEvent.id && s.ministry_id === selectedMinistry.id);
      
      if (existing) {
        scheduleId = existing.id;
      } else {
        const { data, error } = await supabase.from('schedules').insert({
          event_id: selectedEvent.id,
          ministry_id: selectedMinistry.id
        }).select().single();
        if (error) throw error;
        scheduleId = data.id;
      }

      // 2. Clear old volunteers
      await supabase.from('schedule_volunteers').delete().eq('schedule_id', scheduleId);

      // 3. Insert new volunteers
      if (selectedVolsForSchedule.length > 0) {
        const inserts = selectedVolsForSchedule.map(v => ({
          schedule_id: scheduleId,
          volunteer_id: v.volunteer_id,
          role_function: v.role_function,
          status: 'pending'
        }));
        await supabase.from('schedule_volunteers').insert(inserts);
      }

      // 3. Salvar Setlist (se for ministério de louvor ou se houver músicas)
      if (selectedSongsForSchedule.length > 0) {
        // Deletar antigos
        await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
        
        // Inserir novos
        const songsToInsert = selectedSongsForSchedule.map((song, index) => ({
          schedule_id: scheduleId,
          song_id: song.id,
          order_index: index + 1
        }));
        await supabase.from('schedule_songs').insert(songsToInsert);
      } else {
        // Se não houver músicas, garantir que limpamos o setlist antigo
        await supabase.from('schedule_songs').delete().eq('schedule_id', scheduleId);
      }

      setIsScheduleModalOpen(false);
      fetchData();
    } catch (error) {
      console.error('Erro ao salvar escala:', error);
      alert('Erro ao salvar escala.');
    }
    setIsSubmittingSchedule(false);
  };

  const addSongToSetlist = (songId: string) => {
    const song = allSongs.find(s => s.id === songId);
    if (song && !selectedSongsForSchedule.find(s => s.id === songId)) {
      setSelectedSongsForSchedule([...selectedSongsForSchedule, song]);
    }
  };

  const removeSongFromSetlist = (songId: string) => {
    setSelectedSongsForSchedule(selectedSongsForSchedule.filter(s => s.id !== songId));
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">Escalas Oficiais</h2>
          <p className="text-slate-gray text-sm">Gerencie os eventos e a escala de cada ministério.</p>
        </div>
        {currentUserRole === 'manager' && (
          <button onClick={() => setIsEventModalOpen(true)} className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center">
            <Plus size={18} /> Novo Evento
          </button>
        )}
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : events.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center border-dashed border-2">
          <Calendar size={48} className="text-navy-700 mb-4" />
          <h3 className="text-xl font-bold text-white mb-2">Nenhum Evento Agendado</h3>
          <p className="text-slate-gray mb-6">Comece criando um novo evento para que os ministérios possam se organizar.</p>
          {currentUserRole === 'manager' && (
            <button onClick={() => setIsEventModalOpen(true)} className="btn-primary text-sm px-6 py-2">Criar Evento</button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {events.map(event => (
            <div key={event.id} className="glass-card overflow-hidden">
              <div className="bg-navy-900/50 p-6 border-b border-navy-800 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 bg-navy-800 rounded-2xl flex flex-col items-center justify-center border border-navy-700 shadow-xl">
                    <span className="text-[10px] font-black text-accent-cyan uppercase leading-none mb-1">
                      {new Date(event.date).toLocaleDateString('pt-BR', { weekday: 'short' }).replace('.', '')}
                    </span>
                    <span className="text-xl font-black text-white leading-none">
                      {new Date(event.date).getDate()}
                    </span>
                  </div>
                  <div>
                    <h4 className="text-xl font-display font-black text-white">{event.title}</h4>
                    <p className="text-sm text-slate-gray">
                      {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {event.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
                  {canSeeSongs && louvorMin && (
                    <button
                      onClick={() => openScheduleModal(event, louvorMin)}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Music size={14} /> Setlist do Dia
                    </button>
                  )}
                  {currentUserRole === 'manager' && (
                    <button 
                      onClick={() => {
                        if (window.confirm(`Excluir o evento "${event.title}"? Isso removerá todas as escalas vinculadas.`)) {
                          supabase.from('events').delete().eq('id', event.id).then(() => fetchData());
                        }
                      }}
                      className="p-2.5 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500/20 hover:text-white transition-all border border-red-500/20 cursor-pointer"
                      title="Excluir Evento"
                    >
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              </div>
              
              <div className="p-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {ministries.map(min => {
                    const isMusicOrMedia = ['louvor', 'musica', 'música', 'worship', 'som', 'mídia', 'midia', 'comunicação', 'comunicacao'].some(k => min.name.toLowerCase().includes(k));
                    if (isMusicOrMedia && !canSeeSongs) return null;

                    const schedule = schedules.find(s => s.event_id === event.id && s.ministry_id === min.id);
                    const volsInMin = scheduleVolunteers.filter(sv => sv.schedule_id === schedule?.id);
                    const canEdit = currentUserRole === 'manager' || leadMinistriesIds.includes(min.id);
                    
                    return (
                      <div key={min.id} className="bg-navy-950/40 border border-navy-800 rounded-2xl p-4 hover:border-navy-700 transition-all">
                        <div className="flex justify-between items-center mb-4">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: min.color }} />
                            <span className="text-sm font-black text-white uppercase tracking-tighter">{min.name}</span>
                          </div>
                          {canEdit ? (
                            <button 
                              onClick={() => openScheduleModal(event, min)}
                              className="text-[10px] font-black uppercase text-accent-cyan hover:text-white transition-colors cursor-pointer"
                            >
                              {schedule ? 'Editar' : 'Montar'}
                            </button>
                          ) : (
                            <span className="text-[10px] font-bold uppercase text-slate-600 flex items-center gap-1">
                              Apenas Ver
                            </span>
                          )}
                        </div>
                        
                        <div className="space-y-2 min-h-[40px]">
                          {volsInMin.length > 0 ? (
                            volsInMin.map(sv => {
                              const vol = volunteers.find(v => v.id === sv.volunteer_id);
                              return (
                                <div key={sv.id} className="flex justify-between items-center text-xs gap-2">
                                  <div className="flex items-center gap-2">
                                    <div className={`w-6 h-6 rounded-lg flex-shrink-0 overflow-hidden border ${
                                      sv.status === 'confirmed' ? 'border-green-400/50' : 
                                      sv.status === 'declined' ? 'border-red-400/50' : 'border-yellow-400/50'
                                    } bg-navy-800`}>
                                      {vol?.avatar_url
                                        ? <img src={vol.avatar_url} alt="" className="w-full h-full object-cover" />
                                        : <span className={`w-full h-full flex items-center justify-center text-[10px] font-black ${
                                            sv.status === 'confirmed' ? 'text-green-400' : 
                                            sv.status === 'declined' ? 'text-red-400' : 'text-yellow-400'
                                          }`}>{vol?.full_name?.charAt(0)}</span>
                                      }
                                    </div>
                                    <span className="text-slate-light font-medium">{vol?.full_name}</span>
                                  </div>
                                  {sv.role_function && (
                                    <span className="text-[10px] text-slate-gray italic">{sv.role_function}</span>
                                  )}
                                </div>
                              );
                            })
                          ) : (
                            <p className="text-[11px] text-slate-600 italic">Ninguém escalado</p>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Criar Evento */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-md relative"
            >
              <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-6 uppercase">Novo Evento</h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Título</label>
                  <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Ex: Culto de Celebração" className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Data e Hora</label>
                  <input type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]" />
                </div>
                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Descrição (Opcional)</label>
                  <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={2} className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm resize-none" />
                </div>
                <div className="flex gap-3 pt-4">
                  <button type="button" onClick={() => setIsEventModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmittingEvent} className="flex-1 btn-primary text-sm">
                    {isSubmittingEvent ? 'Criando...' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal Montar Escala */}
      <AnimatePresence>
        {isScheduleModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-lg relative max-h-[90vh] flex flex-col"
            >
              <div className="mb-6">
                <div className="flex items-center gap-2 mb-1">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: selectedMinistry.color }} />
                  <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest">{selectedMinistry.name}</span>
                </div>
                <h3 className="text-2xl font-display font-black text-white tracking-tighter uppercase line-clamp-1">Escala: {selectedEvent.title}</h3>
              </div>

              <div className="overflow-y-auto flex-1 pr-2 custom-scrollbar space-y-4">
                <p className="text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-4">Selecione os voluntários e suas funções</p>
                
                {volunteers.filter(v => volunteerMinistries.some(vm => vm.volunteer_id === v.id && vm.ministry_id === selectedMinistry.id)).length === 0 ? (
                  <div className="p-8 text-center bg-navy-900/50 rounded-2xl border border-dashed border-navy-800">
                    <p className="text-sm text-slate-gray">Nenhum voluntário vinculado a este ministério.</p>
                  </div>
                ) : (
                  volunteers.filter(v => volunteerMinistries.some(vm => vm.volunteer_id === v.id && vm.ministry_id === selectedMinistry.id)).map(v => {
                    const isSelected = selectedVolsForSchedule.some(sv => sv.volunteer_id === v.id);
                    const selectedVol = selectedVolsForSchedule.find(sv => sv.volunteer_id === v.id);
                    
                    return (
                      <div key={v.id} className={`p-4 rounded-2xl border transition-all ${isSelected ? 'bg-navy-800 border-accent-cyan/40' : 'bg-navy-900 border-navy-800'}`}>
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center gap-3">
                            <div className="w-8 h-8 rounded-lg bg-navy-700 flex items-center justify-center text-accent-cyan font-bold text-xs">
                              {v.full_name?.charAt(0)}
                            </div>
                            <span className="text-sm font-bold text-white">{v.full_name}</span>
                          </div>
                          <button 
                            onClick={() => toggleVolunteerInSchedule(v.id)}
                            className={`w-10 h-6 rounded-full transition-all relative ${isSelected ? 'bg-accent-cyan' : 'bg-navy-700'}`}
                          >
                            <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${isSelected ? 'left-5' : 'left-1'}`} />
                          </button>
                        </div>
                        
                        {isSelected && (
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }}>
                            <input 
                              type="text" 
                              value={selectedVol?.role_function || ''} 
                              onChange={(e) => updateRoleFunction(v.id, e.target.value)}
                              placeholder="Função (ex: Teclado, Câmera 1...)"
                              className="w-full px-3 py-2 bg-navy-950/50 border border-navy-700 rounded-lg text-xs text-white focus:outline-none focus:border-accent-cyan transition-all"
                            />
                          </motion.div>
                        )}
                      </div>
                    );
                  })
                )}

                {/* Gestão de Setlist (Músicas) */}
                {canSeeSongs && (
                  <div className="pt-6 border-t border-navy-800">
                    <p className="text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-4 flex items-center gap-2">
                      <Music size={12} className="text-accent-cyan" /> Setlist de Músicas
                    </p>
                    
                    <div className="mb-4">
                      <select 
                        onChange={(e) => {
                          if (e.target.value) {
                            addSongToSetlist(e.target.value);
                            e.target.value = '';
                          }
                        }}
                        className="w-full bg-navy-950 border border-navy-700 text-white text-sm rounded-xl px-4 py-2.5 focus:border-accent-cyan transition-colors outline-none"
                      >
                        <option value="">Adicionar música ao setlist...</option>
                        {allSongs
                          .filter(s => !selectedSongsForSchedule.find(ss => ss.id === s.id))
                          .map(s => (
                            <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>
                          ))
                        }
                      </select>
                    </div>

                    {selectedSongsForSchedule.length === 0 ? (
                      <div className="p-4 text-center bg-navy-900/30 rounded-xl border border-dashed border-navy-800">
                        <p className="text-[10px] text-slate-600">Nenhuma música no setlist.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {selectedSongsForSchedule.map((song, index) => (
                          <div key={song.id} className="flex items-center justify-between p-3 bg-navy-800/50 rounded-xl border border-navy-700 group">
                            <div className="flex items-center gap-3">
                              <div className="w-6 h-6 rounded-md bg-navy-700 flex items-center justify-center text-[10px] font-bold text-accent-cyan">
                                {index + 1}
                              </div>
                              <div>
                                <p className="text-xs font-bold text-white">{song.title}</p>
                                <p className="text-[10px] text-slate-gray">{song.artist} • {song.key}</p>
                              </div>
                            </div>
                            <button 
                              onClick={() => removeSongFromSetlist(song.id)}
                              className="p-1.5 text-slate-gray hover:text-red-500 transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="flex gap-3 pt-6 mt-4 border-t border-navy-800">
                <button type="button" onClick={() => setIsScheduleModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white transition-colors">Cancelar</button>
                <button 
                  onClick={handleSaveSchedule}
                  disabled={isSubmittingSchedule} 
                  className="flex-1 btn-primary text-sm"
                >
                  {isSubmittingSchedule ? 'Salvando...' : 'Salvar Escala'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function StatCard({ label, value, icon, trend }: { label: string, value: string, icon: ReactNode, trend?: string }) {
  return (
    <div className="glass-card p-6 sm:p-8 flex flex-col group hover:-translate-y-1 transition-all overflow-hidden relative">
      <div className="absolute top-0 right-0 p-1 opacity-10 blur-sm group-hover:opacity-20 transition-opacity">
         <div className="scale-[3] sm:scale-[5]">{icon}</div>
      </div>
      <div className="p-2 sm:p-3.5 bg-navy-950 rounded-2xl border border-navy-700 w-fit mb-4 sm:mb-6 shadow-inner">
        {icon}
      </div>
      <div>
        <p className="text-[9px] sm:text-[10px] text-slate-gray font-black uppercase tracking-[0.2em] mb-1 sm:mb-2">{label}</p>
        <div className="flex items-baseline gap-2 sm:gap-3">
          <p className="text-3xl sm:text-4xl font-display font-black text-white tracking-tighter">{value}</p>
          {trend && (
            <span className="text-[9px] sm:text-[10px] font-bold px-2 py-0.5 rounded-full bg-green-500/10 text-green-400">
              {trend}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

function SongsView() {
  const [songs, setSongs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [churchId, setChurchId] = useState<string>('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [search, setSearch] = useState('');

  // Novo Cadastro
  const [title, setTitle] = useState('');
  const [artist, setArtist] = useState('');
  const [key, setKey] = useState('');
  const [bpm, setBpm] = useState('');
  const [youtubeLink, setYoutubeLink] = useState('');
  const [cifraLink, setCifraLink] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editingSong, setEditingSong] = useState<any>(null);

  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');

  useEffect(() => {
    fetchSongs();
  }, []);

  const fetchSongs = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const { data: profile } = await supabase.from('profiles').select('church_id').eq('id', sessionData.session.user.id).single();
      if (profile) {
        setChurchId(profile.church_id);
        const { data } = await supabase
          .from('songs')
          .select('*')
          .eq('church_id', profile.church_id)
          .order('title');
        if (data) setSongs(data);
      }
    }
    setLoading(false);
  };

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setIsSubmitting(true);

    const songData = {
      church_id: churchId,
      title,
      artist,
      key,
      bpm: bpm ? parseInt(bpm) : null,
      video_url: youtubeLink,
      lyrics_url: cifraLink
    };

    let error;
    if (editingSong) {
      const { error: err } = await supabase.from('songs').update(songData).eq('id', editingSong.id);
      error = err;
    } else {
      const { error: err } = await supabase.from('songs').insert(songData);
      error = err;
    }

    if (!error) {
      setIsModalOpen(false);
      setEditingSong(null);
      setTitle('');
      setArtist('');
      setKey('');
      setBpm('');
      setYoutubeLink('');
      setCifraLink('');
      fetchSongs();
    } else {
      console.error(error);
      alert('Erro ao salvar música.');
    }
    setIsSubmitting(false);
  };

  const openEditModal = (song: any) => {
    setEditingSong(song);
    setTitle(song.title);
    setArtist(song.artist || '');
    setKey(song.key || '');
    setBpm(song.bpm?.toString() || '');
    setYoutubeLink(song.video_url || '');
    setCifraLink(song.lyrics_url || '');
    setIsModalOpen(true);
  };

  const openCreateModal = () => {
    setEditingSong(null);
    setTitle('');
    setArtist('');
    setKey('');
    setBpm('');
    setYoutubeLink('');
    setCifraLink('');
    setIsModalOpen(true);
    setExternalSearchResults([]);
    setExternalSearchQuery('');
  };

  const handleSearchExternal = async () => {
    if (!externalSearchQuery.trim()) return;
    setIsSearchingExternal(true);
    try {
      const response = await fetch(`https://itunes.apple.com/search?term=${encodeURIComponent(externalSearchQuery)}&entity=song&limit=5&country=BR`);
      const data = await response.json();
      
      const results = data.results.map((item: any) => ({
        id: item.trackId,
        title: item.trackName,
        artist: item.artistName,
        artwork: item.artworkUrl100,
        youtube: `https://www.youtube.com/results?search_query=${encodeURIComponent(item.artistName + ' ' + item.trackName + ' clipe oficial')}`,
        cifra: `https://www.cifraclub.com.br/?q=${encodeURIComponent(item.artistName + ' ' + item.trackName)}`
      }));
      
      setExternalSearchResults(results);
    } catch (err) {
      console.error('Erro na busca externa:', err);
    } finally {
      setIsSearchingExternal(false);
    }
  };

  const selectExternalSong = (song: any) => {
    setTitle(song.title);
    setArtist(song.artist);
    setYoutubeLink(song.youtube);
    setCifraLink(song.cifra);
    setExternalSearchResults([]);
  };

  const handleDeleteSong = async (id: string, name: string) => {
    if (window.confirm(`Deseja realmente excluir a música "${name}"?`)) {
      await supabase.from('songs').delete().eq('id', id);
      fetchSongs();
    }
  };

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.artist?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">Repertório de Louvor</h2>
          <p className="text-slate-gray text-sm">Gerencie as músicas e cifras da sua igreja.</p>
        </div>
        <button 
          onClick={openCreateModal}
          className="btn-primary flex items-center gap-2 w-full sm:w-auto justify-center"
        >
          <Plus size={18} /> Adicionar Música
        </button>
      </div>

      {/* Busca */}
      <div className="relative max-w-md">
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray" size={18} />
        <input 
          type="text" 
          placeholder="Buscar por título ou artista..." 
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-navy-900/50 border border-navy-800 text-white pl-12 pr-4 py-3 rounded-2xl focus:border-accent-cyan transition-all outline-none"
        />
      </div>

      {loading ? (
        <div className="flex justify-center p-12">
          <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" />
        </div>
      ) : filteredSongs.length === 0 ? (
        <div className="glass-card p-12 text-center flex flex-col items-center">
          <div className="w-16 h-16 bg-navy-800 rounded-full flex items-center justify-center text-slate-gray mb-4">
            <Music size={24} />
          </div>
          <h3 className="text-xl font-bold text-white mb-2">Nenhuma Música Encontrada</h3>
          <p className="text-slate-gray mb-6">Comece cadastrando as músicas mais tocadas na sua igreja.</p>
          <button onClick={() => setIsModalOpen(true)} className="btn-primary text-sm px-6 py-2">Cadastrar Música</button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSongs.map(song => (
            <div key={song.id} className="glass-card p-6 group hover:border-accent-cyan/30 transition-all flex flex-col justify-between">
              <div>
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h4 className="text-lg font-bold text-white group-hover:text-accent-cyan transition-colors">{song.title}</h4>
                    <p className="text-sm text-slate-gray">{song.artist}</p>
                  </div>
                  <div className="flex gap-2">
                    <button 
                      onClick={() => openEditModal(song)}
                      className="p-2 rounded-lg bg-navy-800 text-slate-gray hover:text-white transition-colors"
                      title="Editar"
                    >
                      <Pencil size={14} />
                    </button>
                    <button 
                      onClick={() => handleDeleteSong(song.id, song.title)}
                      className="p-2 rounded-lg bg-navy-800 text-slate-gray hover:text-red-400 transition-colors"
                      title="Excluir"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
                
                <div className="flex gap-4 mb-6">
                  {song.key && (
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-gray tracking-widest mb-1">Tom</p>
                      <p className="text-sm font-bold text-accent-cyan">{song.key}</p>
                    </div>
                  )}
                  {song.bpm && (
                    <div>
                      <p className="text-[10px] uppercase font-black text-slate-gray tracking-widest mb-1">BPM</p>
                      <p className="text-sm font-bold text-white">{song.bpm}</p>
                    </div>
                  )}
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-navy-800">
                {song.video_url && (
                  <a 
                    href={song.video_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold hover:bg-red-500/20 transition-all"
                  >
                    <Youtube size={14} /> YouTube
                  </a>
                )}
                {song.lyrics_url && (
                  <a 
                    href={song.lyrics_url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-lg bg-accent-cyan/10 text-accent-cyan text-xs font-bold hover:bg-accent-cyan/20 transition-all"
                  >
                    <ExternalLink size={14} /> Cifra
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal Cadastro de Música */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-lg relative max-h-[90vh] overflow-y-auto"
            >
              <button 
                onClick={() => {
                  setIsModalOpen(false);
                  setEditingSong(null);
                }} 
                className="absolute top-6 right-6 text-slate-gray hover:text-white transition-colors"
              >
                <X size={20} />
              </button>
              
              <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-2 uppercase">
                {editingSong ? 'Editar Música' : 'Nova Música'}
              </h3>
              <p className="text-slate-gray text-xs mb-6">Adicione ao repertório da igreja.</p>

              {/* Busca Externa Integrada */}
              {!editingSong && (
                <div className="mb-8 p-5 bg-navy-950 rounded-2xl border border-accent-cyan/20 shadow-xl">
                  <label className="text-[10px] font-black text-accent-cyan uppercase tracking-widest block mb-3">Importar da Nuvem (Auto-Preencher)</label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-gray" size={16} />
                      <input 
                        type="text" 
                        placeholder="Buscar no YouTube/iTunes..." 
                        value={externalSearchQuery}
                        onChange={(e) => setExternalSearchQuery(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchExternal())}
                        className="w-full bg-navy-900 border border-navy-800 text-white text-xs rounded-xl pl-10 pr-4 py-3 outline-none focus:border-accent-cyan transition-all"
                      />
                    </div>
                    <button 
                      type="button"
                      onClick={handleSearchExternal}
                      disabled={isSearchingExternal}
                      className="px-6 py-3 bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 rounded-xl text-[10px] font-black uppercase hover:bg-accent-cyan hover:text-navy-950 transition-all"
                    >
                      {isSearchingExternal ? '...' : 'Buscar'}
                    </button>
                  </div>

                  {externalSearchResults.length > 0 && (
                    <div className="mt-4 space-y-2 max-h-56 overflow-y-auto pr-2 custom-scrollbar">
                      {externalSearchResults.map(res => (
                        <button
                          key={res.id}
                          type="button"
                          onClick={() => selectExternalSong(res)}
                          className="w-full flex items-center gap-4 p-3 bg-navy-900 border border-navy-800 rounded-xl hover:border-accent-cyan/50 transition-all group text-left"
                        >
                          <img src={res.artwork} alt="" className="w-12 h-12 rounded-lg shadow-2xl" />
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold text-white truncate group-hover:text-accent-cyan transition-colors">{res.title}</p>
                            <p className="text-[10px] text-slate-gray truncate">{res.artist}</p>
                          </div>
                          <Plus size={16} className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <form onSubmit={handleSaveSong} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">Título</label>
                    <input 
                      type="text" required value={title} onChange={(e) => setTitle(e.target.value)}
                      placeholder="Ex: Teu Reino"
                      className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">Artista</label>
                    <input 
                      type="text" value={artist} onChange={(e) => setArtist(e.target.value)}
                      placeholder="Ex: Ministério Zoe"
                      className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">Tom</label>
                    <input 
                      type="text" value={key} onChange={(e) => setKey(e.target.value)}
                      placeholder="Ex: C#m"
                      className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">BPM</label>
                    <input 
                      type="number" value={bpm} onChange={(e) => setBpm(e.target.value)}
                      placeholder="Ex: 72"
                      className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">Link YouTube</label>
                  <input 
                    type="url" value={youtubeLink} onChange={(e) => setYoutubeLink(e.target.value)}
                    placeholder="https://youtube.com/..."
                    className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest ml-1">Link Cifra/Letra</label>
                  <input 
                    type="url" value={cifraLink} onChange={(e) => setCifraLink(e.target.value)}
                    placeholder="https://cifraclub.com/..."
                    className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                  />
                </div>

                <div className="flex gap-3 pt-6">
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white hover:bg-navy-800 transition-colors">Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary text-sm">
                    {isSubmitting ? 'Salvando...' : 'Salvar Música'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
function ProfileView({ userId, profile, onProfileUpdate, onLogout }: { userId: string | null, profile: any, onProfileUpdate: (p: any) => void, onLogout: () => void }) {
  const [isSaving, setIsSaving] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [fullName, setFullName] = useState(profile?.full_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile?.avatar_url || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (profile) {
      setFullName(profile.full_name || '');
      setAvatarUrl(profile.avatar_url || '');
    }
  }, [profile]);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !userId) return;

    try {
      setIsUploading(true);
      
      // Criar caminho único: userId/timestamp-filename
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      // Upload do arquivo
      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // Pegar URL pública
      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setAvatarUrl(publicUrl);
      
      // Atualizar no perfil imediatamente para feedback visual
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', userId);
      onProfileUpdate({ ...profile, avatar_url: publicUrl });
      
      alert('Foto carregada com sucesso!');
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    const { error } = await supabase.from('profiles').update({
      full_name: fullName,
      avatar_url: avatarUrl
    }).eq('id', userId);
    
    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    } else {
      alert('Perfil atualizado com sucesso!');
      onProfileUpdate({ ...profile, full_name: fullName, avatar_url: avatarUrl });
    }
    setIsSaving(false);
  };

  if (!profile) return <div className="flex justify-center p-12"><div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-black text-white uppercase tracking-tighter">Meu Perfil</h2>
          <p className="text-slate-gray text-sm">Gerencie suas informações pessoais.</p>
        </div>
        <button onClick={onLogout} className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all">Sair da Conta</button>
      </div>

      <div className="glass-card p-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <div className="w-32 h-32 rounded-3xl bg-navy-800 border-2 border-navy-700 flex items-center justify-center overflow-hidden shadow-2xl group-hover:border-accent-cyan transition-all relative">
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black text-accent-cyan">{fullName?.charAt(0) || '?'}</span>
              )}
              
              {isUploading && (
                <div className="absolute inset-0 bg-navy-950/60 flex items-center justify-center">
                  <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                </div>
              )}
            </div>
            
            <button 
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-cyan text-navy-950 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
              title="Trocar Foto"
            >
              <Camera size={20} />
            </button>
            <input 
              type="file" 
              ref={fileInputRef} 
              onChange={handleFileUpload} 
              className="hidden" 
              accept="image/*"
            />
          </div>
          
          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest block mb-2 ml-1">Nome Completo</label>
              <input 
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
              />
            </div>
            <div className="p-4 bg-navy-900/50 rounded-2xl border border-navy-800 border-dashed">
               <p className="text-[10px] text-slate-gray text-center font-medium">Sua foto será armazenada de forma segura e visível para todos os membros da sua igreja.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 border-t border-navy-800 flex justify-end">
          <button 
            onClick={handleSave}
            disabled={isSaving || isUploading}
            className="btn-primary px-8 py-3"
          >
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>
    </div>
  );
}
