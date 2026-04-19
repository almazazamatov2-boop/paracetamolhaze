'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Tv, Lightbulb, SkipForward, Trophy, Home, ChevronRight, 
  Search, X, Check, Sparkles, Clapperboard, Eye, Crown, LogIn, 
  Zap, Medal, Menu, User, Inbox, RefreshCw, Loader2, LogOut, Share2,
  Smile
} from 'lucide-react';
import { Button } from '@/components/67/ui/button'; 
import { AuthProvider, useSession, signIn, signOut } from '@/lib/67/authHook'; 
import { supabase } from '@/lib/supabase';
import { movies, Movie } from '@/data/movies';

// ============ TYPES ============
interface EmojinoState {
  hintsUsed: number;
  guessed: boolean;
  correct: boolean;
  score: number;
  totalScore: number;
  round: number;
  mode: string;
}

type Screen = 'home' | 'game' | 'leaderboard' | 'result';

function AnimatedBg() {
  return (
    <div className="fixed inset-0 overflow-hidden pointer-events-none">
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] rounded-full bg-amber-500/[0.07] blur-[120px] animate-float-slow" />
      <div className="absolute bottom-[-15%] right-[-10%] w-[600px] h-[600px] rounded-full bg-red-600/[0.06] blur-[140px] animate-float-slow-reverse" />
      <div className="absolute top-[40%] left-[50%] w-[300px] h-[300px] rounded-full bg-orange-500/[0.04] blur-[100px] animate-float-slow" />
    </div>
  );
}

const SCORE_FOR_HINTS = [5, 3, 2, 1];

function ProfileModal({ isOpen, onClose, user, stats }: { isOpen: boolean, onClose: () => void, user: any, stats: any }) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} className="absolute inset-0 bg-black/80 backdrop-blur-sm" />
      <motion.div 
        initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
        className="relative w-full max-w-md bg-[#0c0c0e] border border-white/10 rounded-[2.5rem] overflow-hidden shadow-2xl p-8"
      >
        <button onClick={onClose} className="absolute top-6 right-6 text-neutral-500 hover:text-white transition-colors">
          <X className="w-6 h-6" />
        </button>

        <div className="flex flex-col items-center text-center space-y-4">
          <div className="relative">
            <img src={user.image} className="w-24 h-24 rounded-[2rem] border-2 border-white/10 shadow-2xl shadow-amber-500/20" alt="" />
            <div className="absolute -bottom-2 -right-2 bg-amber-500 text-black p-2 rounded-xl shadow-lg">
              <Crown className="w-4 h-4" />
            </div>
          </div>
          <div className="space-y-1">
            <h3 className="text-2xl font-black">{user.name}</h3>
            <p className="text-[10px] text-neutral-500 uppercase font-black tracking-widest">Личный кабинет</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-3 mt-10">
           <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-amber-500/10 flex items-center justify-center text-amber-400 font-black text-xs">
                    К
                 </div>
                 <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest font-black">КОМБО</span>
              </div>
              <span className="text-xl font-black text-white">{stats.all || 0}</span>
           </div>
           <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-400 font-black text-xs">
                    Ф
                 </div>
                 <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest font-black">ФИЛЬМЫ</span>
              </div>
              <span className="text-xl font-black text-white">{stats.film || 0}</span>
           </div>
           <div className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/[0.06]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-xl bg-red-500/10 flex items-center justify-center text-red-400 font-black text-xs">
                    С
                 </div>
                 <span className="text-sm font-bold text-neutral-400 uppercase tracking-widest font-black">СЕРИАЛЫ</span>
              </div>
              <span className="text-xl font-black text-white">{stats.serial || 0}</span>
           </div>
        </div>

        <button 
          onClick={() => window.location.reload()}
          className="w-full mt-8 p-5 rounded-3xl bg-rose-500/10 border border-rose-500/20 text-rose-500 font-black text-sm hover:bg-rose-500 hover:text-white transition-all flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> ВЫЙТИ ИЗ АККАУНТА
        </button>
      </motion.div>
    </div>
  );
}

