'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  Clock3,
  Crown,
  Film,
  List,
  Loader2,
  Sparkles,
  Trophy,
  Tv,
  Volume2
} from 'lucide-react';
import { Button } from '@/components/67/ui/button';
import { AuthProvider, signIn, signOut, useSession } from '@/lib/67/authHook';

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

interface ChatMessage {
  user: string;
  text: string;
  isCorrect: boolean;
  source: 'chat' | 'streamer';
}

interface RoundWinner {
  username: string;
  answerRu: string;
  answerOriginal: string;
  submittedAnswer: string;
}

type Screen = 'lobby' | 'game' | 'results';

const ROUND_TIME_OPTIONS = [30, 60, 90, 120] as const;
const ROUND_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

const modeOptions: Array<{ id: Movie['type']; label: string; Icon: typeof Film; palette: string }> = [
  { id: 'movie', label: 'ФИЛЬМЫ', Icon: Film, palette: 'from-[#ff8b66] to-[#ff5f67]' },
  { id: 'series', label: 'СЕРИАЛЫ', Icon: Tv, palette: 'from-[#8a7fff] to-[#5a6bf6]' },
  { id: 'anime', label: 'АНИМЕ', Icon: Sparkles, palette: 'from-[#ff7db5] to-[#ff5f8d]' }
];

function shuffleMovies<T>(items: T[]) {
  return [...items].sort(() => Math.random() - 0.5);
}

