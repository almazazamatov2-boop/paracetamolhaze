'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { HugeiconsIcon } from '@hugeicons/react';
import {
  ArrowDown01Icon,
  Camera01Icon,
  CrownIcon,
  FilmRoll01Icon,
  Login01Icon,
  Logout01Icon,
  VolumeHighIcon
} from '@hugeicons/core-free-icons';
import { Loader2 } from 'lucide-react';
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

type EffectKey = 'start' | 'success' | 'timeout' | 'continue';

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
  const [loadError, setLoadError] = useState<string>('');
  const [soundPanelOpen, setSoundPanelOpen] = useState<boolean>(false);
  const [musicVolume, setMusicVolume] = useState<number>(0.18);
  const [effectsVolume, setEffectsVolume] = useState<number>(0.72);

  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const musicRef = useRef<HTMLAudioElement | null>(null);
  const effectsRef = useRef<Record<EffectKey, HTMLAudioElement | null>>({
    start: null,
    success: null,
    timeout: null,
    continue: null
  });
  const screenRef = useRef<Screen>('lobby');
  const currentRoundRef = useRef<number>(0);
  const moviesRef = useRef<Movie[]>([]);
  const isRevealedRef = useRef<boolean>(false);
  const timeLeftRef = useRef<number>(90);
  const activeRoundsRef = useRef<number>(15);
  const activeRoundDurationRef = useRef<number>(90);

  const currentMovie = movies[currentRound];
  const selectedModeLabel = useMemo(
    () => modeOptions.find(mode => mode.id === selectedType)?.label || 'ФИЛЬМЫ',
    [selectedType]
  );

  const timerPercent = useMemo(() => {
    if (activeRoundDuration <= 0) return 0;
    return Math.max(0, Math.min(100, Math.round((timeLeft / activeRoundDuration) * 100)));
  }, [timeLeft, activeRoundDuration]);

  const playMusic = async () => {
    const music = musicRef.current;
    if (!music) return;
    music.volume = musicVolume;
    if (musicVolume <= 0) {
      music.pause();
      return;
    }
    try {
      await music.play();
    } catch {
      // Browser may block autoplay before first user gesture.
    }
  };

  const stopMusic = () => {
    const music = musicRef.current;
    if (!music) return;
    music.pause();
    music.currentTime = 0;
  };

  const playEffect = async (key: EffectKey) => {
    const clip = effectsRef.current[key];
    if (!clip || effectsVolume <= 0) return;
    clip.pause();
    clip.currentTime = 0;
    clip.volume = effectsVolume;
    try {
      await clip.play();
    } catch {
      // Ignore blocked play attempts.
    }
  };

  useEffect(() => {
    if (session?.user?.name) setStreamerName(session.user.name);
  }, [session?.user?.name]);

  useEffect(() => {
    const music = new Audio('/overlays/defaults/sounds/roll.mp3');
    music.loop = true;
    music.volume = musicVolume;
    musicRef.current = music;

    effectsRef.current = {
      start: new Audio('/overlays/defaults/sounds/in.mp3'),
      success: new Audio('/overlays/defaults/sounds/win.mp3'),
      timeout: new Audio('/overlays/defaults/sounds/lose.mp3'),
      continue: new Audio('/overlays/defaults/sounds/out.mp3')
    };

    return () => {
      stopMusic();
      Object.values(effectsRef.current).forEach(clip => {
        if (!clip) return;
        clip.pause();
        clip.currentTime = 0;
      });
      effectsRef.current = { start: null, success: null, timeout: null, continue: null };
    };
  }, []);

  useEffect(() => {
    if (musicRef.current) {
      musicRef.current.volume = musicVolume;
      if (musicVolume <= 0) musicRef.current.pause();
    }
  }, [musicVolume]);

  useEffect(() => {
    Object.values(effectsRef.current).forEach(clip => {
      if (!clip) return;
      clip.volume = effectsVolume;
    });
  }, [effectsVolume]);

  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as HTMLElement | null;
      if (!target?.closest('[data-picker-root="true"]')) setOpenPicker(null);
      if (!target?.closest('[data-sound-panel="true"]')) setSoundPanelOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
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
      if (wsRef.current) wsRef.current.close();
    };
  }, []);

  const clearRoundTimer = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
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
    setScores(previous => {
      const existing = previous.find(score => score.username === username);
      if (existing) {
        return previous
          .map(score => (score.username === username ? { ...score, score: score.score + points } : score))
          .sort((a, b) => b.score - a.score);
      }
      return [...previous, { username, score: points }].sort((a, b) => b.score - a.score);
    });
  };

  const handleNext = () => {
    const nextRound = currentRoundRef.current + 1;
    const hasNextRound = nextRound < activeRoundsRef.current && !!moviesRef.current[nextRound];

    if (hasNextRound) {
      void playEffect('continue');
      setCurrentRound(nextRound);
      currentRoundRef.current = nextRound;
      startRound();
      return;
    }

    clearRoundTimer();
    disconnectTwitch();
    setScreen('results');
  };

  const startRound = () => {
    const duration = activeRoundDurationRef.current;
    clearRoundTimer();
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
          clearRoundTimer();
          void playEffect('timeout');
          setIsRevealed(true);
          isRevealedRef.current = true;
          setTimeout(() => {
            if (!showWinnerModal) handleNext();
          }, 2200);
          return 0;
        }
        const next = previous - 1;
        timeLeftRef.current = next;
        return next;
      });
    }, 1000);
  };

  const handleCorrectAnswer = (username: string, submittedAnswer: string) => {
    if (isRevealedRef.current) return;
    const current = moviesRef.current[currentRoundRef.current];
    if (!current) return;

    clearRoundTimer();
    void playEffect('success');
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

  const handleContinueAfterCorrect = () => {
    void playEffect('continue');
    setShowWinnerModal(false);
    handleNext();
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

    ws.onclose = () => setIsConnected(false);
    ws.onerror = () => setIsConnected(false);

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

        setChatMessages(previous => [...previous.slice(-159), { user, text: textRaw, isCorrect: correct, source: 'chat' }]);

        if (correct) handleCorrectAnswer(user, textRaw);
      });
    };
  };

  const startQuiz = async () => {
    if (!session || !streamerName.trim()) return;

    setLoadError('');
    setIsLoading(true);
    try {
      const response = await fetch(`/api/kinoquiz/rounds?type=${selectedType}`);
      const data = await response.json();
      if (!response.ok) {
        setLoadError(data?.error || 'Не удалось загрузить кадры. Проверьте базу данных.');
        return;
      }

      if (!data.movies?.length) {
        setLoadError('В базе нет кадров для выбранного режима.');
        return;
      }

      const preparedMovies = shuffleMovies<Movie>(data.movies).slice(0, roundsCount);
      if (preparedMovies.length === 0) {
        setLoadError('Не удалось сформировать раунды.');
        return;
      }

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
      void playMusic();
      void playEffect('start');
      connectToTwitch();
      startRound();
    } catch (error) {
      console.error(error);
      setLoadError('Ошибка сети при запуске игры.');
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
    setChatMessages(previous => [...previous.slice(-159), { user: displayName, text: input, isCorrect: correct, source: 'streamer' }]);
    setGuessInput('');

    if (correct) handleCorrectAnswer(displayName, input);
  };

  const backToLobby = () => {
    clearRoundTimer();
    disconnectTwitch();
    stopMusic();
    setLoadError('');
    setScreen('lobby');
    setShowWinnerModal(false);
    setWinnerModal(null);
    setIsRevealed(false);
    setCurrentRound(0);
    setOpenPicker(null);
  };

  const panelClass =
    'rounded-[28px] border-[2px] border-[#6f542d] bg-[linear-gradient(180deg,#2b2a2f_0%,#17171b_100%)] shadow-[inset_0_0_0_1px_rgba(255,213,124,0.08),0_16px_28px_rgba(0,0,0,0.45)]';

  return (
    <div
      className="h-screen overflow-hidden p-3 text-[#f4e2bb]"
      style={{
        fontFamily: "'Waffle Soft', sans-serif",
        background: 'radial-gradient(circle at 45% 12%, #531f2f 0%, #2b1520 30%, #141419 66%, #0b0d12 100%)'
      }}
    >
      <div className="mx-auto h-full max-w-[1740px] grid grid-cols-1 xl:grid-cols-[350px_1fr] gap-3">
        <aside className="min-h-0 flex flex-col gap-3">
          <div className={`${panelClass} h-[148px] p-3`}>
            {screen === 'lobby' ? (
              <div className="h-full rounded-2xl border border-[#70562f] bg-black/25 flex flex-col items-center justify-center leading-none">
                <span className="text-[32px] uppercase tracking-[0.16em] text-[#d8bb74]">KINO</span>
                <span className="text-[56px] uppercase text-[#ffd56e] drop-shadow-[0_3px_0_#a15f1f]">SHOW</span>
              </div>
            ) : (
              <div className="h-full rounded-2xl border border-[#70562f] bg-black/25 p-2 overflow-y-auto space-y-1.5">
                {scores.slice(0, 9).map((score, index) => (
                  <div
                    key={`${score.username}-${index}`}
                    className="h-9 rounded-md border border-[#71572f] bg-[#1f1a14] px-2 flex items-center justify-between text-[20px]"
                  >
                    <span className="truncate pr-2">{score.username}</span>
                    <span>{score.score}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className={`${panelClass} min-h-0 flex-1 p-2.5`}>
            <div className="h-full rounded-[20px] border border-[#70562f] bg-black/30 overflow-y-auto p-2 space-y-1.5">
              {chatMessages
                .slice()
                .reverse()
                .map((message, index) => (
                  <div
                    key={`${message.user}-${index}`}
                    className={`rounded-md border px-2 py-1 text-[18px] leading-[1.15] ${
                      message.isCorrect
                        ? 'bg-[#1f4a2b] border-[#58b174] text-[#b6f5c8]'
                        : message.source === 'streamer'
                          ? 'bg-[#243857] border-[#5c83ca] text-[#d0ddff]'
                          : 'bg-[#1b1b1f] border-[#3b3327] text-[#dbc99f]'
                    }`}
                  >
                    <span className="text-[#f3dfa9]">{message.user}:</span> {message.text}
                  </div>
                ))}
            </div>
          </div>

          <div className={`${panelClass} h-[280px] p-3`}>
            <div className="relative h-full rounded-[22px] border border-[#70562f] overflow-hidden bg-[radial-gradient(circle_at_50%_20%,#3a2d23_0%,#251d19_57%,#171412_100%)]">
              <div className="absolute bottom-[-58px] left-3 right-3 h-[138px] rounded-[50%] border border-[#7c5730] bg-[linear-gradient(180deg,#67111a_0%,#36090e_100%)]" />
              <div className="absolute top-7 inset-x-0 flex justify-center">
                <HugeiconsIcon icon={Camera01Icon} size={46} color="#f1c86c" strokeWidth={1.8} />
              </div>
              {screen === 'game' && (
                <div className="absolute left-3 right-3 bottom-4 flex gap-2">
                  <input
                    value={guessInput}
                    onChange={event => setGuessInput(event.target.value)}
                    onKeyDown={event => event.key === 'Enter' && handleManualGuess()}
                    placeholder="Ответ стримера..."
                    className="flex-1 h-10 rounded-lg border border-[#785f34] bg-[#161311] px-2 text-[17px] text-[#f0e2bf] placeholder:text-[#997f57] outline-none"
                  />
                  <Button
                    onClick={handleManualGuess}
                    className="h-10 rounded-lg border border-[#856128] bg-[#efbe48] hover:bg-[#ffd15f] text-[#2f1d09] text-[18px] uppercase px-3"
                  >
                    OK
                  </Button>
                </div>
              )}
            </div>
          </div>
        </aside>

        <section className="relative min-h-0 rounded-[34px] border-[3px] border-[#71562d] bg-[linear-gradient(180deg,#27262c_0%,#17171c_100%)] shadow-[inset_0_0_0_1px_rgba(255,214,128,0.16),0_20px_40px_rgba(0,0,0,0.55)] overflow-hidden">
          <div className="absolute inset-0 pointer-events-none opacity-24 bg-[repeating-linear-gradient(90deg,transparent_0px,transparent_32px,rgba(255,255,255,0.03)_32px,rgba(255,255,255,0.03)_34px)]" />
          <div className="absolute top-0 left-0 right-0 h-6 pointer-events-none bg-[repeating-radial-gradient(circle_at_18px_12px,#846534_0px,#846534_6px,transparent_7px,transparent_40px)] opacity-5" />

          <div className="relative z-10 h-full p-4 pt-7 flex flex-col min-h-0">
            <div className="relative flex items-center justify-between" data-sound-panel="true">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setSoundPanelOpen(previous => !previous)}
                className="h-9 w-9 p-0 rounded-lg border border-[#71562f] bg-black/30 text-[#e9c57e] hover:bg-black/50"
              >
                <HugeiconsIcon icon={VolumeHighIcon} size={18} color="#e9c57e" strokeWidth={1.9} />
              </Button>
              <AnimatePresence>
                {soundPanelOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -8 }}
                    className="absolute left-0 top-11 z-40 w-[280px] rounded-xl border border-[#71562f] bg-[#f5f2e7] text-[#23204a] p-3"
                  >
                    <div className="space-y-3">
                      <div>
                        <p className="text-[18px] uppercase mb-1">Музыка</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setMusicVolume(previous => Math.max(0, Number((previous - 0.1).toFixed(2))))}
                            className="h-8 w-8 rounded-md border border-[#2d3795] text-[22px] leading-none"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={musicVolume}
                            onChange={event => setMusicVolume(Number(event.target.value))}
                            className="w-full accent-[#2d3795]"
                          />
                          <button
                            type="button"
                            onClick={() => setMusicVolume(previous => Math.min(1, Number((previous + 0.1).toFixed(2))))}
                            className="h-8 w-8 rounded-md border border-[#2d3795] text-[22px] leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>

                      <div>
                        <p className="text-[18px] uppercase mb-1">Эффекты</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setEffectsVolume(previous => Math.max(0, Number((previous - 0.1).toFixed(2))))}
                            className="h-8 w-8 rounded-md border border-[#2d3795] text-[22px] leading-none"
                          >
                            -
                          </button>
                          <input
                            type="range"
                            min={0}
                            max={1}
                            step={0.01}
                            value={effectsVolume}
                            onChange={event => setEffectsVolume(Number(event.target.value))}
                            className="w-full accent-[#2d3795]"
                          />
                          <button
                            type="button"
                            onClick={() => setEffectsVolume(previous => Math.min(1, Number((previous + 0.1).toFixed(2))))}
                            className="h-8 w-8 rounded-md border border-[#2d3795] text-[22px] leading-none"
                          >
                            +
                          </button>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
              <div />
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

                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-3" data-picker-root="true">
                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'mode' ? null : 'mode'))}
                        className="w-full h-12 rounded-xl border border-[#755b31] bg-[#1c1916] px-3 flex items-center justify-between text-[21px] uppercase"
                      >
                        <span>{selectedModeLabel}</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={19} color="#e4c78c" strokeWidth={1.9} className={`transition-transform ${openPicker === 'mode' ? 'rotate-180' : ''}`} />
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
                              className={`w-full h-10 px-3 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
                                selectedType === option.id ? 'bg-[#3a2a18] text-[#ffd888]' : 'text-[#e8d1a5]'
                              }`}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'time' ? null : 'time'))}
                        className="w-full h-12 rounded-xl border border-[#755b31] bg-[#1c1916] px-3 flex items-center justify-between text-[21px] uppercase"
                      >
                        <span>{roundDuration} сек</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={19} color="#e4c78c" strokeWidth={1.9} className={`transition-transform ${openPicker === 'time' ? 'rotate-180' : ''}`} />
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
                              className={`w-full h-10 px-3 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
                                roundDuration === value ? 'bg-[#3a2a18] text-[#ffd888]' : 'text-[#e8d1a5]'
                              }`}
                            >
                              {value} сек
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="relative">
                      <button
                        type="button"
                        onClick={() => setOpenPicker(previous => (previous === 'rounds' ? null : 'rounds'))}
                        className="w-full h-12 rounded-xl border border-[#755b31] bg-[#1c1916] px-3 flex items-center justify-between text-[21px] uppercase"
                      >
                        <span>{roundsCount} раундов</span>
                        <HugeiconsIcon icon={ArrowDown01Icon} size={19} color="#e4c78c" strokeWidth={1.9} className={`transition-transform ${openPicker === 'rounds' ? 'rotate-180' : ''}`} />
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
                              className={`w-full h-10 px-3 text-left text-[19px] uppercase hover:bg-[#2a2018] ${
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

                  <div className="mt-3 flex-1 min-h-0 rounded-[26px] border-[3px] border-[#6f542d] bg-[linear-gradient(180deg,#201f24_0%,#101219_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(255,213,125,0.1)]">
                    <div className="relative h-full rounded-[20px] border-[7px] border-[#3d4049] bg-[#07080d] overflow-hidden">
                      <div className="absolute left-3 right-3 top-3 h-3 rounded-full bg-[#12141d] border border-[#4a4f5f]" />
                      <div className="absolute left-4 right-4 top-9 bottom-6 rounded-[16px] border border-[#222832] bg-[radial-gradient(circle_at_50%_50%,#141924_0%,#080a11_76%)] flex items-center justify-center">
                        <HugeiconsIcon icon={FilmRoll01Icon} size={72} color="#434d63" strokeWidth={1.7} />
                      </div>
                    </div>
                  </div>

                  <div className="mt-3">
                    {!session ? (
                      <Button
                        onClick={() => signIn('kinoquiz')}
                        disabled={isAuthLoading}
                        className="w-full h-13 rounded-xl border border-[#7b5f2c] bg-[#9146FF] hover:bg-[#7e37ea] text-white text-[32px] uppercase disabled:opacity-70"
                      >
                        <HugeiconsIcon icon={Login01Icon} size={20} color="currentColor" strokeWidth={2} className="mr-2" />
                        Авторизовать через Twitch
                      </Button>
                    ) : (
                      <div className="flex gap-3">
                        <Button
                          onClick={() => signOut('kinoquiz')}
                          className="w-1/2 h-13 rounded-xl border border-[#784726] bg-[#d44f64] hover:bg-[#e05a71] text-[#fff4de] text-[30px] uppercase"
                        >
                          <HugeiconsIcon icon={Logout01Icon} size={20} color="currentColor" strokeWidth={2} className="mr-2" />
                          Разлогиниться
                        </Button>
                        <Button
                          onClick={startQuiz}
                          disabled={isLoading}
                          className="w-1/2 h-13 rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffd15f] text-[#2f1d09] text-[36px] uppercase disabled:opacity-70"
                        >
                          {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : 'Начать'}
                        </Button>
                      </div>
                    )}

                    {loadError && (
                      <div className="mt-2 rounded-xl border border-[#96595f] bg-[#311a1d] px-3 py-2 text-[17px] text-[#ffb8c1]">
                        {loadError}
                      </div>
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
                  className="flex-1 min-h-0 mt-2"
                >
                  <div className="h-full rounded-[26px] border-[3px] border-[#73572f] bg-[linear-gradient(180deg,#1f2026_0%,#0f1119_100%)] p-3 shadow-[inset_0_0_0_1px_rgba(255,214,129,0.1)]">
                    <div className="relative h-full rounded-[20px] border-[8px] border-[#3d4049] bg-[#07080d] overflow-hidden">
                      <div className="absolute left-3 right-3 top-3 h-3 rounded-full bg-[#12141d] border border-[#4a4f5f]" />
                      <div className="absolute left-4 right-4 top-9 bottom-7 rounded-[16px] border border-[#222832] bg-black overflow-hidden">
                        <img src={currentMovie.imageUrl} alt="" className="absolute inset-0 w-full h-full object-cover blur-[36px] opacity-35 scale-110" />
                        <div className="absolute inset-0 p-4 flex items-center justify-center">
                          <img
                            src={currentMovie.imageUrl}
                            alt="Кадр"
                            className={`max-w-full max-h-full rounded-[14px] border-[3px] border-[#3b3f49] transition-all duration-700 ${
                              isRevealed ? 'blur-0 brightness-100' : 'blur-md brightness-50'
                            }`}
                          />
                        </div>

                        <div className="absolute top-3 right-3 px-3 py-2 rounded-full border-[2px] border-[#4e5667] bg-[#0f1219]/90 text-center">
                          <div className={`text-[34px] leading-none ${timeLeft <= 5 ? 'text-[#f16d83]' : 'text-[#f4db9f]'}`}>{timeLeft}</div>
                          <div className="text-[11px] uppercase text-[#b3a88f]">сек</div>
                        </div>

                        {isRevealed && (
                          <div className="absolute left-3 right-3 bottom-3 rounded-lg border border-[#7c5a2b] bg-[#f0c65b] px-3 py-2 text-center text-[#34210b]">
                            <div className="text-[16px] uppercase">Верный ответ</div>
                            <div className="text-[24px] leading-none uppercase break-words [overflow-wrap:anywhere]">{currentMovie.title_ru}</div>
                          </div>
                        )}
                      </div>

                      <div className="absolute left-4 right-4 bottom-3 h-4 rounded-full border border-[#545864] bg-[#0e1016] overflow-hidden">
                        <div className={`h-full ${timerPercent <= 20 ? 'bg-[#cb4f6a]' : 'bg-[#d3a142]'}`} style={{ width: `${timerPercent}%` }} />
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
                  className="flex-1 min-h-0 flex items-center justify-center"
                >
                  <div className="w-full max-w-[760px] text-center">
                    <HugeiconsIcon icon={CrownIcon} size={88} color="#f0c35a" strokeWidth={1.8} className="mx-auto" />
                    <p className="text-[58px] uppercase leading-none text-[#f1d48b] mt-2">Финиш</p>

                    <div className="mt-4 rounded-2xl border border-[#6a522d] bg-black/25 p-3 space-y-2">
                      {scores.slice(0, 6).map((score, index) => (
                        <div
                          key={`${score.username}-${index}`}
                          className="h-11 rounded-lg border border-[#674f28] bg-[#201a12] px-3 flex items-center justify-between text-[23px]"
                        >
                          <span className="truncate pr-2">{score.username}</span>
                          <span>{score.score}</span>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 flex gap-3">
                      <Button
                        onClick={backToLobby}
                        className="w-1/2 h-12 rounded-xl border border-[#784725] bg-[#d54e63] hover:bg-[#e25a71] text-[#fff3db] text-[28px] uppercase"
                      >
                        В меню
                      </Button>
                      <Button
                        onClick={startQuiz}
                        className="w-1/2 h-12 rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffcf5d] text-[#2f1e08] text-[28px] uppercase"
                      >
                        Играть
                      </Button>
                    </div>
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
              className="w-full max-w-[760px] rounded-[24px] border-[2px] border-[#73572d] bg-[linear-gradient(180deg,#2a1f16_0%,#1a1410_100%)] shadow-[0_18px_50px_rgba(0,0,0,0.58)] p-6 text-center"
              style={{ fontFamily: "'Waffle Soft', sans-serif" }}
            >
              <p className="text-[22px] uppercase text-[#d8bb74]">Верный ответ</p>
              <h3 className="mx-auto mt-1 max-w-[640px] text-[clamp(30px,5vw,52px)] leading-[1.02] uppercase text-[#ffd98b] break-words [overflow-wrap:anywhere]">
                {winnerModal.answerRu}
              </h3>
              <p className="text-[22px] uppercase text-[#bfa573] mt-1 break-words [overflow-wrap:anywhere]">{winnerModal.answerOriginal}</p>

              <div className="mt-4 rounded-xl border border-[#71562f] bg-black/30 p-3">
                <p className="text-[24px] uppercase text-[#e5cb91] break-words [overflow-wrap:anywhere]">{winnerModal.username}</p>
              </div>

              <div className="mt-5 flex items-center justify-center">
                <Button
                  onClick={handleContinueAfterCorrect}
                  className="h-12 min-w-[270px] rounded-xl border border-[#7f6128] bg-[#efbf4a] hover:bg-[#ffcf5d] text-[#2f1e08] text-[28px] uppercase inline-flex items-center justify-center"
                >
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