function EmojinoContent() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMovies, setGameMovies] = useState<Movie[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [guessInput, setGuessInput] = useState('');
  const [state, setState] = useState<EmojinoState>({ 
    hintsUsed: 0, 
    guessed: false, 
    correct: false, 
    score: 0, 
    totalScore: 0,
    round: 1,
    mode: 'all' 
  });
  const [leaderboard, setLeaderboard] = useState<any[]>([]);
  const [lbMode, setLbMode] = useState('all');
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [userStats, setUserStats] = useState({ all: 0, film: 0, serial: 0 });

  // Client-side suggestions
  useEffect(() => {
    if (guessInput.length < 1 || state.guessed) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const filtered = movies.filter(m => 
      m.name.toLowerCase().includes(guessInput.toLowerCase()) ||
      m.aliases.some(a => a.toLowerCase().includes(guessInput.toLowerCase()))
    ).slice(0, 5);
    
    setSuggestions(filtered);
    setShowSuggestions(true);
  }, [guessInput, state.guessed]);

  // Load leaderboard (local storage or supabase if I had a table, but I'll use a specific tag for now)
  useEffect(() => {
    fetchLeaderboard(lbMode);
  }, [lbMode]);

  const fetchLeaderboard = async (mode: string) => {
    try {
      const { data } = await supabase
        .from('kinokadr_scores')
        .select('*')
        .eq('mode', `emojino_${mode}`)
        .order('score', { ascending: false })
        .limit(100);
      
      const seen = new Set();
      const unique = (data || []).filter(item => {
        const id = item.user_id;
        if (seen.has(id)) return false;
        seen.add(id);
        return true;
      }).slice(0, 10);

      setLeaderboard(unique);
    } catch (e) {}
  };

  const fetchUserStats = async () => {
    if (!session?.user) return;
    try {
      const { data } = await supabase
        .from('kinokadr_scores')
        .select('*')
        .eq('user_id', session.user.id || (session.user as any).name)
        .filter('mode', 'like', 'emojino_%');
      
      const stats = { all: 0, film: 0, serial: 0 };
      data?.forEach(s => {
        if (s.mode === 'emojino_all' && s.score > stats.all) stats.all = s.score;
        if (s.mode === 'emojino_film' && s.score > stats.film) stats.film = s.score;
        if (s.mode === 'emojino_serial' && s.score > stats.serial) stats.serial = s.score;
      });
      setUserStats(stats);
    } catch (e) {}
  };

  useEffect(() => {
    if (isProfileOpen) fetchUserStats();
  }, [isProfileOpen]);

  const twitchLogin = () => signIn('emojino');

  const fetchMoviesSupabase = async (mode: string) => {
    try {
      let query = supabase.from('emojino_movies').select('*');
      if (mode === 'film') query = query.eq('type', 'film');
      else if (mode === 'serial') query = query.eq('type', 'serial');
      
      const { data, error } = await query.limit(200);
      
      if (data && data.length > 0) {
        return data.sort(() => Math.random() - 0.5).slice(0, 10);
      }
      return null;
    } catch (e) {
      return null;
    }
  };

  const startNewGame = async (mode: string) => {
    let pool: any[] = [];
    
    // Try to get from Supabase first
    const dbData = await fetchMoviesSupabase(mode);
    if (dbData) {
      pool = dbData;
    } else {
      // Fallback to local data
      const localPool = mode === 'all' ? movies : movies.filter(m => m.type === mode);
      pool = [...localPool].sort(() => Math.random() - 0.5).slice(0, 10);
    }

    setGameMovies(pool);
    setScreen('game');
    setCurrentIndex(0);
    setState({ 
      hintsUsed: 0, 
      guessed: false, 
      correct: false, 
      score: 0, 
      totalScore: 0,
      round: 1,
      mode 
    });
    setGuessInput('');
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/ё/g, 'е').replace(/[-:.,!?'"\s]+/g, ' ');
  };

  const checkAnswer = (input: string, movie: Movie): boolean => {
    const normalized = normalizeAnswer(input);
    const possibleAnswers = [movie.name, ...movie.aliases];
    
    for (const alias of possibleAnswers) {
      const normAlias = normalizeAnswer(alias);
      if (normalized === normAlias) return true;
      if (normalized.length >= 3 && (normAlias.includes(normalized) || normalized.includes(normAlias))) return true;
    }
    return false;
  };

  const handleGuess = (inputOverride?: string) => {
    const input = (inputOverride || guessInput).trim();
    if (!input || state.guessed) return;
    
    const current = gameMovies[currentIndex];
    const isCorrect = checkAnswer(input, current);

    const earned = isCorrect ? SCORE_FOR_HINTS[state.hintsUsed] : 0;
    
    setState(prev => ({ 
      ...prev, 
      guessed: true, 
      correct: isCorrect, 
      score: earned,
      totalScore: prev.totalScore + earned
    }));
    setShowSuggestions(false);
  };

  const handleSkip = () => {
    if (state.guessed) return;
    setState(prev => ({ ...prev, guessed: true, correct: false, score: 0 }));
  };

  const nextMovie = () => {
    if (state.round < 10 && currentIndex < gameMovies.length - 1) {
      setCurrentIndex(prev => prev + 1);
      setState(prev => ({ ...prev, hintsUsed: 0, guessed: false, correct: false, score: 0, round: prev.round + 1 }));
      setGuessInput('');
    } else {
      setScreen('result');
      if (session?.user) {
        saveFinalScore(session.user, state.totalScore, state.mode);
      }
    }
  };

  const saveFinalScore = async (user: any, points: number, mode: string) => {
    try {
      await supabase.from('kinokadr_scores').insert({
        user_id: user.id || user.name,
        username: user.name,
        avatar: user.image,
        score: points,
        mode: `emojino_${mode}`,
      });
      fetchLeaderboard(mode);
    } catch (e) {}
  };

  const useHint = () => {
    if (state.hintsUsed < 3) {
      setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
    }
  };

  const selectSuggestion = (s: Movie) => {
    setGuessInput(s.name);
    setShowSuggestions(false);
    handleGuess(s.name);
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#050505] text-white font-sans selection:bg-amber-500/30">
      <AnimatedBg />
      
      <AnimatePresence>
        {isProfileOpen && session?.user && (
          <ProfileModal user={session.user} stats={userStats} isOpen={isProfileOpen} onClose={() => setIsProfileOpen(false)} />
        )}
      </AnimatePresence>

      {/* Header */}
      <header className="relative z-50 w-full border-b border-white/[0.06] backdrop-blur-md bg-black/40">
        <div className="max-w-6xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-6">
            {screen === 'game' && (
               <div className="flex items-center gap-4 h-10 px-4 rounded-xl bg-white/[0.04] border border-white/[0.08]">
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Раунд</span>
                     <span className="text-sm font-black text-amber-400">{state.round} / 10</span>
                  </div>
                  <div className="w-px h-4 bg-white/10" />
                  <div className="flex items-center gap-2">
                     <span className="text-[10px] font-black uppercase text-white/30 tracking-widest leading-none">Счет</span>
                     <span className="text-sm font-black text-white">{state.totalScore}</span>
                  </div>
               </div>
            )}
            {screen !== 'game' && screen !== 'home' && (
              <button 
                onClick={() => setScreen('home')}
                className="flex items-center gap-2 text-white/40 hover:text-white transition-colors uppercase text-[10px] font-black tracking-widest"
              >
                <Home className="w-4 h-4" /> Домой
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
             {session?.user ? (
                <button 
                  onClick={() => setIsProfileOpen(true)}
                  className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-all group"
                >
                  <img src={(session.user as any).image} className="w-8 h-8 rounded-full border border-white/10 group-hover:scale-110 transition-transform shadow-xl" alt="" />
                  <span className="text-xs font-bold">{session.user.name}</span>
                </button>
             ) : (
                <Button className="bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-xl h-11 px-6 text-sm font-bold shadow-lg shadow-purple-500/20" onClick={twitchLogin}>
                  Войти через Twitch
                </Button>
             )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6 overflow-y-auto custom-scrollbar">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div 
              key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-6xl grid grid-cols-1 lg:grid-cols-12 gap-12 items-start pt-10"
            >
              {/* Left Column: Menu */}
              <div className="lg:col-span-5 space-y-12">
                <div className="space-y-4 pr-12 overflow-visible">
                  <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white via-white to-white/40 bg-clip-text text-transparent leading-none uppercase italic drop-shadow-2xl whitespace-nowrap pr-20 overflow-visible">
                    Угадай <br/> Эмоджи
                  </h1>
                </div>

                <div className="grid grid-cols-1 gap-4">
                  {[
                    { m: 'all', t: 'КОМБО', i: <Inbox className="w-9 h-9 text-white" />, c: 'from-purple-600 to-indigo-800' },
                    { m: 'film', t: 'ФИЛЬМЫ', i: <Film className="w-9 h-9 text-white" />, c: 'from-amber-500 to-orange-700' },
                    { m: 'serial', t: 'СЕРИАЛЫ', i: <Tv className="w-9 h-9 text-white" />, c: 'from-emerald-600 to-teal-900' }
                  ].map((item) => (
                    <button 
                      key={item.m} onClick={() => startNewGame(item.m)} 
                      className={`group relative w-full border border-white/10 rounded-[2rem] p-8 flex items-center gap-6 transition-all hover:scale-[1.03] active:scale-[0.98] shadow-2xl bg-gradient-to-br ${item.c}`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:scale-110 transition-transform shadow-inner">
                        {item.i}
                      </div>
                      <div className="text-left flex-1">
                        <h3 className="text-4xl font-black tracking-tighter uppercase text-white drop-shadow-md italic">
                          {item.t}
                        </h3>
                      </div>
                      <ChevronRight className="w-8 h-8 text-white/50 group-hover:text-white group-hover:translate-x-1 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Embedded Leaderboard */}
              <div className="lg:col-span-7 bg-[#0c0c0e]/50 backdrop-blur-xl border border-white/[0.06] rounded-[3rem] p-8 flex flex-col h-[600px] shadow-2xl">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-yellow-500/10 flex items-center justify-center text-yellow-500 shadow-inner">
                          <Trophy className="w-6 h-6" />
                       </div>
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter">Рейтинг</h2>
                    </div>

                    <div className="flex gap-1 bg-white/[0.03] p-1 rounded-2xl border border-white/[0.06]">
                      {['all', 'film', 'serial'].map(m => (
                          <button key={m} onClick={() => setLbMode(m)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${lbMode === m ? 'bg-white/10 text-white shadow-lg' : 'text-neutral-500 hover:text-neutral-300'}`}>
                            {m === 'all' ? 'КОМБО' : m === 'film' ? 'ФИЛЬМЫ' : 'СЕРИАЛЫ'}
                          </button>
                      ))}
                    </div>
                 </div>

                 <div className="flex-1 space-y-3 overflow-y-auto pr-3 custom-scrollbar">
                    {leaderboard.length > 0 ? leaderboard.map((p, i) => (
                        <div key={i} className="flex items-center gap-5 p-5 rounded-3xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-all group">
                          <div className={`w-10 text-2xl font-black italic ${i < 3 ? 'text-amber-400' : 'text-neutral-700'}`}>#{i+1}</div>
                          <img src={p.avatar} className="w-14 h-14 rounded-2xl border border-white/10 shadow-lg group-hover:scale-110 transition-transform" alt="" />
                          <div className="flex-1 min-w-0">
                              <p className="text-lg font-black tracking-tight truncate">{p.username}</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-black leading-none mt-1">{p.mode.replace('emojino_', '')}</p>
                          </div>
                          <div className="text-right">
                              <p className={`text-4xl font-black italic leading-none ${i < 3 ? 'text-amber-400' : 'text-white/60'}`}>{p.score}</p>
                          </div>
                        </div>
                    )) : (
                        <div className="flex flex-col items-center justify-center h-full opacity-20 uppercase font-black tracking-widest text-sm italic">
                           Пусто...
                        </div>
                    )}
                 </div>
              </div>
            </motion.div>
          )}

          {screen === 'game' && gameMovies[currentIndex] && (
            <motion.div 
              key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-xl flex flex-col gap-5"
            >
              {/* Emoji Card */}
              <div className="relative aspect-video rounded-[2.5rem] overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl flex items-center justify-center group p-8">
                 <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-red-500/10 opacity-50" />
                 
                 <div className="relative z-10 text-6xl tracking-[0.2em] flex flex-nowrap justify-center items-center gap-6 text-center whitespace-nowrap">
                    {Array.from(gameMovies[currentIndex].emoji).map((char, i) => (
                      <motion.span
                        key={i}
                        initial={{ opacity: 0, scale: 0, rotate: -20 }}
                        animate={{ opacity: 1, scale: 1, rotate: 0 }}
                        transition={{ delay: i * 0.1, type: "spring" }}
                      >
                        {char}
                      </motion.span>
                    ))}
                 </div>
                 
                 <div className="absolute top-5 left-5 z-20">
                    <span className="px-3 py-1.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest flex items-center h-7 shadow-lg">
                      {gameMovies[currentIndex].type === 'film' ? 'Фильм' : 'Сериал'}
                    </span>
                 </div>

                 {!state.guessed && (
                    <div className="absolute top-5 right-5 animate-pulse z-20 cursor-default">
                       <div className="bg-amber-500 text-black px-4 py-2.5 rounded-2xl font-black text-2xl shadow-lg shadow-amber-500/30">
                          +{SCORE_FOR_HINTS[state.hintsUsed]}
                       </div>
                    </div>
                 )}
              </div>

              {/* Hints Display */}
              <AnimatePresence>
                {state.hintsUsed > 0 && !state.guessed && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-black text-center uppercase tracking-widest"
                  >
                    💡 {gameMovies[currentIndex].hints.slice(0, state.hintsUsed).join(' • ')}
                  </motion.div>
                )}
              </AnimatePresence>

              {!state.guessed ? (
                <div className="space-y-3 relative">
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-5 flex items-center pointer-events-none">
                        <Search className="w-5 h-5 text-white/20 group-focus-within:text-amber-400 transition-colors" />
                      </div>
                      <input 
                        className="w-full h-16 pl-14 pr-6 bg-white/[0.03] border border-white/10 rounded-2xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-lg font-bold transition-all placeholder:text-white/10"
                        placeholder="Название..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                   </div>

                   <AnimatePresence>
                     {showSuggestions && suggestions.length > 0 && (
                       <motion.div 
                         initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
                         className="absolute bottom-full mb-3 left-0 right-0 bg-[#0c0c0e] border border-white/10 rounded-3xl overflow-hidden shadow-2xl z-50 p-1.5"
                       >
                         {suggestions.map((s, idx) => (
                           <button key={idx} onClick={() => selectSuggestion(s)} className="w-full text-left p-4 hover:bg-white/[0.05] flex flex-col transition-colors rounded-2xl group">
                             <span className="font-bold text-white group-hover:text-amber-400 truncate">{s.name}</span>
                             <span className="text-[10px] text-white/40 uppercase font-black">{s.type === 'serial' ? 'Сериал' : 'Фильм'} {s.year && `• ${s.year}`}</span>
                           </button>
                         ))}
                       </motion.div>
                     )}
                   </AnimatePresence>

                   <div className="grid grid-cols-4 gap-2">
                      <button onClick={useHint} disabled={state.hintsUsed >= 3} className="h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all disabled:opacity-20 group">
                         <Lightbulb className="w-5 h-5 group-hover:text-yellow-400 transition-colors" />
                         <span className="text-[8px] uppercase font-black tracking-widest mt-1">ПОДСКАЗКА</span>
                      </button>
                      <button onClick={handleSkip} className="h-16 rounded-2xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-neutral-400 hover:text-white hover:bg-white/5 transition-all group">
                         <SkipForward className="w-5 h-5 group-hover:text-amber-400 transition-colors" />
                         <span className="text-[8px] uppercase font-black tracking-widest mt-1">СКИП</span>
                      </button>
                      <button onClick={() => handleGuess()} className="col-span-2 h-16 rounded-2xl bg-amber-500 text-black flex items-center justify-center gap-2 font-black hover:bg-amber-400 transition-all shadow-lg shadow-amber-500/20 active:scale-95">
                         <Sparkles className="w-5 h-5" /> УГАДАТЬ
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                   <div className={`p-5 rounded-[2rem] border ${state.correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} flex items-center justify-between`}>
                      <div className="flex items-center gap-4">
                         <div className={`w-12 h-12 rounded-2xl flex items-center justify-center ${state.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {state.correct ? <Check className="w-6 h-6" /> : <X className="w-6 h-6" />}
                         </div>
                         <div className="flex-1 min-w-0">
                            <p className={`text-[9px] font-black uppercase tracking-widest mb-0.5 ${state.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {state.correct ? 'Верно!' : 'Не угадали'}
                            </p>
                            <p className="text-xl font-black leading-tight">{gameMovies[currentIndex]?.name || '---'}</p>
                         </div>
                      </div>
                      <div className="text-right ml-4">
                         <p className="text-[9px] text-white/40 uppercase font-black tracking-widest">Баллы</p>
                         <p className="text-3xl font-black text-amber-400 leading-none mt-1">+{state.score}</p>
                      </div>
                   </div>

                   <Button className="w-full h-16 text-lg font-black rounded-3xl bg-white text-black hover:bg-neutral-200 shadow-xl shadow-amber-500/10" onClick={nextMovie}>
                     СЛЕДУЮЩИЙ <ChevronRight className="w-5 h-5 ml-1" />
                   </Button>
                </div>
              )}
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-8 max-w-sm w-full">
              <div className="relative inline-block">
                <Trophy className="w-24 h-24 text-yellow-500 mx-auto" />
                <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className="absolute -top-2 -right-2 bg-amber-500 text-black w-10 h-10 rounded-full flex items-center justify-center font-black text-base border-4 border-black">
                   <Sparkles className="w-5 h-5" />
                </motion.div>
              </div>
              
              <div className="space-y-1">
                <h2 className="text-4xl font-black italic tracking-tighter uppercase">Конец игры!</h2>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-[10px]">Все 10 раундов завершены</p>
              </div>

              <div className="p-10 rounded-[2.5rem] bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden">
                 <p className="text-[9px] font-black uppercase tracking-[0.3em] text-amber-500 mb-2">Общий счет</p>
                 <h3 className="text-7xl font-black leading-none italic">{state.totalScore}</h3>
              </div>

              <div className="flex flex-col gap-3">
                 <Button className="w-full h-16 rounded-[1.5rem] bg-amber-500 text-black font-black hover:bg-amber-400 shadow-lg shadow-amber-500/20" onClick={() => startNewGame(state.mode)}>
                   ИГРАТЬ СНОВА <RefreshCw className="w-5 h-5 ml-2" />
                 </Button>

                 <Button variant="ghost" className="w-full h-14 rounded-[1.5rem] border border-white/10 hover:bg-white/5 text-neutral-500" onClick={() => setScreen('home')}>
                   ВЕРНУТЬСЯ В МЕНЮ
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-5 px-6 bg-black/50 backdrop-blur-md">
        <div className="max-w-5xl mx-auto flex items-center justify-center">
          <a 
            href="https://t.me/paracetamolhaze" 
            target="_blank" 
            rel="noopener noreferrer"
            className="group flex items-center gap-2"
          >
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.2em] group-hover:text-white/40 transition-colors">Powered by</span>
            <span className="text-xs font-black italic tracking-tighter bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent group-hover:from-amber-300 group-hover:to-red-400 transition-all pr-1">PARACETAMOLHAZE</span>
          </a>
        </div>
      </footer>
    </div>
  );
}

export default function EmojinoPage() {
  return (
    <AuthProvider>
      <EmojinoContent />
    </AuthProvider>
  );
}