function normalizeAnswer(value: string) {
  return value
    .toLowerCase()
    .replace(/ё/g, 'е')
    .replace(/[^\p{L}\p{N}\s]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function isCorrectAnswer(answer: string, movie: Movie) {
  const normalized = normalizeAnswer(answer);
  if (!normalized) return false;
  return normalized === normalizeAnswer(movie.title) || normalized === normalizeAnswer(movie.title_ru);
}

function KinoQuizContent() {
  const { data: session, status } = useSession();
  const isAuthLoading = status === 'loading';

  const [screen, setScreen] = useState<Screen>('lobby');
  const [selectedType, setSelectedType] = useState<Movie['type']>('movie');
  const [roundDuration, setRoundDuration] = useState<number>(90);
  const [roundsCount, setRoundsCount] = useState<number>(15);
  const [activeRoundDuration, setActiveRoundDuration] = useState<number>(90);
  const [activeRoundsCount, setActiveRoundsCount] = useState<number>(15);
  const [currentRound, setCurrentRound] = useState<number>(0);
  const [movies, setMovies] = useState<Movie[]>([]);
  const [scores, setScores] = useState<ParticipantScore[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(90);
  const [guessInput, setGuessInput] = useState<string>('');
  const [isRevealed, setIsRevealed] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [streamerName, setStreamerName] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [winnerModal, setWinnerModal] = useState<RoundWinner | null>(null);
  const [showWinnerModal, setShowWinnerModal] = useState<boolean>(false);
  const [attemptsInRound, setAttemptsInRound] = useState<number>(0);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const nextRoundTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);

  const screenRef = useRef<Screen>('lobby');
  const currentRoundRef = useRef<number>(0);
  const moviesRef = useRef<Movie[]>([]);
  const isRevealedRef = useRef<boolean>(false);
  const timeLeftRef = useRef<number>(90);
  const activeRoundsRef = useRef<number>(15);
  const activeRoundDurationRef = useRef<number>(90);

  const currentMovie = movies[currentRound];

  const timerPercent = useMemo(() => {
    if (activeRoundDuration <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((timeLeft / activeRoundDuration) * 100)));
  }, [timeLeft, activeRoundDuration]);

  useEffect(() => {
    if (session?.user?.name) {
      setStreamerName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    screenRef.current = screen;
  }, [screen]);

  useEffect(() => {
    currentRoundRef.current = currentRound;
  }, [currentRound]);

  useEffect(() => {
    moviesRef.current = movies;
  }, [movies]);

  useEffect(() => {
    isRevealedRef.current = isRevealed;
  }, [isRevealed]);

  useEffect(() => {
    timeLeftRef.current = timeLeft;
  }, [timeLeft]);

  useEffect(() => {
    activeRoundsRef.current = activeRoundsCount;
  }, [activeRoundsCount]);

  useEffect(() => {
    activeRoundDurationRef.current = activeRoundDuration;
  }, [activeRoundDuration]);

  useEffect(() => {
    if (screen === 'lobby') {
      setTimeLeft(roundDuration);
      timeLeftRef.current = roundDuration;
    }
  }, [roundDuration, screen]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (nextRoundTimeoutRef.current) clearTimeout(nextRoundTimeoutRef.current);
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const clearRoundTimers = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (nextRoundTimeoutRef.current) {
      clearTimeout(nextRoundTimeoutRef.current);
      nextRoundTimeoutRef.current = null;
    }
  };

  const disconnectTwitch = () => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
    setIsConnected(false);
  };

  const handleSubscriberAnswer = (username: string, points: number) => {
    setScores(prev => {
      const existing = prev.find(s => s.username === username);
      if (existing) {
        return prev
          .map(s => (s.username === username ? { ...s, score: s.score + points } : s))
          .sort((a, b) => b.score - a.score);
      }
      return [...prev, { username, score: points }].sort((a, b) => b.score - a.score);
    });
  };

  const startRound = () => {
    const duration = activeRoundDurationRef.current;
    clearRoundTimers();
    setIsRevealed(false);
    isRevealedRef.current = false;
    setGuessInput('');
    setWinnerModal(null);
    setShowWinnerModal(false);
    setAttemptsInRound(0);
    setTimeLeft(duration);
    timeLeftRef.current = duration;

    timerRef.current = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRevealed(true);
          isRevealedRef.current = true;
          nextRoundTimeoutRef.current = setTimeout(() => {
            handleNext();
          }, 3600);
          return 0;
        }
        const next = prev - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
  };

  const handleNext = () => {
    const nextRound = currentRoundRef.current + 1;
    const hasNextRound = nextRound < activeRoundsRef.current && !!moviesRef.current[nextRound];
    if (hasNextRound) {
      setCurrentRound(nextRound);
      currentRoundRef.current = nextRound;
      startRound();
      return;
    }
    clearRoundTimers();
    disconnectTwitch();
    setScreen('results');
  };

  const handleCorrectAnswer = (username: string, submittedAnswer: string) => {
    if (isRevealedRef.current) return;
    const current = moviesRef.current[currentRoundRef.current];
    if (!current) return;

    clearRoundTimers();
    setIsRevealed(true);
    isRevealedRef.current = true;

    setWinnerModal({
      username,
      answerRu: current.title_ru,
      answerOriginal: current.title,
      submittedAnswer
    });
    setShowWinnerModal(true);

    handleSubscriberAnswer(username, Math.max(timeLeftRef.current, 1));

    nextRoundTimeoutRef.current = setTimeout(() => {
      setShowWinnerModal(false);
      handleNext();
    }, 3600);
  };

  const connectToTwitch = () => {
    if (!streamerName.trim()) return;
    disconnectTwitch();

    const ws = new WebSocket('wss://irc-ws.chat.twitch.tv:443');
    wsRef.current = ws;

    ws.onopen = () => {
      ws.send('PASS SCHMOOPIIE');
      ws.send('NICK justinfan' + Math.floor(Math.random() * 90000 + 10000));
      ws.send('JOIN #' + streamerName.toLowerCase().trim());
      setIsConnected(true);
    };

    ws.onclose = () => {
      setIsConnected(false);
    };

    ws.onerror = () => {
      setIsConnected(false);
    };

    ws.onmessage = e => {
      const lines = e.data.split('\r\n');
      lines.forEach((line: string) => {
        if (!line) return;
        if (line.startsWith('PING')) {
          ws.send('PONG :tmi.twitch.tv');
          return;
        }

        const match = line.match(/:([^!]+)![^ ]+ PRIVMSG #[^ ]+ :(.+)$/);
        if (!match) return;

        const user = match[1];
        const textRaw = match[2].trim();
        const current = moviesRef.current[currentRoundRef.current];
        const canAccept = screenRef.current === 'game' && !isRevealedRef.current && !!current;
        const isCorrect = canAccept && current ? isCorrectAnswer(textRaw, current) : false;

        if (canAccept) {
          setAttemptsInRound(prev => prev + 1);
        }

        setChatMessages(prev => [
          ...prev.slice(-79),
          { user, text: textRaw, isCorrect, source: 'chat' }
        ]);

        if (isCorrect) {
          handleCorrectAnswer(user, textRaw);
        }
      });
    };
  };

  const startQuiz = async () => {
    if (!streamerName.trim()) return;

    setIsLoading(true);
    try {
      const res = await fetch(`/api/kinoquiz/rounds?type=${selectedType}`);
      const data = await res.json();
      if (data.movies?.length) {
        const preparedMovies = shuffleMovies<Movie>(data.movies).slice(0, roundsCount);
        if (preparedMovies.length === 0) return;

        setActiveRoundDuration(roundDuration);
        activeRoundDurationRef.current = roundDuration;
        setActiveRoundsCount(preparedMovies.length);
        activeRoundsRef.current = preparedMovies.length;

        setMovies(preparedMovies);
        moviesRef.current = preparedMovies;
        setScores([]);
        setChatMessages([]);
        setWinnerModal(null);
        setShowWinnerModal(false);
        setCurrentRound(0);
        currentRoundRef.current = 0;
        setScreen('game');
        screenRef.current = 'game';
        connectToTwitch();
        startRound();
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleManualGuess = () => {
    if (isRevealedRef.current) return;
    const current = moviesRef.current[currentRoundRef.current];
    const input = guessInput.trim();
    if (!current || !input) return;

    const displayName = streamerName || 'Стример';
    const correct = isCorrectAnswer(input, current);
    setAttemptsInRound(prev => prev + 1);
    setChatMessages(prev => [
      ...prev.slice(-79),
      { user: displayName, text: input, isCorrect: correct, source: 'streamer' }
    ]);

    if (correct) {
      handleCorrectAnswer(displayName, input);
    }

    setGuessInput('');
  };

  const backToLobby = () => {
    clearRoundTimers();
    disconnectTwitch();
    setScreen('lobby');
    setShowWinnerModal(false);
    setWinnerModal(null);
    setIsRevealed(false);
    setCurrentRound(0);
  };

  const leftCardClass =
    'rounded-[28px] border-[4px] border-[#22388f] bg-[#eef4ff] shadow-[6px_6px_0_#1d2c72]';
  const noteFont = { fontFamily: "'Waffle Soft', sans-serif" };

  return (
    <div
      className="min-h-screen overflow-auto text-[#20388f] p-2 sm:p-3 md:p-5"
      style={{
        ...noteFont,
        background:
          'radial-gradient(circle at 20% 10%, #8d81ff 0%, #7165ef 28%, #5f55dd 55%, #5449cd 78%, #4a40c0 100%)'
      }}
    >
      <div
        className="pointer-events-none fixed inset-0 opacity-25"
        style={{
          backgroundImage:
            'repeating-linear-gradient(120deg, rgba(255,255,255,0.2) 0px, rgba(255,255,255,0.2) 2px, transparent 2px, transparent 22px)'
        }}
      />

      <div className="relative mx-auto max-w-[1780px] h-[calc(100vh-16px)] min-h-[860px] grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-4">
        <aside className="flex flex-col gap-4">
          {screen === 'lobby' && (
            <>
              <div className={`${leftCardClass} h-[250px] p-6 flex items-center justify-center`}>
                <div className="text-center">
                  <div className="text-[26px] sm:text-[34px] leading-none tracking-wide uppercase text-[#233a95] drop-shadow-[2px_2px_0_#f7ce4e]">
                    Kino
                  </div>
                  <div className="text-[46px] sm:text-[58px] leading-none tracking-wide uppercase text-[#1f318a] drop-shadow-[3px_3px_0_#ffce4e]">
                    SHOW
                  </div>
                  <p className="mt-3 text-[17px] tracking-wide text-[#3853bb]">Стрим-режим для чата Twitch</p>
                </div>
              </div>

              <div className={`${leftCardClass} flex-1 p-5`}>
                <p className="text-[24px] uppercase tracking-wide text-[#3048a8]">Чат зрителей</p>
                <div className="mt-4 h-[calc(100%-52px)] rounded-[20px] border-[3px] border-[#29439f] bg-white/70 p-4 text-[18px] text-[#4a62bd]">
                  Здесь будут ответы из Twitch-чата во время игры.
                </div>
              </div>

              <div className={`${leftCardClass} h-[265px] p-5`}>
                <p className="text-[24px] uppercase tracking-wide text-[#3048a8] text-center">Размести здесь свою камеру</p>
                <div className="mt-4 h-[165px] rounded-[20px] border-[3px] border-dashed border-[#3654bf] bg-[#e7efff] flex flex-col items-center justify-center gap-2">
                  <Camera className="w-12 h-12 text-[#3c56ba]" />
                  <span className="text-[18px] text-[#3a54b5]">Вебка стримера</span>
                </div>
              </div>
            </>
          )}

          {screen === 'game' && (
            <>
              <div className={`${leftCardClass} h-[280px] p-5 overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[28px] uppercase tracking-wide">Лидерборд</h3>
                  <div className={`h-3 w-3 rounded-full ${isConnected ? 'bg-[#31c364]' : 'bg-[#f05872]'}`} />
                </div>
                <div className="mt-3 h-[210px] rounded-[20px] border-[3px] border-[#2f47a6] bg-white/75 overflow-y-auto p-3 space-y-2">
                  {scores.length > 0 ? (
                    scores.map((item, index) => (
                      <div key={`${item.username}-${index}`} className="rounded-xl border-2 border-[#9fb6ff] bg-white px-3 py-2 flex items-center justify-between">
                        <span className="text-[18px] uppercase tracking-wide truncate max-w-[180px]">
                          {index + 1}. {item.username}
                        </span>
                        <span className="text-[20px]">{item.score}</span>
                      </div>
                    ))
                  ) : (
                    <div className="h-full flex flex-col items-center justify-center text-[#5067c1]">
                      <List className="w-7 h-7 mb-2" />
                      <p className="text-[20px]">Пока без очков</p>
                    </div>
                  )}
                </div>
              </div>

              <div className={`${leftCardClass} flex-1 p-5 overflow-hidden`}>
                <div className="flex items-center justify-between">
                  <h3 className="text-[28px] uppercase tracking-wide">Чат</h3>
                  <span className="text-[16px] uppercase tracking-wide text-[#4961ba]">{attemptsInRound} ответов</span>
                </div>
                <div className="mt-3 h-[calc(100%-52px)] rounded-[20px] border-[3px] border-[#2f47a6] bg-white/75 overflow-y-auto p-3 space-y-2 flex flex-col-reverse">
                  {chatMessages.length > 0 ? (
                    chatMessages
                      .slice()
                      .reverse()
                      .map((message, index) => (
                        <div
                          key={`${message.user}-${index}`}
                          className={`rounded-xl border-2 px-3 py-2 ${
                            message.isCorrect
                              ? 'border-[#4bbf7c] bg-[#def8e7]'
                              : message.source === 'streamer'
                                ? 'border-[#66b7ff] bg-[#e6f5ff]'
                                : 'border-[#a6baf9] bg-white'
                          }`}
                        >
                          <span className="text-[18px] text-[#2d45a2]">{message.user}:</span>{' '}
                          <span className="text-[18px] text-[#334da9]">{message.text}</span>
                        </div>
                      ))
                  ) : (
                    <div className="h-full flex items-center justify-center text-[#5067c1] text-[20px]">
                      Ожидание сообщений...
                    </div>
                  )}
                </div>
              </div>

              <div className={`${leftCardClass} h-[285px] p-5`}>
                <h3 className="text-[26px] uppercase tracking-wide text-center">Вебка и ответ стримера</h3>
                <div className="mt-3 h-[120px] rounded-[18px] border-[3px] border-dashed border-[#3654bf] bg-[#e7efff] flex flex-col items-center justify-center gap-2">
                  <Camera className="w-9 h-9 text-[#3c56ba]" />
                  <span className="text-[16px] text-[#3a54b5]">Место для камеры</span>
                </div>
                <div className="mt-3 flex gap-2 h-12">
                  <input
                    value={guessInput}
                    onChange={e => setGuessInput(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && handleManualGuess()}
                    className="flex-1 rounded-xl border-[3px] border-[#2e48a7] bg-white px-3 text-[18px] text-[#22409e] placeholder:text-[#7a8fd7] outline-none"
                    placeholder="Ответ стримера..."
                  />
                  <Button
                    onClick={handleManualGuess}
                    className="h-full rounded-xl bg-[#ff6588] hover:bg-[#ff5078] text-[#11265f] border-[3px] border-[#223c96] px-5 text-[18px] uppercase"
                  >
                    OK
                  </Button>
                </div>
              </div>
            </>
          )}

          {screen === 'results' && (
            <div className={`${leftCardClass} flex-1 p-6 flex flex-col items-center justify-center text-center`}>
              <Trophy className="w-20 h-20 text-[#f5b730]" />
              <h3 className="mt-4 text-[44px] uppercase leading-none">Финиш</h3>
              <p className="text-[22px] text-[#4360b8] mt-2">Раундов сыграно: {activeRoundsCount}</p>
              <p className="text-[22px] text-[#4360b8] mt-1">Чемпион: {scores[0]?.username || '---'}</p>
            </div>
          )}
        </aside>

        <section className="relative rounded-[36px] border-[5px] border-[#21388d] bg-[#f7fbff] shadow-[8px_8px_0_#1b2b72] overflow-hidden">
          <div className="absolute inset-5 rounded-[28px] border-[4px] border-[#9ec0ff] overflow-hidden bg-[#f6f9ff]">
            <div
              className="absolute inset-0"
              style={{
                backgroundImage:
                  'repeating-linear-gradient(90deg, rgba(214,228,255,0.9) 0px, rgba(214,228,255,0.9) 2px, transparent 2px, transparent 44px)'
              }}
            />
          </div>

          <div className="absolute -top-4 left-16 right-16 flex justify-between pointer-events-none">
            {Array.from({ length: 14 }).map((_, i) => (
              <div key={i} className="w-8 h-8 rounded-full border-[4px] border-[#253c95] bg-[#dce8ff]" />
            ))}
          </div>

          <div className="relative z-20 h-full px-8 py-6 flex flex-col">
            <div className="flex items-center justify-between">
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl border-[3px] border-[#2c479f] bg-white/70 text-[#2f49a9] hover:bg-white/90 px-3 h-11"
              >
                <Volume2 className="w-5 h-5" />
              </Button>

              {session ? (
                <div className="flex items-center gap-2 rounded-xl border-[3px] border-[#2e4ca9] bg-white/80 px-3 py-1.5">
                  <img src={session.user?.image || ''} alt="" className="w-8 h-8 rounded-full border-2 border-[#2f4ca8]" />
                  <span className="text-[20px] uppercase tracking-wide text-[#2845a4]">{session.user?.name}</span>
                </div>
              ) : (
                <Button
                  onClick={() => signIn('kinoquiz')}
                  className="rounded-xl h-11 bg-[#9146FF] hover:bg-[#7e37ea] border-[3px] border-[#243c95] text-white text-[20px] uppercase"
                >
                  Вход через Twitch
                </Button>
              )}
            </div>

            <AnimatePresence mode="wait">
              {screen === 'lobby' && (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="pt-4 flex-1 flex flex-col"
                >
                  <div className="text-center mb-4">
                    <p className="text-[30px] text-[#4662bc]">Журнал стримера</p>
                    <h1 className="text-[58px] leading-none uppercase text-[#1c348b] tracking-wide">
                      {streamerName || 'TIKTOKEVELONE888'}
                    </h1>
                  </div>

                  <div className="grid grid-cols-1 lg:grid-cols-[1.2fr_1fr] gap-6 flex-1">
                    <div className="space-y-5">
                      <div className="rounded-[20px] border-[4px] border-[#2d48a7] bg-white/75 p-4">
                        <p className="text-[20px] uppercase text-[#4360b8]">Канал Twitch (для чтения чата)</p>
                        <input
                          value={streamerName}
                          onChange={e => setStreamerName(e.target.value)}
                          className="mt-2 h-12 w-full rounded-xl border-[3px] border-[#2e49a8] bg-white px-3 text-[22px] uppercase tracking-wide text-[#213f9b] placeholder:text-[#7b8fd5] outline-none"
                          placeholder="Введите ник стримера"
                        />
                      </div>

                      <div className="rounded-[20px] border-[4px] border-[#2d48a7] bg-white/75 p-4">
                        <div className="flex items-center gap-2 text-[#3a58b4]">
                          <Film className="w-5 h-5" />
                          <p className="text-[22px] uppercase">Режим</p>
                        </div>
                        <div className="mt-3 grid grid-cols-1 sm:grid-cols-3 gap-2">
                          {modeOptions.map(option => (
                            <button
                              key={option.id}
                              onClick={() => setSelectedType(option.id)}
                              className={`rounded-xl border-[3px] px-2 py-3 transition ${
                                selectedType === option.id
                                  ? `bg-gradient-to-r ${option.palette} border-[#21398f] text-white`
                                  : 'border-[#2f4ba9] bg-white text-[#2f4ba9]'
                              }`}
                            >
                              <option.Icon className="w-5 h-5 mx-auto mb-1" />
                              <span className="text-[18px] uppercase tracking-wide">{option.label}</span>
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[20px] border-[4px] border-[#2d48a7] bg-white/75 p-4">
                        <div className="flex items-center gap-2 text-[#3a58b4]">
                          <Clock3 className="w-5 h-5" />
                          <p className="text-[22px] uppercase">Время на 1 раунд</p>
                        </div>
                        <div className="mt-3 grid grid-cols-4 gap-2">
                          {ROUND_TIME_OPTIONS.map(value => (
                            <button
                              key={value}
                              onClick={() => setRoundDuration(value)}
                              className={`h-11 rounded-xl border-[3px] text-[20px] uppercase transition ${
                                roundDuration === value
                                  ? 'border-[#1f3b95] bg-[#ffd856] text-[#1b2f7f]'
                                  : 'border-[#2f4ba9] bg-white text-[#2f4ba9]'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="rounded-[20px] border-[4px] border-[#2d48a7] bg-white/75 p-4">
                        <div className="flex items-center gap-2 text-[#3a58b4]">
                          <Trophy className="w-5 h-5" />
                          <p className="text-[22px] uppercase">Количество раундов</p>
                        </div>
                        <div className="mt-3 grid grid-cols-5 gap-2">
                          {ROUND_COUNT_OPTIONS.map(value => (
                            <button
                              key={value}
                              onClick={() => setRoundsCount(value)}
                              className={`h-11 rounded-xl border-[3px] text-[20px] uppercase transition ${
                                roundsCount === value
                                  ? 'border-[#1f3b95] bg-[#ffd856] text-[#1b2f7f]'
                                  : 'border-[#2f4ba9] bg-white text-[#2f4ba9]'
                              }`}
                            >
                              {value}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    <div className="rounded-[20px] border-[4px] border-[#2d48a7] bg-white/75 p-5">
                      <h2 className="text-[38px] uppercase leading-none text-center text-[#2f4dab]">Как играть</h2>
                      <div className="mt-4 space-y-3 text-[22px] text-[#3e5db8] leading-[1.15]">
                        <p>1. Включи игру и открой кадр на большом экране.</p>
                        <p>2. Зрители пишут ответы в Twitch-чат.</p>
                        <p>3. Сайт регистрирует ответы до правильного.</p>
                        <p>4. После правильного ответа показывается ник победителя и верный ответ.</p>
                        <p>5. Побеждает тот, кто набрал больше очков за раунды.</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-4">
                    {session ? (
                      <>
                        <Button
                          onClick={() => signOut('kinoquiz')}
                          className="sm:w-1/2 h-16 rounded-2xl border-[4px] border-[#21398f] bg-[#ff6f92] hover:bg-[#ff5d84] text-[#122c73] text-[34px] uppercase"
                        >
                          Разлогиниться
                        </Button>
                        <Button
                          onClick={startQuiz}
                          disabled={isLoading}
                          className="sm:w-1/2 h-16 rounded-2xl border-[4px] border-[#21398f] bg-[#ffd856] hover:bg-[#ffc93e] text-[#122c73] text-[38px] uppercase disabled:opacity-70"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Начать'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => signIn('kinoquiz')}
                        disabled={isAuthLoading}
                        className="w-full h-16 rounded-2xl border-[4px] border-[#21398f] bg-[#9146FF] hover:bg-[#7d38ea] text-white text-[34px] uppercase disabled:opacity-70"
                      >
                        {isAuthLoading ? 'Проверка...' : 'Войти через Twitch'}
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {screen === 'game' && currentMovie && (
                <motion.div
                  key="game"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="pt-4 flex-1 flex flex-col"
                >
                  <div className="flex flex-wrap items-center gap-3 mb-4">
                    <div className="rounded-xl border-[3px] border-[#2843a1] bg-white/85 px-3 py-1 text-[20px] uppercase text-[#2d49a6]">
                      Раунд {currentRound + 1}/{activeRoundsCount}
                    </div>
                    <div className="rounded-xl border-[3px] border-[#2843a1] bg-white/85 px-3 py-1 text-[20px] uppercase text-[#2d49a6]">
                      {selectedType === 'movie' ? 'Фильмы' : selectedType === 'series' ? 'Сериалы' : 'Аниме'}
                    </div>
                    <div className="rounded-xl border-[3px] border-[#2843a1] bg-white/85 px-3 py-1 text-[20px] uppercase text-[#2d49a6]">
                      {activeRoundDuration} сек
                    </div>
                    <div className="rounded-xl border-[3px] border-[#2843a1] bg-white/85 px-3 py-1 text-[20px] uppercase text-[#2d49a6]">
                      Сложность: {currentMovie.difficulty}
                    </div>
                  </div>

                  <div className="relative flex-1 rounded-[26px] border-[4px] border-[#223a94] bg-white/80 overflow-hidden">
                    <img
                      src={currentMovie.imageUrl}
                      alt=""
                      className="absolute inset-0 w-full h-full object-cover blur-[40px] opacity-30 scale-110"
                    />

                    <div className="absolute inset-0 p-6 flex items-center justify-center">
                      <img
                        src={currentMovie.imageUrl}
                        alt="Кадр"
                        className={`max-w-full max-h-full rounded-[18px] border-[4px] border-[#22398f] shadow-xl transition-all duration-700 ${
                          isRevealed ? 'blur-0 brightness-100' : 'blur-md brightness-50'
                        }`}
                      />
                    </div>

                    <div className="absolute top-4 right-4 w-28 h-28 rounded-full border-[4px] border-[#22398f] bg-white/90 flex flex-col items-center justify-center">
                      <span className={`text-[44px] leading-none ${timeLeft <= 5 ? 'text-[#f05f79]' : 'text-[#2e4ba8]'}`}>{timeLeft}</span>
                      <span className="text-[18px] uppercase text-[#4862ba]">сек</span>
                    </div>

                    <div className="absolute left-4 right-4 bottom-4 rounded-xl border-[3px] border-[#2c48a7] bg-white/90 p-2">
                      <div className="h-4 rounded-full border-2 border-[#3552b3] bg-[#dae5ff] overflow-hidden">
                        <div
                          className={`h-full ${timerPercent <= 20 ? 'bg-[#f06282]' : 'bg-[#5a7bed]'}`}
                          style={{ width: `${timerPercent}%` }}
                        />
                      </div>
                      <p className="mt-1 text-center text-[18px] text-[#425fb8] uppercase">
                        Ответы зрителей принимаются до первого правильного
                      </p>
                    </div>

                    <AnimatePresence>
                      {isRevealed && (
                        <motion.div
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: 12 }}
                          className="absolute left-1/2 -translate-x-1/2 bottom-14 w-[min(900px,90%)] rounded-2xl border-[4px] border-[#21409f] bg-[#fff4bf] p-4 text-center"
                        >
                          <p className="text-[18px] uppercase text-[#425fb8]">Верный ответ</p>
                          <h3 className="text-[42px] uppercase text-[#1d348b] leading-none">{currentMovie.title_ru}</h3>
                          <p className="text-[20px] text-[#4f67be] uppercase">{currentMovie.title} • {currentMovie.year || '-'}</p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </motion.div>
              )}

              {screen === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  className="pt-6 flex-1 flex flex-col items-center justify-center text-center"
                >
                  <Crown className="w-20 h-20 text-[#f5b730]" />
                  <h2 className="mt-2 text-[64px] uppercase leading-none text-[#1d348b]">Игра завершена</h2>
                  <p className="text-[28px] text-[#4561ba] uppercase">Сыграно {activeRoundsCount} раундов</p>

                  <div className="mt-6 w-full max-w-[760px] rounded-[24px] border-[4px] border-[#2a47a6] bg-white/80 p-5 space-y-2">
                    {scores.slice(0, 3).map((item, index) => (
                      <div
                        key={`${item.username}-${index}`}
                        className="rounded-xl border-[3px] border-[#9fb6ff] bg-white px-4 py-2 flex items-center justify-between"
                      >
                        <span className="text-[28px] uppercase">{index + 1}. {item.username}</span>
                        <span className="text-[30px]">{item.score}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-6 flex flex-col sm:flex-row gap-4 w-full max-w-[760px]">
                    <Button
                      onClick={backToLobby}
                      className="sm:w-1/2 h-16 rounded-2xl border-[4px] border-[#21398f] bg-[#ff6f92] hover:bg-[#ff5d84] text-[#122c73] text-[34px] uppercase"
                    >
                      В меню
                    </Button>
                    <Button
                      onClick={startQuiz}
                      className="sm:w-1/2 h-16 rounded-2xl border-[4px] border-[#21398f] bg-[#ffd856] hover:bg-[#ffc93e] text-[#122c73] text-[34px] uppercase"
                    >
                      Играть снова
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </section>
      </div>

      <AnimatePresence>
        {showWinnerModal && winnerModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] bg-black/45 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.92, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.92, y: 10 }}
              className="w-full max-w-[760px] rounded-[30px] border-[5px] border-[#233d99] bg-[#fff6cb] shadow-[8px_8px_0_#1b2d74] p-7 text-center"
              style={noteFont}
            >
              <p className="text-[24px] uppercase text-[#4d63bc]">Правильный ответ</p>
              <h3 className="text-[62px] leading-none uppercase text-[#1f378f]">{winnerModal.answerRu}</h3>
              <p className="text-[26px] uppercase text-[#4b63ba] mt-1">{winnerModal.answerOriginal}</p>

              <div className="mt-5 rounded-[20px] border-[4px] border-[#2d47a6] bg-white/80 p-4">
                <p className="text-[24px] uppercase text-[#4462ba]">Первым угадал</p>
                <p className="text-[52px] leading-none uppercase text-[#1f378f]">{winnerModal.username}</p>
                <p className="text-[23px] text-[#4f66be] mt-1">Ответ в чате: «{winnerModal.submittedAnswer}»</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default function KinoQuizClient() {
  return (
    <AuthProvider>
      <KinoQuizContent />
    </AuthProvider>
  );
}
