'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Trophy, 
  Settings as SettingsIcon,
  Users,
  LogOut,
  HelpCircle,
  X,
  Volume2,
  VolumeX,
  Camera,
  RotateCcw
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'
import { PokerLogic, type PokerPlayer, type PokerGameState, type Card } from '@/lib/pokerLogic'

// --- POKER CHIP COMPONENT ---
const CHIP_COLORS: Record<number, string> = {
  1: 'bg-slate-200 border-slate-400 text-slate-800',
  5: 'bg-red-600 border-red-800 text-white',
  25: 'bg-green-600 border-green-800 text-white',
  100: 'bg-black border-gray-800 text-white',
  500: 'bg-blue-600 border-blue-800 text-white',
  1000: 'bg-orange-500 border-orange-700 text-white',
  5000: 'bg-yellow-500 border-yellow-700 text-white',
}

const PokerChip = ({ value, index }: { value: number, index: number }) => {
  const colorClass = Object.entries(CHIP_COLORS)
    .reverse()
    .find(([v]) => value >= Number(v))?.[1] || CHIP_COLORS[1]

  return (
    <motion.div
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-6 h-6 rounded-full border-2 ${colorClass} shadow-md flex items-center justify-center relative`}
      style={{ 
        marginTop: index > 0 ? -18 : 0, 
        zIndex: 50 + index,
      }}
    >
      <span className="text-[6px] font-black">{value}</span>
    </motion.div>
  )
}

const ChipsStack = ({ amount, className = "" }: { amount: number, className?: string }) => {
  const denominations = [5000, 1000, 500, 100, 25, 5, 1]
  const chips: number[] = []
  let remaining = amount
  
  denominations.forEach(d => {
    while (remaining >= d && chips.length < 10) {
      chips.push(d)
      remaining -= d
    }
  })

  return (
    <div className={`flex flex-col-reverse items-center justify-center ${className}`}>
        {chips.map((val, i) => <PokerChip key={i} value={val} index={i} />)}
    </div>
  )
}

interface TableProps {
  roomId: string
  user: { id: string, display_name: string, profile_image_url: string }
  settings: {
    name: string
    size: number
    buyIn: number
    blind: number
    withWebcams: boolean
    password?: string
    ante?: number
  }
  onBack: () => void
}

export default function PokerTable({ roomId, user, settings, onBack }: TableProps) {
  const [players, setPlayers] = useState<any[]>([])
  const [communityCards, setCommunityCards] = useState<{ suit: string, value: string }[]>([])
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('waiting')
  const [raiseAmount, setRaiseAmount] = useState(40)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [volumeMusic, setVolumeMusic] = useState(50)
  const [volumeSFX, setVolumeSFX] = useState(70)
  const [showSettings, setShowSettings] = useState(false)
  const [showHandRanks, setShowHandRanks] = useState(false)
  
  const [currentBet, setCurrentBet] = useState(0)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])
  const [winnerInfo, setWinnerInfo] = useState<{ id: string; handName: string }[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const dealerIndexRef = useRef(0)
  const deckRef = useRef<Card[]>([])
  const fullStateRef = useRef<PokerGameState | null>(null)
  const myCardsRef = useRef<{ suit: string, value: string }[]>([])

  const myId = String(user?.id || user?.display_name || '')

  // --- LOGIC ---
  const playSound = (type: string) => {
    const audio = new Audio(`/audio/${type}.mp3`)
    audio.volume = volumeSFX / 100
    audio.play().catch(() => {})
  }

  const broadcastMessage = (msg: any) => {
    if (!roomId) return
    supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'game_logic',
      payload: msg
    })
    applyGameMessage(msg)
  }

  const applyGameMessage = (msg: any) => {
    if (msg.phase !== undefined) setGameState(msg.phase)
    else if (msg.state !== undefined) setGameState(msg.state)

    if (msg.players) {
      const isShowdown = (msg.phase || msg.state) === 'showdown'
      const sanitized = msg.players.map((p: any) => {
        const isMe = String(p.id) === myId
        let cards = p.cards || []
        if (!isMe && !isShowdown) {
          cards = p.cards?.length > 0 ? p.cards.map(() => ({ suit: 'X', value: 'X' })) : []
        }
        return { ...p, cards }
      })
      setPlayers(sanitized)
    }

    if (msg.pot !== undefined) setPot(msg.pot)
    if (msg.communityCards !== undefined) setCommunityCards(msg.communityCards)
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn !== undefined) setCurrentTurn(msg.currentTurn)
    if (msg.winners !== undefined) setWinnerInfo(msg.winners || [])

    if (msg.players && msg.deck !== undefined) {
      fullStateRef.current = {
        players: msg.players, 
        pot: msg.pot ?? pot,
        sidePots: msg.sidePots ?? [],
        currentBet: msg.currentBet ?? currentBet,
        dealerIndex: msg.dealerIndex ?? dealerIndexRef.current,
        activePlayerIndex: msg.players.findIndex((p: any) => String(p.id) === String(msg.currentTurn)),
        phase: msg.phase || msg.state || 'waiting',
        communityCards: msg.communityCards ?? communityCards,
        lastRaiserId: msg.lastRaiserId ?? null,
        deck: msg.deck,
        winners: msg.winners,
      }
    }
  }

  const handleAction = (action: 'fold' | 'call' | 'raise' | 'check', amount?: number) => {
    if (!fullStateRef.current) return
    const state = fullStateRef.current
    const nextState = PokerLogic.handleAction(state, myId, action, amount)
    fullStateRef.current = nextState
    broadcastMessage({
      phase: nextState.phase,
      players: nextState.players,
      pot: nextState.pot,
      currentBet: nextState.currentBet,
      currentTurn: nextState.players[nextState.activePlayerIndex]?.id,
      communityCards: nextState.communityCards,
      deck: nextState.deck,
      winners: nextState.winners || [],
    })
  }

  const startNewGame = () => {
    if (joinedPlayers.length < 2) return
    const playersWithChips = joinedPlayers.map(jp => {
      const prev = players.find(p => String(p.id) === String(jp.id))
      return { ...jp, chips: prev?.chips && prev.chips > 0 ? prev.chips : settings.buyIn }
    })
    dealerIndexRef.current = (dealerIndexRef.current + 1) % playersWithChips.length
    const newState = PokerLogic.prepareNewHand(playersWithChips, dealerIndexRef.current, settings.blind, settings.buyIn, settings.ante || 0)
    broadcastMessage({
      phase: newState.phase,
      players: newState.players,
      pot: newState.pot,
      currentBet: newState.currentBet,
      currentTurn: newState.players[newState.activePlayerIndex]?.id,
      communityCards: newState.communityCards,
      deck: newState.deck,
      dealerIndex: newState.dealerIndex,
    })
  }

  // --- PRESENCE ---
  useEffect(() => {
    if (!user || !roomId) return
    const channel = supabase.channel(roomId, { config: { presence: { key: myId } } })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineUsers = Object.values(state).flat() as any[]
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.id, u])).values())
        setJoinedPlayers(uniqueUsers)
        if (uniqueUsers[0]?.id === myId) {
          supabase.from('poker_lobbies').update({ players_count: uniqueUsers.length }).eq('id', roomId).then()
        }
      })
      .on('broadcast', { event: 'game_logic' }, (payload) => applyGameMessage(payload.payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id || user.display_name,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
          })
        }
      })
    return () => { channel.unsubscribe() }
  }, [user, roomId])

  // --- WEBCAMS ---
  useEffect(() => {
    if (!settings.withWebcams) return
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(err => console.error('Webcam error:', err))
  }, [settings.withWebcams])

  useEffect(() => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => track.enabled = isVideoOn)
      localStream.getAudioTracks().forEach(track => track.enabled = isMicOn)
    }
  }, [isVideoOn, isMicOn, localStream])

  // --- POSITIONING ---
  const getPlayerPosition = (index: number, size: number) => {
    const positions = [
      { top: '82%', left: '50%' }, // Bottom (Me)
      { top: '75%', left: '22%' }, // Bottom Left
      { top: '50%', left: '10%' }, // Mid Left
      { top: '25%', left: '22%' }, // Top Left
      { top: '15%', left: '50%' }, // Top Mid
      { top: '25%', left: '78%' }, // Top Right
      { top: '50%', left: '90%' }, // Mid Right
      { top: '75%', left: '78%' }, // Bottom Right
    ]
    const p = positions[index % positions.length]
    return { ...p, transform: 'translate(-50%, -50%)' }
  }

  const playersWithState = useMemo(() => {
    return Array.from({ length: settings.size }).map((_, i) => {
      const presencePlayer = joinedPlayers[i]
      if (!presencePlayer) return null
      const presenceId = String(presencePlayer.id)
      const gp = players.find(p => String(p.id) === presenceId)
      return {
        id: presencePlayer.id,
        name: presencePlayer.display_name || 'Игрок',
        profile: presencePlayer.profile_image_url,
        chips: gp?.chips ?? settings.buyIn,
        isCurrent: presenceId === String(currentTurn),
        isDealer: gp?.isDealer || false,
        folded: gp?.folded || false,
        bet: gp?.bet || 0,
        cards: gp?.cards || [],
      }
    })
  }, [joinedPlayers, players, settings, currentTurn])

  const isMyTurn = String(currentTurn) === myId
  const myPlayer = players.find(p => String(p.id) === myId)
  const canCheck = (myPlayer?.bet || 0) >= currentBet

  // Hand Rankings for help modal
  const handRankings = [
    { name: 'Рояль-флеш', desc: 'A, K, Q, J, 10 одной масти' },
    { name: 'Стрит-флеш', desc: '5 карт одной масти подряд' },
    { name: 'Каре', desc: '4 карты одного достоинства' },
    { name: 'Фулл-хаус', desc: 'Тройка и пара' },
    { name: 'Флеш', desc: '5 карт одной масти' },
    { name: 'Стрит', desc: '5 карт подряд разных мастей' },
    { name: 'Сет (Тройка)', desc: '3 карты одного достоинства' },
    { name: 'Две пары', desc: 'Две разные пары карт' },
    { name: 'Пара', desc: 'Две карты одного достоинства' },
    { name: 'Старшая карта', desc: 'Самая высокая карта в руке' },
  ]

  return (
    <div className="fixed inset-0 overflow-hidden select-none text-white font-sans bg-[#0a0a0a]">
      
      {/* PROFESSIONAL TEXTURED BACKGROUND (CSS BASED) */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{
        backgroundImage: `radial-gradient(circle at 50% 50%, #2c1d12 0%, #000 100%)`,
      }} />
      <div className="absolute inset-0 pointer-events-none opacity-20" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")`,
      }} />

      {/* TOP LEFT INFO */}
      <div className="absolute top-6 left-6 z-40 glass-panel p-4 min-w-[180px] border-white/5 bg-black/60 shadow-2xl">
        <div className="text-sm font-bold text-white/80">NL Hold'em</div>
        <div className="text-xl font-black text-white">${settings.blind.toFixed(2)} / ${(settings.blind * 2).toFixed(2)}</div>
        <div className="mt-2 text-[10px] font-bold text-white/40 uppercase tracking-widest space-y-0.5">
          <div>Рука: #45678912</div>
          <div>Время: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* TOP RIGHT BUTTONS */}
      <div className="absolute top-6 right-6 z-40 flex gap-3">
        <button onClick={() => setShowSettings(true)} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-colors border-white/5 bg-black/60 shadow-xl">
          <SettingsIcon className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Настройки</span>
        </button>
        <button onClick={onBack} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-colors border-white/5 bg-black/60 shadow-xl">
          <Users className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Лобби</span>
        </button>
        <button onClick={onBack} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-red-500/20 transition-colors border-white/5 bg-black/60 shadow-xl">
          <LogOut className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Выйти</span>
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="absolute inset-0 flex items-center justify-center p-20">
        <div className="relative w-full max-w-[1100px] aspect-[2.1/1] rounded-[280px] border-[18px] border-[#3a2a1f] shadow-[0_40px_100px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Table Interior (Felt) */}
            <div className="absolute inset-0 bg-[#073b2a]" style={{
                backgroundImage: `radial-gradient(circle at 50% 50%, #0a4d38 0%, #063125 100%)`,
            }} />
            <div className="absolute inset-0 opacity-30 pointer-events-none" style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                mixBlendMode: 'overlay'
            }} />
            
            {/* Inner Rim Decoration */}
            <div className="absolute inset-[25px] border-2 border-white/10 rounded-[250px] pointer-events-none" />

            {/* CENTER AREA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-10">
                {/* Community Cards */}
                <div className="flex gap-4">
                    {communityCards.map((card, i) => (
                        <motion.div key={i} initial={{ scale: 0.8, opacity: 0, rotateY: 90 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }} transition={{ delay: i * 0.1 }}>
                            <PokerCard suit={card.suit} value={card.value} className="w-20 h-30" />
                        </motion.div>
                    ))}
                    {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                        <div key={i} className="w-20 h-30 rounded-xl border-2 border-white/5 bg-black/20" />
                    ))}
                </div>

                {/* Pot Display */}
                <div className="bg-black/60 backdrop-blur-xl px-12 py-3.5 rounded-2xl border border-white/10 shadow-2xl">
                    <span className="text-2xl font-black italic tracking-tighter text-white">Банк: ${pot.toFixed(2)}</span>
                </div>
            </div>
        </div>

        {/* PLAYERS SECTION */}
        <div className="absolute inset-0 pointer-events-none">
            {playersWithState.map((player, i) => {
                if (!player) return null
                const pos = getPlayerPosition(i, settings.size)
                const isMe = String(player.id) === myId
                
                return (
                    <motion.div key={player.id} className="absolute pointer-events-auto" style={pos}>
                        <div className={`relative flex gap-4 ${player.folded ? 'opacity-40 grayscale' : ''}`}>
                            
                            {/* Cards (Next to Webcam) */}
                            <div className="flex flex-col gap-1 justify-center">
                                {player.cards.map((card, idx) => (
                                    <motion.div key={idx} initial={{ x: 10, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}>
                                        <PokerCard suit={card.suit} value={card.value} isFlipped={card.suit === 'X'} className="w-12 h-18 shadow-2xl" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Player Box */}
                            <div className={`relative w-40 h-52 glass-panel overflow-hidden border-2 transition-all duration-500 ${player.isCurrent ? 'border-[#ff4500] ring-[6px] ring-[#ff4500]/30 shadow-[0_0_30px_rgba(255,69,0,0.4)]' : 'border-white/10'}`}>
                                {/* Header (Position Number) */}
                                <div className="absolute top-2 left-2 z-20 w-6 h-6 bg-black/60 rounded flex items-center justify-center text-[10px] font-black border border-white/10">{i + 1}</div>
                                {player.isDealer && <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">D</div>}
                                
                                {/* Webcam Area */}
                                <div className="h-[82%] bg-black/40 relative group">
                                    {isMe && settings.withWebcams ? (
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" />
                                    ) : (
                                        <img src={player.profile || '/poker/assets/ninja.png'} className="w-full h-full object-cover opacity-80" alt="" />
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-80" />
                                </div>

                                {/* Footer (Name & Balance) */}
                                <div className="absolute bottom-0 left-0 w-full p-2.5 text-center bg-black/90 backdrop-blur-md border-t border-white/5">
                                    <div className="text-[11px] font-black truncate text-white uppercase tracking-wider">{player.name} {isMe && '(Вы)'}</div>
                                    <div className="text-[13px] font-black text-green-400 mt-0.5">${player.chips.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Bet & Chips Display */}
                            {player.bet > 0 && (
                                <div className="absolute -top-20 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <ChipsStack amount={player.bet} />
                                    <div className="mt-2 bg-black/60 px-3 py-1 rounded-full text-[10px] font-black text-white/90 border border-white/10 shadow-lg">${player.bet.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
      </div>

      {/* BOTTOM LEFT OPTIONS */}
      <div className="absolute bottom-8 left-8 z-40 glass-panel p-6 border-white/5 bg-black/70 space-y-4 min-w-[220px] shadow-2xl">
        {['Фолд на любую ставку', 'Пропускать раздачи', 'Авто-докупка'].map((label, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <input type="checkbox" className="w-5 h-5 rounded border-2 border-white/20 bg-white/5 checked:bg-[#ff4500] checked:border-[#ff4500] transition-all cursor-pointer" />
                <span className="text-xs font-black uppercase tracking-widest text-white/40 group-hover:text-white transition-colors">{label}</span>
            </label>
        ))}
      </div>

      {/* BOTTOM RIGHT HELP BUTTON */}
      <div className="absolute bottom-8 right-[630px] z-40">
        <button onClick={() => setShowHandRanks(true)} className="w-12 h-12 glass-panel flex items-center justify-center hover:bg-white/10 transition-all border-white/10 bg-black/60 shadow-xl">
            <HelpCircle className="w-6 h-6 opacity-40 hover:opacity-100 transition-opacity" />
        </button>
      </div>

      {/* BOTTOM RIGHT HUD */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div initial={{ y: 100, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 100, opacity: 0 }} className="absolute bottom-8 right-8 z-50 flex flex-col items-end gap-4">
            
            {/* HUD Panel */}
            <div className="glass-panel p-6 bg-black/90 border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.8)] w-[600px]">
                {/* Main Action Buttons */}
                <div className="flex gap-4 mb-6 h-20">
                    <button onClick={() => handleAction('fold')} className="flex-1 rounded-2xl bg-red-950/40 hover:bg-red-900/60 border-2 border-red-500/20 text-2xl font-black italic uppercase transition-all shadow-xl active:scale-95 group">
                        <span className="group-hover:scale-110 transition-transform block">ФОЛД</span>
                    </button>
                    {canCheck ? (
                        <button onClick={() => handleAction('check')} className="flex-1 rounded-2xl bg-green-950/40 hover:bg-green-900/60 border-2 border-green-500/20 text-2xl font-black italic uppercase transition-all shadow-xl active:scale-95 group">
                            <span className="group-hover:scale-110 transition-transform block">ЧЕК</span>
                        </button>
                    ) : (
                        <button onClick={() => handleAction('call')} className="flex-1 rounded-2xl bg-green-950/40 hover:bg-green-900/60 border-2 border-green-500/20 text-2xl font-black italic uppercase transition-all shadow-xl active:scale-95 group flex flex-col items-center justify-center">
                            <span className="group-hover:scale-110 transition-transform block">КОЛЛ</span>
                            <span className="text-xs font-bold text-green-400 mt-1">${(currentBet - (myPlayer?.bet || 0)).toFixed(2)}</span>
                        </button>
                    )}
                    <button onClick={() => handleAction('raise', raiseAmount)} className="flex-1 rounded-2xl bg-green-950/40 hover:bg-green-900/60 border-2 border-green-500/20 text-2xl font-black italic uppercase transition-all shadow-xl active:scale-95 group flex flex-col items-center justify-center">
                        <span className="group-hover:scale-110 transition-transform block">РЕЙЗ ДО</span>
                        <span className="text-xs font-bold text-green-400 mt-1">${raiseAmount.toFixed(2)}</span>
                    </button>
                </div>

                {/* Slider and Input */}
                <div className="flex items-center gap-6 mb-6 px-2">
                    <button onClick={() => setRaiseAmount(prev => Math.max(prev - settings.blind, currentBet * 2))} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-2xl transition-colors">-</button>
                    <input type="range" min={currentBet * 2} max={myPlayer?.chips + (myPlayer?.bet || 0)} step={settings.blind} value={raiseAmount} onChange={(e) => setRaiseAmount(parseInt(e.target.value))} className="flex-1 h-2.5 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4500]" />
                    <button onClick={() => setRaiseAmount(prev => prev + settings.blind)} className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full text-2xl transition-colors">+</button>
                    <div className="w-28 bg-black/60 border border-white/10 rounded-xl p-3 text-center text-lg font-black italic text-[#ff4500] shadow-inner">${raiseAmount.toFixed(2)}</div>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-5 gap-3">
                    {['МИН', '1/2', '2/3', 'ПОТ', 'МАКС'].map(label => (
                        <button key={label} className="py-3 bg-white/5 hover:bg-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all border border-white/5">{label}</button>
                    ))}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-panel p-10 max-w-md w-full bg-black/80 border-white/10">
                <div className="flex justify-between items-center mb-8">
                    <h2 className="text-3xl font-black italic uppercase tracking-tighter">Настройки</h2>
                    <button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6" /></button>
                </div>
                
                <div className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Громкость музыки</label>
                        <div className="flex items-center gap-4">
                            <Volume2 className="w-5 h-5 text-white/60" />
                            <input type="range" value={volumeMusic} onChange={e => setVolumeMusic(parseInt(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-[#ff4500]" />
                            <span className="text-sm font-bold w-8">{volumeMusic}%</span>
                        </div>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase tracking-widest text-white/40 mb-4">Громкость эффектов</label>
                        <div className="flex items-center gap-4">
                            <Volume2 className="w-5 h-5 text-white/60" />
                            <input type="range" value={volumeSFX} onChange={e => setVolumeSFX(parseInt(e.target.value))} className="flex-1 h-1.5 bg-white/10 rounded-lg appearance-none accent-[#ff4500]" />
                            <span className="text-sm font-bold w-8">{volumeSFX}%</span>
                        </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase transition-all ${isVideoOn ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50'}`}>
                            {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                            {isVideoOn ? 'Камера ВКЛ' : 'Камера ВЫКЛ'}
                        </button>
                        <button onClick={() => setIsMicOn(!isMicOn)} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-sm uppercase transition-all ${isMicOn ? 'bg-green-500/10 text-green-500 border border-green-500/50' : 'bg-red-500/10 text-red-500 border border-red-500/50'}`}>
                            {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                            {isMicOn ? 'Мик ВКЛ' : 'Мик ВЫКЛ'}
                        </button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* HAND RANKS MODAL */}
      <AnimatePresence>
        {showHandRanks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setShowHandRanks(false)}>
             <motion.div initial={{ scale: 0.9, x: 100 }} animate={{ scale: 1, x: 0 }} className="glass-panel p-8 max-w-sm w-full bg-black/90 border-white/10" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-black italic uppercase tracking-tighter">Комбинации</h2>
                    <button onClick={() => setShowHandRanks(false)} className="p-1 hover:bg-white/10 rounded-full"><X className="w-5 h-5" /></button>
                </div>
                <div className="space-y-4">
                    {handRankings.map((rank, i) => (
                        <div key={i} className="flex flex-col border-b border-white/5 pb-2 last:border-0">
                            <span className="text-xs font-black text-[#ff4500] uppercase tracking-wider">{rank.name}</span>
                            <span className="text-[10px] text-white/40 font-bold">{rank.desc}</span>
                        </div>
                    ))}
                </div>
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINNER OVERLAY */}
      <AnimatePresence>
        {winnerInfo.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-panel p-16 text-center border-[#ff4500]/50 bg-black/60 shadow-[0_0_100px_rgba(255,69,0,0.3)]">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">ПОБЕДИТЕЛЬ!</h2>
                <div className="text-3xl font-black text-[#ff4500] mb-6 uppercase tracking-widest">{players.find(p => p.id === winnerInfo[0]?.id)?.name || 'Кто-то'}</div>
                <div className="text-white/40 font-black uppercase tracking-[0.4em] mb-12 text-sm">{winnerInfo[0]?.handName}</div>
                {joinedPlayers[0]?.id === myId && (
                    <button onClick={startNewGame} className="bg-[#ff4500] hover:bg-[#e63e00] text-white font-black py-4 px-12 rounded-2xl transition-all shadow-2xl shadow-[#ff4500]/40 uppercase tracking-widest text-lg italic">Следующая раздача</button>
                )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
