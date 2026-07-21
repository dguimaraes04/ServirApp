import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Calendar, 
  CheckCircle2, 
  XCircle, 
  Bell, 
  User, 
  Users, 
  Clock, 
  Zap, 
  LogOut, 
  Music, 
  ExternalLink, 
  Youtube, 
  X, 
  Plus, 
  Pencil, 
  Trash2, 
  Save, 
  Search, 
  Settings, 
  Camera,
  ArrowLeft,
  Sun,
  Moon
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useTheme } from '../contexts/ThemeContext';

export function VolunteerApp() {
  const { theme, toggleTheme } = useTheme();
  const [schedules, setSchedules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userProfile, setUserProfile] = useState<any>(null);
  const [isSetlistModalOpen, setIsSetlistModalOpen] = useState(false);
  const [currentView, setCurrentView] = useState<'schedules' | 'songs' | 'profile'>('schedules');
  const [userMinistries, setUserMinistries] = useState<any[]>([]);
  const [songs, setSongs] = useState<any[]>([]);
  const [isWorshipMember, setIsWorshipMember] = useState(false);
  const [isSongModalOpen, setIsSongModalOpen] = useState(false);
  const [isEditSetlistModalOpen, setIsEditSetlistModalOpen] = useState(false);
  const [selectedScheduleForEdit, setSelectedScheduleForEdit] = useState<any>(null);
  const [selectedSongsForSetlist, setSelectedSongsForSetlist] = useState<any[]>([]);
  const [isSubmittingSetlist, setIsSubmittingSetlist] = useState(false);
  
  const [songTitle, setSongTitle] = useState('');
  const [songArtist, setSongArtist] = useState('');
  const [songKey, setSongKey] = useState('');
  const [songBpm, setSongBpm] = useState('');
  const [songYoutube, setSongYoutube] = useState('');
  const [songCifra, setSongCifra] = useState('');
  const [editingSong, setEditingSong] = useState<any>(null);
  const [isSubmittingSong, setIsSubmittingSong] = useState(false);
  
  const [search, setSearch] = useState('');
  const [churchId, setChurchId] = useState<string | null>(null);
  const [session, setSession] = useState<any>(null);
  const [externalSearchResults, setExternalSearchResults] = useState<any[]>([]);
  const [isSearchingExternal, setIsSearchingExternal] = useState(false);
  const [externalSearchQuery, setExternalSearchQuery] = useState('');
  
  const [newFullName, setNewFullName] = useState('');
  const [newAvatarUrl, setNewAvatarUrl] = useState('');
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingProfile, setIsUploadingProfile] = useState(false);
  const [selectedSetlist, setSelectedSetlist] = useState<any[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    fetchMySchedules();

    // Configurar Realtime para atualizações instantâneas
    let channel: any;
    
    const setupRealtime = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        channel = supabase
          .channel(`my-schedules-${session.user.id}`)
          .on(
            'postgres_changes',
            {
              event: '*',
              schema: 'public',
              table: 'schedule_volunteers',
              filter: `volunteer_id=eq.${session.user.id}`
            },
            () => {
              fetchMySchedules(false);
            }
          )
          .subscribe();
      }
    };

    setupRealtime();

    return () => {
      if (channel) supabase.removeChannel(channel);
    };
  }, []);

  const fetchMySchedules = async (showLoading = true) => {
    if (showLoading) setLoading(true);
    try {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      setSession(currentSession);
      
      if (currentSession) {
        const { data: profile } = await supabase
          .from('profiles')
          .select('*')
          .eq('id', currentSession.user.id)
          .single();
          
        if (profile) {
          setUserProfile(profile);
          setChurchId(profile.church_id);
          setNewFullName(profile.full_name || '');
          setNewAvatarUrl(profile.avatar_url || '');
        }

        const { data: userMins } = await supabase
          .from('volunteer_ministries')
          .select('ministries(*)')
          .eq('volunteer_id', currentSession.user.id);
        
        const userMinistriesList = userMins?.map((m: any) => m.ministries).filter(Boolean) || [];
        setUserMinistries(userMinistriesList);

        const { data, error } = await supabase
          .from('schedule_volunteers')
          .select(`
            id,
            role_function,
            status,
            schedule:schedules (
              id,
              ministry_id,
              ministry:ministries (
                name,
                color
              ),
              event:events (
                id,
                title,
                date,
                description
              ),
              schedule_songs (
                *,
                songs (
                  *
                )
              ),
              volunteers:schedule_volunteers (
                id,
                role_function,
                status,
                volunteer_id,
                profile:profiles (
                  id,
                  full_name,
                  avatar_url
                )
              )
            )
          `)
          .eq('volunteer_id', currentSession.user.id)
          .order('created_at', { ascending: false });

        if (error) {
          console.error('Erro ao buscar escalas:', error);
        } else {
          const schedulesData = (data || []).map((s: any) => ({
            ...s,
            schedule: s.schedule ? {
              ...s.schedule,
              event: Array.isArray(s.schedule?.event) ? s.schedule.event[0] : s.schedule?.event,
              ministry: Array.isArray(s.schedule?.ministry) ? s.schedule.ministry[0] : s.schedule?.ministry
            } : null
          }));
          setSchedules(schedulesData);

          const eventIds = [...new Set(schedulesData.map(s => s.schedule?.event?.id).filter(Boolean))];
          if (eventIds.length > 0) {
            const { data: allSongs } = await supabase
              .from('schedule_songs')
              .select(`
                *,
                schedule:schedules!inner (
                  event_id
                ),
                songs (*)
              `)
              .in('schedule.event_id', eventIds);

            const setlistsByEvent: Record<string, any[]> = {};
            allSongs?.forEach(ss => {
              const eid = ss.schedule?.event_id;
              if (!eid) return;
              if (!setlistsByEvent[eid]) setlistsByEvent[eid] = [];
              if (!setlistsByEvent[eid].find(x => x.song_id === ss.song_id)) {
                setlistsByEvent[eid].push(ss);
              }
            });

            setSchedules(prev => prev.map(s => ({
              ...s,
              shared_setlist: s.schedule?.event?.id ? (setlistsByEvent[s.schedule.event.id] || []) : []
            })));
          }
        }

        const keywords = ['louvor', 'musica', 'música', 'worship', 'som', 'mídia', 'midia', 'worsip', 'louvor/musica', 'comunicação', 'comunicacao'];
        
        const hasWorshipMin = userMinistriesList.some((m: any) => 
          keywords.some(k => m.name?.toLowerCase().includes(k))
        );

        const isWorship = !!hasWorshipMin;
        setIsWorshipMember(isWorship);

        if (isWorship || profile?.role === 'manager') {
          const { data: songList } = await supabase
            .from('songs')
            .select('*')
            .eq('church_id', profile?.church_id)
            .order('title');
          if (songList) setSongs(songList);
        }
      }
    } catch (err) {
      console.error('Critical error in fetchMySchedules:', err);
    } finally {
      setLoading(false);
    }
  };

  const canManageRepertoire = isWorshipMember || userProfile?.role === 'manager';

  const handleSaveSong = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!churchId) return;
    setIsSubmittingSong(true);

    const songData = {
      church_id: churchId,
      title: songTitle,
      artist: songArtist,
      key: songKey,
      bpm: songBpm ? parseInt(songBpm) : null,
      video_url: songYoutube,
      lyrics_url: songCifra
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
      setIsSongModalOpen(false);
      setEditingSong(null);
      setSongTitle('');
      setSongArtist('');
      setSongKey('');
      setSongBpm('');
      setSongYoutube('');
      setSongCifra('');
      fetchMySchedules(false);
    } else {
      alert('Erro ao salvar música.');
    }
    setIsSubmittingSong(false);
  };

  const openSongModal = (song?: any) => {
    if (song) {
      setEditingSong(song);
      setSongTitle(song.title);
      setSongArtist(song.artist || '');
      setSongKey(song.key || '');
      setSongBpm(song.bpm?.toString() || '');
      setSongYoutube(song.video_url || '');
      setSongCifra(song.lyrics_url || '');
    } else {
      setEditingSong(null);
      setSongTitle('');
      setSongArtist('');
      setSongKey('');
      setSongBpm('');
      setSongYoutube('');
      setSongCifra('');
    }
    setIsSongModalOpen(true);
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
        preview: item.previewUrl,
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
    setSongTitle(song.title);
    setSongArtist(song.artist);
    setSongYoutube(song.youtube);
    setSongCifra(song.cifra);
    setExternalSearchResults([]);
  };

  const handleDeleteSong = async (id: string, name: string) => {
    if (window.confirm(`Excluir a música "${name}"?`)) {
      await supabase.from('songs').delete().eq('id', id);
      fetchMySchedules(false);
    }
  };

  const moveSongUpInVolunteerSetlist = (index: number) => {
    if (index === 0) return;
    const updated = [...selectedSongsForSetlist];
    const temp = updated[index - 1];
    updated[index - 1] = updated[index];
    updated[index] = temp;
    setSelectedSongsForSetlist(updated);
  };

  const moveSongDownInVolunteerSetlist = (index: number) => {
    if (index === selectedSongsForSetlist.length - 1) return;
    const updated = [...selectedSongsForSetlist];
    const temp = updated[index + 1];
    updated[index + 1] = updated[index];
    updated[index] = temp;
    setSelectedSongsForSetlist(updated);
  };

  const updateVolunteerSetlistSongKey = (index: number, newKey: string) => {
    const updated = [...selectedSongsForSetlist];
    updated[index] = { ...updated[index], custom_key: newKey };
    setSelectedSongsForSetlist(updated);
  };

  const handleSaveSetlist = async () => {
    if (!selectedScheduleForEdit) return;
    setIsSubmittingSetlist(true);
    try {
      const { data: eventSchedules } = await supabase
        .from('schedules')
        .select('id, ministry:ministries(name)')
        .eq('event_id', selectedScheduleForEdit.schedule.event.id);
      
      if (!eventSchedules) throw new Error('Não foi possível encontrar as escalas do evento');

      const allScheduleIds = eventSchedules.map(s => s.id);
      const targetScheduleId = eventSchedules.find((s: any) => {
        const mName = Array.isArray(s.ministry) ? s.ministry[0]?.name : s.ministry?.name;
        return mName?.toLowerCase().includes('louvor') || mName?.toLowerCase().includes('música');
      })?.id || selectedScheduleForEdit.schedule.id;

      await supabase.from('schedule_songs').delete().in('schedule_id', allScheduleIds);
      
      const inserts = selectedSongsForSetlist.map((song, index) => ({
        schedule_id: targetScheduleId,
        song_id: song.id,
        order_index: index + 1,
        custom_key: song.custom_key || song.key || null
      }));
      
      if (inserts.length > 0) {
        const { error: insertErr } = await supabase.from('schedule_songs').insert(inserts);
        if (insertErr) {
          const fallback = selectedSongsForSetlist.map((song, index) => ({
            schedule_id: targetScheduleId,
            song_id: song.id,
            order_index: index + 1
          }));
          await supabase.from('schedule_songs').insert(fallback);
        }
      }
      
      setIsEditSetlistModalOpen(false);
      fetchMySchedules(false);
    } catch (err) {
      console.error(err);
      alert('Erro ao salvar setlist.');
    }
    setIsSubmittingSetlist(false);
  };

  const filteredSongs = songs.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.artist?.toLowerCase().includes(search.toLowerCase())
  );

  const handleResponse = async (id: string, status: 'confirmed' | 'declined' | 'pending') => {
    const { error } = await supabase
      .from('schedule_volunteers')
      .update({ status })
      .eq('id', id);

    if (!error) {
      setSchedules(prev => prev.map(s => s.id === id ? { ...s, status } : s));
    } else {
      alert('Erro ao atualizar status: ' + error.message);
    }
  };

  const handleProfileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !session?.user.id) return;

    try {
      setIsUploadingProfile(true);
      const fileExt = file.name.split('.').pop();
      const filePath = `${session.user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      setNewAvatarUrl(publicUrl);
      
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      
      setUserProfile((prev: any) => prev ? { ...prev, avatar_url: publicUrl } : null);
      
      alert('Foto atualizada com sucesso!');
    } catch (error: any) {
      alert('Erro no upload: ' + error.message);
    } finally {
      setIsUploadingProfile(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}>
        <div className="w-8 h-8 border-4 rounded-full animate-spin mb-4" style={{ borderColor: 'var(--accent-subtle)', borderTopColor: 'var(--accent)' }} />
        <p className="font-medium text-sm" style={{ color: 'var(--text-secondary)' }}>Carregando suas escalas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col md:items-center" style={{ background: 'var(--bg-base)' }}>
      <div className="w-full md:max-w-md min-h-screen flex flex-col relative shadow-2xl" style={{ background: 'var(--bg-base)', borderLeft: '1px solid var(--border-main)', borderRight: '1px solid var(--border-main)' }}>
        
        {/* Header */}
        <header className="px-6 py-5 sticky top-0 z-20 backdrop-blur-md" style={{ background: 'var(--bg-elevated)', borderBottom: '1px solid var(--border-main)' }}>
          <div className="flex justify-between items-center">
            {currentView === 'profile' ? (
              <button 
                onClick={() => setCurrentView('schedules')}
                className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer"
                style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', border: '1px solid var(--accent-border)' }}
              >
                <ArrowLeft size={16} /> Voltar para Escalas
              </button>
            ) : (
              <div>
                <p className="text-xs font-bold uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>
                  Olá, {userProfile?.full_name?.split(' ')[0]}
                </p>
                <h1 className="text-2xl font-display font-black leading-none" style={{ color: 'var(--text-heading)' }}>
                  {currentView === 'schedules' ? 'Minha Agenda' : 'Repertório'}
                </h1>
              </div>
            )}

            <div className="flex items-center gap-2">
              <button 
                onClick={() => setCurrentView(currentView === 'profile' ? 'schedules' : 'profile')}
                className="w-10 h-10 rounded-xl p-0.5 transition-all overflow-hidden cursor-pointer"
                style={{ background: 'var(--bg-surface)', border: `2px solid ${currentView === 'profile' ? 'var(--accent)' : 'var(--border-main)'}` }}
                title={currentView === 'profile' ? "Voltar para Escalas" : "Meu Perfil"}
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center font-black text-xs rounded-lg" style={{ background: 'linear-gradient(135deg, var(--accent), #3B82F6)', color: 'var(--accent-text)' }}>
                    {userProfile?.full_name?.charAt(0) || 'V'}
                  </div>
                )}
              </button>
            </div>
          </div>

          {/* Subnav tabs (Escalas / Repertorio) */}
          {canManageRepertoire && currentView !== 'profile' && (
            <div className="flex mt-4 p-1 rounded-xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)' }}>
              <button 
                onClick={() => setCurrentView('schedules')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                style={currentView === 'schedules' ? { background: 'var(--accent)', color: 'var(--accent-text)' } : { color: 'var(--text-secondary)' }}
              >
                Escalas
              </button>
              <button 
                onClick={() => setCurrentView('songs')}
                className="flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all cursor-pointer"
                style={currentView === 'songs' ? { background: 'var(--accent)', color: 'var(--accent-text)' } : { color: 'var(--text-secondary)' }}
              >
                Músicas
              </button>
            </div>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-28">
          <AnimatePresence mode="wait">
            {currentView === 'schedules' && (
              <motion.div 
                key="schedules"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                className="space-y-6"
              >
                {schedules.map(item => {
                  const event = item.schedule?.event;
                  const ministry = item.schedule?.ministry;
                  
                  if (!event || !ministry) return null;

                  const date = new Date(event.date);
                  const mName = (ministry.name || "").toLowerCase();

                  return (
                    <motion.div 
                      key={item.id}
                      layout
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      className="rounded-3xl p-5 transition-all relative overflow-hidden glass-card"
                      style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
                    >
                      <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ background: item.status === 'confirmed' ? '#22C55E' : item.status === 'declined' ? '#EF4444' : 'var(--accent)' }} />

                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: ministry.color }} />
                            <span className="text-[10px] font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>{ministry.name}</span>
                          </div>
                          <h3 className="text-xl font-display font-black leading-tight" style={{ color: 'var(--text-heading)' }}>{event.title}</h3>
                          <div className="flex items-center gap-4 text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>
                            <div className="flex items-center gap-1.5">
                              <Clock size={14} style={{ color: 'var(--accent)' }} />
                              {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.role_function && (
                        <div className="mb-4 p-3 rounded-xl border" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)' }}>
                          <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: 'var(--text-secondary)' }}>Sua Função</p>
                          <p className="text-sm font-bold" style={{ color: 'var(--accent)' }}>{item.role_function}</p>
                        </div>
                      )}

                      {/* Lista de Equipe */}
                      <div className="mb-6">
                        <p className="text-[10px] font-black uppercase tracking-widest mb-2 flex items-center gap-2" style={{ color: 'var(--text-secondary)' }}>
                          <Users size={12} style={{ color: 'var(--accent)' }} /> Equipe Escalada
                        </p>
                        <div className="flex flex-wrap gap-2">
                          {item.schedule.volunteers?.map((sv: any) => {
                            const isMe = sv.volunteer_id === session?.user.id;
                            const profile = Array.isArray(sv.profile) ? sv.profile[0] : sv.profile;
                            const name = profile?.full_name || 'Voluntário';
                            const avatarUrl = profile?.avatar_url;
                            return (
                              <div 
                                key={sv.id} 
                                className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold"
                                style={isMe 
                                  ? { background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)', color: 'var(--accent)' }
                                  : { background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-primary)' }
                                }
                              >
                                <div className="w-5 h-5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-[9px]" style={{ background: isMe ? 'var(--accent)' : 'var(--border-main)', color: isMe ? 'var(--accent-text)' : 'var(--text-primary)' }}>
                                  {avatarUrl
                                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                    : name.charAt(0)
                                  }
                                </div>
                                <span>{name.split(' ')[0]}</span>
                                <span className="opacity-40">•</span>
                                <span className="opacity-70">{sv.role_function || 'Voluntário'}</span>
                                {isMe && <span className="ml-1 text-[8px] px-1 rounded-sm" style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}>VOCÊ</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Setlist Actions */}
                      {canManageRepertoire && (mName.includes('louvor') || mName.includes('música') || mName.includes('musica') || mName.includes('worship') || mName.includes('mídia') || mName.includes('midia') || mName.includes('som')) && (
                        <div className="mb-4 flex gap-3">
                          {item.shared_setlist?.length > 0 && (
                            <button 
                              onClick={() => {
                                setSelectedSetlist(item.shared_setlist);
                                setIsSetlistModalOpen(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all cursor-pointer border"
                              style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                            >
                              <Music size={14} /> Ver Setlist
                            </button>
                          )}
                          
                          {canManageRepertoire && (
                            <button 
                              onClick={() => {
                                setSelectedScheduleForEdit(item);
                                setSelectedSongsForSetlist(item.shared_setlist?.map((ss: any) => ss.songs) || []);
                                setIsEditSetlistModalOpen(true);
                              }}
                              className="flex-1 py-2.5 rounded-xl font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 transition-all cursor-pointer border"
                              style={{ background: 'rgba(234, 179, 8, 0.1)', color: '#CA8A04', borderColor: 'rgba(234, 179, 8, 0.3)' }}
                            >
                              <Pencil size={14} /> Editar Setlist
                            </button>
                          )}
                        </div>
                      )}

                      {item.status === 'pending' ? (
                        <div className="flex gap-3 mt-2">
                          <button 
                            onClick={() => handleResponse(item.id, 'declined')}
                            className="flex-1 py-3 rounded-xl border font-bold text-sm transition-all flex items-center justify-center gap-2 cursor-pointer hover:bg-red-500/10 hover:text-red-500"
                            style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}
                          >
                            <XCircle size={18} /> Recusar
                          </button>
                          <button 
                            onClick={() => handleResponse(item.id, 'confirmed')}
                            className="flex-1 py-3 rounded-xl font-black text-sm transition-all flex items-center justify-center gap-2 cursor-pointer shadow-md"
                            style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                          >
                            <CheckCircle2 size={18} /> Confirmar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between">
                          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest"
                            style={item.status === 'confirmed' 
                              ? { background: 'rgba(34,197,94,0.1)', color: '#16A34A' }
                              : { background: 'rgba(239,68,68,0.1)', color: '#DC2626' }
                            }
                          >
                            {item.status === 'confirmed' ? (
                              <><CheckCircle2 size={12} /> Confirmado</>
                            ) : (
                              <><XCircle size={12} /> Recusado</>
                            )}
                          </div>
                          <button 
                            onClick={() => handleResponse(item.id, 'pending')}
                            className="text-[10px] font-bold transition-colors uppercase tracking-widest cursor-pointer"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            Alterar Resposta
                          </button>
                        </div>
                      )}
                    </motion.div>
                  );
                })}

                {schedules.length === 0 && (
                  <div className="text-center py-20 flex flex-col items-center">
                    <div className="w-20 h-20 rounded-3xl flex items-center justify-center mb-6 border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
                      <Calendar size={32} style={{ color: 'var(--text-secondary)' }} />
                    </div>
                    <h3 className="font-bold mb-2 text-lg" style={{ color: 'var(--text-heading)' }}>Tudo limpo!</h3>
                    <p className="text-sm px-10" style={{ color: 'var(--text-secondary)' }}>Você não tem nenhuma escala pendente ou confirmada no momento.</p>
                  </div>
                )}
              </motion.div>
            )}

            {currentView === 'songs' && canManageRepertoire && (
              <motion.div 
                key="songs"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                className="space-y-6"
              >
                <div className="flex justify-between items-center">
                  <h2 className="text-lg font-display font-black uppercase tracking-tighter" style={{ color: 'var(--text-heading)' }}>Repertório</h2>
                  <button 
                    onClick={() => openSongModal()}
                    className="p-2.5 rounded-xl transition-all cursor-pointer shadow-md"
                    style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar música ou artista..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full pl-12 pr-4 py-3.5 rounded-2xl transition-all outline-none text-sm shadow-inner"
                    style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredSongs.map(song => (
                    <div key={song.id} className="glass-card p-5 group transition-all" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold leading-tight mb-1" style={{ color: 'var(--text-heading)' }}>{song.title}</h4>
                          <p className="text-xs font-medium" style={{ color: 'var(--text-secondary)' }}>{song.artist || 'Artista desconhecido'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openSongModal(song)}
                            className="p-2 rounded-lg transition-colors cursor-pointer"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            className="p-2 rounded-lg transition-colors cursor-pointer hover:text-red-500"
                            style={{ background: 'var(--bg-input)', color: 'var(--text-secondary)' }}
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mb-4">
                        {song.key && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black tracking-widest" style={{ color: 'var(--text-secondary)' }}>Tom</span>
                            <span className="text-xs font-bold" style={{ color: 'var(--accent)' }}>{song.key}</span>
                          </div>
                        )}
                        {song.bpm && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black tracking-widest" style={{ color: 'var(--text-secondary)' }}>BPM</span>
                            <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{song.bpm}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4" style={{ borderTop: '1px solid var(--border-main)' }}>
                        {song.video_url && (
                          <a href={song.video_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all border" style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}>YouTube</a>
                        )}
                        {song.lyrics_url && (
                          <a href={song.lyrics_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 rounded-xl text-center text-[10px] font-black uppercase tracking-widest transition-all border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>Cifra</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <div className="space-y-6 pb-20">
                  
                  {/* Big Back Button at Top of Profile */}
                  <button 
                    onClick={() => setCurrentView('schedules')}
                    className="w-full py-3 px-4 rounded-2xl flex items-center justify-center gap-2 font-bold text-xs uppercase tracking-widest transition-all cursor-pointer border"
                    style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                  >
                    <ArrowLeft size={16} /> Voltar para Minha Agenda
                  </button>

                  <div className="flex flex-col items-center gap-4">
                    <div className="relative">
                      <div className="w-28 h-28 rounded-3xl flex items-center justify-center overflow-hidden shadow-2xl transition-all relative" style={{ background: 'var(--bg-surface)', border: '2px solid var(--border-main)' }}>
                        {newAvatarUrl ? (
                          <img src={newAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black" style={{ color: 'var(--accent)' }}>{userProfile?.full_name?.charAt(0) || '?'}</span>
                        )}
                        
                        {isUploadingProfile && (
                          <div className="absolute inset-0 flex items-center justify-center" style={{ background: 'rgba(5,12,22,0.6)' }}>
                            <div className="w-6 h-6 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'var(--accent)', borderTopColor: 'transparent' }} />
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 rounded-xl flex items-center justify-center shadow-lg transition-transform cursor-pointer"
                        style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                      >
                        <Camera size={20} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>{userProfile?.full_name}</h3>
                      <p className="text-xs mt-1" style={{ color: 'var(--text-secondary)' }}>{userProfile?.role === 'volunteer' ? 'Voluntário' : userProfile?.role === 'leader' ? 'Líder' : 'Administrador'}</p>
                    </div>
                  </div>

                  {/* Configuração de Tema */}
                  <div className="glass-card p-6 space-y-4" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                    <h4 className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-secondary)' }}>Aparência do App</h4>
                    <div className="flex items-center justify-between p-4 rounded-2xl" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)' }}>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: 'var(--accent-subtle)' }}>
                          {theme === 'dark' ? <Moon size={18} style={{ color: 'var(--accent)' }} /> : <Sun size={18} style={{ color: 'var(--accent)' }} />}
                        </div>
                        <div>
                          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                            {theme === 'dark' ? 'Tema Escuro' : 'Tema Claro'}
                          </p>
                          <p className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                            {theme === 'dark' ? 'Alternar para tema claro' : 'Alternar para tema escuro'}
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
                          {theme === 'dark' ? <Moon size={12} style={{ color: 'var(--accent)' }} /> : <Sun size={12} style={{ color: '#F59E0B' }} />}
                        </motion.span>
                      </button>
                    </div>
                  </div>

                  {/* Dados Pessoais */}
                  <div className="glass-card p-6 space-y-6" style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}>
                    <div>
                      <label className="text-[10px] font-black uppercase tracking-widest block mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Nome Completo</label>
                      <input 
                        type="text" value={newFullName} onChange={e => setNewFullName(e.target.value)}
                        className="w-full rounded-xl px-4 py-3 outline-none transition-all"
                        style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
                      />
                    </div>
                    
                    <div className="p-4 rounded-2xl border border-dashed" style={{ background: 'var(--accent-subtle)', borderColor: 'var(--accent-border)' }}>
                      <p className="text-[10px] text-center font-medium" style={{ color: 'var(--text-secondary)' }}>Sua foto é importante para que os líderes te identifiquem nas escalas.</p>
                    </div>
                    
                    <button 
                      onClick={async () => {
                        setIsSavingProfile(true);
                        const { error } = await supabase.from('profiles').update({
                          full_name: newFullName,
                          avatar_url: newAvatarUrl
                        }).eq('id', userProfile.id);
                        
                        if (error) {
                          alert('Erro ao salvar: ' + error.message);
                        } else {
                          setUserProfile((prev: any) => prev ? { ...prev, full_name: newFullName, avatar_url: newAvatarUrl } : null);
                          alert('Perfil atualizado!');
                        }
                        setIsSavingProfile(false);
                      }}
                      disabled={isSavingProfile || isUploadingProfile}
                      className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all cursor-pointer shadow-md"
                      style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                    >
                      {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>

                  {/* Sair da Conta (Apenas no Perfil) */}
                  <div className="pt-2">
                    <button
                      onClick={() => supabase.auth.signOut()}
                      className="w-full py-4 border rounded-2xl text-xs font-black uppercase tracking-[0.2em] transition-all cursor-pointer flex items-center justify-center gap-2 hover:bg-red-500 hover:text-white"
                      style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#EF4444', borderColor: 'rgba(239, 68, 68, 0.25)' }}
                    >
                      <LogOut size={16} /> Sair da Conta
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Bottom Navigation Bar */}
        <div 
          className="px-4 py-3 fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-md flex items-center justify-around gap-2 z-30 shadow-2xl backdrop-blur-xl"
          style={{ background: 'var(--bg-surface)', borderTop: '1px solid var(--border-main)' }}
        >
          <button 
            onClick={() => setCurrentView('schedules')}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={currentView === 'schedules' 
              ? { background: 'var(--accent)', color: 'var(--accent-text)' } 
              : { color: 'var(--text-secondary)', background: 'transparent' }
            }
          >
            <Calendar size={16} /> Escalas
          </button>
          
          {canManageRepertoire && (
            <button 
              onClick={() => setCurrentView('songs')}
              className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
              style={currentView === 'songs' 
                ? { background: 'var(--accent)', color: 'var(--accent-text)' } 
                : { color: 'var(--text-secondary)', background: 'transparent' }
              }
            >
              <Music size={16} /> Músicas
            </button>
          )}

          <button 
            onClick={() => setCurrentView('profile')}
            className="flex-1 py-2.5 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all cursor-pointer"
            style={currentView === 'profile' 
              ? { background: 'var(--accent)', color: 'var(--accent-text)' } 
              : { color: 'var(--text-secondary)', background: 'transparent' }
            }
          >
            <User size={16} /> Perfil
          </button>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Modal Visualizar Setlist */}
          {isSetlistModalOpen && selectedSetlist && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSetlistModalOpen(false)}
                className="absolute inset-0 backdrop-blur-sm"
                style={{ background: 'rgba(5, 12, 22, 0.8)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col glass-card"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Music size={20} style={{ color: 'var(--accent)' }} />
                    <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>Setlist do Culto</h3>
                  </div>
                  <button onClick={() => setIsSetlistModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedSetlist
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((ss, idx) => (
                    <div key={ss.id} className="p-4 rounded-2xl space-y-3 border" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold leading-none mb-1" style={{ color: 'var(--text-heading)' }}>{ss.songs.title}</h4>
                            <p className="text-[11px]" style={{ color: 'var(--text-secondary)' }}>{ss.songs.artist}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {(ss.custom_key || ss.songs.key) && <span className="text-[10px] font-black px-1.5 py-0.5 rounded border" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}>Tom: {ss.custom_key || ss.songs.key}</span>}
                          {ss.songs.bpm && <span className="text-[9px] font-bold" style={{ color: 'var(--text-secondary)' }}>{ss.songs.bpm} BPM</span>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {ss.songs.video_url && (
                          <a 
                            href={ss.songs.video_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                            style={{ background: 'rgba(239,68,68,0.1)', color: '#EF4444', borderColor: 'rgba(239,68,68,0.2)' }}
                          >
                            <Youtube size={12} /> Video
                          </a>
                        )}
                        {ss.songs.lyrics_url && (
                          <a 
                            href={ss.songs.lyrics_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border"
                            style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                          >
                            <Music size={12} /> Cifra
                          </a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          )}

          {/* Modal Editar Setlist */}
          {isEditSetlistModalOpen && selectedScheduleForEdit && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsEditSetlistModalOpen(false)}
                className="absolute inset-0 backdrop-blur-sm"
                style={{ background: 'rgba(5, 12, 22, 0.8)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col glass-card"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>Editar Setlist</h3>
                  <button onClick={() => setIsEditSetlistModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  <div>
                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Adicionar Música</label>
                    <select 
                      onChange={(e) => {
                        const song = songs.find(s => s.id === e.target.value);
                        if (song && !selectedSongsForSetlist.find(s => s.id === song.id)) {
                          setSelectedSongsForSetlist([...selectedSongsForSetlist, { ...song, custom_key: song.key || '' }]);
                        }
                        e.target.value = "";
                      }}
                      className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all"
                      style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
                    >
                      <option value="">Selecione para adicionar...</option>
                      {songs.map(s => (
                        <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2 ml-1" style={{ color: 'var(--text-secondary)' }}>Ordem & Tom das Músicas</label>
                    {selectedSongsForSetlist.map((song, idx) => (
                      <div key={song.id} className="flex items-center justify-between p-3 rounded-xl border gap-2" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                          {/* Reorder Buttons */}
                          <div className="flex flex-col gap-0.5 flex-shrink-0">
                            <button
                              type="button"
                              onClick={() => moveSongUpInVolunteerSetlist(idx)}
                              disabled={idx === 0}
                              className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                              style={{ color: 'var(--accent)' }}
                              title="Mover para cima"
                            >
                              ▲
                            </button>
                            <button
                              type="button"
                              onClick={() => moveSongDownInVolunteerSetlist(idx)}
                              disabled={idx === selectedSongsForSetlist.length - 1}
                              className="p-0.5 rounded text-[10px] font-black disabled:opacity-20 cursor-pointer hover:bg-black/10 dark:hover:bg-white/10"
                              style={{ color: 'var(--accent)' }}
                              title="Mover para baixo"
                            >
                              ▼
                            </button>
                          </div>

                          <div className="w-5 h-5 rounded flex items-center justify-center text-[10px] font-black flex-shrink-0" style={{ background: 'var(--accent-subtle)', color: 'var(--accent)' }}>
                            {idx + 1}
                          </div>
                          
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-bold truncate" style={{ color: 'var(--text-heading)' }}>{song.title}</p>
                            <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{song.artist}</p>
                          </div>
                        </div>

                        {/* Tom (Key Input) & Delete */}
                        <div className="flex items-center gap-1.5 flex-shrink-0">
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg border" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}>
                            <span className="text-[9px] font-black uppercase" style={{ color: 'var(--text-secondary)' }}>Tom:</span>
                            <input
                              type="text"
                              value={song.custom_key ?? song.key ?? ''}
                              onChange={(e) => updateVolunteerSetlistSongKey(idx, e.target.value)}
                              placeholder="Tom"
                              className="w-10 text-xs font-bold text-center outline-none bg-transparent"
                              style={{ color: 'var(--accent)' }}
                            />
                          </div>

                          <button 
                            type="button"
                            onClick={() => setSelectedSongsForSetlist(selectedSongsForSetlist.filter(s => s.id !== song.id))}
                            className="p-1 cursor-pointer hover:text-red-500 transition-colors"
                            style={{ color: 'var(--text-secondary)' }}
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    ))}
                    {selectedSongsForSetlist.length === 0 && (
                      <div className="py-12 border-2 border-dashed rounded-2xl flex flex-col items-center justify-center gap-2" style={{ borderColor: 'var(--border-main)', color: 'var(--text-secondary)' }}>
                        <Music size={24} className="opacity-40" />
                        <span className="text-[10px] font-bold uppercase">Nenhuma música selecionada</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSaveSetlist}
                  disabled={isSubmittingSetlist}
                  className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all disabled:opacity-50 cursor-pointer shadow-md"
                  style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                >
                  {isSubmittingSetlist ? 'Salvando...' : 'Salvar Setlist'}
                </button>
              </motion.div>
            </div>
          )}

          {/* Modal Música */}
          {isSongModalOpen && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSongModalOpen(false)}
                className="absolute inset-0 backdrop-blur-sm"
                style={{ background: 'rgba(5, 12, 22, 0.8)' }}
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto glass-card"
                style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)' }}
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-display font-black uppercase tracking-tight" style={{ color: 'var(--text-heading)' }}>
                    {editingSong ? 'Editar Música' : 'Nova Música'}
                  </h3>
                  <button onClick={() => setIsSongModalOpen(false)} style={{ color: 'var(--text-secondary)' }} className="cursor-pointer">
                    <X size={20} />
                  </button>
                </div>

                {/* Busca Externa Integrada */}
                {!editingSong && (
                  <div className="mb-8 p-4 rounded-2xl border shadow-inner" style={{ background: 'var(--bg-input)', borderColor: 'var(--border-main)' }}>
                    <label className="text-[10px] font-black uppercase tracking-widest block mb-2" style={{ color: 'var(--accent)' }}>Importar da Nuvem (Sugestão)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'var(--text-secondary)' }} size={14} />
                        <input 
                          type="text" 
                          placeholder="Buscar no YouTube/iTunes..." 
                          value={externalSearchQuery}
                          onChange={(e) => setExternalSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchExternal())}
                          className="w-full text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none transition-all"
                          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }}
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleSearchExternal}
                        disabled={isSearchingExternal}
                        className="px-4 py-2.5 border rounded-xl text-[10px] font-black uppercase transition-all cursor-pointer"
                        style={{ background: 'var(--accent-subtle)', color: 'var(--accent)', borderColor: 'var(--accent-border)' }}
                      >
                        {isSearchingExternal ? '...' : 'Buscar'}
                      </button>
                    </div>

                    {externalSearchResults.length > 0 && (
                      <div className="mt-4 space-y-2 max-h-48 overflow-y-auto pr-2 custom-scrollbar">
                        {externalSearchResults.map(res => (
                          <button
                            key={res.id}
                            type="button"
                            onClick={() => selectExternalSong(res)}
                            className="w-full flex items-center gap-3 p-2 rounded-lg border transition-all group text-left cursor-pointer"
                            style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-main)' }}
                          >
                            <img src={res.artwork} alt="" className="w-10 h-10 rounded-md shadow-lg" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold truncate transition-colors" style={{ color: 'var(--text-heading)' }}>{res.title}</p>
                              <p className="text-[10px] truncate" style={{ color: 'var(--text-secondary)' }}>{res.artist}</p>
                            </div>
                            <Plus size={14} style={{ color: 'var(--accent)' }} />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveSong} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Título</label>
                    <input required value={songTitle} onChange={e => setSongTitle(e.target.value)} type="text" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="Título da música" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Artista</label>
                    <input value={songArtist} onChange={e => setSongArtist(e.target.value)} type="text" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="Artista ou Ministério" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Tom</label>
                      <input value={songKey} onChange={e => setSongKey(e.target.value)} type="text" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="Ex: G#" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>BPM</label>
                      <input value={songBpm} onChange={e => setSongBpm(e.target.value)} type="number" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="Ex: 72" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Link YouTube</label>
                    <input value={songYoutube} onChange={e => setSongYoutube(e.target.value)} type="url" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black uppercase tracking-widest ml-1" style={{ color: 'var(--text-secondary)' }}>Link Cifra</label>
                    <input value={songCifra} onChange={e => setSongCifra(e.target.value)} type="url" className="w-full text-sm rounded-xl px-4 py-3 outline-none transition-all" style={{ background: 'var(--bg-input)', border: '1px solid var(--border-main)', color: 'var(--text-primary)' }} placeholder="https://..." />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingSong}
                    className="w-full py-4 font-black text-xs uppercase tracking-[0.2em] rounded-2xl transition-all mt-4 disabled:opacity-50 cursor-pointer shadow-md"
                    style={{ background: 'var(--accent)', color: 'var(--accent-text)' }}
                  >
                    {isSubmittingSong ? 'Salvando...' : 'Salvar Música'}
                  </button>
                </form>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

