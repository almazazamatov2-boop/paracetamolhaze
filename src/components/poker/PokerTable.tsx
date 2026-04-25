'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  ArrowLeft, 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Trophy, 
  Coins,
  Settings as SettingsIcon,
  Users,
  LogOut,
  ChevronDown
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'
import { PokerLogic, type PokerPlayer, type PokerGameState, type Card } from '@/lib/pokerLogic'

// --- ASSETS ---
const WOOD_BG = '/brain/f56565b6-f5ec-4b06-8e0a-9e6e58636a4c/poker_wood_bg_1777137580035.png'
const FELT_TEXTURE = '/brain/f56565b6-f5ec-4b06-8e0a-9e6e58636a4c/poker_felt_texture_1777137596872.png'

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
    while (remaining >= d && chips.length < 5) {
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
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [currentBet, setCurrentBet] = useState(0)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])
  const [winnerInfo, setWinnerInfo] = useState<{ id: string; handName: string }[]>([])

  const videoRef = useRef<HTMLVideoElement>(null)
  const dealerIndexRef = useRef(0)
  const deckRef = useRef<Card[]>([])
  const fullStateRef = useRef<PokerGameState | null>(null)
  const myCardsRef = useRef<{ suit: string, value: string }[]>([])
  const [timeLeft, setTimeLeft] = useState(20)

  const myId = String(user?.id || user?.display_name || '')

  // --- LOGIC ---
  const playSound = (type: string) => {
    const audio = new Audio(`/audio/${type}.mp3`)
    audio.volume = 0.4
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
      const meInMsg = msg.players.find((p: any) => String(p.id) === myId)
      if (meInMsg?.cards?.length > 0) {
        const validCards = meInMsg.cards.filter((c: any) => c.suit !== 'X')
        if (validCards.length > 0) myCardsRef.current = validCards
      }

      const sanitized = msg.players.map((p: any) => {
        const isMe = String(p.id) === myId
        let cards: { suit: string, value: string }[]
        if (isMe) cards = myCardsRef.current.length > 0 ? myCardsRef.current : (p.cards || [])
        else if (isShowdown) cards = p.cards || []
        else cards = p.cards?.length > 0 ? p.cards.map(() => ({ suit: 'X', value: 'X' })) : []
        return { ...p, cards }
      })
      setPlayers(sanitized)
    }

    if (msg.pot !== undefined) setPot(msg.pot)
    if (msg.communityCards !== undefined) setCommunityCards(msg.communityCards)
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn !== undefined) setCurrentTurn(msg.currentTurn)
    if (msg.deck !== undefined) deckRef.current = msg.deck
    if (msg.dealerIndex !== undefined) dealerIndexRef.current = msg.dealerIndex
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
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || String(activePlayer.id) !== myId) return
    
    const nextState = PokerLogic.handleAction(state, myId, action, amount)
    deckRef.current = nextState.deck
    fullStateRef.current = nextState
    const currentTurnId = nextState.players[nextState.activePlayerIndex]?.id
    
    broadcastMessage({
      phase: nextState.phase,
      state: nextState.phase,
      players: nextState.players,
      pot: nextState.pot,
      sidePots: nextState.sidePots,
      currentBet: nextState.currentBet,
      currentTurn: currentTurnId,
      communityCards: nextState.communityCards,
      deck: nextState.deck,
      lastRaiserId: nextState.lastRaiserId,
      dealerIndex: nextState.dealerIndex,
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
    setWinnerInfo([])
    myCardsRef.current = []
    const meInState = newState.players.find(p => String(p.id) === myId)
    if (meInState?.cards) myCardsRef.current = meInState.cards
    deckRef.current = newState.deck
    fullStateRef.current = newState
    broadcastMessage({
      phase: newState.phase,
      state: newState.phase,
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

  // --- POSITIONING ---
  const getPlayerPosition = (index: number, size: number) => {
    // Top-down distribution like the screenshot
    const positions = [
      { top: '80%', left: '50%' }, // Me (Bottom)
      { top: '75%', left: '20%' }, // Bottom Left
      { top: '55%', left: '8%' },  // Mid Left
      { top: '35%', left: '8%' },  // Top Left
      { top: '15%', left: '35%' }, // Top Mid Left
      { top: '15%', left: '65%' }, // Top Mid Right
      { top: '35%', left: '92%' }, // Top Right
      { top: '55%', left: '92%' }, // Mid Right
      { top: '75%', left: '80%' }, // Bottom Right
    ]
    
    // Scale indices based on table size
    const actualIndex = Math.floor((index / size) * 9)
    const pos = positions[actualIndex] || positions[0]
    return { ...pos, transform: 'translate(-50%, -50%)' }
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

  return (
    <div className="fixed inset-0 overflow-hidden select-none text-white font-sans" style={{ backgroundImage: `url(${WOOD_BG})`, backgroundSize: 'cover' }}>
      
      {/* TOP LEFT INFO */}
      <div className="absolute top-6 left-6 z-50 glass-panel p-4 min-w-[180px] border-white/5 bg-black/40">
        <div className="text-sm font-bold text-white/80">NL Hold'em</div>
        <div className="text-lg font-black text-white">${settings.blind.toFixed(2)} / ${(settings.blind * 2).toFixed(2)}</div>
        <div className="mt-2 text-[10px] font-bold text-white/40 uppercase tracking-widest space-y-0.5">
          <div>Рука: #45678912</div>
          <div>Время: {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
        </div>
      </div>

      {/* TOP RIGHT BUTTONS */}
      <div className="absolute top-6 right-6 z-50 flex gap-2">
        <button className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-colors border-white/5 bg-black/40">
          <SettingsIcon className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Настройки</span>
        </button>
        <button onClick={() => window.location.reload()} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-colors border-white/5 bg-black/40">
          <Users className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Лобби</span>
        </button>
        <button onClick={onBack} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-red-500/20 transition-colors border-white/5 bg-black/40">
          <LogOut className="w-5 h-5 mb-1 opacity-60" />
          <span className="text-[10px] font-bold uppercase tracking-tighter opacity-60">Выйти</span>
        </button>
      </div>

      {/* TABLE SECTION */}
      <div className="absolute inset-0 flex items-center justify-center p-20">
        <div className="relative w-full max-w-[1200px] aspect-[2.2/1] rounded-[300px] border-[20px] border-[#2a1a12] shadow-[0_40px_100px_rgba(0,0,0,0.8)] overflow-hidden">
            {/* Table Interior */}
            <div className="absolute inset-0 bg-[#0d2a1e]" style={{ backgroundImage: `url(${FELT_TEXTURE})`, backgroundBlendMode: 'overlay', opacity: 0.95 }} />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.6)_100%)]" />
            
            {/* Inner Rim Decoration */}
            <div className="absolute inset-[30px] border-2 border-white/5 rounded-[270px] pointer-events-none" />

            {/* CENTER AREA */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-8">
                {/* Community Cards */}
                <div className="flex gap-4">
                    {communityCards.map((card, i) => (
                        <motion.div key={i} initial={{ scale: 0.8, opacity: 0, rotateY: 90 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }}>
                            <PokerCard suit={card.suit} value={card.value} className="w-20 h-32" />
                        </motion.div>
                    ))}
                    {Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                        <div key={i} className="w-20 h-32 rounded-xl border-2 border-white/5 bg-white/5" />
                    ))}
                </div>

                {/* Pot Display */}
                <div className="bg-black/40 backdrop-blur-md px-10 py-3 rounded-xl border border-white/10 shadow-2xl">
                    <span className="text-xl font-black italic tracking-tighter text-white/90">Банк: ${pot.toFixed(2)}</span>
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
                            <div className="flex gap-1 items-center">
                                {player.cards.map((card, idx) => (
                                    <motion.div key={idx} initial={{ y: 5, opacity: 0 }} animate={{ y: 0, opacity: 1 }}>
                                        <PokerCard suit={card.suit} value={card.value} isFlipped={card.suit === 'X'} className="w-12 h-18" />
                                    </motion.div>
                                ))}
                            </div>

                            {/* Player Box */}
                            <div className={`relative w-44 h-56 glass-panel overflow-hidden border-2 transition-all duration-300 ${player.isCurrent ? 'border-[#ff4500] ring-4 ring-[#ff4500]/20' : 'border-white/10'}`}>
                                {/* Header (Position Number) */}
                                <div className="absolute top-2 left-2 z-20 w-6 h-6 bg-black/60 rounded flex items-center justify-center text-[10px] font-black">{i + 1}</div>
                                {player.isDealer && <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">D</div>}
                                
                                {/* Webcam / Avatar Area */}
                                <div className="h-4/5 bg-black/20 relative">
                                    <img src={player.profile || '/poker/assets/ninja.png'} className="w-full h-full object-cover" alt="" />
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent" />
                                </div>

                                {/* Footer (Name & Balance) */}
                                <div className="absolute bottom-0 left-0 w-full p-2 text-center bg-black/80 backdrop-blur-md">
                                    <div className="text-sm font-bold truncate text-white/80">{player.name} {isMe && '(Вы)'}</div>
                                    <div className="text-sm font-black text-green-500">${player.chips.toFixed(2)}</div>
                                </div>
                            </div>

                            {/* Bet & Chips (Above) */}
                            {player.bet > 0 && (
                                <div className="absolute -top-16 left-1/2 -translate-x-1/2 flex flex-col items-center">
                                    <ChipsStack amount={player.bet} />
                                    <div className="mt-1 text-xs font-black text-white/80">${player.bet.toFixed(2)}</div>
                                </div>
                            )}
                        </div>
                    </motion.div>
                )
            })}
        </div>
      </div>

      {/* BOTTOM LEFT OPTIONS */}
      <div className="absolute bottom-10 left-10 z-50 glass-panel p-6 border-white/5 bg-black/60 space-y-4 min-w-[220px]">
        <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 rounded bg-white/10 border-white/20 checked:bg-[#ff4500]" />
            <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Фолд на любую ставку</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 rounded bg-white/10 border-white/20 checked:bg-[#ff4500]" />
            <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Пропускать раздачи</span>
        </label>
        <label className="flex items-center gap-3 cursor-pointer group">
            <input type="checkbox" className="w-5 h-5 rounded bg-white/10 border-white/20 checked:bg-[#ff4500]" />
            <span className="text-sm font-bold text-white/60 group-hover:text-white transition-colors">Авто-докупка</span>
        </label>
      </div>

      {/* BOTTOM RIGHT HUD */}
      <AnimatePresence>
        {isMyTurn && (
          <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 right-10 z-[60] flex flex-col items-end gap-4">
            
            {/* HUD Panel */}
            <div className="glass-panel p-6 bg-black/80 border-white/10 shadow-2xl w-[600px]">
                {/* Main Action Buttons */}
                <div className="flex gap-4 mb-6">
                    <button onClick={() => handleAction('fold')} className="flex-1 h-16 rounded-xl bg-red-900/40 hover:bg-red-800/60 border border-red-500/30 text-xl font-black italic uppercase transition-all shadow-lg">ФОЛД</button>
                    {canCheck ? (
                        <button onClick={() => handleAction('check')} className="flex-1 h-16 rounded-xl bg-green-900/40 hover:bg-green-800/60 border border-green-500/30 text-xl font-black italic uppercase transition-all shadow-lg">ЧЕК</button>
                    ) : (
                        <button onClick={() => handleAction('call')} className="flex-1 h-16 rounded-xl bg-green-900/40 hover:bg-green-800/60 border border-green-500/30 text-xl font-black italic uppercase transition-all shadow-lg flex flex-col items-center justify-center">
                            <span className="text-lg">КОЛЛ</span>
                            <span className="text-xs opacity-60">${(currentBet - (myPlayer?.bet || 0)).toFixed(2)}</span>
                        </button>
                    )}
                    <button onClick={() => handleAction('raise', raiseAmount)} className="flex-1 h-16 rounded-xl bg-green-900/40 hover:bg-green-800/60 border border-green-500/30 text-xl font-black italic uppercase transition-all shadow-lg flex flex-col items-center justify-center">
                        <span className="text-lg">РЕЙЗ ДО</span>
                        <span className="text-xs opacity-60">${raiseAmount.toFixed(2)}</span>
                    </button>
                </div>

                {/* Slider and Input */}
                <div className="flex items-center gap-6 mb-4">
                    <div className="flex items-center gap-3 w-12 text-white/40">
                        <button onClick={() => setRaiseAmount(prev => Math.max(prev - 10, 0))} className="p-1 hover:text-white">-</button>
                    </div>
                    <input type="range" min={currentBet * 2} max={myPlayer?.chips + (myPlayer?.bet || 0)} step={10} value={raiseAmount} onChange={(e) => setRaiseAmount(parseInt(e.target.value))} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4500]" />
                    <div className="flex items-center gap-3 w-12 text-white/40">
                        <button onClick={() => setRaiseAmount(prev => prev + 10)} className="p-1 hover:text-white">+</button>
                    </div>
                    <div className="w-24 bg-white/5 border border-white/10 rounded-lg p-2 text-center text-sm font-black italic text-white/90">${raiseAmount.toFixed(2)}</div>
                </div>

                {/* Preset Buttons */}
                <div className="grid grid-cols-5 gap-2">
                    {['МИН', '1/2', '2/3', 'ПОТ', 'МАКС'].map(label => (
                        <button key={label} className="py-2 bg-white/5 hover:bg-white/10 rounded-lg text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-white transition-all">{label}</button>
                    ))}
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* WINNER OVERLAY */}
      <AnimatePresence>
        {winnerInfo.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
             <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-panel p-20 text-center border-[#ff4500]/50 bg-black/60 shadow-[0_0_100px_rgba(255,69,0,0.2)]">
                <Trophy className="w-24 h-24 text-yellow-500 mx-auto mb-8 animate-bounce" />
                <h2 className="text-6xl font-black italic uppercase tracking-tighter mb-4">ПОБЕДИТЕЛЬ!</h2>
                <div className="text-3xl font-bold text-[#ff4500] mb-8 uppercase tracking-widest">{players.find(p => p.id === winnerInfo[0]?.id)?.name || 'Кто-то'}</div>
                <div className="text-white/40 font-bold uppercase tracking-[0.4em] mb-12">{winnerInfo[0]?.handName}</div>
                {joinedPlayers[0]?.id === myId && (
                    <button onClick={startNewGame} className="bg-[#ff4500] hover:bg-[#e63e00] text-white font-black py-5 px-16 rounded-2xl transition-all shadow-2xl shadow-[#ff4500]/20 uppercase tracking-widest text-xl italic">Следующая раздача</button>
                )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
