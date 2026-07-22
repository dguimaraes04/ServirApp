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
  Globe,
  CalendarDays,
  ChevronLeft,
  RefreshCw,
  Repeat,
  Moon,
  Sun,
  Megaphone
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
import { useTheme } from '../contexts/ThemeContext';

type View = 'dashboard' | 'volunteers' | 'ministries' | 'schedule' | 'songs' | 'announcements' | 'profile';

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
  const { theme } = useTheme();
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
    <div className="flex h-screen font-sans antialiased overflow-hidden" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
      {/* Mobile Sidebar Overlay */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div 
            initial={{ opacity: 0 }} 
            animate={{ opacity: 1 }} 
            exit={{ opacity: 0 }}
            className="fixed inset-0 backdrop-blur-sm z-40 lg:hidden"
            style={{ background: 'rgba(5,12,22,0.80)' }}
            onClick={() => setSidebarOpen(false)}
          />
        )}
      </AnimatePresence>

      {/* Sidebar */}
      <aside className={`fixed inset-y-0 left-0 w-72 flex flex-col z-50 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'}`} style={{ background: 'var(--bg-base)', borderRight: '1px solid var(--border-main)' }}>
        <div className="p-8">
          <div className="flex items-center justify-between mb-10">
            <div className="flex items-center gap-3">
              <div className="h-8 flex items-center justify-start overflow-hidden">
                <img 
                  src={theme === 'dark' ? '/church_logo_dark.svg' : '/church_logo_light.svg'} 
                  alt="Church+" 
                  className="h-8 w-auto object-contain transition-all"
                />
              </div>
            </div>
            <button className="lg:hidden" style={{ color: 'var(--text-secondary)' }} onClick={() => setSidebarOpen(false)}>
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
              label="Cultos/Eventos" 
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
            <NavItem 
              icon={<Megaphone size={20} />} 
              label="Mural de Avisos" 
              active={currentView === 'announcements'} 
              onClick={() => { setCurrentView('announcements'); setSidebarOpen(false); }} 
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

        <div className="mt-auto p-8" style={{ borderTop: '1px solid var(--border-main)' }}>
          <NavItem icon={<Settings size={20} />} label="Configurações" />
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col overflow-hidden relative">
        {/* Header */}
        <header className="h-20 backdrop-blur-xl flex items-center justify-between px-6 lg:px-10 relative z-10" style={{ borderBottom: '1px solid var(--border-main)', background: 'var(--bg-elevated)' }}>
          <div className="flex items-center gap-4">
            <Menu className="lg:hidden cursor-pointer" style={{ color: 'var(--text-secondary)' }} onClick={() => setSidebarOpen(true)} />
            <div className="relative w-full max-w-xs hidden sm:block">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} size={18} />
              <input
                type="text"
                placeholder="Busca inteligente..."
                className="w-full rounded-xl py-2.5 pl-12 pr-4 text-sm outline-none transition-all"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
              />
            </div>
          </div>

          <div className="flex items-center gap-4 lg:gap-6">
            <button className="relative p-2 transition-colors" style={{ color: 'var(--text-secondary)' }}>
              <Bell size={22} />
              {pendingConfirms > 0 && (
                <span className="absolute top-1.5 right-1.5 w-3 h-3 bg-red-500 rounded-full" style={{ border: '2px solid var(--bg-base)' }}></span>
              )}
            </button>
            
            <div
              className="h-10 w-10 rounded-xl p-0.5 transition-all cursor-pointer relative group"
              style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-main)' }}
              onClick={() => setCurrentView('profile')}
            >
              <div className="w-full h-full rounded-lg flex items-center justify-center font-bold text-xs overflow-hidden" style={{ background: 'linear-gradient(135deg, var(--accent), #3B82F6)', color: 'var(--accent-text)' }}>
                {currentUserProfile?.avatar_url ? (
                  <img src={currentUserProfile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <span>{currentUserProfile?.full_name?.charAt(0).toUpperCase() || 'A'}</span>
                )}
              </div>
              <div className="absolute top-full right-0 mt-2 w-max px-3 py-1.5 rounded-lg shadow-xl opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                <p className="text-xs font-medium" style={{ color: 'var(--text-primary)' }}>Meu Perfil</p>
              </div>
            </div>
          </div>
        </header>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto p-6 lg:p-10 custom-scrollbar" style={{ background: 'var(--bg-base)' }}>
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
              {currentView === 'announcements' && <AnnouncementsView />}
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

const syncRecurringEvents = async (cid: string) => {
  try {
    const { data: templates } = await supabase
      .from('recurring_events')
      .select('*')
      .eq('church_id', cid);

    if (!templates) return;

    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(sixMonthsFromNow.getMonth() + 6);
    
    const { data: existingEvents } = await supabase
      .from('events')
      .select('*')
      .eq('church_id', cid)
      .not('recurring_event_id', 'is', null)
      .gte('date', new Date().toISOString())
      .lte('date', sixMonthsFromNow.toISOString());

    const existingEventsList = existingEvents || [];
    const expectedEvents: {
      recurring_event_id: string;
      title: string;
      description: string;
      date: Date;
      color: string;
    }[] = [];

    const today = new Date();
    for (let d = new Date(today); d <= sixMonthsFromNow; d.setDate(d.getDate() + 1)) {
      const dayOfWeek = d.getDay();
      const weekOfMonth = Math.ceil(d.getDate() / 7);

      const matchingTemplates = templates.filter(t => {
        if (t.day_of_week !== dayOfWeek) return false;
        if (t.pattern_type === 'weekly') return true;
        if (t.pattern_type === 'monthly_nth_day') {
          return t.week_of_month === weekOfMonth;
        }
        return false;
      });

      if (matchingTemplates.length === 0) continue;

      // Precedence: monthly overrides weekly
      const monthlyTemplates = matchingTemplates.filter(t => t.pattern_type === 'monthly_nth_day');
      const finalTemplates = monthlyTemplates.length > 0 ? monthlyTemplates : matchingTemplates;

      finalTemplates.forEach(t => {
        const [hours, minutes] = t.time.split(':').map(Number);
        const occurrenceDate = new Date(d);
        occurrenceDate.setHours(hours, minutes, 0, 0);

        expectedEvents.push({
          recurring_event_id: t.id,
          title: t.title,
          description: t.description || '',
          date: occurrenceDate,
          color: t.color || '#64FFDA'
        });
      });
    }

    const toInsert: any[] = [];
    const toKeepIds = new Set<string>();

    expectedEvents.forEach(expected => {
      const match = existingEventsList.find(existing => {
        const expectedTime = expected.date.getTime();
        const existingTime = new Date(existing.date).getTime();
        return existing.recurring_event_id === expected.recurring_event_id && Math.abs(expectedTime - existingTime) < 60000;
      });

      if (match) {
        toKeepIds.add(match.id);
        if (match.title !== expected.title || match.description !== expected.description || match.color !== expected.color) {
          supabase.from('events').update({
            title: expected.title,
            description: expected.description,
            color: expected.color
          }).eq('id', match.id).then();
        }
      } else {
        toInsert.push({
          church_id: cid,
          recurring_event_id: expected.recurring_event_id,
          title: expected.title,
          description: expected.description,
          date: expected.date.toISOString(),
          color: expected.color
        });
      }
    });

    const toDelete = existingEventsList.filter(existing => !toKeepIds.has(existing.id));

    if (toDelete.length > 0) {
      const deleteIds = toDelete.map(d => d.id);
      await supabase.from('events').delete().in('id', deleteIds);
    }

    if (toInsert.length > 0) {
      await supabase.from('events').insert(toInsert);
    }
  } catch (error) {
    console.error('Error syncing recurring events:', error);
  }
};

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
  const [editingEvent, setEditingEvent] = useState<any | null>(null);
  const [userRole, setUserRole] = useState<string>('');
  const [dashboardEvents, setDashboardEvents] = useState<any[]>([]);
  const [eventColor, setEventColor] = useState<string>('#64FFDA');
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Announcements State in DashboardView
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [leadMinistriesIds, setLeadMinistriesIds] = useState<string[]>([]);
  const [activeAnonTab, setActiveAnonTab] = useState<string>('all');
  const [isAnonModalOpen, setIsAnonModalOpen] = useState(false);
  const [anonTitle, setAnonTitle] = useState('');
  const [anonContent, setAnonContent] = useState('');
  const [anonPriority, setAnonPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [anonTargetMinistryId, setAnonTargetMinistryId] = useState<string>('');
  const [isSubmittingAnon, setIsSubmittingAnon] = useState(false);
  const [currentUserId, setCurrentUserId] = useState<string>('');

  useEffect(() => { fetchDashboardData(); }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (!sessionData.session) return;

    const { data: profile } = await supabase
      .from('profiles')
      .select('church_id, role')
      .eq('id', sessionData.session.user.id)
      .single();

    if (profile) {
      setChurchId(profile.church_id);
      setUserRole(profile.role);
      setCurrentUserId(sessionData.session.user.id);
      const [
        { count: volCount },
        { data: upcomingEvents },
        { data: mins },
        { data: church },
        { data: allEvents },
        { data: annons },
        { data: myLedMins }
      ] = await Promise.all([
        supabase.from('profiles').select('*', { count: 'exact', head: true }).eq('church_id', profile.church_id),
        supabase.from('events').select('*').eq('church_id', profile.church_id).gte('date', new Date().toISOString()).order('date', { ascending: true }).limit(5),
        supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name'),
        supabase.from('churches').select('name').eq('id', profile.church_id).single(),
        supabase.from('events').select('id, date, color, title, description, recurring_event_id').eq('church_id', profile.church_id),
        supabase.from('announcements')
          .select('*, author:profiles(*), ministry:ministries(*)')
          .eq('church_id', profile.church_id)
          .order('created_at', { ascending: false }),
        supabase.from('ministry_leaders').select('ministry_id').eq('profile_id', sessionData.session.user.id)
      ]);

      setStats({ volunteers: volCount || 0 });
      setNextEvents(upcomingEvents || []);
      setMinistries(mins || []);
      setDashboardEvents(allEvents || []);
      if (annons) setAnnouncements(annons);
      if (myLedMins) setLeadMinistriesIds(myLedMins.map(m => m.ministry_id));
      if (church) setChurchName(church.name || '');
      if (allEvents) {
        const dates = new Set(allEvents.map((e: any) => e.date.split('T')[0]));
        setEventDates(dates as Set<string>);
      }
    }
    setLoading(false);
  };

  const handleDayClick = (dateStr: string) => {
    setEditingEvent(null);
    setEventColor('#64FFDA');
    setSelectedDate(dateStr);
    setNewEventTitle('');
    setNewEventTime('09:00');
    setNewEventDescription('');
    setIsEventModalOpen(true);
  };

  const handleEditEventClick = (event: any) => {
    setEditingEvent(event);
    setEventColor(event.color || '#64FFDA');
    setNewEventTitle(event.title);
    setNewEventDescription(event.description || '');
    
    const eventDateObj = new Date(event.date);
    const yyyy = eventDateObj.getFullYear();
    const mm = String(eventDateObj.getMonth() + 1).padStart(2, '0');
    const dd = String(eventDateObj.getDate()).padStart(2, '0');
    setSelectedDate(`${yyyy}-${mm}-${dd}`);
    
    const hours = String(eventDateObj.getHours()).padStart(2, '0');
    const mins = String(eventDateObj.getMinutes()).padStart(2, '0');
    setNewEventTime(`${hours}:${mins}`);
    
    setIsEventModalOpen(true);
  };

  const executeDeleteEventDashboard = async (event: any, mode: 'single' | 'all' | 'series') => {
    try {
      setIsCreatingEvent(true);
      if (mode === 'series' && event.recurring_event_id) {
        // ON DELETE CASCADE: deleting the template automatically removes ALL linked events
        await supabase.from('recurring_events').delete().eq('id', event.recurring_event_id);
        await syncRecurringEvents(churchId);
      } else if (mode === 'all' && event.recurring_event_id) {
        // Delete future events from this series only
        await supabase.from('events')
          .delete()
          .eq('recurring_event_id', event.recurring_event_id)
          .gte('date', event.date);
        // Delete the template (cascade handles remaining instances)
        await supabase.from('recurring_events').delete().eq('id', event.recurring_event_id);
        await syncRecurringEvents(churchId);
      } else {
        // Mode 'single': Delete only this event instance
        await supabase.from('events').delete().eq('id', event.id);
        
        // If it was a recurring event, look for other templates that match this date
        // to restore the overridden event on this day
        if (event.recurring_event_id) {
          const eventDateObj = new Date(event.date);
          const dayOfWeek = eventDateObj.getDay();
          const weekOfMonth = Math.ceil(eventDateObj.getDate() / 7);
          
          const { data: templates } = await supabase
            .from('recurring_events')
            .select('*')
            .eq('church_id', churchId);
            
          if (templates) {
            const matchingTemplates = templates.filter(t => {
              if (t.id === event.recurring_event_id) return false;
              if (t.day_of_week !== dayOfWeek) return false;
              if (t.pattern_type === 'weekly') return true;
              if (t.pattern_type === 'monthly_nth_day') {
                return t.week_of_month === weekOfMonth;
              }
              return false;
            });
            
            if (matchingTemplates.length > 0) {
              const monthly = matchingTemplates.find(t => t.pattern_type === 'monthly_nth_day');
              const toRestore = monthly || matchingTemplates[0];
              
              await supabase.from('events').insert({
                church_id: churchId,
                recurring_event_id: toRestore.id,
                title: toRestore.title,
                description: toRestore.description || null,
                date: event.date,
                color: toRestore.color
              });
            }
          }
        }
      }
      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDashboardData();
    } catch (err) {
      console.error('Error deleting event:', err);
    } finally {
      setIsCreatingEvent(false);
    }
  };

  const handleDeleteClickDashboard = (event: any) => {
    if (!event.recurring_event_id) {
      if (window.confirm(`Excluir o evento "${event.title}"? Isso removerá todas as escalas vinculadas.`)) {
        executeDeleteEventDashboard(event, 'single');
      }
    } else {
      setIsEventModalOpen(false); // Close main event modal
      setIsDeleteConfirmOpen(true); // Open delete confirmation modal
    }
  };

  const handleCreateEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim() || !churchId) return;
    setIsCreatingEvent(true);

    const dateTime = `${selectedDate}T${newEventTime}:00`;
    
    let error;
    if (editingEvent) {
      const res = await supabase.from('events').update({
        title: newEventTitle.trim(),
        description: newEventDescription.trim() || null,
        date: dateTime,
        color: eventColor
      }).eq('id', editingEvent.id);
      error = res.error;
    } else {
      const res = await supabase.from('events').insert({
        church_id: churchId,
        title: newEventTitle.trim(),
        description: newEventDescription.trim() || null,
        date: dateTime,
        color: eventColor
      });
      error = res.error;
    }

    if (!error) {
      setIsEventModalOpen(false);
      setEditingEvent(null);
      await fetchDashboardData();
    } else {
      alert(`Erro ao ${editingEvent ? 'editar' : 'criar'} evento: ` + error?.message);
    }
    setIsCreatingEvent(false);
  };

  const handlePublishAnnouncementDashboard = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!anonTitle.trim() || !anonContent.trim() || !churchId || !currentUserId) return;
    setIsSubmittingAnon(true);

    try {
      const payload = {
        church_id: churchId,
        author_id: currentUserId,
        ministry_id: anonTargetMinistryId || null,
        title: anonTitle.trim(),
        content: anonContent.trim(),
        priority: anonPriority
      };

      const { error } = await supabase.from('announcements').insert(payload);
      if (error) throw error;

      setAnonTitle('');
      setAnonContent('');
      setAnonPriority('normal');
      setAnonTargetMinistryId('');
      setIsAnonModalOpen(false);
      fetchDashboardData();
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar aviso.');
    } finally {
      setIsSubmittingAnon(false);
    }
  };

  const handleDeleteAnnouncementDashboard = async (id: string) => {
    if (window.confirm('Excluir este aviso do mural?')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchDashboardData();
    }
  };

  const canCreateAnon = userRole === 'manager' || userRole === 'leader' || leadMinistriesIds.length > 0;

  const targetMinistryOptionsDashboard = useMemo(() => {
    if (userRole === 'manager') {
      return [{ id: '', name: '📢 Todos os Voluntários (Geral)' }, ...ministries.map(m => ({ id: m.id, name: `🏛️ ${m.name}` }))];
    }
    const myLed = ministries.filter(m => leadMinistriesIds.includes(m.id));
    return myLed.map(m => ({ id: m.id, name: `🏛️ ${m.name}` }));
  }, [userRole, ministries, leadMinistriesIds]);

  const filteredAnnouncementsDashboard = useMemo(() => {
    return announcements.filter(a => {
      if (activeAnonTab === 'all') return true;
      if (activeAnonTab === 'general') return a.ministry_id === null;
      return a.ministry_id === activeAnonTab;
    });
  }, [announcements, activeAnonTab]);

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
              const dayEvents = dashboardEvents.filter(e => e.date.split('T')[0] === dateStr);
              const hasEvent = dayEvents.length > 0;
              const firstEventColor = dayEvents[0]?.color || '#64FFDA';
              return (
                <button
                  key={day}
                  onClick={() => {
                    if (hasEvent) {
                      handleEditEventClick(dayEvents[0]);
                    } else {
                      handleDayClick(dateStr);
                    }
                  }}
                  className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs font-bold relative transition-all cursor-pointer group ${
                    isToday
                      ? 'shadow-md font-black'
                      : hasEvent
                      ? 'border font-bold'
                      : 'font-medium hover:bg-black/5 dark:hover:bg-white/5'
                  }`}
                  style={
                    isToday
                      ? { backgroundColor: 'var(--accent)', color: '#FFFFFF' }
                      : hasEvent
                      ? { borderColor: `${firstEventColor}60`, backgroundColor: 'var(--bg-input)', color: 'var(--text-primary)' }
                      : { color: 'var(--text-primary)' }
                  }
                >
                  {day}
                  {hasEvent && !isToday && (
                    <span className="absolute bottom-0.5 w-1 h-1 rounded-full" style={{ backgroundColor: firstEventColor }} />
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
                const colorVal = event.color || '#64FFDA';
                return (
                  <button 
                    key={event.id} 
                    onClick={() => handleEditEventClick(event)}
                    className="w-full text-left flex items-center gap-4 p-3 bg-navy-900/60 border border-navy-800 rounded-2xl hover:border-accent-cyan/30 transition-all group cursor-pointer"
                    style={{ borderLeft: `4px solid ${colorVal}` }}
                  >
                    <div 
                      className="w-11 h-11 bg-navy-800 rounded-xl flex flex-col items-center justify-center border transition-all flex-shrink-0"
                      style={{ borderColor: `${colorVal}40` }}
                    >
                      <span className="text-[9px] font-black uppercase leading-none" style={{ color: colorVal }}>
                        {d.toLocaleDateString('pt-BR', { month: 'short' }).replace('.', '')}
                      </span>
                      <span className="text-base font-black text-white leading-tight">{d.getDate()}</span>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-white group-hover:text-accent-cyan transition-colors truncate">{event.title}</p>
                      <p className="text-[10px] text-slate-gray truncate">{event.description || 'Sem descrição'}</p>
                    </div>
                    <ChevronRight size={16} className="text-navy-700 group-hover:text-accent-cyan transition-all flex-shrink-0" />
                  </button>
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

      {/* Mural de Avisos da Igreja na Dashboard */}
      <section className="glass-card p-6 md:p-8 space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-navy-800 pb-4">
          <div>
            <h3 className="text-xl font-display font-black text-white uppercase tracking-tight flex items-center gap-2.5">
              <Megaphone className="text-accent-cyan" size={24} /> Mural de Avisos
            </h3>
            <p className="text-slate-gray text-xs mt-0.5">Recados oficiais e comunicados para os voluntários da igreja.</p>
          </div>
          {canCreateAnon && (
            <button
              onClick={() => {
                if (targetMinistryOptionsDashboard.length > 0) {
                  setAnonTargetMinistryId(targetMinistryOptionsDashboard[0].id);
                }
                setIsAnonModalOpen(true);
              }}
              className="flex items-center gap-2 py-2 px-4 text-xs font-black uppercase tracking-wider text-navy-950 bg-accent-cyan hover:bg-accent-cyan/80 rounded-xl cursor-pointer transition-all shadow-md"
            >
              <Plus size={16} /> Novo Aviso
            </button>
          )}
        </div>

        {/* Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
          <button
            onClick={() => setActiveAnonTab('all')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeAnonTab === 'all'
                ? 'bg-accent-cyan text-navy-950 font-black'
                : 'bg-navy-900/60 border border-navy-800 text-slate-300 hover:border-navy-700'
            }`}
          >
            Todos ({announcements.length})
          </button>
          <button
            onClick={() => setActiveAnonTab('general')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
              activeAnonTab === 'general'
                ? 'bg-accent-cyan text-navy-950 font-black'
                : 'bg-navy-900/60 border border-navy-800 text-slate-300 hover:border-navy-700'
            }`}
          >
            📢 Geral da Igreja ({announcements.filter(a => !a.ministry_id).length})
          </button>
          {ministries.map(m => {
            const count = announcements.filter(a => a.ministry_id === m.id).length;
            return (
              <button
                key={m.id}
                onClick={() => setActiveAnonTab(m.id)}
                className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                  activeAnonTab === m.id
                    ? 'bg-accent-cyan text-navy-950 font-black'
                    : 'bg-navy-900/60 border border-navy-800 text-slate-300 hover:border-navy-700'
                }`}
              >
                <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
                {m.name} ({count})
              </button>
            );
          })}
        </div>

        {/* Feed of Cards */}
        {filteredAnnouncementsDashboard.length === 0 ? (
          <div className="py-12 border-2 border-dashed border-navy-800 rounded-2xl text-center space-y-2">
            <Megaphone size={32} className="mx-auto text-slate-600 opacity-40" />
            <p className="text-slate-400 font-medium text-xs">Nenhum aviso publicado para esta categoria.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredAnnouncementsDashboard.map(item => {
              const isManager = userRole === 'manager';
              const isAuthor = item.author_id === currentUserId;
              const canDelete = isManager || isAuthor;

              let priorityBadge = { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: '📌 AVISO' };
              if (item.priority === 'urgent') priorityBadge = { bg: 'bg-red-500/15 text-red-400 border-red-500/30', text: '🚨 URGENTE' };
              if (item.priority === 'important') priorityBadge = { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', text: '⚠️ IMPORTANTE' };

              return (
                <div
                  key={item.id}
                  className="bg-navy-900/40 border border-navy-800 hover:border-navy-700 rounded-2xl p-5 transition-all flex flex-col justify-between space-y-3 glass-card-subtle"
                  style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span className={`text-[9px] font-black px-2 py-0.5 rounded-lg border ${priorityBadge.bg}`}>
                          {priorityBadge.text}
                        </span>
                        <span className="text-[9px] font-black px-2 py-0.5 rounded-lg border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                          {item.ministry ? `🏛️ ${item.ministry.name}` : '📢 Todos os Voluntários'}
                        </span>
                      </div>

                      {canDelete && (
                        <button
                          onClick={() => handleDeleteAnnouncementDashboard(item.id)}
                          className="p-1 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                          title="Excluir aviso"
                        >
                          <Trash2 size={14} />
                        </button>
                      )}
                    </div>

                    <h4 className="text-base font-display font-black tracking-tight mb-1" style={{ color: 'var(--text-heading)' }}>
                      {item.title}
                    </h4>

                    <p className="text-xs whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                      {item.content}
                    </p>
                  </div>

                  <div className="pt-3 border-t flex items-center justify-between text-[11px]" style={{ borderColor: 'var(--border-main)' }}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 rounded-lg bg-navy-800 overflow-hidden border flex items-center justify-center font-bold text-accent-cyan text-[10px]" style={{ borderColor: 'var(--border-main)' }}>
                        {item.author?.avatar_url ? (
                          <img src={item.author.avatar_url} alt={item.author.full_name} className="w-full h-full object-cover" />
                        ) : (
                          item.author?.full_name?.charAt(0) || 'U'
                        )}
                      </div>
                      <div>
                        <p className="font-bold leading-none" style={{ color: 'var(--text-heading)' }}>{item.author?.full_name || 'Membro'}</p>
                        <p className="text-[9px] uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>
                          {item.author?.role === 'manager' ? 'Pastor / Gerente' : item.author?.role === 'leader' ? 'Líder' : 'Voluntário'}
                        </p>
                      </div>
                    </div>

                    <span className="text-[10px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Modal Novo Aviso (Dashboard) */}
      <AnimatePresence>
        {isAnonModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsAnonModalOpen(false)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-lg relative z-10 overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Megaphone size={22} style={{ color: 'var(--accent)' }} />
                  <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>
                    Publicar Novo Aviso
                  </h3>
                </div>
                <button onClick={() => setIsAnonModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="p-1 cursor-pointer">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handlePublishAnnouncementDashboard} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Canal / Destino do Aviso
                  </label>
                  <select
                    value={anonTargetMinistryId}
                    onChange={(e) => setAnonTargetMinistryId(e.target.value)}
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  >
                    {targetMinistryOptionsDashboard.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Nível de Prioridade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setAnonPriority('normal')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        anonPriority === 'normal' ? 'bg-blue-600 text-white border-blue-500' : 'opacity-60'
                      }`}
                    >
                      📌 Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnonPriority('important')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        anonPriority === 'important' ? 'bg-amber-600 text-white border-amber-500' : 'opacity-60'
                      }`}
                    >
                      ⚠️ Importante
                    </button>
                    <button
                      type="button"
                      onClick={() => setAnonPriority('urgent')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        anonPriority === 'urgent' ? 'bg-red-600 text-white border-red-500' : 'opacity-60'
                      }`}
                    >
                      🚨 Urgente
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Título do Aviso *
                  </label>
                  <input
                    type="text"
                    required
                    value={anonTitle}
                    onChange={(e) => setAnonTitle(e.target.value)}
                    placeholder="Ex: Reunião Geral de Ensaio"
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Mensagem / Detalhes *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={anonContent}
                    onChange={(e) => setAnonContent(e.target.value)}
                    placeholder="Escreva a mensagem do aviso..."
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all resize-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-main)' }}>
                  <button type="button" onClick={() => setIsAnonModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                  <button type="submit" disabled={isSubmittingAnon} className="flex-1 btn-primary text-sm cursor-pointer">
                    {isSubmittingAnon ? 'Publicando...' : 'Publicar Aviso'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Modal: Criar/Editar Evento */}
      <AnimatePresence>
        {isEventModalOpen && (
          <motion.div
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsEventModalOpen(false);
              setEditingEvent(null);
            }}
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
                      <CalendarDays size={14} className="text-accent-cyan" style={{ color: eventColor }} />
                    </div>
                    <span className="text-[10px] font-black text-accent-cyan uppercase tracking-widest" style={{ color: eventColor }}>
                      {editingEvent ? (userRole === 'manager' ? 'Editar Evento' : 'Detalhes do Evento') : 'Novo Evento'}
                    </span>
                  </div>
                  <h3 className="text-2xl font-display font-black text-white tracking-tighter">
                    {newEventTitle || 'Sem Título'}
                  </h3>
                </div>
                <button
                  onClick={() => {
                    setIsEventModalOpen(false);
                    setEditingEvent(null);
                  }}
                  className="p-2 text-slate-gray hover:text-white transition-colors cursor-pointer"
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
                    disabled={editingEvent && userRole !== 'manager'}
                    autoFocus
                    value={newEventTitle}
                    onChange={e => setNewEventTitle(e.target.value)}
                    placeholder="Ex: Culto de Domingo, Ensaio, Célula..."
                    className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 transition-all text-sm disabled:opacity-60"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                      Data
                    </label>
                    <input
                      type="date"
                      required
                      disabled={editingEvent && userRole !== 'manager'}
                      value={selectedDate}
                      onChange={e => setSelectedDate(e.target.value)}
                      className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan/50 transition-all text-sm [color-scheme:dark] disabled:opacity-60"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                      Horário
                    </label>
                    <input
                      type="time"
                      disabled={editingEvent && userRole !== 'manager'}
                      value={newEventTime}
                      onChange={e => setNewEventTime(e.target.value)}
                      className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan/50 transition-all text-sm [color-scheme:dark] disabled:opacity-60"
                    />
                  </div>
                </div>

                {(!editingEvent || userRole === 'manager') && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Cor do Culto</label>
                    <div className="flex flex-wrap gap-2 bg-navy-950/60 p-2 rounded-xl border border-navy-800">
                      {[
                        { name: 'Ciano', value: '#64FFDA' },
                        { name: 'Roxo', value: '#A855F7' },
                        { name: 'Laranja', value: '#F97316' },
                        { name: 'Rosa', value: '#EC4899' },
                        { name: 'Verde', value: '#10B981' },
                        { name: 'Amarelo', value: '#EAB308' },
                        { name: 'Azul', value: '#3B82F6' },
                        { name: 'Vermelho', value: '#EF4444' }
                      ].map(color => (
                        <button
                          key={color.value}
                          type="button"
                          onClick={() => setEventColor(color.value)}
                          className="w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer border border-navy-850 hover:scale-110"
                          style={{ 
                            backgroundColor: color.value, 
                            boxShadow: eventColor === color.value ? `0 0 10px ${color.value}` : 'none',
                            transform: eventColor === color.value ? 'scale(1.15)' : 'none',
                            borderColor: eventColor === color.value ? '#ffffff' : 'transparent'
                          }}
                          title={color.name}
                        />
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">
                    Descrição <span className="normal-case font-medium">(opcional)</span>
                  </label>
                  <textarea
                    value={newEventDescription}
                    disabled={editingEvent && userRole !== 'manager'}
                    onChange={e => setNewEventDescription(e.target.value)}
                    placeholder="Observações, local, informações adicionais..."
                    rows={3}
                    className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white placeholder-slate-gray/50 focus:outline-none focus:border-accent-cyan/50 transition-all text-sm resize-none disabled:opacity-60"
                  />
                </div>

                <div className="flex gap-3 pt-2">
                  {editingEvent && userRole === 'manager' && (
                    <button
                      type="button"
                      onClick={() => handleDeleteClickDashboard(editingEvent)}
                      className="px-4 py-3 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all border border-red-500/20 text-xs font-black uppercase tracking-wider cursor-pointer"
                    >
                      Excluir
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => {
                      setIsEventModalOpen(false);
                      setEditingEvent(null);
                    }}
                    className="flex-1 py-3 rounded-xl text-sm font-bold text-slate-gray hover:text-white hover:bg-navy-800 transition-colors cursor-pointer"
                  >
                    {editingEvent && userRole !== 'manager' ? 'Fechar' : 'Cancelar'}
                  </button>

                  {(!editingEvent || userRole === 'manager') && (
                    <button
                      type="submit"
                      disabled={isCreatingEvent || !newEventTitle.trim()}
                      className="flex-1 py-3 rounded-xl bg-accent-cyan text-navy-950 font-black text-sm uppercase tracking-widest hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 cursor-pointer"
                    >
                      {isCreatingEvent ? (
                        <><div className="w-4 h-4 border-2 border-navy-950/30 border-t-navy-950 rounded-full animate-spin" /> Salvando...</>
                      ) : (
                        <>{editingEvent ? 'Salvar' : 'Criar Evento'}</>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão Dashboard */}
      <AnimatePresence>
        {isDeleteConfirmOpen && editingEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setEditingEvent(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-sm relative text-center"
            >
              <h3 className="text-xl font-display font-black text-white tracking-tighter uppercase mb-2">Excluir Evento</h3>
              <p className="text-xs text-slate-gray mb-6">
                O evento <strong className="text-white">"{editingEvent.title}"</strong> é recorrente. Escolha a opção de exclusão desejada:
              </p>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEventDashboard(editingEvent, 'single');
                    setIsDeleteConfirmOpen(false);
                    setEditingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-navy-800 hover:bg-navy-700 transition-all border border-navy-700 cursor-pointer"
                >
                  Excluir APENAS este culto
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEventDashboard(editingEvent, 'all');
                    setIsDeleteConfirmOpen(false);
                    setEditingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-red-650 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                >
                  Excluir todos os cultos futuros (série)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEventDashboard(editingEvent, 'series');
                    setIsDeleteConfirmOpen(false);
                    setEditingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 bg-red-950/60 hover:bg-red-900/80 transition-all border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
                >
                  ⚠ Excluir TODA a série (incluindo cultos passados)
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setEditingEvent(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-gray hover:text-white transition-all cursor-pointer"
                >
                  Voltar / Cancelar
                </button>
              </div>
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

const parseWorshipRole = (roleFunc: string) => {
  const normalized = (roleFunc || '').toLowerCase().trim();
  
  if (!normalized) return { baseRole: '', modifier: '' };

  // Find base role
  let baseRole = '';
  if (normalized.includes('ministro')) baseRole = 'Ministro de Louvor';
  else if (normalized.includes('vocal')) baseRole = 'Vocalista';
  else if (normalized.includes('violão') || normalized.includes('violao')) baseRole = 'Violonista';
  else if (normalized.includes('guitarra')) baseRole = 'Guitarrista';
  else if (normalized.includes('teclado') || normalized.includes('tecladista')) baseRole = 'Tecladista';
  else if (normalized.includes('baixo') || normalized.includes('baixista')) baseRole = 'Baixista';
  else if (normalized.includes('bateria') || normalized.includes('baterista')) baseRole = 'Baterista';
  
  // Find modifier
  let modifier = '';
  if (normalized.includes('principal') || normalized.includes(' 1') || normalized.endsWith(' 1')) modifier = 'Principal';
  else if (normalized.includes('secundario') || normalized.includes('secundário') || normalized.includes(' 2') || normalized.endsWith(' 2')) modifier = 'Secundário';
  else if (normalized.includes('backing') || normalized.includes('back')) modifier = 'Backing';

  // If we found a base role, return it. Otherwise, it is 'Custom'
  if (baseRole) {
    return { baseRole, modifier };
  }
  return { baseRole: 'Custom', modifier: '' };
};

const formatWorshipRole = (base: string, mod: string) => {
  if (base === 'Ministro de Louvor') {
    return 'Ministro de Louvor';
  }
  if (base === 'Vocalista') {
    if (mod === 'Principal') return 'Vocal Principal';
    if (mod === 'Secundário') return 'Vocal Secundário';
    if (mod === 'Backing') return 'Backing Vocal';
    return 'Vocalista';
  }
  if (base === 'Tecladista') {
    if (mod === 'Principal') return 'Teclado 1';
    if (mod === 'Secundário') return 'Teclado 2';
    return 'Tecladista';
  }
  if (base === 'Guitarrista') {
    if (mod === 'Principal') return 'Guitarra 1';
    if (mod === 'Secundário') return 'Guitarra 2';
    return 'Guitarrista';
  }
  if (base === 'Violonista') {
    if (mod === 'Principal') return 'Violão 1';
    if (mod === 'Secundário') return 'Violão 2';
    return 'Violonista';
  }
  if (base === 'Baixista') {
    return 'Baixista';
  }
  if (base === 'Baterista') {
    return 'Baterista';
  }
  return '';
};

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

  // Recurrence states
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);

  // Recurrence form states
  const [eventRecurrenceType, setEventRecurrenceType] = useState<'single' | 'recurring'>('single');
  const [recurrencePattern, setRecurrencePattern] = useState<'weekly' | 'monthly_nth_day'>('weekly');
  const [recurrenceDayOfWeek, setRecurrenceDayOfWeek] = useState<number>(0); // 0 = Sunday
  const [recurrenceWeekOfMonth, setRecurrenceWeekOfMonth] = useState<number>(1);
  const [recurrenceTime, setRecurrenceTime] = useState<string>('18:30');
  const [startDate, setStartDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [eventColor, setEventColor] = useState<string>('#64FFDA');
  const [allSongs, setAllSongs] = useState<any[]>([]);
  const [selectedSongsForSchedule, setSelectedSongsForSchedule] = useState<any[]>([]);
  const [scheduleSongs, setScheduleSongs] = useState<any[]>([]);
  const [leadMinistriesIds, setLeadMinistriesIds] = useState<string[]>([]);
  const [deletingEvent, setDeletingEvent] = useState<any | null>(null);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);

  // Dedicated Setlist Modal States
  const [isSetlistModalOpen, setIsSetlistModalOpen] = useState(false);
  const [setlistModalEvent, setSetlistModalEvent] = useState<any>(null);
  const [setlistModalIsEditable, setSetlistModalIsEditable] = useState(false);
  const [setlistModalSongs, setSetlistModalSongs] = useState<any[]>([]);
  const [isSavingSetlistModal, setIsSavingSetlistModal] = useState(false);

  // Setlist Repertoire & Online Search States
  const [songSearchTab, setSongSearchTab] = useState<'repertoire' | 'online'>('repertoire');
  const [repertoireQuery, setRepertoireQuery] = useState('');
  const [newSongTitle, setNewSongTitle] = useState('');
  const [newSongArtist, setNewSongArtist] = useState('');
  const [newSongKey, setNewSongKey] = useState('');
  const [newSongBpm, setNewSongBpm] = useState('');
  const [newSongVideoUrl, setNewSongVideoUrl] = useState('');
  const [newSongLyricsUrl, setNewSongLyricsUrl] = useState('');
  const [isCreatingOnlineSong, setIsCreatingOnlineSong] = useState(false);

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
    if (!eventTitle) return;
    setIsSubmittingEvent(true);
    
    try {
      if (eventRecurrenceType === 'single') {
        if (!eventDate) return;
        const { error } = await supabase.from('events').insert({
          church_id: churchId,
          title: eventTitle,
          date: eventDate,
          description: eventDescription,
          color: eventColor
        });
        if (error) throw error;
      } else {
        // Recurring event template
        const payload = {
          church_id: churchId,
          title: eventTitle,
          description: eventDescription,
          pattern_type: recurrencePattern,
          day_of_week: recurrenceDayOfWeek,
          week_of_month: recurrencePattern === 'monthly_nth_day' ? recurrenceWeekOfMonth : null,
          time: recurrenceTime + ':00',
          color: eventColor
        };

        if (editingTemplateId) {
          const { error } = await supabase.from('recurring_events').update(payload).eq('id', editingTemplateId);
          if (error) throw error;
          setEditingTemplateId(null);
        } else {
          const { error } = await supabase.from('recurring_events').insert(payload);
          if (error) throw error;
        }

        await syncRecurringEvents(churchId);
      }

      setIsEventModalOpen(false);
      // Clean states
      setEventTitle('');
      setEventDate('');
      setEventDescription('');
      setEventRecurrenceType('single');
      setRecurrencePattern('weekly');
      setRecurrenceDayOfWeek(0);
      setRecurrenceWeekOfMonth(1);
      setRecurrenceTime('18:30');
      fetchData();
    } catch (err: any) {
      console.error('Erro ao salvar evento:', err);
      alert('Erro ao salvar evento.');
    } finally {
      setIsSubmittingEvent(false);
    }
  };

  const executeDeleteEvent = async (event: any, mode: 'single' | 'all' | 'series') => {
    try {
      if (mode === 'series' && event.recurring_event_id) {
        // ON DELETE CASCADE: deleting the template automatically removes ALL linked events
        await supabase.from('recurring_events').delete().eq('id', event.recurring_event_id);
        await syncRecurringEvents(churchId);
      } else if (mode === 'all' && event.recurring_event_id) {
        // Delete future events from this series only
        await supabase.from('events')
          .delete()
          .eq('recurring_event_id', event.recurring_event_id)
          .gte('date', event.date);
        // Delete the template (cascade handles remaining instances)
        await supabase.from('recurring_events').delete().eq('id', event.recurring_event_id);
        await syncRecurringEvents(churchId);
      } else {
        // Mode 'single': Delete only this event instance
        await supabase.from('events').delete().eq('id', event.id);
        
        // If it was a recurring event, look for other templates that match this date
        // to restore the overridden event on this day
        if (event.recurring_event_id) {
          const eventDateObj = new Date(event.date);
          const dayOfWeek = eventDateObj.getDay();
          const weekOfMonth = Math.ceil(eventDateObj.getDate() / 7);
          
          const { data: templates } = await supabase
            .from('recurring_events')
            .select('*')
            .eq('church_id', churchId);
            
          if (templates) {
            const matchingTemplates = templates.filter(t => {
              if (t.id === event.recurring_event_id) return false;
              if (t.day_of_week !== dayOfWeek) return false;
              if (t.pattern_type === 'weekly') return true;
              if (t.pattern_type === 'monthly_nth_day') {
                return t.week_of_month === weekOfMonth;
              }
              return false;
            });
            
            if (matchingTemplates.length > 0) {
              const monthly = matchingTemplates.find(t => t.pattern_type === 'monthly_nth_day');
              const toRestore = monthly || matchingTemplates[0];
              
              await supabase.from('events').insert({
                church_id: churchId,
                recurring_event_id: toRestore.id,
                title: toRestore.title,
                description: toRestore.description || null,
                date: event.date,
                color: toRestore.color
              });
            }
          }
        }
      }
      fetchData();
    } catch (err) {
      console.error('Error deleting event:', err);
    }
  };

  const handleDeleteClick = (event: any) => {
    if (!event.recurring_event_id) {
      if (window.confirm(`Excluir o evento "${event.title}"? Isso removerá todas as escalas vinculadas.`)) {
        executeDeleteEvent(event, 'single');
      }
    } else {
      setDeletingEvent(event);
      setIsDeleteConfirmOpen(true);
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
        setSelectedSongsForSchedule(songs.map(ss => ({
          ...ss.songs,
          custom_key: ss.custom_key || ss.songs?.key || '',
          order_index: ss.order_index
        })));
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
        
        // Inserir novos com ordem e tom
        const songsToInsert = selectedSongsForSchedule.map((song, index) => ({
          schedule_id: scheduleId,
          song_id: song.id,
          order_index: index + 1,
          custom_key: song.custom_key || song.key || null
        }));
        
        const { error: insertErr } = await supabase.from('schedule_songs').insert(songsToInsert);
        if (insertErr) {
          const fallback = selectedSongsForSchedule.map((song, index) => ({
            schedule_id: scheduleId,
            song_id: song.id,
            order_index: index + 1
          }));
          await supabase.from('schedule_songs').insert(fallback);
        }
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
      setSelectedSongsForSchedule([
        ...selectedSongsForSchedule, 
        { ...song, custom_key: song.key || '' }
      ]);
    }
  };

  const removeSongFromSetlist = (songId: string) => {
    setSelectedSongsForSchedule(selectedSongsForSchedule.filter(s => s.id !== songId));
  };

  const moveSongUpInSetlist = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedSongsForSchedule];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSelectedSongsForSchedule(updated);
  };

  const moveSongDownInSetlist = (index: number) => {
    if (index === selectedSongsForSchedule.length - 1) return;
    const updated = [...selectedSongsForSchedule];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSelectedSongsForSchedule(updated);
  };

  const updateSetlistSongKey = (index: number, newKey: string) => {
    const updated = [...selectedSongsForSchedule];
    updated[index] = { ...updated[index], custom_key: newKey };
    setSelectedSongsForSchedule(updated);
  };

  const getEventSetlist = (eventId: string) => {
    const masterSchedule = schedules.find(s => {
      if (s.event_id !== eventId) return false;
      const min = ministries.find(m => m.id === s.ministry_id);
      const mName = min?.name?.toLowerCase() || '';
      return mName.includes('louvor') || mName.includes('música') || mName.includes('musica');
    }) || schedules.find(s => s.event_id === eventId);

    if (!masterSchedule) return [];

    return scheduleSongs
      .filter(ss => ss.schedule_id === masterSchedule.id)
      .sort((a, b) => (a.order_index || 0) - (b.order_index || 0));
  };

  const openSetlistModal = async (event: any, canEdit: boolean) => {
    setSetlistModalEvent(event);
    setSetlistModalIsEditable(canEdit);

    let masterSchedule = schedules.find(s => {
      if (s.event_id !== event.id) return false;
      const min = ministries.find(m => m.id === s.ministry_id);
      const mName = min?.name?.toLowerCase() || '';
      return mName.includes('louvor') || mName.includes('música') || mName.includes('musica');
    }) || schedules.find(s => s.event_id === event.id);

    if (masterSchedule) {
      const { data: songs } = await supabase
        .from('schedule_songs')
        .select('*, songs(*)')
        .eq('schedule_id', masterSchedule.id)
        .order('order_index');

      if (songs) {
        setSetlistModalSongs(songs.map(ss => ({
          ...ss.songs,
          custom_key: ss.custom_key || ss.songs?.key || '',
          order_index: ss.order_index
        })));
      } else {
        setSetlistModalSongs([]);
      }
    } else {
      setSetlistModalSongs([]);
    }

    setIsSetlistModalOpen(true);
  };

  const addSongToDedicatedSetlist = (songId: string) => {
    const song = allSongs.find(s => s.id === songId);
    if (song && !setlistModalSongs.find(s => s.id === songId)) {
      setSetlistModalSongs([
        ...setlistModalSongs,
        { ...song, custom_key: song.key || '' }
      ]);
    }
  };

  const moveDedicatedSongUp = (index: number) => {
    if (index === 0) return;
    const updated = [...setlistModalSongs];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSetlistModalSongs(updated);
  };

  const moveDedicatedSongDown = (index: number) => {
    if (index === setlistModalSongs.length - 1) return;
    const updated = [...setlistModalSongs];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSetlistModalSongs(updated);
  };

  const updateDedicatedSongKey = (index: number, newKey: string) => {
    const updated = [...setlistModalSongs];
    updated[index] = { ...updated[index], custom_key: newKey };
    setSetlistModalSongs(updated);
  };

  const handleSaveDedicatedSetlist = async () => {
    if (!setlistModalEvent) return;
    setIsSavingSetlistModal(true);
    try {
      let targetMinistry = louvorMin || ministries[0];
      let masterSchedule = schedules.find(s => s.event_id === setlistModalEvent.id && s.ministry_id === targetMinistry?.id);

      let scheduleId;
      if (masterSchedule) {
        scheduleId = masterSchedule.id;
      } else {
        const { data: newSch, error } = await supabase.from('schedules').insert({
          event_id: setlistModalEvent.id,
          ministry_id: targetMinistry.id
        }).select().single();
        if (error) throw error;
        scheduleId = newSch.id;
      }

      const { data: eventSchedules } = await supabase.from('schedules').select('id').eq('event_id', setlistModalEvent.id);
      const allScheduleIds = eventSchedules?.map(s => s.id) || [scheduleId];

      await supabase.from('schedule_songs').delete().in('schedule_id', allScheduleIds);

      if (setlistModalSongs.length > 0) {
        const inserts = setlistModalSongs.map((song, index) => ({
          schedule_id: scheduleId,
          song_id: song.id,
          order_index: index + 1,
          custom_key: song.custom_key || song.key || null
        }));

        const { error: insertErr } = await supabase.from('schedule_songs').insert(inserts);
        if (insertErr) {
          const fallback = setlistModalSongs.map((song, index) => ({
            schedule_id: scheduleId,
            song_id: song.id,
            order_index: index + 1
          }));
          await supabase.from('schedule_songs').insert(fallback);
        }
      }

      setIsSetlistModalOpen(false);
      fetchData();
    } catch (err) {
      console.error('Erro ao salvar setlist:', err);
      alert('Erro ao salvar setlist.');
    } finally {
      setIsSavingSetlistModal(false);
    }
  };

  const filteredRepertoireSongs = useMemo(() => {
    const query = repertoireQuery.toLowerCase().trim();
    return allSongs.filter(s => {
      const inSetlist = setlistModalSongs.some(ss => ss.id === s.id);
      if (inSetlist) return false;
      if (!query) return true;
      return s.title?.toLowerCase().includes(query) || s.artist?.toLowerCase().includes(query);
    });
  }, [allSongs, repertoireQuery, setlistModalSongs]);

  const handleCreateAndAddOnlineSong = async () => {
    if (!newSongTitle.trim() || !churchId) return;
    setIsCreatingOnlineSong(true);
    try {
      const songData = {
        church_id: churchId,
        title: newSongTitle.trim(),
        artist: newSongArtist.trim() || 'Desconhecido',
        key: newSongKey.trim() || null,
        bpm: newSongBpm ? parseInt(newSongBpm) : null,
        video_url: newSongVideoUrl.trim() || null,
        lyrics_url: newSongLyricsUrl.trim() || null
      };

      const { data, error } = await supabase
        .from('songs')
        .insert(songData)
        .select()
        .single();

      if (error) throw error;

      if (data) {
        setAllSongs(prev => [...prev, data]);
        setSetlistModalSongs(prev => [
          ...prev,
          { ...data, custom_key: data.key || '' }
        ]);
        setNewSongTitle('');
        setNewSongArtist('');
        setNewSongKey('');
        setNewSongBpm('');
        setNewSongVideoUrl('');
        setNewSongLyricsUrl('');
        setRepertoireQuery('');
        setSongSearchTab('repertoire');
      }
    } catch (err) {
      console.error('Erro ao cadastrar música:', err);
      alert('Erro ao salvar música no repertório da igreja.');
    } finally {
      setIsCreatingOnlineSong(false);
    }
  };

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter">Cultos/Eventos</h2>
          <p className="text-slate-gray text-sm">Gerencie os eventos e a escala de cada ministério.</p>
        </div>
        {currentUserRole === 'manager' && (
          <button 
            onClick={() => {
              setEditingTemplateId(null);
              setEventTitle('');
              setEventDescription('');
              setEventRecurrenceType('single');
              setIsEventModalOpen(true);
            }} 
            className="flex items-center gap-2 justify-center py-2.5 px-4 text-xs font-black uppercase tracking-wider text-navy-950 bg-accent-cyan hover:bg-accent-cyan/80 rounded-xl cursor-pointer transition-all"
          >
            <Plus size={14} /> Novo Evento
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
                    <h4 className="text-xl font-display font-black text-white flex items-center gap-2">
                      {event.title}
                      {event.recurring_event_id && (
                        <span className="p-1 bg-navy-850 border border-navy-750 text-slate-gray rounded-md" title="Evento Recorrente">
                          <Repeat size={12} className="text-accent-cyan" />
                        </span>
                      )}
                    </h4>
                    <p className="text-sm text-slate-gray">
                      {new Date(event.date).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })} • {event.description || 'Sem descrição'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3 self-stretch md:self-auto justify-end">
                  {canSeeSongs && (
                    <button
                      onClick={() => openSetlistModal(event, currentUserRole === 'manager' || (louvorMin && leadMinistriesIds.includes(louvorMin.id)))}
                      className="flex items-center gap-2 px-4 py-2.5 bg-accent-cyan/10 hover:bg-accent-cyan/20 border border-accent-cyan/30 text-accent-cyan rounded-xl text-xs font-black uppercase tracking-wider transition-all cursor-pointer"
                    >
                      <Music size={14} /> Setlist do Dia
                    </button>
                  )}
                  {currentUserRole === 'manager' && (
                    <button 
                      onClick={() => handleDeleteClick(event)}
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
                  {/* Card exclusivo para o Setlist do Dia */}
                  {canSeeSongs && (
                    <div className="bg-navy-950/40 border border-navy-800 rounded-2xl p-4 transition-all flex flex-col justify-between glass-card-subtle" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                      <div>
                        <div className="flex justify-between items-center mb-3">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: '#2563EB' }} />
                            <span className="text-sm font-black uppercase tracking-tighter" style={{ color: 'var(--text-heading)' }}>
                              Setlist do Dia
                            </span>
                          </div>
                          {currentUserRole === 'manager' || (louvorMin && leadMinistriesIds.includes(louvorMin.id)) ? (
                            <button 
                              onClick={() => openSetlistModal(event, true)}
                              className="text-[10px] font-black uppercase transition-colors cursor-pointer"
                              style={{ color: 'var(--accent)' }}
                            >
                              {getEventSetlist(event.id).length > 0 ? 'Editar' : 'Montar'}
                            </button>
                          ) : (
                            <button 
                              onClick={() => openSetlistModal(event, false)}
                              className="text-[10px] font-bold uppercase transition-colors cursor-pointer"
                              style={{ color: 'var(--text-secondary)' }}
                            >
                              Ver Setlist
                            </button>
                          )}
                        </div>

                        <div className="space-y-2 min-h-[40px]">
                          {getEventSetlist(event.id).length > 0 ? (
                            getEventSetlist(event.id).slice(0, 4).map((ss: any, idx: number) => (
                              <div key={ss.id || idx} className="flex justify-between items-center text-xs gap-2">
                                <div className="flex items-center gap-2 min-w-0">
                                  <span className="w-4 h-4 rounded text-[9px] font-black flex items-center justify-center flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                                    {idx + 1}
                                  </span>
                                  <span className="font-medium truncate" style={{ color: 'var(--text-primary)' }}>{ss.songs?.title}</span>
                                </div>
                                <span className="text-[10px] font-black px-1.5 py-0.5 rounded flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                                  {ss.custom_key || ss.songs?.key || '-'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <p className="text-[11px] italic" style={{ color: 'var(--text-secondary)' }}>Nenhuma música no setlist</p>
                          )}
                          {getEventSetlist(event.id).length > 4 && (
                            <p className="text-[10px] font-bold text-center pt-1" style={{ color: 'var(--accent)' }}>
                              +{getEventSetlist(event.id).length - 4} mais músicas...
                            </p>
                          )}
                        </div>
                      </div>
                    </div>
                  )}

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
              <h3 className="text-2xl font-display font-black text-white tracking-tighter mb-6 uppercase">
                {editingTemplateId ? 'Editar Recorrência' : 'Novo Evento'}
              </h3>
              <form onSubmit={handleCreateEvent} className="space-y-4">
                {!editingTemplateId && (
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Tipo de Evento</label>
                    <div className="grid grid-cols-2 gap-2 bg-navy-950/60 p-1.5 rounded-xl border border-navy-800">
                      <button
                        type="button"
                        onClick={() => setEventRecurrenceType('single')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          eventRecurrenceType === 'single'
                            ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35'
                            : 'text-slate-gray hover:text-white border border-transparent'
                        }`}
                      >
                        Único
                      </button>
                      <button
                        type="button"
                        onClick={() => setEventRecurrenceType('recurring')}
                        className={`py-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                          eventRecurrenceType === 'recurring'
                            ? 'bg-accent-cyan/15 text-accent-cyan border border-accent-cyan/35'
                            : 'text-slate-gray hover:text-white border border-transparent'
                        }`}
                      >
                        Recorrente
                      </button>
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Título</label>
                  <input type="text" required value={eventTitle} onChange={e => setEventTitle(e.target.value)} placeholder="Ex: Culto de Celebração" className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm" />
                </div>

                {eventRecurrenceType === 'single' ? (
                  <div>
                    <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Data e Hora</label>
                    <input type="datetime-local" required value={eventDate} onChange={e => setEventDate(e.target.value)} className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]" />
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Frequência</label>
                        <select
                          value={recurrencePattern}
                          onChange={e => setRecurrencePattern(e.target.value as any)}
                          className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]"
                        >
                          <option value="weekly">Semanal</option>
                          <option value="monthly_nth_day">Mensal (N-ésimo dia)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Hora</label>
                        <input
                          type="time"
                          required
                          value={recurrenceTime}
                          onChange={e => setRecurrenceTime(e.target.value)}
                          className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]"
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Dia da Semana</label>
                        <select
                          value={recurrenceDayOfWeek}
                          onChange={e => setRecurrenceDayOfWeek(Number(e.target.value))}
                          className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]"
                        >
                          <option value={0}>Domingo</option>
                          <option value={1}>Segunda-feira</option>
                          <option value={2}>Terça-feira</option>
                          <option value={3}>Quarta-feira</option>
                          <option value={4}>Quinta-feira</option>
                          <option value={5}>Sexta-feira</option>
                          <option value={6}>Sábado</option>
                        </select>
                      </div>

                      {recurrencePattern === 'monthly_nth_day' && (
                        <div>
                          <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Qual Semana do Mês?</label>
                          <select
                            value={recurrenceWeekOfMonth}
                            onChange={e => setRecurrenceWeekOfMonth(Number(e.target.value))}
                            className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm [color-scheme:dark]"
                          >
                            <option value={1}>1ª Semana (Primeiro)</option>
                            <option value={2}>2ª Semana (Segundo)</option>
                            <option value={3}>3ª Semana (Terceiro)</option>
                            <option value={4}>4ª Semana (Quarto)</option>
                            <option value={5}>5ª Semana (Último)</option>
                          </select>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Cor do Culto</label>
                  <div className="flex flex-wrap gap-2 bg-navy-950/60 p-2 rounded-xl border border-navy-800">
                    {[
                      { name: 'Ciano', value: '#64FFDA' },
                      { name: 'Roxo', value: '#A855F7' },
                      { name: 'Laranja', value: '#F97316' },
                      { name: 'Rosa', value: '#EC4899' },
                      { name: 'Verde', value: '#10B981' },
                      { name: 'Amarelo', value: '#EAB308' },
                      { name: 'Azul', value: '#3B82F6' },
                      { name: 'Vermelho', value: '#EF4444' }
                    ].map(color => (
                      <button
                        key={color.value}
                        type="button"
                        onClick={() => setEventColor(color.value)}
                        className="w-6 h-6 rounded-full transition-all flex items-center justify-center cursor-pointer border border-navy-850 hover:scale-110"
                        style={{ 
                          backgroundColor: color.value, 
                          boxShadow: eventColor === color.value ? `0 0 10px ${color.value}` : 'none',
                          transform: eventColor === color.value ? 'scale(1.15)' : 'none',
                          borderColor: eventColor === color.value ? '#ffffff' : 'transparent'
                        }}
                        title={color.name}
                      />
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] font-black text-slate-gray uppercase tracking-[0.2em] mb-2 ml-1">Descrição (Opcional)</label>
                  <textarea value={eventDescription} onChange={e => setEventDescription(e.target.value)} rows={2} className="block w-full px-4 py-3 bg-navy-950/50 border border-navy-800 rounded-xl text-white focus:outline-none focus:border-accent-cyan transition-all text-sm resize-none" />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEventModalOpen(false);
                      setEditingTemplateId(null);
                    }}
                    className="flex-1 py-3 px-4 rounded-xl text-sm font-bold text-slate-gray hover:text-white transition-colors cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button type="submit" disabled={isSubmittingEvent} className="flex-1 btn-primary text-sm cursor-pointer">
                    {isSubmittingEvent ? 'Salvando...' : editingTemplateId ? 'Salvar Alterações' : 'Criar Evento'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Modal de Confirmação de Exclusão */}
      <AnimatePresence>
        {isDeleteConfirmOpen && deletingEvent && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 bg-navy-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4"
            onClick={() => {
              setIsDeleteConfirmOpen(false);
              setDeletingEvent(null);
            }}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              onClick={e => e.stopPropagation()}
              className="glass-card p-6 w-full max-w-sm relative text-center"
            >
              <h3 className="text-xl font-display font-black text-white tracking-tighter uppercase mb-2">Excluir Evento</h3>
              <p className="text-xs text-slate-gray mb-6">
                O evento <strong className="text-white">"{deletingEvent.title}"</strong> é recorrente. Escolha a opção de exclusão desejada:
              </p>
              
              <div className="space-y-3">
                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEvent(deletingEvent, 'single');
                    setIsDeleteConfirmOpen(false);
                    setDeletingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-bold text-white bg-navy-800 hover:bg-navy-700 transition-all border border-navy-700 cursor-pointer"
                >
                  Excluir APENAS este culto
                </button>
                
                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEvent(deletingEvent, 'all');
                    setIsDeleteConfirmOpen(false);
                    setDeletingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-white bg-red-650 hover:bg-red-500 hover:text-white transition-all border border-red-500/20 shadow-[0_0_15px_rgba(239,68,68,0.3)] cursor-pointer"
                >
                  Excluir todos os cultos futuros (série)
                </button>

                <button
                  type="button"
                  onClick={async () => {
                    await executeDeleteEvent(deletingEvent, 'series');
                    setIsDeleteConfirmOpen(false);
                    setDeletingEvent(null);
                  }}
                  className="w-full py-3 px-4 rounded-xl text-xs font-black uppercase tracking-wider text-red-400 bg-red-950/60 hover:bg-red-900/80 transition-all border border-red-500/40 shadow-[0_0_20px_rgba(239,68,68,0.4)] cursor-pointer"
                >
                  ⚠ Excluir TODA a série (incluindo cultos passados)
                </button>
                
                <button
                  type="button"
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setDeletingEvent(null);
                  }}
                  className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-slate-gray hover:text-white transition-all cursor-pointer"
                >
                  Voltar / Cancelar
                </button>
              </div>
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
                          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="mt-3 space-y-3">
                            {(() => {
                              const isWorship = selectedMinistry && (
                                selectedMinistry.name.toLowerCase().includes('louvor') || 
                                selectedMinistry.name.toLowerCase().includes('musica') || 
                                selectedMinistry.name.toLowerCase().includes('música') || 
                                selectedMinistry.name.toLowerCase().includes('worship')
                              );

                              if (isWorship) {
                                const parsed = parseWorshipRole(selectedVol?.role_function || '');
                                return (
                                  <div className="space-y-3 bg-navy-950/20 p-3 rounded-xl border border-navy-800/80">
                                    <div>
                                      <p className="text-[9px] uppercase font-black text-slate-gray tracking-wider mb-2">Função no Louvor</p>
                                      <div className="flex flex-wrap gap-1.5">
                                        {['Ministro de Louvor', 'Vocalista', 'Tecladista', 'Guitarrista', 'Violonista', 'Baixista', 'Baterista', 'Outro'].map(role => {
                                          const active = (role === 'Outro' && parsed.baseRole === 'Custom') || (parsed.baseRole === role);
                                          return (
                                            <button
                                              key={role}
                                              type="button"
                                              onClick={() => {
                                                if (role === 'Outro') {
                                                  updateRoleFunction(v.id, '');
                                                } else {
                                                  updateRoleFunction(v.id, formatWorshipRole(role, parsed.modifier));
                                                }
                                              }}
                                              className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                                active
                                                  ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_8px_rgba(100,255,218,0.1)]'
                                                  : 'bg-navy-950/40 border-navy-800 text-slate-400 hover:border-navy-700'
                                              }`}
                                            >
                                              {role}
                                            </button>
                                          );
                                        })}
                                      </div>
                                    </div>

                                    {['Vocalista', 'Tecladista', 'Guitarrista', 'Violonista'].includes(parsed.baseRole) && (
                                      <div>
                                        <p className="text-[9px] uppercase font-black text-slate-gray tracking-wider mb-2">Hierarquia / Variação</p>
                                        <div className="flex flex-wrap gap-1.5">
                                          {[
                                            { label: 'Nenhuma', value: '' },
                                            { label: parsed.baseRole === 'Vocalista' ? 'Principal' : '1 (Principal)', value: 'Principal' },
                                            { label: parsed.baseRole === 'Vocalista' ? 'Secundário' : '2 (Apoio)', value: 'Secundário' },
                                            ...(parsed.baseRole === 'Vocalista' ? [{ label: 'Backing Vocal', value: 'Backing' }] : [])
                                          ].map(mod => {
                                            const active = parsed.modifier === mod.value;
                                            return (
                                              <button
                                                key={mod.label}
                                                type="button"
                                                onClick={() => {
                                                  updateRoleFunction(v.id, formatWorshipRole(parsed.baseRole, mod.value));
                                                }}
                                                className={`px-2.5 py-1.5 rounded-lg border text-[10px] font-bold transition-all cursor-pointer ${
                                                  active
                                                    ? 'bg-accent-cyan/15 border-accent-cyan text-accent-cyan shadow-[0_0_8px_rgba(100,255,218,0.1)]'
                                                    : 'bg-navy-950/40 border-navy-800 text-slate-400 hover:border-navy-700'
                                                }`}
                                              >
                                                {mod.label}
                                              </button>
                                            );
                                          })}
                                        </div>
                                      </div>
                                    )}

                                    <div>
                                      <p className="text-[9px] uppercase font-black text-slate-gray tracking-wider mb-2">
                                        {parsed.baseRole === 'Custom' ? 'Nome da Função (Outro)' : 'Visualização da Função'}
                                      </p>
                                      <input 
                                        type="text" 
                                        value={selectedVol?.role_function || ''} 
                                        onChange={(e) => updateRoleFunction(v.id, e.target.value)}
                                        placeholder={parsed.baseRole === 'Custom' ? "Ex: Saxofonista, Flautista..." : "Função..."}
                                        className="w-full px-3 py-2 bg-navy-950/50 border border-navy-750 rounded-lg text-xs text-white focus:outline-none focus:border-accent-cyan transition-all"
                                      />
                                    </div>
                                  </div>
                                );
                              }

                              return (
                                <input 
                                  type="text" 
                                  value={selectedVol?.role_function || ''} 
                                  onChange={(e) => updateRoleFunction(v.id, e.target.value)}
                                  placeholder="Função (ex: Teclado, Câmera 1...)"
                                  className="w-full px-3 py-2 bg-navy-950/50 border border-navy-700 rounded-lg text-xs text-white focus:outline-none focus:border-accent-cyan transition-all"
                                />
                              );
                            })()}
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
                          <div 
                            key={song.id} 
                            className="flex items-center justify-between p-3 rounded-xl border gap-2 transition-all"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}
                          >
                            <div className="flex items-center gap-2 min-w-0 flex-1">
                              {/* Botões de Ordem (Reordenar) */}
                              <div className="flex flex-col gap-0.5 flex-shrink-0">
                                <button
                                  type="button"
                                  onClick={() => moveSongUpInSetlist(index)}
                                  disabled={index === 0}
                                  className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                  style={{ color: 'var(--accent)' }}
                                  title="Mover para cima"
                                >
                                  ▲
                                </button>
                                <button
                                  type="button"
                                  onClick={() => moveSongDownInSetlist(index)}
                                  disabled={index === selectedSongsForSchedule.length - 1}
                                  className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                                  style={{ color: 'var(--accent)' }}
                                  title="Mover para baixo"
                                >
                                  ▼
                                </button>
                              </div>

                              {/* Badge da Ordem */}
                              <div className="w-6 h-6 rounded-md flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}>
                                {index + 1}
                              </div>

                              <div className="min-w-0 flex-1">
                                <p className="text-xs font-bold truncate" style={{ color: 'var(--text-heading)' }}>{song.title}</p>
                                <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{song.artist}</p>
                              </div>
                            </div>

                            {/* Tom (Key Input) & Excluir */}
                            <div className="flex items-center gap-2 flex-shrink-0">
                              <div className="flex items-center gap-1 bg-navy-950/20 px-2 py-1 rounded-lg border border-navy-800" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
                                <span className="text-[9px] font-black uppercase tracking-wider" style={{ color: 'var(--text-secondary)' }}>Tom:</span>
                                <input
                                  type="text"
                                  value={song.custom_key ?? song.key ?? ''}
                                  onChange={(e) => updateSetlistSongKey(index, e.target.value)}
                                  placeholder="G#"
                                  className="w-12 text-xs font-bold text-center outline-none bg-transparent"
                                  style={{ color: 'var(--accent)' }}
                                />
                              </div>

                              <button 
                                type="button"
                                onClick={() => removeSongFromSetlist(song.id)}
                                className="p-1.5 rounded-lg transition-colors cursor-pointer hover:text-red-500"
                                style={{ color: 'var(--text-secondary)' }}
                                title="Remover do Setlist"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
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

      {/* Modal Exclusivo de Setlist do Dia (Visualização Mídia / Edição Louvor) */}
      <AnimatePresence>
        {isSetlistModalOpen && setlistModalEvent && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsSetlistModalOpen(false)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-lg relative z-10 overflow-hidden flex flex-col max-h-[85vh]"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Music size={20} style={{ color: 'var(--accent)' }} />
                  <div>
                    <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>
                      Setlist do Culto
                    </h3>
                    <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                      {setlistModalEvent.title} • {new Date(setlistModalEvent.date).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <button onClick={() => setIsSetlistModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="p-1 cursor-pointer">
                  <XCircle size={22} />
                </button>
              </div>

              {setlistModalIsEditable ? (
                /* Modo Edição (Líderes de Louvor e Administradores) */
                <div className="space-y-4 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  {/* Componente Avançado de Busca no Repertório & Cadastro Online */}
                  <div className="space-y-3 p-3 rounded-2xl border mb-4" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                    <div className="flex items-center justify-between gap-2 border-b pb-2" style={{ borderColor: 'var(--border-main)' }}>
                      <span className="text-[11px] font-black uppercase tracking-wider" style={{ color: 'var(--text-heading)' }}>
                        Adicionar Músicas
                      </span>
                      <div className="flex gap-1 p-0.5 rounded-lg border text-[10px] font-bold" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
                        <button 
                          type="button"
                          onClick={() => setSongSearchTab('repertoire')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${songSearchTab === 'repertoire' ? 'bg-blue-600 text-white font-black' : ''}`}
                          style={songSearchTab !== 'repertoire' ? { color: 'var(--text-secondary)' } : {}}
                        >
                          Repertório
                        </button>
                        <button 
                          type="button"
                          onClick={() => setSongSearchTab('online')}
                          className={`px-2.5 py-1 rounded-md transition-all cursor-pointer flex items-center gap-1 ${songSearchTab === 'online' ? 'bg-blue-600 text-white font-black' : ''}`}
                          style={songSearchTab !== 'online' ? { color: 'var(--text-secondary)' } : {}}
                        >
                          <Globe size={11} /> Nova / Internet
                        </button>
                      </div>
                    </div>

                    {songSearchTab === 'repertoire' ? (
                      <div className="space-y-2">
                        <div className="relative">
                          <Search size={14} className="absolute left-3 top-3" style={{ color: 'var(--text-secondary)' }} />
                          <input 
                            type="text"
                            value={repertoireQuery}
                            onChange={(e) => setRepertoireQuery(e.target.value)}
                            placeholder="Buscar título ou artista no repertório..."
                            className="w-full text-xs rounded-xl pl-9 pr-3 py-2 border outline-none transition-all"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        <div className="max-h-44 overflow-y-auto space-y-1.5 custom-scrollbar pr-1">
                          {filteredRepertoireSongs.length > 0 ? (
                            filteredRepertoireSongs.map(s => (
                              <div 
                                key={s.id}
                                className="flex justify-between items-center p-2 rounded-xl border hover:border-blue-500/50 transition-all text-xs cursor-pointer group"
                                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
                                onClick={() => addSongToDedicatedSetlist(s.id)}
                              >
                                <div className="min-w-0 flex-1 pr-2">
                                  <p className="font-bold truncate" style={{ color: 'var(--text-heading)' }}>{s.title}</p>
                                  <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{s.artist}</p>
                                </div>
                                <div className="flex items-center gap-2 flex-shrink-0">
                                  {s.key && (
                                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                                      {s.key}
                                    </span>
                                  )}
                                  <span className="text-[10px] font-black text-blue-500 opacity-80 group-hover:opacity-100 flex items-center gap-0.5">
                                    <Plus size={14} /> Adicionar
                                  </span>
                                </div>
                              </div>
                            ))
                          ) : (
                            <div className="p-3 text-center">
                              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>Nenhuma música encontrada no repertório.</p>
                              <button 
                                type="button" 
                                onClick={() => {
                                  setNewSongTitle(repertoireQuery);
                                  setSongSearchTab('online');
                                }}
                                className="mt-1.5 text-xs font-bold text-blue-500 hover:underline cursor-pointer"
                              >
                                Buscar ou Criar "{repertoireQuery}" na Internet →
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    ) : (
                      /* Tab: Cadastrar/Buscar na Internet */
                      <div className="space-y-2.5">
                        <p className="text-[10px]" style={{ color: 'var(--text-secondary)' }}>
                          Cadastre a música no banco de dados do louvor para salvá-la permanentemente e usá-la no setlist:
                        </p>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Título *</label>
                            <input 
                              type="text"
                              value={newSongTitle}
                              onChange={(e) => setNewSongTitle(e.target.value)}
                              placeholder="Ex: Bondade de Deus"
                              className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Artista / Banda</label>
                            <input 
                              type="text"
                              value={newSongArtist}
                              onChange={(e) => setNewSongArtist(e.target.value)}
                              placeholder="Ex: Isaías Saad"
                              className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Tom Padrão</label>
                            <input 
                              type="text"
                              value={newSongKey}
                              onChange={(e) => setNewSongKey(e.target.value)}
                              placeholder="Ex: G#, Bb"
                              className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                            />
                          </div>

                          <div>
                            <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>BPM (Andamento)</label>
                            <input 
                              type="number"
                              value={newSongBpm}
                              onChange={(e) => setNewSongBpm(e.target.value)}
                              placeholder="Ex: 72"
                              className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                              style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                            />
                          </div>
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Link da Cifra (Cifra Club)</label>
                          <input 
                            type="url"
                            value={newSongLyricsUrl}
                            onChange={(e) => setNewSongLyricsUrl(e.target.value)}
                            placeholder="https://www.cifraclub.com.br/..."
                            className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        <div>
                          <label className="text-[9px] font-black uppercase tracking-wider block mb-1" style={{ color: 'var(--text-secondary)' }}>Link do Vídeo / YouTube</label>
                          <input 
                            type="url"
                            value={newSongVideoUrl}
                            onChange={(e) => setNewSongVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            className="w-full text-xs rounded-xl px-3 py-1.5 border outline-none"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                          />
                        </div>

                        {/* Atalhos para Pesquisar na Web */}
                        {newSongTitle && (
                          <div className="flex gap-2 pt-0.5">
                            <a 
                              href={`https://www.cifraclub.com.br/?q=${encodeURIComponent(newSongTitle + ' ' + newSongArtist)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer hover:opacity-90"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                            >
                              <Music size={12} /> Cifra Club ↗
                            </a>
                            <a 
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(newSongTitle + ' ' + newSongArtist)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-wider border cursor-pointer hover:opacity-90"
                              style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                            >
                              <Youtube size={12} /> YouTube ↗
                            </a>
                          </div>
                        )}

                        <button 
                          type="button"
                          onClick={handleCreateAndAddOnlineSong}
                          disabled={isCreatingOnlineSong || !newSongTitle.trim()}
                          className="w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-wider bg-blue-600 hover:bg-blue-700 text-white cursor-pointer transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                        >
                          <Plus size={14} /> {isCreatingOnlineSong ? 'Salvando...' : 'Salvar no Repertório & Adicionar'}
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>
                      Ordem & Tom das Músicas
                    </label>
                    {setlistModalSongs.map((song, idx) => (
                      <div key={song.id} className="flex items-center justify-between p-3 rounded-xl border gap-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveDedicatedSongUp(idx)}
                              disabled={idx === 0}
                              className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer"
                              style={{ color: 'var(--accent)' }}
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveDedicatedSongDown(idx)}
                              disabled={idx === setlistModalSongs.length - 1}
                              className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer"
                              style={{ color: 'var(--accent)' }}
                            >
                              ▼
                            </button>
                          </div>

                          <div className="w-6 h-6 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                            {idx + 1}
                          </div>

                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold truncate" style={{ color: 'var(--text-heading)' }}>{song.title}</p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{song.artist}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
                            <span className="text-[9px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Tom:</span>
                            <input
                              type="text"
                              value={song.custom_key ?? song.key ?? ''}
                              onChange={(e) => updateDedicatedSongKey(idx, e.target.value)}
                              placeholder="G#"
                              className="w-12 text-xs font-bold text-center outline-none bg-transparent"
                              style={{ color: 'var(--accent)' }}
                            />
                          </div>

                          <button 
                            type="button"
                            onClick={() => setSetlistModalSongs(setlistModalSongs.filter(s => s.id !== song.id))}
                            className="p-1 cursor-pointer hover:text-red-500 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {setlistModalSongs.length === 0 && (
                      <div className="py-10 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2" style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                        <Music size={24} className="opacity-40" />
                        <span className="text-[10px] font-bold uppercase">Nenhuma música no setlist</span>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                /* Modo Visualização READ-ONLY (Mídia & Comunicação e Visitantes) */
                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  <div className="p-3 rounded-xl border border-blue-500/20 bg-blue-500/10 mb-2">
                    <p className="text-[10px] font-bold text-blue-600 dark:text-blue-400 text-center uppercase tracking-widest">
                      Modo Visualização (Mídia & Transmissão)
                    </p>
                  </div>

                  {setlistModalSongs.map((song, idx) => (
                    <div key={song.id} className="p-4 rounded-2xl space-y-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold leading-none mb-1" style={{ color: 'var(--text-heading)' }}>{song.title}</h4>
                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{song.artist}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {(song.custom_key || song.key) && (
                            <span className="text-[10px] font-black px-2 py-0.5 rounded border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                              Tom: {song.custom_key || song.key}
                            </span>
                          )}
                          {song.bpm && <span className="text-[9px] font-bold" style={{ color: 'var(--text-secondary)' }}>{song.bpm} BPM</span>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {song.video_url && (
                          <a 
                            href={song.video_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            <Youtube size={12} /> Video
                          </a>
                        )}
                        {song.lyrics_url && (
                          <a 
                            href={song.lyrics_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                          >
                            <Music size={12} /> Cifra
                          </a>
                        )}
                      </div>
                    </div>
                  ))}

                  {setlistModalSongs.length === 0 && (
                    <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2" style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                      <Music size={24} className="opacity-40" />
                      <span className="text-[10px] font-bold uppercase">Nenhuma música escalada para este culto</span>
                    </div>
                  )}
                </div>
              )}

              {setlistModalIsEditable ? (
                <div className="flex gap-3 pt-6 mt-4 border-t" style={{ borderColor: 'var(--border-main)' }}>
                  <button type="button" onClick={() => setIsSetlistModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold transition-colors cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                  <button 
                    onClick={handleSaveDedicatedSetlist}
                    disabled={isSavingSetlistModal} 
                    className="flex-1 btn-primary text-sm cursor-pointer"
                  >
                    {isSavingSetlistModal ? 'Salvando...' : 'Salvar Setlist'}
                  </button>
                </div>
              ) : (
                <div className="pt-4 mt-2 border-t" style={{ borderColor: 'var(--border-main)' }}>
                  <button type="button" onClick={() => setIsSetlistModalOpen(false)} className="w-full py-3 px-4 rounded-xl text-sm font-bold transition-colors cursor-pointer border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}>
                    Fechar
                  </button>
                </div>
              )}
            </motion.div>
          </div>
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
function AnnouncementsView() {
  const [announcements, setAnnouncements] = useState<any[]>([]);
  const [ministries, setMinistries] = useState<any[]>([]);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [leadMinistriesIds, setLeadMinistriesIds] = useState<string[]>([]);
  const [churchId, setChurchId] = useState<string | null>(null);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & Form States
  const [activeTab, setActiveTab] = useState<string>('all'); // 'all', 'general', or ministry_id
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [priority, setPriority] = useState<'normal' | 'important' | 'urgent'>('normal');
  const [targetMinistryId, setTargetMinistryId] = useState<string>(''); // '' = Todos
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    const { data: sessionData } = await supabase.auth.getSession();
    if (sessionData.session) {
      const uid = sessionData.session.user.id;
      setCurrentUserId(uid);

      const { data: profile } = await supabase.from('profiles').select('church_id, role').eq('id', uid).single();
      if (profile) {
        setChurchId(profile.church_id);
        setUserRole(profile.role);

        const [{ data: mins }, { data: myMins }, { data: annons }] = await Promise.all([
          supabase.from('ministries').select('*').eq('church_id', profile.church_id).order('name'),
          supabase.from('ministry_leaders').select('ministry_id').eq('profile_id', uid),
          supabase.from('announcements')
            .select('*, author:profiles(*), ministry:ministries(*)')
            .eq('church_id', profile.church_id)
            .order('created_at', { ascending: false })
        ]);

        if (mins) setMinistries(mins);
        if (myMins) setLeadMinistriesIds(myMins.map(m => m.ministry_id));
        if (annons) setAnnouncements(annons);
      }
    }
    setLoading(false);
  };

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim() || !churchId || !currentUserId) return;
    setIsSubmitting(true);

    try {
      const payload = {
        church_id: churchId,
        author_id: currentUserId,
        ministry_id: targetMinistryId || null,
        title: title.trim(),
        content: content.trim(),
        priority: priority
      };

      const { error } = await supabase.from('announcements').insert(payload);
      if (error) throw error;

      setTitle('');
      setContent('');
      setPriority('normal');
      setTargetMinistryId('');
      setIsModalOpen(false);
      fetchData();
    } catch (err) {
      console.error(err);
      alert('Erro ao publicar aviso.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (window.confirm('Excluir este aviso do mural?')) {
      await supabase.from('announcements').delete().eq('id', id);
      fetchData();
    }
  };

  const canCreateAnnouncement = userRole === 'manager' || userRole === 'leader' || leadMinistriesIds.length > 0;

  // Filter announcements based on tab
  const filteredAnnouncements = announcements.filter(a => {
    if (activeTab === 'all') return true;
    if (activeTab === 'general') return a.ministry_id === null;
    return a.ministry_id === activeTab;
  });

  // Available options for targeting when creating announcement
  const targetMinistryOptions = useMemo(() => {
    if (userRole === 'manager') {
      return [{ id: '', name: '📢 Todos os Voluntários (Geral)' }, ...ministries.map(m => ({ id: m.id, name: `🏛️ ${m.name}` }))];
    }
    const myLed = ministries.filter(m => leadMinistriesIds.includes(m.id));
    return myLed.map(m => ({ id: m.id, name: `🏛️ ${m.name}` }));
  }, [userRole, ministries, leadMinistriesIds]);

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl sm:text-3xl font-display font-black text-white uppercase tracking-tighter flex items-center gap-3">
            <Megaphone className="text-accent-cyan" size={32} /> Mural de Avisos
          </h2>
          <p className="text-slate-gray text-sm">Comunicação oficial e recados dos ministérios para toda a igreja.</p>
        </div>
        {canCreateAnnouncement && (
          <button 
            onClick={() => {
              if (targetMinistryOptions.length > 0) {
                setTargetMinistryId(targetMinistryOptions[0].id);
              }
              setIsModalOpen(true);
            }} 
            className="flex items-center gap-2 justify-center py-2.5 px-4 text-xs font-black uppercase tracking-wider text-navy-950 bg-accent-cyan hover:bg-accent-cyan/80 rounded-xl cursor-pointer transition-all shadow-lg"
          >
            <Plus size={16} /> Novo Aviso
          </button>
        )}
      </div>

      {/* Tabs Filter */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 custom-scrollbar">
        <button
          onClick={() => setActiveTab('all')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'all' 
              ? 'bg-accent-cyan text-navy-950 font-black' 
              : 'bg-navy-950/60 border border-navy-800 text-slate-300 hover:border-navy-700'
          }`}
        >
          Todos os Avisos ({announcements.length})
        </button>
        <button
          onClick={() => setActiveTab('general')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
            activeTab === 'general' 
              ? 'bg-accent-cyan text-navy-950 font-black' 
              : 'bg-navy-950/60 border border-navy-800 text-slate-300 hover:border-navy-700'
          }`}
        >
          📢 Geral da Igreja ({announcements.filter(a => !a.ministry_id).length})
        </button>
        {ministries.map(m => {
          const count = announcements.filter(a => a.ministry_id === m.id).length;
          return (
            <button
              key={m.id}
              onClick={() => setActiveTab(m.id)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-1.5 ${
                activeTab === m.id 
                  ? 'bg-accent-cyan text-navy-950 font-black' 
                  : 'bg-navy-950/60 border border-navy-800 text-slate-300 hover:border-navy-700'
              }`}
            >
              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: m.color }} />
              {m.name} ({count})
            </button>
          );
        })}
      </div>

      {/* Feed list */}
      {loading ? (
        <div className="py-20 text-center text-slate-400">Carregando avisos...</div>
      ) : filteredAnnouncements.length === 0 ? (
        <div className="py-16 border-2 border-dashed border-navy-800 rounded-3xl text-center space-y-3">
          <Megaphone size={40} className="mx-auto text-slate-600 opacity-40" />
          <p className="text-slate-400 font-medium text-sm">Nenhum aviso publicado nesta categoria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredAnnouncements.map((item) => {
            const isManager = userRole === 'manager';
            const isAuthor = item.author_id === currentUserId;
            const canDelete = isManager || isAuthor;

            let priorityBadge = { bg: 'bg-blue-500/10 text-blue-400 border-blue-500/20', text: '📌 AVISO' };
            if (item.priority === 'urgent') priorityBadge = { bg: 'bg-red-500/15 text-red-400 border-red-500/30', text: '🚨 URGENTE' };
            if (item.priority === 'important') priorityBadge = { bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30', text: '⚠️ IMPORTANTE' };

            return (
              <div 
                key={item.id} 
                className="bg-navy-950/40 border border-navy-800 hover:border-navy-700 rounded-3xl p-6 transition-all flex flex-col justify-between space-y-4 glass-card-subtle"
                style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
              >
                <div>
                  <div className="flex items-start justify-between gap-3 mb-3">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className={`text-[10px] font-black px-2.5 py-1 rounded-lg border ${priorityBadge.bg}`}>
                        {priorityBadge.text}
                      </span>
                      <span className="text-[10px] font-black px-2.5 py-1 rounded-lg border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                        {item.ministry ? `🏛️ ${item.ministry.name}` : '📢 Todos os Voluntários'}
                      </span>
                    </div>

                    {canDelete && (
                      <button 
                        onClick={() => handleDelete(item.id)}
                        className="p-1.5 text-slate-500 hover:text-red-400 transition-colors cursor-pointer"
                        title="Excluir aviso"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </div>

                  <h3 className="text-lg font-display font-black tracking-tight mb-2" style={{ color: 'var(--text-heading)' }}>
                    {item.title}
                  </h3>
                  
                  <p className="text-sm whitespace-pre-line leading-relaxed" style={{ color: 'var(--text-primary)' }}>
                    {item.content}
                  </p>
                </div>

                <div className="pt-4 border-t flex items-center justify-between text-xs" style={{ borderColor: 'var(--border-main)' }}>
                  <div className="flex items-center gap-2.5">
                    <div className="w-8 h-8 rounded-xl bg-navy-800 overflow-hidden border flex items-center justify-center font-bold text-accent-cyan" style={{ borderColor: 'var(--border-main)' }}>
                      {item.author?.avatar_url ? (
                        <img src={item.author.avatar_url} alt={item.author.full_name} className="w-full h-full object-cover" />
                      ) : (
                        item.author?.full_name?.charAt(0) || 'U'
                      )}
                    </div>
                    <div>
                      <p className="font-bold leading-none mb-0.5" style={{ color: 'var(--text-heading)' }}>{item.author?.full_name || 'Membro'}</p>
                      <p className="text-[10px] uppercase font-bold" style={{ color: 'var(--text-secondary)' }}>
                        {item.author?.role === 'manager' ? 'Pastor / Gerente' : item.author?.role === 'leader' ? 'Líder' : 'Voluntário'}
                      </p>
                    </div>
                  </div>

                  <span className="text-[11px] font-medium" style={{ color: 'var(--text-secondary)' }}>
                    {new Date(item.created_at).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Criar Aviso */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setIsModalOpen(false)}
              className="absolute inset-0 bg-navy-950/80 backdrop-blur-sm"
            />
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }}
              className="glass-card p-6 md:p-8 w-full max-w-lg relative z-10 overflow-hidden"
              style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
            >
              <div className="flex justify-between items-center mb-6">
                <div className="flex items-center gap-2">
                  <Megaphone size={22} style={{ color: 'var(--accent)' }} />
                  <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>
                    Publicar Novo Aviso
                  </h3>
                </div>
                <button onClick={() => setIsModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="p-1 cursor-pointer">
                  <XCircle size={22} />
                </button>
              </div>

              <form onSubmit={handlePublish} className="space-y-4">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Canal / Destino do Aviso
                  </label>
                  <select
                    value={targetMinistryId}
                    onChange={(e) => setTargetMinistryId(e.target.value)}
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  >
                    {targetMinistryOptions.map(opt => (
                      <option key={opt.id} value={opt.id}>{opt.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Nível de Prioridade
                  </label>
                  <div className="grid grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => setPriority('normal')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        priority === 'normal' ? 'bg-blue-600 text-white border-blue-500' : 'opacity-60'
                      }`}
                    >
                      📌 Normal
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('important')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        priority === 'important' ? 'bg-amber-600 text-white border-amber-500' : 'opacity-60'
                      }`}
                    >
                      ⚠️ Importante
                    </button>
                    <button
                      type="button"
                      onClick={() => setPriority('urgent')}
                      className={`py-2 rounded-xl text-xs font-black uppercase border transition-all cursor-pointer ${
                        priority === 'urgent' ? 'bg-red-600 text-white border-red-500' : 'opacity-60'
                      }`}
                    >
                      🚨 Urgente
                    </button>
                  </div>
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Título do Aviso *
                  </label>
                  <input
                    type="text"
                    required
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    placeholder="Ex: Reunião Geral de Ensaio"
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest block mb-1.5 ml-1" style={{ color: 'var(--text-secondary)' }}>
                    Mensagem / Detalhes *
                  </label>
                  <textarea
                    required
                    rows={4}
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    placeholder="Escreva a mensagem do aviso..."
                    className="w-full text-sm rounded-xl px-4 py-3 outline-none border transition-all resize-none"
                    style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="flex gap-3 pt-4 border-t" style={{ borderColor: 'var(--border-main)' }}>
                  <button type="button" onClick={() => setIsModalOpen(false)} className="flex-1 py-3 px-4 rounded-xl text-sm font-bold cursor-pointer" style={{ color: 'var(--text-secondary)' }}>Cancelar</button>
                  <button type="submit" disabled={isSubmitting} className="flex-1 btn-primary text-sm cursor-pointer">
                    {isSubmitting ? 'Publicando...' : 'Publicar Aviso'}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
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
  const { theme, toggleTheme } = useTheme();

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
      const fileExt = file.name.split('.').pop();
      const fileName = `${userId}/${Date.now()}.${fileExt}`;
      const { error: uploadError } = await supabase.storage.from('avatars').upload(fileName, file);
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from('avatars').getPublicUrl(fileName);
      setAvatarUrl(publicUrl);
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
    const { error } = await supabase.from('profiles').update({ full_name: fullName, avatar_url: avatarUrl }).eq('id', userId);
    if (error) {
      alert('Erro ao salvar perfil: ' + error.message);
    } else {
      alert('Perfil atualizado com sucesso!');
      onProfileUpdate({ ...profile, full_name: fullName, avatar_url: avatarUrl });
    }
    setIsSaving(false);
  };

  if (!profile) return (
    <div className="flex justify-center p-12">
      <div className="w-8 h-8 border-4 rounded-full animate-spin" style={{ borderColor: 'var(--accent-subtle)', borderTopColor: 'var(--accent)' }} />
    </div>
  );

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-display font-black uppercase tracking-tighter" style={{ color: 'var(--text-heading)' }}>Meu Perfil</h2>
          <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>Gerencie suas informações pessoais.</p>
        </div>
        <button
          onClick={onLogout}
          className="px-4 py-2 border rounded-xl text-xs font-black uppercase hover:bg-red-500 hover:text-white transition-all"
          style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
        >
          Sair da Conta
        </button>
      </div>

      {/* Dados pessoais */}
      <div className="glass-card p-8 space-y-8">
        <div className="flex flex-col sm:flex-row items-center gap-8">
          <div className="relative group">
            <div
              className="w-32 h-32 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl relative transition-all"
              style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-main)' }}
            >
              {avatarUrl ? (
                <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
              ) : (
                <span className="text-4xl font-black" style={{ color: 'var(--accent)' }}>{fullName?.charAt(0) || '?'}</span>
              )}
              {isUploading && (
                <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5,12,22,0.6)' }}>
                  <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                </div>
              )}
            </div>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg hover:scale-110 transition-transform cursor-pointer"
              style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
              title="Trocar Foto"
            >
              <Camera size={20} />
            </button>
            <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" accept="image/*" />
          </div>

          <div className="flex-1 space-y-4 w-full">
            <div>
              <label className="text-[10px] font-black uppercase tracking-widest block mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Nome Completo</label>
              <input
                type="text" value={fullName} onChange={e => setFullName(e.target.value)}
                className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
              />
            </div>
            <div className="p-4 rounded-2xl border border-dashed" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)' }}>
              <p className="text-[10px] text-center font-medium" style={{ color: 'var(--text-secondary)' }}>Sua foto será armazenada de forma segura e visível para todos os membros da sua igreja.</p>
            </div>
          </div>
        </div>

        <div className="pt-6 flex justify-end" style={{ borderTop: '1px solid var(--border-main)' }}>
          <button onClick={handleSave} disabled={isSaving || isUploading} className="btn-primary px-8 py-3 cursor-pointer">
            {isSaving ? 'Salvando...' : 'Salvar Alterações'}
          </button>
        </div>
      </div>

      {/* Configurações */}
      <div className="glass-card p-8 space-y-6">
        <div>
          <h3 className="text-lg font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>Configurações</h3>
          <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>Personalize sua experiência no app.</p>
        </div>

        {/* Toggle de tema */}
        <div
          className="flex items-center justify-between p-4 rounded-2xl"
          style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)' }}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
              {theme === 'dark'
                ? <Moon size={18} style={{ color: 'var(--accent)' }} />
                : <Sun size={18} style={{ color: 'var(--accent)' }} />
              }
            </div>
            <div>
              <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                {theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
              </p>
              <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                {theme === 'dark' ? 'Clique para usar o tema claro' : 'Clique para usar o tema escuro'}
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleTheme}
            className="relative w-14 h-7 rounded-full transition-all duration-300 focus:outline-none cursor-pointer flex-shrink-0"
            style={{ background: theme === 'dark' ? 'var(--accent)' : 'var(--border-main)' }}
            aria-label="Alternar tema"
          >
            <motion.span
              className="absolute top-0.5 left-0.5 w-6 h-6 rounded-full shadow-md flex items-center justify-center"
              animate={{ x: theme === 'dark' ? 28 : 0 }}
              transition={{ type: 'spring', stiffness: 500, damping: 30 }}
              style={{ background: theme === 'dark' ? '#0A192F' : '#FFFFFF' }}
            >
              {theme === 'dark'
                ? <Moon size={12} style={{ color: 'var(--accent)' }} />
                : <Sun size={12} style={{ color: '#F59E0B' }} />
              }
            </motion.span>
          </button>
        </div>
      </div>
    </div>
  );
}

