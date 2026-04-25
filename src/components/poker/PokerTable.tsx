'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings as SettingsIcon,
  Users,
  LogOut,
  HelpCircle,
  X,
  Trophy
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
  const colorClass = Object.entries(CHIP_COLORS).reverse().find(([v]) => value >= Number(v))?.[1] || CHIP_COLORS[1]
  return (
    <div className={`w-6 h-6 rounded-full border-2 ${colorClass} shadow-md flex items-center justify-center relative`} style={{ marginTop: index > 0 ? -18 : 0, zIndex: 50 + index }}>
      <span className="text-[6px] font-black">{value}</span>
    </div>
  )
}

const ChipsStack = ({ amount }: { amount: number }) => {
  const denominations = [5000, 1000, 500, 100, 25, 5, 1]
  const chips: number[] = []
  let remaining = amount
  denominations.forEach(d => { while (remaining >= d && chips.length < 10) { chips.push(d); remaining -= d } })
  return (
    <div className="flex flex-col-reverse items-center justify-center">
        {chips.map((val, i) => <PokerChip key={i} value={val} index={i} />)}
    </div>
  )
}

interface TableProps {
  roomId: string
  user: { id: string, display_name: string, profile_image_url: string }
  settings: {
    buyIn: number
    blind: number
    withWebcams: boolean
    ante?: number
    size: number
  }
  onBack: () => void
}

