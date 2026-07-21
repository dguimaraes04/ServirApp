import React, { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Calendar, CheckCircle2, XCircle, Bell, User, Users, Clock, Zap, LogOut, Music, ExternalLink, Youtube, X, Plus, Pencil, Trash2, Save, Search, Settings, Camera } from 'lucide-react';
import { supabase } from '../lib/supabase';

export function VolunteerApp() {
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
              fetchMySchedules(false); // Busca sem mostrar o loading principal
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
      // Fetch Profile
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

      // Fetch User Ministries
      const { data: userMins } = await supabase
        .from('volunteer_ministries')
        .select('ministries(*)')
        .eq('volunteer_id', currentSession.user.id);
      
      const userMinistriesList = userMins?.map((m: any) => m.ministries).filter(Boolean) || [];
      setUserMinistries(userMinistriesList);

      // Fetch Schedules with Event data
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

        // Fetch shared setlists for these events
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
            // Dedup by song_id
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

      // Calculate if Worship Member
      const keywords = ['louvor', 'musica', 'música', 'worship', 'som', 'mídia', 'midia', 'worsip', 'louvor/musica', 'comunicação', 'comunicacao'];
      
      const hasWorshipMin = userMinistriesList.some((m: any) => 
        keywords.some(k => m.name?.toLowerCase().includes(k))
      );

      const isWorship = !!hasWorshipMin;
      setIsWorshipMember(isWorship);

      // Fetch Songs Repertoire if Louvor or Manager
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
      // iTunes API is free, no key needed, perfect for metadata and artwork
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

  const handleSaveSetlist = async () => {
    if (!selectedScheduleForEdit) return;
    setIsSubmittingSetlist(true);
    try {
      // Find all schedules for this event to clear them all
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

      // Clear existing in ALL schedules of this event to avoid "ghost" songs
      await supabase.from('schedule_songs').delete().in('schedule_id', allScheduleIds);
      
      // Insert new setlist into the Master schedule
      const inserts = selectedSongsForSetlist.map((song, index) => ({
        schedule_id: targetScheduleId,
        song_id: song.id,
        order_index: index + 1
      }));
      
      if (inserts.length > 0) {
        await supabase.from('schedule_songs').insert(inserts);
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
      
      // Update profile immediately
      await supabase.from('profiles').update({ avatar_url: publicUrl }).eq('id', session.user.id);
      
      // Update state locally
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
      <div className="min-h-screen bg-navy-950 flex flex-col items-center justify-center">
        <div className="w-8 h-8 border-4 border-accent-cyan/30 border-t-accent-cyan rounded-full animate-spin mb-4" />
        <p className="text-slate-gray font-medium text-sm">Carregando suas escalas...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-navy-950 flex flex-col md:items-center">
      <div className="w-full md:max-w-md bg-navy-950 md:bg-navy-900/50 md:border-x md:border-navy-800 min-h-screen flex flex-col relative shadow-2xl">
        
        {/* Header */}
        <header className="px-6 py-6 border-b border-navy-800 bg-navy-950/80 backdrop-blur-md sticky top-0 z-20">
          <div className="flex justify-between items-center mb-6">
            <div>
              <p className="text-slate-gray text-xs font-bold uppercase tracking-widest mb-1">Olá, {userProfile?.full_name?.split(' ')[0]}</p>
              <h1 className="text-2xl font-display font-black text-white leading-none">
                {currentView === 'schedules' ? 'Minha Agenda' : 'Repertório'}
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={() => setCurrentView('profile')}
                className="w-10 h-10 rounded-xl bg-navy-800 border-2 border-navy-700 p-0.5 hover:border-accent-cyan transition-all overflow-hidden"
              >
                {userProfile?.avatar_url ? (
                  <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover rounded-lg" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center bg-gradient-to-tr from-accent-cyan to-blue-500 text-navy-950 font-black text-xs rounded-lg">
                    {userProfile?.full_name?.charAt(0) || 'V'}
                  </div>
                )}
              </button>
              <button 
                className="w-10 h-10 rounded-xl bg-navy-800 flex items-center justify-center text-slate-gray hover:text-red-400 transition-colors border border-navy-700"
                onClick={() => supabase.auth.signOut()}
                title="Sair"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>

          {canManageRepertoire && (
            <div className="flex bg-navy-900 p-1 rounded-xl border border-navy-800">
              <button 
                onClick={() => setCurrentView('schedules')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${currentView === 'schedules' ? 'bg-navy-800 text-accent-cyan shadow-lg' : 'text-slate-gray hover:text-white'}`}
              >
                Escalas
              </button>
              <button 
                onClick={() => setCurrentView('songs')}
                className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${currentView === 'songs' ? 'bg-navy-800 text-accent-cyan shadow-lg' : 'text-slate-gray hover:text-white'}`}
              >
                Músicas
              </button>
            </div>
          )}
          
          {currentView === 'profile' && (
            <button 
              onClick={() => setCurrentView('schedules')}
              className="mt-4 flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-accent-cyan hover:text-white transition-colors"
            >
              <Zap size={14} /> Voltar para Agenda
            </button>
          )}
        </header>

        {/* Content */}
        <main className="flex-1 overflow-y-auto p-6 space-y-6 pb-32">
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
                      className={`rounded-3xl border p-5 transition-all relative overflow-hidden ${
                        item.status === 'confirmed' 
                          ? 'bg-green-500/5 border-green-500/20' 
                          : item.status === 'declined'
                          ? 'bg-red-500/5 border-red-500/20 opacity-60'
                          : 'bg-navy-900 border-navy-700 shadow-lg'
                      }`}
                    >
                      <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${
                        item.status === 'confirmed' ? 'bg-green-400' :
                        item.status === 'declined' ? 'bg-red-400' : 'bg-accent-cyan'
                      }`} />

                      <div className="flex justify-between items-start mb-4">
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full" style={{ backgroundColor: ministry.color }} />
                            <span className="text-[10px] font-black text-slate-gray uppercase tracking-widest">{ministry.name}</span>
                          </div>
                          <h3 className="text-xl font-display font-black text-white leading-tight">{event.title}</h3>
                          <div className="flex items-center gap-4 text-xs text-slate-gray font-medium">
                            <div className="flex items-center gap-1">
                              <Clock size={14} className="text-accent-cyan" />
                              {date.toLocaleDateString('pt-BR')} às {date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                            </div>
                          </div>
                        </div>
                      </div>

                      {item.role_function && (
                        <div className="mb-4 p-3 bg-navy-950/50 rounded-xl border border-navy-800">
                          <p className="text-[10px] font-black text-slate-gray uppercase tracking-widest mb-1">Sua Função</p>
                          <p className="text-sm text-accent-cyan font-bold">{item.role_function}</p>
                        </div>
                      )}

                      {/* Lista de Equipe */}
                      <div className="mb-6">
                        <p className="text-[10px] font-black text-slate-gray uppercase tracking-widest mb-2 flex items-center gap-2">
                          <Users size={12} className="text-accent-cyan" /> Equipe Escalada
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
                                className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg border text-[10px] font-bold ${
                                  isMe ? 'bg-accent-cyan/10 border-accent-cyan/30 text-accent-cyan' : 'bg-navy-950 border-navy-800 text-slate-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md overflow-hidden flex-shrink-0 flex items-center justify-center font-black text-[9px] ${
                                  isMe ? 'bg-accent-cyan/20' : 'bg-navy-800'
                                }`}>
                                  {avatarUrl
                                    ? <img src={avatarUrl} alt="" className="w-full h-full object-cover" />
                                    : name.charAt(0)
                                  }
                                </div>
                                <span>{name.split(' ')[0]}</span>
                                <span className="opacity-50">•</span>
                                <span className="opacity-70">{sv.role_function || 'Voluntário'}</span>
                                {isMe && <span className="ml-1 text-[8px] bg-accent-cyan text-navy-950 px-1 rounded-sm">VOCÊ</span>}
                              </div>
                            );
                          })}
                        </div>
                      </div>

                      {/* Ações de Setlist (Visíveis para Louvor e Mídia se tiver permissão) */}
                      {canManageRepertoire && (mName.includes('louvor') || mName.includes('música') || mName.includes('musica') || mName.includes('worship') || mName.includes('mídia') || mName.includes('midia') || mName.includes('som')) && (
                        <div className="mb-4 flex gap-3">
                          {item.shared_setlist?.length > 0 && (
                            <button 
                              onClick={() => {
                                setSelectedSetlist(item.shared_setlist);
                                setIsSetlistModalOpen(true);
                              }}
                              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-accent-cyan/10 text-accent-cyan text-xs font-black uppercase tracking-widest hover:bg-accent-cyan/20 transition-all border border-accent-cyan/20"
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
                              className="flex-1 py-2.5 rounded-xl bg-yellow-500/10 text-yellow-500 border border-yellow-500/20 font-black text-[10px] uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-yellow-500/20 transition-all"
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
                            className="flex-1 py-3 rounded-xl border border-navy-800 bg-navy-800 text-slate-gray font-bold text-sm hover:text-red-400 hover:bg-red-500/10 transition-all flex items-center justify-center gap-2"
                          >
                            <XCircle size={18} /> Recusar
                          </button>
                          <button 
                            onClick={() => handleResponse(item.id, 'confirmed')}
                            className="flex-1 py-3 rounded-xl bg-accent-cyan text-navy-950 font-black text-sm hover:shadow-[0_0_15px_rgba(100,255,218,0.4)] transition-all flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 size={18} /> Confirmar
                          </button>
                        </div>
                      ) : (
                        <div className="mt-2 flex items-center justify-between">
                          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[10px] font-black uppercase tracking-widest ${
                            item.status === 'confirmed' ? 'bg-green-500/10 text-green-400' : 'bg-red-500/10 text-red-400'
                          }`}>
                            {item.status === 'confirmed' ? (
                              <><CheckCircle2 size={12} /> Confirmado</>
                            ) : (
                              <><XCircle size={12} /> Recusado</>
                            )}
                          </div>
                          <button 
                            onClick={() => handleResponse(item.id, 'pending')}
                            className="text-[10px] font-bold text-slate-600 hover:text-white transition-colors uppercase tracking-widest"
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
                    <div className="w-20 h-20 bg-navy-900 rounded-3xl flex items-center justify-center mb-6 border border-navy-800">
                      <Calendar size={32} className="text-navy-700" />
                    </div>
                    <h3 className="text-white font-bold mb-2">Tudo limpo!</h3>
                    <p className="text-slate-gray text-sm px-10">Você não tem nenhuma escala pendente ou confirmada no momento.</p>
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
                  <h2 className="text-lg font-display font-black text-white uppercase tracking-tighter">Repertório</h2>
                  <button 
                    onClick={() => openSongModal()}
                    className="p-2.5 rounded-xl bg-accent-cyan text-navy-950 hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all border border-accent-cyan/50"
                  >
                    <Plus size={20} />
                  </button>
                </div>

                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-gray" size={16} />
                  <input 
                    type="text" 
                    placeholder="Buscar música ou artista..." 
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full bg-navy-900 border border-navy-800 text-white pl-12 pr-4 py-3.5 rounded-2xl focus:border-accent-cyan transition-all outline-none text-sm shadow-inner"
                  />
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {filteredSongs.map(song => (
                    <div key={song.id} className="glass-card p-5 group hover:border-accent-cyan/30 transition-all">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h4 className="font-bold text-white group-hover:text-accent-cyan transition-colors leading-tight mb-1">{song.title}</h4>
                          <p className="text-xs text-slate-gray font-medium">{song.artist || 'Artista desconhecido'}</p>
                        </div>
                        <div className="flex gap-2">
                          <button 
                            onClick={() => openSongModal(song)}
                            className="p-2 rounded-lg bg-navy-800 text-slate-gray hover:text-white transition-colors"
                          >
                            <Pencil size={14} />
                          </button>
                          <button 
                            onClick={() => handleDeleteSong(song.id, song.title)}
                            className="p-2 rounded-lg bg-navy-800 text-slate-gray hover:text-red-500 transition-colors"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                      
                      <div className="flex gap-4 mb-4">
                        {song.key && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-slate-gray tracking-widest">Tom</span>
                            <span className="text-xs font-bold text-accent-cyan">{song.key}</span>
                          </div>
                        )}
                        {song.bpm && (
                          <div className="flex flex-col">
                            <span className="text-[9px] uppercase font-black text-slate-gray tracking-widest">BPM</span>
                            <span className="text-xs font-bold text-white">{song.bpm}</span>
                          </div>
                        )}
                      </div>

                      <div className="flex gap-2 pt-4 border-t border-navy-800">
                        {song.video_url && (
                          <a href={song.video_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-red-500/10 text-red-500 rounded-xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all border border-red-500/20">YouTube</a>
                        )}
                        {song.lyrics_url && (
                          <a href={song.lyrics_url} target="_blank" rel="noopener noreferrer" className="flex-1 py-2 bg-accent-cyan/10 text-accent-cyan rounded-xl text-center text-[10px] font-black uppercase tracking-widest hover:bg-accent-cyan hover:text-navy-950 transition-all border border-accent-cyan/20">Cifra</a>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </motion.div>
            )}

            {currentView === 'profile' && (
              <motion.div key="profile" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 20 }}>
                <div className="space-y-8 pb-20">
                  <div className="flex flex-col items-center gap-6">
                    <div className="relative">
                      <div className="w-32 h-32 rounded-3xl bg-navy-900 border-2 border-navy-800 flex items-center justify-center overflow-hidden shadow-2xl transition-all relative">
                        {newAvatarUrl ? (
                          <img src={newAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-4xl font-black text-accent-cyan">{userProfile?.full_name?.charAt(0) || '?'}</span>
                        )}
                        
                        {isUploadingProfile && (
                          <div className="absolute inset-0 bg-navy-950/60 flex items-center justify-center">
                            <div className="w-6 h-6 border-2 border-accent-cyan border-t-transparent rounded-full animate-spin" />
                          </div>
                        )}
                      </div>
                      
                      <button 
                        onClick={() => fileInputRef.current?.click()}
                        className="absolute -bottom-2 -right-2 w-10 h-10 bg-accent-cyan text-navy-950 rounded-xl flex items-center justify-center shadow-lg active:scale-95 transition-transform"
                      >
                        <Camera size={20} />
                      </button>
                      <input type="file" ref={fileInputRef} onChange={handleProfileUpload} className="hidden" accept="image/*" />
                    </div>
                    <div className="text-center">
                      <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">{userProfile?.full_name}</h3>
                      <p className="text-xs text-slate-gray mt-1">{userProfile?.role === 'volunteer' ? 'Voluntário' : userProfile?.role === 'leader' ? 'Líder' : 'Administrador'}</p>
                    </div>
                  </div>

                  <div className="glass-card p-6 space-y-6">
                    <div>
                      <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest block mb-2 ml-1">Nome Completo</label>
                      <input 
                        type="text" value={newFullName} onChange={e => setNewFullName(e.target.value)}
                        className="w-full bg-navy-950 border border-navy-800 text-white rounded-xl px-4 py-3 focus:border-accent-cyan transition-all outline-none"
                      />
                    </div>
                    
                    <div className="p-4 bg-navy-900/50 rounded-2xl border border-navy-800 border-dashed">
                      <p className="text-[10px] text-slate-gray text-center font-medium">Sua foto é importante para que os líderes te identifiquem nas escalas.</p>
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
                      className="w-full py-4 bg-accent-cyan text-navy-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all"
                    >
                      {isSavingProfile ? 'Salvando...' : 'Salvar Alterações'}
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Floating Profile Info */}
        <div 
          className="px-6 py-4 bg-navy-950/90 backdrop-blur-xl border-t border-navy-800 fixed bottom-0 left-1/2 -translate-x-1/2 w-full md:max-w-md flex items-center gap-4 cursor-pointer hover:bg-navy-900 transition-colors"
          onClick={() => setCurrentView('profile')}
        >
          <div className="w-10 h-10 rounded-xl bg-navy-800 border border-navy-700 flex items-center justify-center overflow-hidden">
             {userProfile?.avatar_url ? (
               <img src={userProfile.avatar_url} alt="" className="w-full h-full object-cover" />
             ) : (
               <User size={20} className="text-accent-cyan" />
             )}
          </div>
          <div className="flex-1">
            <p className="text-[10px] font-black text-slate-gray uppercase tracking-widest leading-none mb-1">{userProfile?.role === 'manager' ? 'Gerente' : userProfile?.role === 'leader' ? 'Líder' : 'Voluntário'}</p>
            <p className="text-sm font-bold text-white leading-none">{userProfile?.full_name}</p>
          </div>
          <div className="text-accent-cyan opacity-50 group-hover:opacity-100">
            <Settings size={16} />
          </div>
        </div>

        {/* Modals */}
        <AnimatePresence>
          {/* Modal Visualizar Setlist */}
          {isSetlistModalOpen && selectedSetlist && (
            <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
              <motion.div 
                initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                onClick={() => setIsSetlistModalOpen(false)}
                className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-navy-900 border border-navy-700 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <div className="flex items-center gap-2">
                    <Music size={20} className="text-accent-cyan" />
                    <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Setlist do Culto</h3>
                  </div>
                  <button onClick={() => setIsSetlistModalOpen(false)} className="text-slate-gray hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                  {selectedSetlist
                    .sort((a, b) => (a.order_index || 0) - (b.order_index || 0))
                    .map((ss, idx) => (
                    <div key={ss.id} className="p-4 rounded-2xl bg-navy-950/50 border border-navy-800 space-y-3">
                      <div className="flex justify-between items-start">
                        <div className="flex gap-3">
                          <div className="w-6 h-6 rounded-lg bg-navy-800 flex items-center justify-center text-[10px] font-black text-accent-cyan border border-navy-700">
                            {idx + 1}
                          </div>
                          <div>
                            <h4 className="text-sm font-bold text-white leading-none mb-1">{ss.songs.title}</h4>
                            <p className="text-[11px] text-slate-gray">{ss.songs.artist}</p>
                          </div>
                        </div>
                        <div className="flex flex-col items-end gap-1">
                          {ss.songs.key && <span className="text-[10px] font-black text-accent-cyan px-1.5 py-0.5 bg-accent-cyan/10 rounded">{ss.songs.key}</span>}
                          {ss.songs.bpm && <span className="text-[9px] text-slate-gray font-bold">{ss.songs.bpm} BPM</span>}
                        </div>
                      </div>

                      <div className="flex gap-2 pt-1">
                        {ss.songs.video_url && (
                          <a 
                            href={ss.songs.video_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-red-500/10 text-red-400 text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 transition-all border border-red-500/20"
                          >
                            <Youtube size={12} /> Video
                          </a>
                        )}
                        {ss.songs.lyrics_url && (
                          <a 
                            href={ss.songs.lyrics_url} target="_blank" rel="noopener noreferrer"
                            className="flex-1 flex items-center justify-center gap-2 py-2 rounded-xl bg-accent-cyan/10 text-accent-cyan text-[10px] font-black uppercase tracking-widest hover:bg-accent-cyan/20 transition-all border border-accent-cyan/20"
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
                className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-navy-900 border border-navy-700 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[85vh] flex flex-col"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">Editar Setlist</h3>
                  <button onClick={() => setIsEditSetlistModalOpen(false)} className="text-slate-gray hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                <div className="space-y-4 mb-6 overflow-y-auto pr-2 custom-scrollbar flex-1">
                  <div>
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest block mb-2 ml-1">Adicionar Música</label>
                    <select 
                      onChange={(e) => {
                        const song = songs.find(s => s.id === e.target.value);
                        if (song && !selectedSongsForSetlist.find(s => s.id === song.id)) {
                          setSelectedSongsForSetlist([...selectedSongsForSetlist, song]);
                        }
                        e.target.value = "";
                      }}
                      className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all"
                    >
                      <option value="">Selecione para adicionar...</option>
                      {songs.map(s => (
                        <option key={s.id} value={s.id}>{s.title} - {s.artist}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-2">
                    <label className="text-[10px] font-black text-slate-gray uppercase tracking-widest block mb-2 ml-1">Ordem das Músicas</label>
                    {selectedSongsForSetlist.map((song, idx) => (
                      <div key={song.id} className="flex items-center gap-3 p-3 bg-navy-950/50 rounded-xl border border-navy-800 group">
                        <div className="w-5 h-5 rounded bg-navy-800 flex items-center justify-center text-[10px] font-black text-accent-cyan">
                          {idx + 1}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white truncate">{song.title}</p>
                          <p className="text-[10px] text-slate-gray truncate">{song.artist}</p>
                        </div>
                        <button 
                          onClick={() => setSelectedSongsForSetlist(selectedSongsForSetlist.filter(s => s.id !== song.id))}
                          className="text-slate-gray hover:text-red-500 p-1"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    ))}
                    {selectedSongsForSetlist.length === 0 && (
                      <div className="py-12 border-2 border-dashed border-navy-800 rounded-2xl flex flex-col items-center justify-center text-slate-gray gap-2">
                        <Music size={24} className="opacity-20" />
                        <span className="text-[10px] font-bold uppercase">Nenhuma música selecionada</span>
                      </div>
                    )}
                  </div>
                </div>

                <button 
                  onClick={handleSaveSetlist}
                  disabled={isSubmittingSetlist}
                  className="w-full py-4 bg-accent-cyan text-navy-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all disabled:opacity-50 disabled:hover:shadow-none"
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
                className="absolute inset-0 bg-navy-950/90 backdrop-blur-sm"
              />
              <motion.div 
                initial={{ scale: 0.95, opacity: 0, y: 20 }}
                animate={{ scale: 1, opacity: 1, y: 0 }}
                exit={{ scale: 0.95, opacity: 0, y: 20 }}
                className="bg-navy-900 border border-navy-700 w-full max-w-sm rounded-3xl p-6 relative z-10 shadow-2xl overflow-hidden max-h-[90vh] overflow-y-auto"
              >
                <div className="flex justify-between items-center mb-6">
                  <h3 className="text-xl font-display font-black text-white uppercase tracking-tight">
                    {editingSong ? 'Editar Música' : 'Nova Música'}
                  </h3>
                  <button onClick={() => setIsSongModalOpen(false)} className="text-slate-gray hover:text-white transition-colors">
                    <X size={20} />
                  </button>
                </div>

                {/* Busca Externa Integrada */}
                {!editingSong && (
                  <div className="mb-8 p-4 bg-navy-950 rounded-2xl border border-accent-cyan/20 shadow-inner">
                    <label className="text-[10px] font-black text-accent-cyan uppercase tracking-widest block mb-2">Importar da Nuvem (Sugestão)</label>
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-gray" size={14} />
                        <input 
                          type="text" 
                          placeholder="Buscar no YouTube/iTunes..." 
                          value={externalSearchQuery}
                          onChange={(e) => setExternalSearchQuery(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleSearchExternal())}
                          className="w-full bg-navy-900 border border-navy-800 text-white text-xs rounded-xl pl-9 pr-4 py-2.5 outline-none focus:border-accent-cyan transition-all"
                        />
                      </div>
                      <button 
                        type="button"
                        onClick={handleSearchExternal}
                        disabled={isSearchingExternal}
                        className="px-4 py-2.5 bg-accent-cyan/10 text-accent-cyan border border-accent-cyan/30 rounded-xl text-[10px] font-black uppercase hover:bg-accent-cyan hover:text-navy-950 transition-all"
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
                            className="w-full flex items-center gap-3 p-2 bg-navy-900 border border-navy-800 rounded-lg hover:border-accent-cyan/50 transition-all group text-left"
                          >
                            <img src={res.artwork} alt="" className="w-10 h-10 rounded-md shadow-lg" />
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-bold text-white truncate group-hover:text-accent-cyan transition-colors">{res.title}</p>
                              <p className="text-[10px] text-slate-gray truncate">{res.artist}</p>
                            </div>
                            <Plus size={14} className="text-accent-cyan opacity-0 group-hover:opacity-100 transition-opacity" />
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                <form onSubmit={handleSaveSong} className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">Título</label>
                    <input required value={songTitle} onChange={e => setSongTitle(e.target.value)} type="text" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="Título da música" />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">Artista</label>
                    <input value={songArtist} onChange={e => setSongArtist(e.target.value)} type="text" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="Artista ou Ministério" />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">Tom</label>
                      <input value={songKey} onChange={e => setSongKey(e.target.value)} type="text" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="Ex: G#" />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">BPM</label>
                      <input value={songBpm} onChange={e => setSongBpm(e.target.value)} type="number" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="Ex: 72" />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">Link YouTube</label>
                    <input value={songYoutube} onChange={e => setSongYoutube(e.target.value)} type="url" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="https://..." />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-[9px] font-black text-slate-gray uppercase tracking-widest ml-1">Link Cifra</label>
                    <input value={songCifra} onChange={e => setSongCifra(e.target.value)} type="url" className="w-full bg-navy-950 border border-navy-800 text-white text-sm rounded-xl px-4 py-3 outline-none focus:border-accent-cyan transition-all" placeholder="https://..." />
                  </div>

                  <button 
                    type="submit"
                    disabled={isSubmittingSong}
                    className="w-full py-4 bg-accent-cyan text-navy-950 font-black text-xs uppercase tracking-[0.2em] rounded-2xl hover:shadow-[0_0_20px_rgba(100,255,218,0.4)] transition-all mt-4 disabled:opacity-50"
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
