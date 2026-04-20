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

function EmojinoContent() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('home');
  const [gameMovies, setGameMovies] = useState<any[]>([]);
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

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (guessInput.length < 2 || state.guessed) {
        setSuggestions([]);
        setShowSuggestions(false);
        return;
      }
      try {
        const { data } = await supabase
          .from('emojino_movies')
          .select('*')
          .or(`title_ru.ilike.%${guessInput}%`)
          .limit(5);
        if (data) {
          setSuggestions(data.map(m => ({ name: m.title_ru, type: m.type, year: m.year })));
          setShowSuggestions(true);
        }
      } catch (e) {}
    };
    const timer = setTimeout(fetchSuggestions, 300);
    return () => clearTimeout(timer);
  }, [guessInput, state.guessed]);

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
        .limit(10);
      setLeaderboard(data || []);
    } catch (e) {}
  };

  const startNewGame = async (mode: string) => {
    try {
      let query = supabase.from('emojino_movies').select('*');
      if (mode === 'film') query = query.eq('type', 'film');
      else if (mode === 'serial') query = query.eq('type', 'serial');
      const { data } = await query;
      if (data && data.length > 0) {
        setGameMovies(data.sort(() => Math.random() - 0.5).slice(0, 10));
        setScreen('game');
        setCurrentIndex(0);
        setState({ hintsUsed: 0, guessed: false, correct: false, score: 0, totalScore: 0, round: 1, mode });
        setGuessInput('');
      }
    } catch (e) {}
  };

  const normalizeAnswer = (answer: string): string => {
    return answer.toLowerCase().trim().replace(/ё/g, 'е').replace(/[-:.,!?'"\s]+/g, ' ');
  };

  const handleGuess = (inputOverride?: string) => {
    const input = (inputOverride || guessInput).trim();
    if (state.guessed || !input) return;
    const current = gameMovies[currentIndex];
    const normalizedIn = normalizeAnswer(input);
    const possible = [normalizeAnswer(current.title_ru)];
    const isCorrect = possible.some(p => p === normalizedIn || (normalizedIn.length >= 4 && p.includes(normalizedIn)));
    const earned = isCorrect ? SCORE_FOR_HINTS[state.hintsUsed] : 0;
    setState(prev => ({ ...prev, guessed: true, correct: isCorrect, score: earned, totalScore: prev.totalScore + earned }));
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
         supabase.from('kinokadr_scores').insert({
          user_id: session.user.id || (session.user as any).name,
          username: session.user.name,
          avatar: session.user.image,
          score: state.totalScore,
          mode: `emojino_${state.mode}`,
        }).then(() => fetchLeaderboard(state.mode));
      }
    }
  };

  const useHint = () => {
    if (state.hintsUsed < 2) setState(prev => ({ ...prev, hintsUsed: prev.hintsUsed + 1 }));
  };

  return (
    <div className="h-screen flex flex-col relative overflow-hidden bg-[#050505] text-white font-sans selection:bg-amber-500/30">
      <AnimatedBg />
      
      {/* Header */}
      <header className="relative z-50 w-full border-b border-white/[0.06] backdrop-blur-md bg-black/40">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
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
                <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                  <img src={(session.user as any).image} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                  <span className="text-xs font-bold">{session.user.name}</span>
                </div>
             ) : (
                <Button className="bg-[#9146FF] hover:bg-[#7c3aed] text-white rounded-xl h-11 px-6 text-sm font-bold shadow-lg" onClick={() => signIn('emojino')}>
                   Войти через Twitch
                </Button>
             )}
          </div>
        </div>
      </header>

      {/* Content */}
      <main className="relative z-10 flex-1 flex flex-col items-center justify-center p-6">
        <AnimatePresence mode="wait">
          {screen === 'home' && (
            <motion.div 
              key="home" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}
              className="w-full max-w-7xl grid grid-cols-1 lg:grid-cols-12 gap-16 items-center"
            >
              {/* Left Column: Title & Buttons */}
              <div className="lg:col-span-5 space-y-10">
                <div className="space-y-0 py-2">
                   <h1 className="text-8xl font-black tracking-tighter bg-gradient-to-b from-white to-white/40 bg-clip-text text-transparent leading-[0.9] uppercase italic">
                      УГАДАЙ<br />ЭМОДЗИ
                   </h1>
                </div>

                <div className="grid grid-cols-1 gap-5">
                  {[
                    { m: 'all', t: 'КОМБО', i: <Inbox className="w-10 h-10" />, c: 'from-purple-600 to-indigo-800' },
                    { m: 'film', t: 'ФИЛЬМЫ', i: <Film className="w-10 h-10" />, c: 'from-amber-500 to-orange-700' },
                    { m: 'serial', t: 'СЕРИАЛЫ', i: <Tv className="w-10 h-10" />, c: 'from-emerald-600 to-teal-900' }
                  ].map((item) => (
                    <button 
                      key={item.m} onClick={() => startNewGame(item.m)} 
                      className={`group relative w-full h-28 border border-white/10 rounded-[2.5rem] p-8 flex items-center gap-8 transition-all hover:scale-[1.03] active:scale-[0.98] shadow-2xl bg-gradient-to-br ${item.c}`}
                    >
                      <div className="w-16 h-16 rounded-2xl bg-white/20 backdrop-blur-md flex items-center justify-center group-hover:rotate-6 transition-all">
                        {item.i}
                      </div>
                      <h3 className="text-4xl font-black tracking-tighter uppercase text-white italic flex-1 text-left">
                        {item.t}
                      </h3>
                      <ChevronRight className="w-8 h-8 text-white/50 group-hover:translate-x-2 transition-all" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Right Column: Leaderboard */}
              <div className="lg:col-span-7 bg-[#0c0c0e]/50 backdrop-blur-3xl border border-white/[0.06] rounded-[3.5rem] p-10 flex flex-col h-[600px] shadow-2xl relative overflow-hidden">
                 <div className="flex items-center justify-between mb-8">
                    <div className="flex items-center gap-4">
                       <div className="w-12 h-12 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                          <Trophy className="w-6 h-6" />
                       </div>
                       <h2 className="text-3xl font-black uppercase italic tracking-tighter">Всемирный рейтинг</h2>
                    </div>
                    <div className="flex gap-1 bg-white/[0.03] p-1 rounded-xl border border-white/[0.06]">
                      {['all', 'film', 'serial'].map(m => (
                          <button key={m} onClick={() => setLbMode(m)} className={`px-5 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${lbMode === m ? 'bg-amber-500 text-black' : 'text-neutral-500 hover:text-neutral-300'}`}>
                            {m === 'all' ? 'КОМБО' : m === 'film' ? 'ФИЛЬМЫ' : 'СЕРИАЛЫ'}
                          </button>
                      ))}
                    </div>
                 </div>

                 <div className="flex-1 space-y-3 overflow-y-auto pr-2 custom-scrollbar">
                    {leaderboard.map((p, i) => (
                        <div key={i} className="flex items-center gap-6 p-6 rounded-3xl bg-white/[0.02] border border-white/[0.04] hover:bg-white/[0.06] transition-all">
                          <div className={`w-8 text-3xl font-black italic ${i < 3 ? 'text-amber-400' : 'text-neutral-700'}`}>#{i+1}</div>
                          <img src={p.avatar} className="w-16 h-16 rounded-2xl border border-white/10" alt="" />
                          <div className="flex-1">
                              <p className="text-xl font-black tracking-tight">{p.username}</p>
                              <p className="text-[10px] text-neutral-500 uppercase font-black leading-none mt-1">{p.mode.replace('emojino_', '')}</p>
                          </div>
                          <div className="text-4xl font-black italic text-amber-400 truncate">{p.score}</div>
                        </div>
                    ))}
                 </div>
              </div>
            </motion.div>
          )}

          {screen === 'game' && gameMovies[currentIndex] && (
            <motion.div 
              key="game" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-2xl flex flex-col gap-6"
            >
              <div className="relative aspect-[21/9] rounded-[3rem] overflow-hidden border border-white/10 shadow-2xl bg-white/[0.02] backdrop-blur-xl flex items-center justify-center p-10">
                 <div className="absolute inset-0 bg-gradient-to-br from-amber-500/10 via-transparent to-rose-500/10 opacity-40" />
                 
                 {/* Emojis in ONE line */}
                 <div 
                    className="relative z-10 text-5xl sm:text-6xl md:text-7xl flex items-center justify-center gap-4 flex-nowrap whitespace-nowrap overflow-hidden"
                    style={{ fontFamily: '"Twemoji Mozilla", "Apple Color Emoji", "Segoe UI Emoji", "Noto Color Emoji", sans-serif' }}
                 >
                    {Array.from(gameMovies[currentIndex].emoji).map((char, i) => (
                      <motion.span key={i} initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: i * 0.05 }}>
                        {char}
                      </motion.span>
                    ))}
                 </div>
                 
                 <div className="absolute top-6 left-6 z-20">
                    <span className="px-4 py-2 rounded-2xl bg-black/60 backdrop-blur-md border border-white/10 text-[10px] font-black uppercase tracking-widest">
                      {gameMovies[currentIndex].type === 'film' ? 'Фильм' : 'Сериал'} • {gameMovies[currentIndex].year}
                    </span>
                 </div>

                 {!state.guessed && (
                    <div className="absolute top-6 right-6">
                       <div className="bg-amber-500 text-black px-5 py-3 rounded-2xl font-black text-2xl shadow-xl shadow-amber-500/30">
                          +{SCORE_FOR_HINTS[state.hintsUsed]}
                       </div>
                    </div>
                 )}
              </div>

              {/* Hints used 1 starts from index 1 in the data list (original hints[0] is year) */}
              <AnimatePresence>
                {state.hintsUsed > 0 && !state.guessed && (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
                    className="p-5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 text-sm font-black text-center uppercase tracking-widest italic"
                  >
                    💡 {gameMovies[currentIndex].hints.slice(1, state.hintsUsed + 1).join(' • ')}
                  </motion.div>
                )}
              </AnimatePresence>

              {!state.guessed ? (
                <div className="space-y-4">
                   <div className="relative group">
                      <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none">
                        <Search className="w-6 h-6 text-white/20 group-focus-within:text-amber-400 transition-colors" />
                      </div>
                      <input 
                        className="w-full h-20 pl-16 pr-8 bg-white/[0.03] border border-white/10 rounded-3xl focus:outline-none focus:border-amber-500/50 focus:ring-4 focus:ring-amber-500/10 text-xl font-bold transition-all placeholder:text-white/10"
                        placeholder="Назови проект..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleGuess()}
                        onFocus={() => suggestions.length > 0 && setShowSuggestions(true)}
                        onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                      />
                   </div>

                   <div className="grid grid-cols-4 gap-3">
                      <button onClick={useHint} disabled={state.hintsUsed >= 2} className="h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-neutral-400 hover:text-white transition-all disabled:opacity-20">
                         <Lightbulb className="w-6 h-6 mb-1" />
                         <span className="text-[9px] uppercase font-black">ПОДСКАЗКА</span>
                      </button>
                      <button onClick={handleSkip} className="h-20 rounded-3xl bg-white/[0.03] border border-white/10 flex flex-col items-center justify-center text-neutral-400 hover:text-white transition-all">
                         <SkipForward className="w-6 h-6 mb-1" />
                         <span className="text-[9px] uppercase font-black">СКИП</span>
                      </button>
                      <button onClick={() => handleGuess()} className="col-span-2 h-20 rounded-3xl bg-amber-500 text-black flex items-center justify-center gap-3 font-black text-lg hover:bg-amber-400 shadow-xl shadow-amber-500/20 active:scale-95">
                         <Sparkles className="w-6 h-6" /> УГАДАТЬ
                      </button>
                   </div>
                </div>
              ) : (
                <div className="flex flex-col gap-4">
                   <div className={`p-6 rounded-[2.5rem] border ${state.correct ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-rose-500/10 border-rose-500/20'} flex items-center justify-between`}>
                      <div className="flex items-center gap-5">
                         <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${state.correct ? 'bg-emerald-500/20 text-emerald-400' : 'bg-rose-500/20 text-rose-400'}`}>
                            {state.correct ? <Check className="w-7 h-7" /> : <X className="w-7 h-7" />}
                         </div>
                         <div>
                             <p className={`text-[10px] font-black uppercase tracking-widest mb-1 ${state.correct ? 'text-emerald-400' : 'text-rose-400'}`}>
                               {state.correct ? 'Верно!' : 'Правильный ответ:'}
                            </p>
                            <p className="text-2xl font-black italic">{gameMovies[currentIndex]?.title_ru || '---'}</p>
                         </div>
                      </div>
                      <div className="text-right">
                         <p className="text-[10px] text-white/40 uppercase font-black leading-none">Баллы</p>
                         <p className="text-4xl font-black text-amber-400 mt-1">+{state.score}</p>
                      </div>
                   </div>
                   <Button className="w-full h-20 text-xl font-black rounded-[2rem] bg-white text-black hover:bg-neutral-200" onClick={nextMovie}>
                     СЛЕДУЮЩИЙ <ChevronRight className="w-6 h-6 ml-2" />
                   </Button>
                </div>
              )}
            </motion.div>
          )}

          {screen === 'result' && (
            <motion.div key="result" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="text-center space-y-10 max-w-sm w-full">
              <Trophy className="w-28 h-28 text-yellow-500 mx-auto drop-shadow-2xl" />
              <div className="space-y-2">
                <h2 className="text-5xl font-black italic uppercase tracking-tighter">Финиш!</h2>
                <p className="text-neutral-500 font-bold uppercase tracking-widest text-xs">Твой результат за 10 раундов</p>
              </div>
              <div className="p-12 rounded-[3.5rem] bg-white/[0.03] border border-white/10 shadow-2xl relative overflow-hidden">
                 <p className="text-amber-500 font-black text-[10px] uppercase tracking-[0.4em] mb-4">Набрано очков</p>
                 <h3 className="text-8xl font-black italic">{state.totalScore}</h3>
              </div>
              <div className="flex flex-col gap-4">
                 <Button className="w-full h-20 rounded-3xl bg-amber-500 text-black font-black text-lg hover:bg-amber-400" onClick={() => startNewGame(state.mode)}>
                   ИГРАТЬ ЕЩЕ <RefreshCw className="w-6 h-6 ml-3" />
                 </Button>
                 <Button variant="ghost" className="w-full h-16 rounded-3xl text-neutral-500 hover:text-white" onClick={() => setScreen('home')}>
                   ГЛАВНОЕ МЕНЮ
                 </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      <footer className="relative z-10 border-t border-white/[0.06] py-6 px-10 bg-black/50 backdrop-blur-md">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
          <a href="https://t.me/paracetamolhaze" target="_blank" className="flex items-center gap-3 group">
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Powered by</span>
            <span className="text-sm font-black italic tracking-tighter bg-gradient-to-r from-amber-400 to-red-500 bg-clip-text text-transparent">PARACETAMOLHAZE</span>
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
