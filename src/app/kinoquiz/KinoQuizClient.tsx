'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Film, Tv, Sparkles, Trophy, Home, ChevronRight, 
  Search, X, Check, Clapperboard, Eye, Crown, LogIn, 
  Zap, Medal, Menu, User, Inbox, RefreshCw, Loader2, LogOut, 
  Clock, Send, Camera, MessageSquare, List
} from 'lucide-react';
import { Button } from '@/components/67/ui/button'; 
import { useSession, signIn } from '@/lib/67/authHook'; 

// ============ TYPES ============
interface Movie {
  id: string;
  title: string;
  title_ru: string;
  imageUrl: string;
  type: 'movie' | 'series' | 'anime';
  difficulty: 'easy' | 'medium' | 'hard';
  year?: number;
}

interface ParticipantScore {
  username: string;
  score: number;
}

type Screen = 'lobby' | 'game' | 'results';

export default function KinoQuizClient() {
  const { data: session } = useSession();
  const [screen, setScreen] = useState<Screen>('lobby');
  const [selectedType, setSelectedType] = useState<'movie' | 'series' | 'anime'>('movie');
  const [currentRound, setCurrentRound] = useState(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [scores, setScores] = useState<ParticipantScore[]>([]);
  const [timeLeft, setTimeLeft] = useState(30);
  const [guessInput, setGuessInput] = useState('');
  const [isRevealed, setIsRevealed] = useState(false);
  const [chatMessages, setChatMessages] = useState<{user: string, text: string}[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [streamerName, setStreamerName] = useState('');
  const [isConnected, setIsConnected] = useState(false);
  
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const roundWinners = useRef<Set<string>>(new Set());

  // Set streamer name from session
  useEffect(() => {
    if (session?.user?.name) {
      setStreamerName(session.user.name);
    }
  }, [session]);

  const startQuiz = async () => {
    setIsLoading(true);
    try {
      const res = await fetch(`/api/kinoquiz/rounds?type=${selectedType}`);
      const data = await res.json();
      if (data.movies) {
        setMovies(data.movies);
        setScores([]);
        setScreen('game');
        setCurrentRound(0);
        connectToTwitch();
        startRound(data.movies[0]);
      }
    } catch (e) {
      console.error(e);
    }
    setIsLoading(false);
  };

  const connectToTwitch = () => {
    if (wsRef.current) wsRef.current.close();
    
    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send('PASS SCHMOOPIIE');
      ws.send('NICK justinfan' + Math.floor(Math.random() * 90000 + 10000));
      ws.send('JOIN #' + streamerName.toLowerCase().trim());
      setIsConnected(true);
    };

    ws.onmessage = (e) => {
      const lines = e.data.split('\r\n');
      lines.forEach((line: string) => {
        if (!line) return;
        if (line.startsWith('PING')) { ws.send('PONG :tmi.twitch.tv'); return; }
        
        const m = line.match(/:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)$/);
        if (!m) return;
        const user = m[1].toLowerCase();
        const textRaw = m[2].trim();
        const text = textRaw.toLowerCase();
        
        setChatMessages(prev => [...prev.slice(-20), { user: m[1], text: textRaw }]);
        
        // Check answer
        if (screen === 'game' && !isRevealed && movies[currentRound]) {
          const current = movies[currentRound];
          const isCorrect = 
            text === current.title.toLowerCase() || 
            text === current.title_ru.toLowerCase();

          if (isCorrect && !roundWinners.current.has(user)) {
            roundWinners.current.add(user);
            handleSubscriberAnswer(m[1], timeLeft);
          }
        }
      });
    };
  };

  const handleSubscriberAnswer = (username: string, points: number) => {
    setScores(prev => {
      const existing = prev.find(s => s.username === username);
      if (existing) {
        return prev.map(s => s.username === username ? { ...s, score: s.score + points } : s)
          .sort((a, b) => b.score - a.score);
      }
      return [...prev, { username, score: points }].sort((a, b) => b.score - a.score);
    });
  };

  const startRound = (movie?: Movie) => {
    setTimeLeft(30);
    setIsRevealed(false);
    setGuessInput('');
    roundWinners.current = new Set();
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          revealAnswer();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const revealAnswer = () => {
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRevealed(true);
    
    // Auto next after 5 seconds
    setTimeout(() => {
      handleNext();
    }, 5000);
  };

  const handleNext = () => {
    setCurrentRound(prev => {
      if (prev < 29 && movies[prev + 1]) {
        startRound(movies[prev + 1]);
        return prev + 1;
      } else {
        setScreen('results');
        if (wsRef.current) wsRef.current.close();
        return prev;
      }
    });
  };

  const handleManualGuess = () => {
    if (isRevealed) return;
    const current = movies[currentRound];
    if (guessInput.toLowerCase() === current.title.toLowerCase() || guessInput.toLowerCase() === current.title_ru.toLowerCase()) {
      revealAnswer();
    }
    setGuessInput('');
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white overflow-hidden flex flex-col font-sans selection:bg-cyan-500/30">
      {/* Background Decor */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-20%] left-[-10%] w-[800px] h-[800px] rounded-full bg-cyan-600/[0.05] blur-[150px] animate-pulse" />
        <div className="absolute bottom-[-15%] right-[-10%] w-[900px] h-[900px] rounded-full bg-purple-700/[0.04] blur-[180px]" />
      </div>

      {/* Header */}
      <header className="relative z-50 border-b border-white/[0.05] backdrop-blur-md bg-black/40">
        <div className="max-w-[1800px] mx-auto px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-blue-600 flex items-center justify-center shadow-lg shadow-cyan-500/20">
                <Clapperboard className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-xl font-black tracking-tighter uppercase italic">KinoQuiz</h1>
            </div>
            
            {screen === 'game' && movies[currentRound] && (
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/[0.05] border border-white/10">
                  <span className="text-[10px] font-black text-white/30 tracking-widest uppercase">Round</span>
                  <span className="text-sm font-black text-white">{currentRound + 1} <span className="text-white/20">/</span> 30</span>
                </div>
                <div className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/20">
                  <span className="text-[10px] font-black text-cyan-500/50 tracking-widest uppercase">Difficulty</span>
                  <span className={`text-sm font-black ${
                    movies[currentRound].difficulty === 'easy' ? 'text-emerald-400' :
                    movies[currentRound].difficulty === 'medium' ? 'text-orange-400' : 'text-rose-400'
                  } uppercase`}>
                    {movies[currentRound].difficulty}
                  </span>
                </div>
              </div>
            )}
          </div>

          <div className="flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
            {session ? (
              <div className="flex items-center gap-3 px-4 py-2 rounded-2xl bg-white/5 border border-white/10">
                 <img src={session.user?.image || ''} className="w-8 h-8 rounded-full border border-white/10" alt="" />
                 <span className="text-xs font-bold">{session.user?.name}</span>
              </div>
            ) : (
              <Button 
                onClick={() => signIn('kinoquiz')} 
                className="bg-[#9146FF] hover:bg-[#7c3aed] rounded-xl h-10 font-bold"
              >
                Вход Twitch
              </Button>
            )}
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 relative z-10 p-6 flex items-center justify-center overflow-hidden">
        <AnimatePresence mode="wait">
          {screen === 'lobby' && (
            <motion.div 
              key="lobby"
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-4xl text-center space-y-12"
            >
              <div className="space-y-4">
                <h2 className="text-8xl font-black italic uppercase tracking-tighter leading-none">
                  <span className="text-white">КИНО</span>
                  <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">КВИЗ</span>
                </h2>
                <p className="text-neutral-500 font-bold uppercase tracking-widest">Интерактив со зрителями Твича</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {[
                  { id: 'movie', label: 'ФИЛЬМЫ', icon: Film, color: 'from-orange-500 to-red-600' },
                  { id: 'series', label: 'СЕРИАЛЫ', icon: Tv, color: 'from-purple-500 to-indigo-600' },
                  { id: 'anime', label: 'АНИМЕ', icon: Sparkles, color: 'from-pink-500 to-rose-600' },
                ].map((m) => (
                  <button
                    key={m.id}
                    onClick={() => setSelectedType(m.id as any)}
                    className={`group relative h-48 rounded-[2.5rem] border transition-all overflow-hidden ${
                      selectedType === m.id 
                        ? `bg-gradient-to-br ${m.color} border-white/20 scale-105 shadow-2xl` 
                        : 'bg-white/[0.02] border-white/5 hover:border-white/10'
                    }`}
                  >
                    <div className="absolute inset-0 bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity" />
                    <div className="relative h-full flex flex-col items-center justify-center gap-4">
                      <m.icon className={`w-12 h-12 ${selectedType === m.id ? 'text-white' : 'text-neutral-500'}`} />
                      <span className={`text-2xl font-black italic ${selectedType === m.id ? 'text-white' : 'text-neutral-400'}`}>{m.label}</span>
                    </div>
                  </button>
                ))}
              </div>

              <div className="max-w-md mx-auto space-y-4">
                {session ? (
                  <div className="space-y-6">
                    <div className="flex flex-col items-center gap-2">
                      <div className="px-6 py-3 rounded-2xl bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 font-black uppercase italic tracking-widest text-xs">
                        Активный стример: {session.user?.name}
                      </div>
                    </div>
                    <Button 
                      onClick={startQuiz}
                      disabled={isLoading}
                      className="w-full h-24 rounded-[2.5rem] bg-white text-black text-4xl font-black uppercase italic hover:bg-neutral-200 transition-all shadow-[0_0_50px_rgba(255,255,255,0.1)] disabled:opacity-50"
                    >
                      {isLoading ? <Loader2 className="animate-spin w-8 h-8" /> : 'Начать игру'}
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <p className="text-white/40 font-bold uppercase tracking-widest text-sm">Для начала игры необходимо авторизоваться</p>
                    <Button 
                      onClick={() => signIn('kinoquiz')}
                      className="w-full h-20 rounded-[2rem] bg-[#9146FF] text-white text-2xl font-black uppercase italic hover:bg-[#7c3aed] transition-all shadow-2xl shadow-purple-500/20"
                    >
                      Войти через Twitch
                    </Button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {screen === 'game' && movies[currentRound] && (
            <motion.div 
              key="game"
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              className="w-full max-w-[1700px] h-full flex gap-6"
            >
              {/* Left Side: Game + Input */}
              <div className="flex-1 flex flex-col gap-6 h-full">
                {/* Image Container */}
                <div className="flex-1 relative rounded-[3rem] overflow-hidden border border-white/10 bg-black shadow-2xl group">
                   {/* Background Blur */}
                   <img 
                    src={movies[currentRound].imageUrl} 
                    className="absolute inset-0 w-full h-full object-cover blur-3xl opacity-20 scale-110" 
                    alt="" 
                   />
                   
                   {/* Main Image */}
                   <div className="absolute inset-0 flex items-center justify-center p-8">
                      <img 
                        src={movies[currentRound].imageUrl} 
                        className={`max-w-full max-h-full rounded-2xl shadow-2xl transition-all duration-1000 ${
                          !isRevealed ? 'blur-md brightness-[0.4]' : 'blur-0 brightness-100'
                        }`}
                        alt="Quiz Frame"
                      />
                   </div>

                   {/* Answer Overlay */}
                   <AnimatePresence>
                     {isRevealed && (
                       <motion.div 
                        initial={{ opacity: 0, y: 50 }} animate={{ opacity: 1, y: 0 }}
                        className="absolute inset-x-0 bottom-12 flex justify-center z-30"
                       >
                          <div className="bg-white text-black px-10 py-6 rounded-[2.5rem] shadow-2xl border-4 border-cyan-500 text-center">
                             <p className="text-[10px] font-black uppercase tracking-[0.3em] mb-1 opacity-50">Верный ответ</p>
                             <h3 className="text-4xl font-black italic uppercase leading-none">{movies[currentRound].title_ru}</h3>
                             <p className="text-[10px] font-bold mt-2 opacity-40 uppercase tracking-widest">{movies[currentRound].title} • {movies[currentRound].year}</p>
                          </div>
                       </motion.div>
                     )}
                   </AnimatePresence>

                   {/* Timer */}
                   <div className="absolute top-8 right-8 z-30">
                      <div className="relative w-24 h-24 flex items-center justify-center bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                         <svg className="absolute inset-0 w-full h-full -rotate-90">
                           <circle 
                            cx="48" cy="48" r="44" fill="none" stroke="white" strokeWidth="2" strokeOpacity="0.05"
                           />
                           <circle 
                            cx="48" cy="48" r="44" fill="none" 
                            stroke={timeLeft > 5 ? '#22d3ee' : '#f43f5e'} 
                            strokeWidth="4" 
                            strokeDasharray={276}
                            strokeDashoffset={276 - (276 * timeLeft) / 30}
                            className="transition-all duration-1000 ease-linear"
                           />
                         </svg>
                         <div className="text-center">
                            <span className={`text-3xl font-black block leading-none ${timeLeft > 5 ? 'text-white' : 'text-rose-500 animate-pulse'}`}>
                              {timeLeft}
                            </span>
                            <span className="text-[8px] font-black uppercase tracking-widest text-white/20">сек</span>
                         </div>
                      </div>
                   </div>
                </div>

                {/* Input Bar */}
                <div className="h-24 bg-white/[0.03] border border-white/10 rounded-[2.5rem] p-3 flex gap-4 items-center backdrop-blur-xl">
                   <div className="flex-1 relative h-full">
                      <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-6 h-6 text-white/20" />
                      <input 
                        className="w-full h-full bg-white/[0.05] border border-white/10 rounded-2xl pl-16 pr-6 text-xl font-bold focus:outline-none focus:border-cyan-500/50 transition-all placeholder:text-white/10"
                        placeholder="Введите название фильма..."
                        value={guessInput}
                        onChange={(e) => setGuessInput(e.target.value)}
                        onKeyDown={(e) => e.key === 'Enter' && handleManualGuess()}
                      />
                   </div>
                   <Button 
                    onClick={handleManualGuess}
                    className="h-full px-12 rounded-2xl bg-cyan-500 text-black font-black text-lg hover:bg-cyan-400 transition-all shadow-lg shadow-cyan-500/20"
                   >
                     ОТПРАВИТЬ
                   </Button>
                </div>
              </div>

              {/* Right Side: Chat + Cam + Leaderboard */}
              <div className="w-[450px] flex flex-col gap-6">
                {/* Webcam Space */}
                <div className="aspect-video bg-white/[0.02] border border-white/10 rounded-[2.5rem] flex flex-col items-center justify-center gap-2 text-white/10 uppercase font-black tracking-widest text-[9px] relative overflow-hidden group">
                   <div className="absolute inset-0 bg-gradient-to-tr from-cyan-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                   <Camera className="w-8 h-8 opacity-20" />
                   КРУТИ ВЕБКУ СЮДА
                </div>

                {/* Leaderboard */}
                <div className="flex-1 bg-[#0c0c0e]/80 backdrop-blur-xl border border-white/10 rounded-[3rem] flex flex-col overflow-hidden shadow-2xl">
                   <div className="p-8 border-b border-white/5 flex items-center justify-between bg-white/[0.02]">
                      <div className="flex items-center gap-3">
                         <div className="w-10 h-10 rounded-xl bg-yellow-500/10 flex items-center justify-center text-yellow-500">
                            <Trophy className="w-5 h-5" />
                         </div>
                         <h3 className="text-xl font-black uppercase tracking-tight italic">Лидерборд</h3>
                      </div>
                      <Badge className="bg-cyan-500/10 text-cyan-500 border-cyan-500/20 text-[10px] animate-pulse">LIVE</Badge>
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-3 custom-scrollbar">
                      {scores.length > 0 ? scores.map((s, i) => (
                        <div key={i} className="flex items-center justify-between p-5 rounded-3xl bg-white/[0.03] border border-white/5 hover:bg-white/[0.05] transition-all group">
                           <div className="flex items-center gap-4">
                              <span className={`text-xl font-black italic w-8 ${i === 0 ? 'text-yellow-400' : i === 1 ? 'text-neutral-400' : i === 2 ? 'text-orange-500' : 'text-neutral-700'}`}>
                                {i + 1}
                              </span>
                              <div className="font-bold text-lg truncate max-w-[180px] group-hover:text-cyan-400 transition-colors">{s.username}</div>
                           </div>
                           <div className="flex items-center gap-2">
                              <span className="text-2xl font-black text-white">{s.score}</span>
                              <span className="text-[10px] font-black text-white/20 uppercase tracking-widest">pts</span>
                           </div>
                        </div>
                      )) : (
                        <div className="h-full flex flex-col items-center justify-center opacity-10 space-y-4">
                           <List className="w-10 h-10" />
                           <p className="text-[10px] font-black uppercase tracking-[0.3em] italic">Ожидание ответов...</p>
                        </div>
                      )}
                   </div>
                </div>

                {/* Twitch Chat Integration */}
                <div className="h-[350px] bg-black/60 border border-white/10 rounded-[3rem] flex flex-col overflow-hidden relative group">
                   <div className="absolute inset-0 bg-[#9146FF]/5 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                   <div className="p-5 border-b border-white/5 flex items-center justify-between bg-[#9146FF]/10 backdrop-blur-md">
                      <div className="flex items-center gap-3">
                         <MessageSquare className="w-4 h-4 text-[#9146FF]" />
                         <span className="text-[11px] font-black uppercase tracking-widest text-[#9146FF]">Live Chat</span>
                      </div>
                      <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500 shadow-[0_0_10px_#10b981]' : 'bg-rose-500'}`} />
                   </div>
                   <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar flex flex-col-reverse">
                      {chatMessages.slice().reverse().map((m, i) => (
                        <div key={i} className="text-sm message-appear">
                           <span className="font-black text-[#9146FF] mr-2">{m.user}:</span>
                           <span className="text-white/90 font-medium">{m.text}</span>
                        </div>
                      ))}
                   </div>
                </div>
              </div>
            </motion.div>
          )}

          {screen === 'results' && (
            <motion.div 
              key="results"
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              className="w-full max-w-4xl text-center space-y-12"
            >
              <div className="space-y-4">
                <div className="relative inline-block">
                  <Trophy className="w-32 h-32 text-yellow-500 mx-auto drop-shadow-[0_0_30px_rgba(234,179,8,0.3)]" />
                  <motion.div 
                    initial={{ scale: 0 }} animate={{ scale: 1 }} 
                    className="absolute -top-4 -right-4 bg-cyan-500 text-black w-12 h-12 rounded-full flex items-center justify-center font-black border-4 border-[#050505]"
                  >
                    <Crown className="w-6 h-6" />
                  </motion.div>
                </div>
                <h2 className="text-7xl font-black italic uppercase tracking-tighter leading-none">КВИЗ ЗАВЕРШЕН!</h2>
                <p className="text-neutral-500 font-bold uppercase tracking-[0.5em] text-sm">ЧЕМПИОН ОПРЕДЕЛЕН</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-end max-w-4xl mx-auto pt-10">
                 {/* 2nd Place */}
                 <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center gap-4 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="w-16 h-16 rounded-2xl bg-neutral-800 flex items-center justify-center text-neutral-400 font-black text-2xl">2</div>
                       <span className="text-xl font-black truncate w-full group-hover:text-cyan-400 transition-colors uppercase italic">{scores[1]?.username || '---'}</span>
                       <span className="text-5xl font-black text-white/50">{scores[1]?.score || 0}</span>
                    </div>
                 </div>
                 
                 {/* 1st Place */}
                 <div className="space-y-6 scale-110">
                    <div className="bg-gradient-to-br from-cyan-500 to-blue-700 rounded-[3.5rem] p-10 flex flex-col items-center gap-6 shadow-[0_0_50px_rgba(6,182,212,0.3)] relative overflow-hidden group">
                       <div className="absolute inset-0 bg-white/10 opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
                       <Crown className="w-16 h-16 text-white drop-shadow-lg" />
                       <span className="text-3xl font-black truncate w-full uppercase italic leading-none">{scores[0]?.username || '---'}</span>
                       <span className="text-7xl font-black leading-none">{scores[0]?.score || 0}</span>
                    </div>
                    <span className="text-4xl font-black text-cyan-400 uppercase italic tracking-widest">CHAMPION</span>
                 </div>

                 {/* 3rd Place */}
                 <div className="space-y-6">
                    <div className="bg-white/5 border border-white/10 rounded-[3rem] p-8 flex flex-col items-center gap-4 relative overflow-hidden group">
                       <div className="absolute inset-0 bg-white/[0.02] opacity-0 group-hover:opacity-100 transition-opacity" />
                       <div className="w-16 h-16 rounded-2xl bg-neutral-900 flex items-center justify-center text-orange-900 font-black text-2xl">3</div>
                       <span className="text-xl font-black truncate w-full group-hover:text-orange-500 transition-colors uppercase italic">{scores[2]?.username || '---'}</span>
                       <span className="text-4xl font-black text-white/30">{scores[2]?.score || 0}</span>
                    </div>
                 </div>
              </div>

              <div className="flex gap-6 max-w-xl mx-auto pt-10">
                <Button onClick={() => setScreen('lobby')} className="flex-1 h-20 rounded-[2rem] bg-white text-black font-black text-xl hover:bg-neutral-200 shadow-xl transition-all">
                  В МЕНЮ
                </Button>
                <Button onClick={startQuiz} className="flex-1 h-20 rounded-[2rem] border-2 border-white/10 bg-white/5 text-white font-black text-xl hover:bg-white/10 transition-all backdrop-blur-md">
                  ИГРАТЬ СНОВА
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer */}
      <footer className="relative z-50 border-t border-white/[0.05] py-6 px-10 bg-black/40 backdrop-blur-md flex items-center justify-between">
         <div className="flex items-center gap-3 opacity-30 group cursor-default">
            <span className="text-[11px] font-black uppercase tracking-[0.3em] group-hover:text-cyan-400 transition-colors">KinoQuiz PRO</span>
            <div className="w-1 h-1 rounded-full bg-cyan-500 group-hover:animate-ping" />
            <span className="text-[11px] font-black uppercase tracking-[0.3em] group-hover:text-white transition-colors">By ParacetamolHaze</span>
         </div>
         <div className="flex items-center gap-10">
            <button className="text-[10px] font-black text-white/20 hover:text-cyan-400 uppercase tracking-[0.3em] transition-all">Правила</button>
            <button className="text-[10px] font-black text-white/20 hover:text-cyan-400 uppercase tracking-[0.3em] transition-all">База данных</button>
            <button className="text-[10px] font-black text-white/20 hover:text-cyan-400 uppercase tracking-[0.3em] transition-all">Поддержка</button>
         </div>
      </footer>
    </div>
  );
}
