'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Camera,
  ChevronDown,
  Clapperboard,
  Crown,
  Loader2,
  Play,
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
type PickerKey = 'mode' | 'time' | 'rounds' | null;

const ROUND_TIME_OPTIONS = [30, 60, 90, 120] as const;
const ROUND_COUNT_OPTIONS = [5, 10, 15, 20, 30] as const;

const modeOptions: Array<{ id: Movie['type']; label: string }> = [
  { id: 'movie', label: 'ФИЛЬМЫ' },
  { id: 'series', label: 'СЕРИАЛЫ' },
  { id: 'anime', label: 'АНИМЕ' }
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
  const [openPicker, setOpenPicker] = useState<PickerKey>(null);

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

  const selectedModeLabel = useMemo(
    () => modeOptions.find(option => option.id === selectedType)?.label || 'ФИЛЬМЫ',
    [selectedType]
  );

  useEffect(() => {
    if (session?.user?.name) {
      setStreamerName(session.user.name);
    }
  }, [session?.user?.name]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-picker-root="true"]')) {
        setOpenPicker(null);
      }
    };

    document.addEventListener('mousedown', onPointerDown);
    return () => {
      document.removeEventListener('mousedown', onPointerDown);
    };
  }, []);

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
          .map(score => (score.username === username ? { ...score, score: score.score + points } : score))
          .sort((a, b) => b.score - a.score);
      }
      return [...prev, { username, score: points }].sort((a, b) => b.score - a.score);
    });
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

  const startRound = () => {
    const duration = activeRoundDurationRef.current;
    clearRoundTimers();
    setIsRevealed(false);
    isRevealedRef.current = false;
    setGuessInput('');
    setWinnerModal(null);
    setShowWinnerModal(false);
    setTimeLeft(duration);
    timeLeftRef.current = duration;

    timerRef.current = setInterval(() => {
      setTimeLeft(previous => {
        if (previous <= 1) {
          if (timerRef.current) {
            clearInterval(timerRef.current);
            timerRef.current = null;
          }
          setIsRevealed(true);
          isRevealedRef.current = true;
          nextRoundTimeoutRef.current = setTimeout(() => {
            handleNext();
          }, 2600);
          return 0;
        }
        const next = previous - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
  };

  const handleContinueAfterCorrect = () => {
    setShowWinnerModal(false);
    handleNext();
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

    ws.onmessage = event => {
      const lines = event.data.split('\r\n');
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
        const canCheck = screenRef.current === 'game' && !isRevealedRef.current && !!current;
        const correct = canCheck && current ? isCorrectAnswer(textRaw, current) : false;

        setChatMessages(previous => [...previous.slice(-139), { user, text: textRaw, isCorrect: correct, source: 'chat' }]);

        if (correct) {
          handleCorrectAnswer(user, textRaw);
        }
      });
    };
  };

  const startQuiz = async () => {
    if (!streamerName.trim()) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/kinoquiz/rounds?type=${selectedType}`);
      const data = await response.json();
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
    if (screenRef.current !== 'game' || isRevealedRef.current) return;
    const current = moviesRef.current[currentRoundRef.current];
    const input = guessInput.trim();
    if (!current || !input) return;

    const displayName = streamerName || 'Стример';
    const correct = isCorrectAnswer(input, current);

    setChatMessages(previous => [
      ...previous.slice(-139),
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
    setOpenPicker(null);
  };

  const basePanel =
    'rounded-[28px] border-[2px] border-[#4f3f27] bg-[linear-gradient(180deg,#2d2b2c_0%,#1d1b1c_100%)] shadow-[0_10px_24px_rgba(0,0,0,0.38)]';

  return (
    <div
      className="h-screen overflow-hidden p-3 text-[#f5e7c7]"
      style={{
        fontFamily: "'Waffle Soft', sans-serif",
        background:
          'radial-gradient(circle at 50% 15%, #4f1f2d 0%, #2f1620 33%, #19141a 65%, #0d0f12 100%)'
      }}
    >
      <div className="mx-auto h-full max-w-[1840px] grid grid-cols-1 xl:grid-cols-[340px_1fr] gap-3">
        <aside className="min-h-0 flex flex-col gap-3">
          <div className={`${basePanel} h-[165px] p-4 flex items-center justify-center`}>
            {screen === 'lobby' ? (
              <div className="text-center leading-none">
                <div className="text-[34px] uppercase tracking-[0.15em] text-[#d8bb74]">KINO</div>
                <div className="text-[58px] uppercase text-[#ffd56e] drop-shadow-[0_3px_0_#a05f1f]">SHOW</div>
              </div>
            ) : (
              <div className="w-full h-full rounded-2xl border border-[#5d4827] bg-black/35 p-3 overflow-y-auto space-y-2">
                {scores.slice(0, 9).map((score, index) => (
                  <div
                    key={`${score.username}-${index}`}
                    className="rounded-lg border border-[#674f28] bg-[#201a12] px-2 py-1.5 flex items-center justify-between text-[19px]"
                  >
                    <span className="truncate pr-3">{score.username}</span>
                    <span>{score.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${basePanel} min-h-0 flex-1 p-3`}>
            <div className="h-full rounded-[20px] border border-[#5d4827] bg-black/30 overflow-y-auto p-2 space-y-1.5">
              {chatMessages
                .slice()
                .reverse()
                .map((message, index) => (
                  <div
                    key={`${message.user}-${index}`}
                    className={`rounded-md px-2 py-1 text-[17px] border ${
                      message.isCorrect
                        ? 'bg-[#22412c] border-[#4aa465] text-[#b9f2c8]'
                        : message.source === 'streamer'
                          ? 'bg-[#1f2f49] border-[#4f76b8] text-[#c7d8ff]'
                          : 'bg-[#1d1b1d] border-[#3d3528] text-[#d7c7a2]'
                    }`}
                  >
                    <span className="text-[#f2dba8]">{message.user}:</span> {message.text}
                  </div>
                ))}
            </div>
          </div>

          <div className={`${basePanel} h-[215px] p-3`}>
            <div className="relative h-full rounded-[20px] border border-[#5d4827] overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#3b2e26_0%,#271f1a_55%,#1a1614_100%)]">
              <div className="absolute bottom-[-44px] left-4 right-4 h-[110px] rounded-[50%] border border-[#6b4f2c] bg-[linear-gradient(180deg,#5a141a_0%,#35090e_100%)]" />
              <div className="absolute inset-x-0 top-6 flex justify-center">
                <Camera className="w-11 h-11 text-[#f2c872]" />
              </div>

              {screen === 'game' && (
                <div className="absolute left-3 right-3 bottom-4 flex gap-2">
                  <input
                    value={guessInput}
                    onChange={event => setGuessInput(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && handleManualGuess()}
                    placeholder="Ответ стримера..."
                    className="flex-1 h-10 rounded-lg border border-[#6b542d] bg-[#191614] px-2 text-[17px] text-[#f2e5c6] placeholder:text-[#997f57] outline-none"
                  />
                  <Button
                    onClick={handleManualGuess}
                    className="h-10 rounded-lg border border-[#845e26] bg-[#efb73e] hover:bg-[#ffca58] text-[#251706] text-[17px] uppercase px-3"
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="min-h-0 rounded-[34px] border-[3px] border-[#5a4526] bg-[linear-gradient(180deg,#27262a_0%,#151619_100%)] shadow-[0_16px_38px_rgba(0,0,0,0.5)] overflow-hidden relative">
          <div className="absolute inset-0 pointer-events-none opacity-25 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_34px,rgba(255,255,255,0.03)_34px,rgba(255,255,255,0.03)_36px)]" />
          <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none bg-[repeating-radial-gradient(circle_at_18px_12px,#7c6234_0px,#7c6234_6px,transparent_7px,transparent_46px)] opacity-45" />

          <div className="relative z-10 h-full p-4 pt-7 flex flex-col min-h-0">
            <div className="flex items-center justify-between">
              <Button
                variant="ghost"
                type="button"
                className="h-9 w-9 p-0 rounded-lg border border-[#6d5630] bg-black/30 text-[#eac27a] hover:bg-black/50"
              >
                <Volume2 className="w-4 h-4" />
              </Button>

              {!session ? (
                <Button
                  onClick={() => signIn('kinoquiz')}
                  className="h-10 rounded-lg border border-[#7e5c29] bg-[#9146FF] hover:bg-[#7d37ea] text-white text-[17px] uppercase px-4"
                >
                  Вход через Twitch
                </Button>
              ) : (
                <div />
              )}
            </div>

            <AnimatePresence mode="wait">
              {screen === 'lobby' && (
                <motion.div
                  key="lobby"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex-1 min-h-0 flex flex-col"
                >
                  <div className="text-center mt-1 mb-3">
                    <p className="text-[30px] uppercase text-[#d6b16f]">Кинотеатр Стримера</p>
                    <h1 className="text-[52px] leading-none uppercase text-[#f1d48b]">{streamerName || 'TIKTOKEVELONE888'}</h1>
                  </div>

                  <div className="rounded-[24px] border border-[#5f4929] bg-black/25 p-3">
                    <input
                      value={streamerName}
                      onChange={event => setStreamerName(event.target.value)}
                      placeholder="Ник стримера"
                      className="w-full h-11 rounded-lg border border-[#725a31] bg-[#191614] px-3 text-[22px] uppercase text-[#f0dfb8] placeholder:text-[#9a835b] outline-none"
                    />
                  </div>

                  <div className="mt-3 grid grid-cols-1 lg:grid-cols-3 gap-3">
                    <div className="relative" data-picker-root="true">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'mode' ? null : 'mode'))}
                        className="w-full h-12 rounded-xl border border-[#745b31] bg-[#1c1816] px-3 flex items-center justify-between text-[20px] uppercase"
                      >
                        <span>{selectedModeLabel}</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openPicker === 'mode' ? 'rotate-180' : ''}`} />
                      </button>
                      {openPicker === 'mode' && (
                        <div className="absolute z-30 left-0 right-0 top-[52px] rounded-xl border border-[#7a5f32] bg-[#151211] overflow-hidden">
                          {modeOptions.map(option => (
                            <button
                              key={option.id}
                              type="button"
                              onClick={() => {
                                setSelectedType(option.id);
                                setOpenPicker(null);
                              }}
                              className={`w-full px-3 h-10 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
                                selectedType === option.id ? 'bg-[#3a2a18] text-[#ffd888]' : 'text-[#e8d1a5]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative" data-picker-root="true">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'time' ? null : 'time'))}
                        className="w-full h-12 rounded-xl border border-[#745b31] bg-[#1c1816] px-3 flex items-center justify-between text-[20px] uppercase"
                      >
                        <span>{roundDuration} сек</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openPicker === 'time' ? 'rotate-180' : ''}`} />
                      </button>
                      {openPicker === 'time' && (
                        <div className="absolute z-30 left-0 right-0 top-[52px] rounded-xl border border-[#7a5f32] bg-[#151211] overflow-hidden">
                          {ROUND_TIME_OPTIONS.map(value => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setRoundDuration(value);
                                setOpenPicker(null);
                              }}
                              className={`w-full px-3 h-10 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
                                roundDuration === value ? 'bg-[#3a2a18] text-[#ffd888]' : 'text-[#e8d1a5]'
                              }`}
                            >
                              {value} сек
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative" data-picker-root="true">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'rounds' ? null : 'rounds'))}
                        className="w-full h-12 rounded-xl border border-[#745b31] bg-[#1c1816] px-3 flex items-center justify-between text-[20px] uppercase"
                      >
                        <span>{roundsCount} раундов</span>
                        <ChevronDown className={`w-5 h-5 transition-transform ${openPicker === 'rounds' ? 'rotate-180' : ''}`} />
                      </button>
                      {openPicker === 'rounds' && (
                        <div className="absolute z-30 left-0 right-0 top-[52px] rounded-xl border border-[#7a5f32] bg-[#151211] overflow-hidden">
                          {ROUND_COUNT_OPTIONS.map(value => (
                            <button
                              key={value}
                              type="button"
                              onClick={() => {
                                setRoundsCount(value);
                                setOpenPicker(null);
                              }}
                              className={`w-full px-3 h-10 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
                                roundsCount === value ? 'bg-[#3a2a18] text-[#ffd888]' : 'text-[#e8d1a5]'
                              }`}
                            >
                              {value} раундов
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="mt-3 flex-1 min-h-0 rounded-[28px] border border-[#6a522d] bg-[linear-gradient(180deg,#201f23_0%,#121318_100%)] p-3">
                    <div className="relative h-full rounded-[24px] border-[7px] border-[#393a42] bg-[#07080d] overflow-hidden">
                      <div className="absolute left-2 right-2 top-2 h-3 rounded-full bg-[#12141c] border border-[#4a4f5f]" />
                      <div className="absolute left-4 right-4 top-8 bottom-6 rounded-[18px] border border-[#222732] bg-[radial-gradient(circle_at_50%_50%,#121722_0%,#080a11_72%)] flex items-center justify-center">
                        <Clapperboard className="w-16 h-16 text-[#3f4a61]" />
                      </div>
                      <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-10 h-2 rounded-full bg-[#464a57]" />
                    </div>
                  </div>

                  <div className="mt-3 flex gap-3">
                    {session ? (
                      <>
                        <Button
                          onClick={() => signOut('kinoquiz')}
                          className="w-1/2 h-13 rounded-xl border border-[#784725] bg-[#d54e63] hover:bg-[#e25a71] text-[#fff3db] text-[29px] uppercase"
                        >
                          Разлогиниться
                        </Button>
                        <Button
                          onClick={startQuiz}
                          disabled={isLoading}
                          className="w-1/2 h-13 rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffcf5d] text-[#2f1e08] text-[34px] uppercase disabled:opacity-70"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Начать'}
                        </Button>
                      </>
                    ) : (
                      <Button
                        onClick={() => signIn('kinoquiz')}
                        disabled={isAuthLoading}
                        className="w-full h-13 rounded-xl border border-[#7f6128] bg-[#9146FF] hover:bg-[#7d37ea] text-white text-[30px] uppercase disabled:opacity-70"
                      >
                        Войти через Twitch
                      </Button>
                    )}
                  </div>
                </motion.div>
              )}

              {screen === 'game' && currentMovie && (
                <motion.div
                  key="game"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex-1 min-h-0 flex flex-col"
                >
                  <div className="text-center mt-1 mb-2">
                    <p className="text-[28px] uppercase text-[#d6b16f]">Кинотеатр Стримера</p>
                    <h2 className="text-[42px] leading-none uppercase text-[#f1d48b]">{streamerName || 'СТРИМЕР'}</h2>
                  </div>

                  <div className="flex gap-2 flex-wrap mb-2">
                    <div className="h-9 px-3 rounded-lg border border-[#71562f] bg-[#1c1816] text-[18px] uppercase flex items-center">
                      Раунд {currentRound + 1}/{activeRoundsCount}
                    </div>
                    <div className="h-9 px-3 rounded-lg border border-[#71562f] bg-[#1c1816] text-[18px] uppercase flex items-center">
                      {selectedModeLabel}
                    </div>
                    <div className="h-9 px-3 rounded-lg border border-[#71562f] bg-[#1c1816] text-[18px] uppercase flex items-center">
                      {activeRoundDuration} сек
                    </div>
                  </div>

                  <div className="flex-1 min-h-0 rounded-[28px] border border-[#6a522d] bg-[linear-gradient(180deg,#201f23_0%,#121318_100%)] p-3">
                    <div className="relative h-full rounded-[24px] border-[8px] border-[#393a42] bg-[#07080d] overflow-hidden">
                      <div className="absolute left-3 right-3 top-3 h-3 rounded-full bg-[#12141c] border border-[#4a4f5f]" />
                      <div className="absolute left-4 right-4 top-9 bottom-8 rounded-[18px] border border-[#222732] bg-black overflow-hidden">
                        <img
                          src={currentMovie.imageUrl}
                          alt=""
                          className="absolute inset-0 w-full h-full object-cover blur-[36px] opacity-35 scale-110"
                        />
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <img
                            src={currentMovie.imageUrl}
                            alt="Кадр"
                            className={`max-w-full max-h-full rounded-[14px] border-[3px] border-[#3b3f49] transition-all duration-700 ${
                              isRevealed ? 'blur-0 brightness-100' : 'blur-md brightness-50'
                            }`}
                          />
                        </div>

                        <div className="absolute top-3 right-3 w-20 h-20 rounded-full border-[3px] border-[#545864] bg-[#0f1219]/90 flex flex-col items-center justify-center">
                          <span className={`text-[34px] leading-none ${timeLeft <= 5 ? 'text-[#f16d83]' : 'text-[#f4db9f]'}`}>{timeLeft}</span>
                          <span className="text-[12px] uppercase text-[#a59a7f]">сек</span>
                        </div>

                        {isRevealed && (
                          <div className="absolute left-3 right-3 bottom-3 rounded-lg border border-[#7b5a2b] bg-[#f0c65b] px-3 py-2 text-center text-[#34210b]">
                            <div className="text-[16px] uppercase">Верный ответ</div>
                            <div className="text-[26px] leading-none uppercase">{currentMovie.title_ru}</div>
                          </div>
                        )}
                      </div>

                      <div className="absolute left-4 right-4 bottom-3 h-4 rounded-full border border-[#545864] bg-[#0e1016] overflow-hidden">
                        <div
                          className={`h-full ${timerPercent <= 20 ? 'bg-[#cb4f6a]' : 'bg-[#d3a142]'}`}
                          style={{ width: `${timerPercent}%` }}
                        />
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}

              {screen === 'results' && (
                <motion.div
                  key="results"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -6 }}
                  className="flex-1 min-h-0 flex flex-col justify-center items-center"
                >
                  <Crown className="w-20 h-20 text-[#f0c35a]" />
                  <p className="text-[54px] leading-none uppercase text-[#f1d48b] mt-2">Финиш</p>

                  <div className="w-full max-w-[760px] mt-4 rounded-2xl border border-[#6a522d] bg-black/25 p-3 space-y-2">
                    {scores.slice(0, 6).map((score, index) => (
                      <div
                        key={`${score.username}-${index}`}
                        className="rounded-lg border border-[#674f28] bg-[#201a12] px-3 py-2 flex items-center justify-between text-[22px]"
                      >
                        <span className="truncate pr-3">{score.username}</span>
                        <span>{score.score}</span>
                      </div>
                    ))}
                  </div>

                  <div className="mt-4 w-full max-w-[760px] flex gap-3">
                    <Button
                      onClick={backToLobby}
                      className="w-1/2 h-12 rounded-xl border border-[#784725] bg-[#d54e63] hover:bg-[#e25a71] text-[#fff3db] text-[27px] uppercase"
                    >
                      В меню
                    </Button>
                    <Button
                      onClick={startQuiz}
                      className="w-1/2 h-12 rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffcf5d] text-[#2f1e08] text-[27px] uppercase"
                    >
                      Играть
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
            className="fixed inset-0 z-[200] bg-black/65 backdrop-blur-sm p-4 flex items-center justify-center"
          >
            <motion.div
              initial={{ scale: 0.94, y: 16 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.94, y: 10 }}
              className="w-full max-w-[700px] rounded-[24px] border-[2px] border-[#73572d] bg-[linear-gradient(180deg,#2a1f16_0%,#1a1410_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.58)] p-6 text-center"
              style={{ fontFamily: "'Waffle Soft', sans-serif" }}
            >
              <p className="text-[21px] uppercase text-[#d8bb74]">Верный ответ</p>
              <h3 className="text-[56px] leading-none uppercase text-[#ffd98b]">{winnerModal.answerRu}</h3>
              <p className="text-[23px] uppercase text-[#bfa573] mt-1">{winnerModal.answerOriginal}</p>

              <div className="mt-4 rounded-xl border border-[#71562f] bg-black/30 p-3">
                <p className="text-[22px] uppercase text-[#e5cb91]">{winnerModal.username}</p>
              </div>

              <div className="mt-5 flex justify-center">
                <Button
                  onClick={handleContinueAfterCorrect}
                  className="h-12 rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffcf5d] text-[#2f1e08] text-[28px] uppercase px-8"
                >
                  <Play className="w-4 h-4 mr-2" />
                  Продолжить
                </Button>
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