export default function PokerTable({ roomId, user, settings, onBack }: TableProps) {
  const [players, setPlayers] = useState<any[]>([])
  const [communityCards, setCommunityCards] = useState<{ suit: string, value: string }[]>([])
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState<string>('waiting')
  const [raiseAmount, setRaiseAmount] = useState(40)
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [peers, setPeers] = useState<Record<string, RTCPeerConnection>>({})
  const [currentBet, setCurrentBet] = useState(0)
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])
  const [winnerInfo, setWinnerInfo] = useState<{ id: string; handName: string }[]>([])
  const [showHandRanks, setShowHandRanks] = useState(false)

  const videoRef = useRef<HTMLVideoElement>(null)
  const dealerIndexRef = useRef(0)
  const fullStateRef = useRef<PokerGameState | null>(null)
  const myId = String(user?.id || user?.display_name || '')

  // --- LOGIC ---
  const broadcastMessage = (msg: any) => {
    supabase.channel(roomId).send({ type: 'broadcast', event: 'game_logic', payload: msg })
    applyGameMessage(msg)
  }

  const applyGameMessage = (msg: any) => {
    if (msg.phase !== undefined) setGameState(msg.phase)
    if (msg.players) setPlayers(msg.players.map((p: any) => {
        const isShowdown = (msg.phase || gameState) === 'showdown'
        const isMe = String(p.id) === myId
        let cards = p.cards || []
        if (!isMe && !isShowdown) cards = p.cards?.length > 0 ? p.cards.map(() => ({ suit: 'X', value: 'X' })) : []
        return { ...p, cards }
    }))
    if (msg.pot !== undefined) setPot(msg.pot)
    if (msg.communityCards !== undefined) setCommunityCards(msg.communityCards)
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn !== undefined) setCurrentTurn(msg.currentTurn)
    if (msg.winners !== undefined) setWinnerInfo(msg.winners || [])
  }

  const handleAction = (action: 'fold' | 'call' | 'raise' | 'check', amount?: number) => {
    if (!fullStateRef.current) return
    const nextState = PokerLogic.handleAction(fullStateRef.current, myId, action, amount)
    fullStateRef.current = nextState
    broadcastMessage({ phase: nextState.phase, players: nextState.players, pot: nextState.pot, currentBet: nextState.currentBet, currentTurn: nextState.players[nextState.activePlayerIndex]?.id, communityCards: nextState.communityCards, winners: nextState.winners || [] })
  }

  const startNewGame = () => {
    if (joinedPlayers.length < 2) return
    const playersWithChips = joinedPlayers.map(jp => ({ ...jp, chips: settings.buyIn }))
    dealerIndexRef.current = (dealerIndexRef.current + 1) % playersWithChips.length
    const newState = PokerLogic.prepareNewHand(playersWithChips, dealerIndexRef.current, settings.blind, settings.buyIn, settings.ante || 0)
    fullStateRef.current = newState
    broadcastMessage({ phase: newState.phase, players: newState.players, pot: newState.pot, currentBet: newState.currentBet, currentTurn: newState.players[newState.activePlayerIndex]?.id, communityCards: newState.communityCards, dealerIndex: newState.dealerIndex })
  }

  // --- WEBRTC & PRESENCE ---
  useEffect(() => {
    const channel = supabase.channel(roomId, { config: { presence: { key: myId } } })
    channel.on('presence', { event: 'sync' }, () => {
        const uniqueUsers = Array.from(new Map((Object.values(channel.presenceState()).flat() as any[]).map(u => [u.id, u])).values())
        setJoinedPlayers(uniqueUsers)
    })
    .on('broadcast', { event: 'game_logic' }, (payload) => applyGameMessage(payload.payload))
    .subscribe(async (status) => { if (status === 'SUBSCRIBED') await channel.track({ id: user.id, display_name: user.display_name, profile_image_url: user.profile_image_url }) })
    return () => { channel.unsubscribe() }
  }, [roomId])

  useEffect(() => {
    if (!settings.withWebcams) return
    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then(stream => {
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
    })
  }, [])

  // --- EXACT PIXEL COORDINATES ---
  const getPlayerPosition = (index: number) => {
    const positions = [
        { left: 890, top: 760 }, // YOU (Bottom Center)
        { left: 580, top: 650 }, // Bottom Left
        { left: 450, top: 420 }, // Left
        { left: 580, top: 260 }, // Top Left
        { left: 890, top: 180 }, // Top Center
        { left: 1200, top: 260 }, // Top Right
        { left: 1320, top: 420 }, // Right
        { left: 1200, top: 650 }, // Bottom Right
        { left: 1450, top: 760 }, // (Extra seat if 9)
    ]
    const p = positions[index % positions.length]
    return { left: `${p.left}px`, top: `${p.top}px`, position: 'absolute' as const }
  }

  const isMyTurn = String(currentTurn) === myId
  const myPlayer = players.find(p => String(p.id) === myId)
  const canCheck = (myPlayer?.bet || 0) >= currentBet

  return (
    <div className="fixed inset-0 w-[1920px] h-[1080px] bg-[#2b1e14] overflow-hidden select-none text-white font-sans left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 origin-center scale-[0.8] 2xl:scale-100">
      
      {/* TOP LEFT INFO */}
      <div className="absolute left-[60px] top-[40px] z-40">
        <div className="text-2xl font-bold opacity-80 mb-1">NL Hold'em</div>
        <div className="text-[28px] font-bold">${settings.blind.toFixed(2)} / ${(settings.blind * 2).toFixed(2)}</div>
      </div>

      {/* TOP RIGHT BUTTONS */}
      <div className="absolute right-[60px] top-[40px] z-40 flex gap-4">
        {[ {icon: <SettingsIcon />, label: 'Настройки'}, {icon: <Users />, label: 'Лобби'}, {icon: <LogOut />, label: 'Выйти'} ].map((b, i) => (
            <button key={i} onClick={i > 0 ? onBack : undefined} className="w-[90px] h-[90px] bg-black/50 border border-white/10 rounded-xl flex flex-col items-center justify-center group hover:bg-white/10 transition-all">
                <div className="text-white/40 group-hover:text-white mb-1">{b.icon}</div>
                <div className="text-[10px] font-bold text-white/40 group-hover:text-white uppercase">{b.label}</div>
            </button>
        ))}
      </div>

      {/* POKER TABLE OVAL */}
      <div className="absolute left-[500px] top-[280px] w-[920px] height-[520px] h-[520px] bg-[#1f4d2b] rounded-[460px] border-[15px] border-[#3d2a1d] shadow-[inset_0_0_80px_rgba(0,0,0,0.9)] overflow-hidden">
            {/* Center Area */}
            <div className="absolute top-[210px] left-1/2 -translate-x-1/2 bg-black/40 px-6 py-2 rounded-xl text-xl font-bold">
                Банк: ${pot.toFixed(2)}
            </div>

            {/* Card Slots */}
            <div className="absolute top-[240px] left-1/2 -translate-x-1/2 flex gap-[10px]">
                {Array.from({ length: 5 }).map((_, i) => {
                    const card = communityCards[i]
                    return (
                        <div key={i} className="w-[60px] h-[85px] bg-[#2e6b3c] border border-white/10 rounded-lg flex items-center justify-center">
                            {card && <PokerCard suit={card.suit as any} value={card.value as any} className="w-full h-full" />}
                        </div>
                    )
                })}
            </div>
      </div>

      {/* PLAYERS */}
      {joinedPlayers.map((presencePlayer, i) => {
          const pId = String(presencePlayer.id)
          const isMe = pId === myId
          const gp = players.find(p => String(p.id) === pId)
          const pos = getPlayerPosition(i)
          
          return (
              <div key={pId} style={pos} className={`w-[140px] flex flex-col items-center z-30 transition-all ${gp?.folded ? 'opacity-30 grayscale' : ''}`}>
                  {/* Video/Avatar Box */}
                  <div className={`w-[140px] h-[100px] bg-[#121212] rounded-lg border-2 ${isMe ? 'border-orange-500 shadow-[0_0_15px_rgba(243,156,18,0.3)]' : 'border-white/10'} overflow-hidden relative`}>
                      {isMe ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror" /> : <img src={presencePlayer.profile_image_url || 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + pId} className="w-full h-full object-cover" />}
                      <div className="absolute bottom-0 left-0 w-full bg-black/60 p-1 text-[10px] text-center font-bold truncate">{presencePlayer.display_name}</div>
                      {gp?.isDealer && <div className="absolute top-1 right-1 w-5 h-5 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black">D</div>}
                  </div>
                  
                  {/* Cards & Chips */}
                  <div className="mt-1 font-bold text-green-500">${(gp?.chips ?? settings.buyIn).toFixed(2)}</div>
                  <div className="flex gap-1 mt-1">
                      {gp?.cards?.map((c: any, ci: number) => <PokerCard key={ci} suit={c.suit} value={c.value} isFlipped={c.suit === 'X'} className="w-8 h-12 rounded shadow-lg" />)}
                  </div>
                  
                  {/* Bet Amount */}
                  {gp?.bet > 0 && (
                      <div className="absolute -top-16 flex flex-col items-center">
                          <ChipsStack amount={gp.bet} />
                          <div className="bg-black/80 px-3 py-0.5 rounded-full text-[10px] font-bold text-white mt-1 border border-white/5">${gp.bet.toFixed(2)}</div>
                      </div>
                  )}
              </div>
          )
      })}

      {/* BETTING PANEL */}
      <div className="absolute left-[1450px] top-[700px] w-[410px] height-[280px] bg-[#121212]/95 border border-white/10 rounded-xl p-6 shadow-2xl flex flex-col justify-between z-50 transition-opacity" style={{ opacity: isMyTurn ? 1 : 0.5, pointerEvents: isMyTurn ? 'auto' : 'none' }}>
            <div className="flex gap-3 h-[60px]">
                <button onClick={() => handleAction('fold')} className="flex-1 bg-[#b03030] rounded-lg font-bold text-lg hover:opacity-80">ФОЛД</button>
                <button onClick={() => handleAction('call')} className="flex-1 bg-[#2d9cdb] rounded-lg font-bold text-lg hover:opacity-80 flex flex-col items-center justify-center">
                    КОЛЛ
                    <small className="text-xs opacity-70 mt-1">${(currentBet - (myPlayer?.bet || 0)).toFixed(2)}</small>
                </button>
                <button onClick={() => handleAction('raise', raiseAmount)} className="flex-1 bg-[#2ecc71] rounded-lg font-bold text-lg hover:opacity-80 flex flex-col items-center justify-center">
                    РЕЙЗ ДО
                    <small className="text-xs opacity-70 mt-1">${raiseAmount.toFixed(2)}</small>
                </button>
            </div>

            <div className="my-5 flex items-center gap-4">
                <button onClick={() => setRaiseAmount(p => Math.max(p - settings.blind, currentBet * 2))} className="w-10 h-10 rounded-full bg-white/10 text-xl font-bold">-</button>
                <input type="range" min={currentBet * 2} max={myPlayer?.chips + (myPlayer?.bet || 0)} step={settings.blind} value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} className="flex-1 h-1 bg-white/10 accent-green-500 appearance-none" />
                <button onClick={() => setRaiseAmount(p => p + settings.blind)} className="w-10 h-10 rounded-full bg-white/10 text-xl font-bold">+</button>
                <div className="w-24 bg-black/60 border border-white/10 rounded-lg p-2 text-center text-orange-400 font-bold">${raiseAmount.toFixed(2)}</div>
            </div>

            <div className="flex gap-2">
                {['МИН', '1/2', '2/3', 'ПОТ', 'МАКС'].map(l => <button key={l} className="flex-1 bg-white/5 border border-white/5 py-2 rounded-lg text-[10px] font-bold text-white/50 hover:text-white transition-all">{l}</button>)}
            </div>
      </div>

      {/* BOTTOM LEFT OPTIONS */}
      <div className="absolute left-[60px] bottom-[60px] bg-black/60 p-5 rounded-xl flex flex-col gap-3 border border-white/5 z-40">
          <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-green-500" /> Фолд на любую ставку</label>
          <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer"><input type="checkbox" defaultChecked className="w-4 h-4 accent-green-500" /> Пропускать раздачи</label>
          <label className="flex items-center gap-3 text-sm text-white/70 cursor-pointer"><input type="checkbox" className="w-4 h-4 accent-green-500" /> Авто-докупка</label>
      </div>

      {/* HELP BUTTON */}
      <button onClick={() => setShowHandRanks(true)} className="absolute right-[60px] bottom-[60px] w-14 h-14 bg-black/60 rounded-full flex items-center justify-center text-white/20 hover:text-white transition-colors border border-white/5 z-40">
          <HelpCircle className="w-7 h-7" />
      </button>

      {/* WINNER OVERLAY */}
      <AnimatePresence>
        {winnerInfo.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-xl">
             <div className="bg-black/60 p-16 rounded-[40px] border border-orange-500/50 text-center shadow-[0_0_100px_rgba(255,165,0,0.2)]">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6 animate-bounce" />
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4">ПОБЕДИТЕЛЬ!</h2>
                <div className="text-3xl font-bold text-orange-500 uppercase">{players.find(p => p.id === winnerInfo[0]?.id)?.name || 'Кто-то'}</div>
                <div className="text-white/40 uppercase tracking-[0.4em] mt-2 mb-12 text-sm">{winnerInfo[0]?.handName}</div>
                {joinedPlayers[0]?.id === myId && (<button onClick={startNewGame} className="w-full bg-orange-500 hover:bg-orange-600 py-5 rounded-2xl font-black text-xl italic uppercase tracking-widest shadow-2xl">Следующая раздача</button>)}
             </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx>{`
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  )
}
