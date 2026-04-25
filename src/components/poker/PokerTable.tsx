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
  Camera
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
      style={{ marginTop: index > 0 ? -18 : 0, zIndex: 50 + index }}
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
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [peers, setPeers] = useState<Record<string, RTCPeerConnection>>({})
  
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideo, setSelectedVideo] = useState<string>('')
  const [selectedAudio, setSelectedAudio] = useState<string>('')
  
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

  const myId = String(user?.id || user?.display_name || '')

  // --- LOGIC ---
  const broadcastMessage = (msg: any) => {
    if (!roomId) return
    supabase.channel(roomId).send({ type: 'broadcast', event: 'game_logic', payload: msg })
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
        if (!isMe && !isShowdown) cards = p.cards?.length > 0 ? p.cards.map(() => ({ suit: 'X', value: 'X' })) : []
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
    const nextState = PokerLogic.handleAction(fullStateRef.current, myId, action, amount)
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

  // --- WEBRTC SIGNALING ---
  const createPeer = (targetId: string, stream: MediaStream) => {
    const pc = new RTCPeerConnection({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    stream.getTracks().forEach(track => pc.addTrack(track, stream))
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        supabase.channel(roomId).send({ type: 'broadcast', event: 'webrtc', payload: { type: 'candidate', from: myId, to: targetId, candidate: event.candidate } })
      }
    }
    pc.ontrack = (event) => {
      setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }))
    }
    return pc
  }

  // --- PRESENCE & WEBRTC ---
  useEffect(() => {
    if (!user || !roomId) return
    const channel = supabase.channel(roomId, { config: { presence: { key: myId } } })
    
    channel
      .on('presence', { event: 'sync' }, async () => {
        const state = channel.presenceState()
        const onlineUsers = Object.values(state).flat() as any[]
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.id, u])).values())
        setJoinedPlayers(uniqueUsers)
        
        if (uniqueUsers[0]?.id === myId) {
          supabase.from('poker_lobbies').update({ players_count: uniqueUsers.length }).eq('id', roomId).then()
        }

        // Auto-connect WebRTC to new peers
        if (localStream) {
          uniqueUsers.forEach(async (u) => {
            const uId = String(u.id)
            if (uId !== myId && !peers[uId]) {
              const pc = createPeer(uId, localStream)
              const offer = await pc.createOffer()
              await pc.setLocalDescription(offer)
              setPeers(prev => ({ ...prev, [uId]: pc }))
              channel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'offer', from: myId, to: uId, offer } })
            }
          })
        }
      })
      .on('broadcast', { event: 'game_logic' }, (payload) => applyGameMessage(payload.payload))
      .on('broadcast', { event: 'webrtc' }, async (payload) => {
        const { type, from, to, offer, answer, candidate } = payload.payload
        if (to !== myId) return

        if (type === 'offer') {
          const pc = createPeer(from, localStream!)
          await pc.setRemoteDescription(new RTCSessionDescription(offer))
          const ans = await pc.createAnswer()
          await pc.setLocalDescription(ans)
          setPeers(prev => ({ ...prev, [from]: pc }))
          channel.send({ type: 'broadcast', event: 'webrtc', payload: { type: 'answer', from: myId, to: from, answer: ans } })
        } else if (type === 'answer') {
          await peers[from]?.setRemoteDescription(new RTCSessionDescription(answer))
        } else if (type === 'candidate') {
          await peers[from]?.addIceCandidate(new RTCIceCandidate(candidate))
        }
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({ id: user.id || user.display_name, display_name: user.display_name, profile_image_url: user.profile_image_url })
        }
      })
    return () => { channel.unsubscribe() }
  }, [user, roomId, localStream])

  // --- DEVICES ---
  useEffect(() => {
    const loadDevices = async () => {
      const devices = await navigator.mediaDevices.enumerateDevices()
      setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
      setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
    }
    loadDevices()
  }, [])

  useEffect(() => {
    if (!settings.withWebcams) return
    const constraints = {
      video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true,
      audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true
    }
    navigator.mediaDevices.getUserMedia(constraints)
      .then(stream => {
        if (localStream) localStream.getTracks().forEach(t => t.stop())
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      })
  }, [settings.withWebcams, selectedVideo, selectedAudio])

  // --- POSITIONING (ROTATED) ---
  const rotatedPlayers = useMemo(() => {
    const myIdx = joinedPlayers.findIndex(p => String(p.id) === myId)
    if (myIdx === -1) return joinedPlayers
    // Rotate so current user is always at the bottom
    return [...joinedPlayers.slice(myIdx), ...joinedPlayers.slice(0, myIdx)]
  }, [joinedPlayers, myId])

  const getPlayerPosition = (index: number) => {
    const positions = [
      { top: '82%', left: '50%' }, // Bottom (Index 0 = Me)
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

  // --- RENDER HELPERS ---
  const handRankings = [
    { name: 'Рояль-флеш', cards: [{v:'A',s:'S'}, {v:'K',s:'S'}, {v:'Q',s:'S'}, {v:'J',s:'S'}, {v:'T',s:'S'}] },
    { name: 'Стрит-флеш', cards: [{v:'9',s:'H'}, {v:'8',s:'H'}, {v:'7',s:'H'}, {v:'6',s:'H'}, {v:'5',s:'H'}] },
    { name: 'Каре', cards: [{v:'A',s:'S'}, {v:'A',s:'H'}, {v:'A',s:'D'}, {v:'A',s:'C'}, {v:'K',s:'S'}] },
    { name: 'Фулл-хаус', cards: [{v:'K',s:'S'}, {v:'K',s:'H'}, {v:'K',s:'D'}, {v:'Q',s:'S'}, {v:'Q',s:'H'}] },
    { name: 'Флеш', cards: [{v:'A',s:'D'}, {v:'J',s:'D'}, {v:'8',s:'D'}, {v:'5',s:'D'}, {v:'2',s:'D'}] },
    { name: 'Стрит', cards: [{v:'9',s:'S'}, {v:'8',s:'H'}, {v:'7',s:'D'}, {v:'6',s:'C'}, {v:'5',s:'S'}] },
    { name: 'Сет (Тройка)', cards: [{v:'Q',s:'S'}, {v:'Q',s:'H'}, {v:'Q',s:'D'}, {v:'A',s:'S'}, {v:'7',s:'H'}] },
    { name: 'Две пары', cards: [{v:'J',s:'S'}, {v:'J',s:'H'}, {v:'T',s:'D'}, {v:'T',s:'C'}, {v:'2',s:'S'}] },
    { name: 'Пара', cards: [{v:'8',s:'S'}, {v:'8',s:'H'}, {v:'A',s:'D'}, {v:'K',s:'C'}, {v:'5',s:'S'}] },
  ]

  const isMyTurn = String(currentTurn) === myId
  const myPlayer = players.find(p => String(p.id) === myId)
  const canCheck = (myPlayer?.bet || 0) >= currentBet

  return (
    <div className="fixed inset-0 overflow-hidden select-none text-white font-sans bg-[#0c0c0c]">
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-60 pointer-events-none" style={{ backgroundImage: `radial-gradient(circle at 50% 40%, #2a1b12 0%, #000 100%)` }} />
      <div className="absolute inset-0 pointer-events-none opacity-[0.03]" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.6' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E")` }} />

      {/* TOP LEFT INFO */}
      <div className="absolute top-6 left-6 z-40 glass-panel p-4 min-w-[200px] border-white/5 bg-black/60 shadow-2xl">
        <div className="text-xs font-black text-white/50 uppercase tracking-[0.2em] mb-1">NL Hold'em</div>
        <div className="text-2xl font-black text-white tracking-tighter">${settings.blind.toFixed(2)} / ${(settings.blind * 2).toFixed(2)}</div>
        <div className="mt-3 pt-3 border-t border-white/5 text-[9px] font-black text-white/30 uppercase tracking-widest space-y-1">
          <div className="flex justify-between"><span>Рука:</span> <span className="text-white/60">#45678912</span></div>
          <div className="flex justify-between"><span>Время:</span> <span className="text-white/60">{new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span></div>
        </div>
      </div>

      {/* TOP RIGHT BUTTONS */}
      <div className="absolute top-6 right-6 z-40 flex gap-3">
        <button onClick={() => setShowSettings(true)} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-all border-white/5 bg-black/60 group"><SettingsIcon className="w-5 h-5 mb-1 text-white/40 group-hover:text-white" /><span className="text-[9px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">Настройки</span></button>
        <button onClick={onBack} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-white/10 transition-all border-white/5 bg-black/60 group"><Users className="w-5 h-5 mb-1 text-white/40 group-hover:text-white" /><span className="text-[9px] font-black text-white/40 group-hover:text-white uppercase tracking-widest">Лобби</span></button>
        <button onClick={onBack} className="flex flex-col items-center justify-center w-20 h-20 glass-panel hover:bg-red-500/20 transition-all border-white/5 bg-black/60 group"><LogOut className="w-5 h-5 mb-1 text-white/40 group-hover:text-red-500" /><span className="text-[9px] font-black text-white/40 group-hover:text-red-500 uppercase tracking-widest">Выйти</span></button>
      </div>

      {/* TABLE */}
      <div className="absolute inset-0 flex items-center justify-center p-20">
        <div className="relative w-full max-w-[1100px] aspect-[2.1/1] rounded-[280px] border-[18px] border-[#31251e] shadow-[0_50px_120px_rgba(0,0,0,1)] overflow-hidden">
            <div className="absolute inset-0 bg-[#063b2a]" style={{ backgroundImage: `radial-gradient(circle at 50% 50%, #0a4f38 0%, #052a20 100%)` }} />
            <div className="absolute inset-[24px] border border-white/10 rounded-[254px] pointer-events-none shadow-[inset_0_0_40px_rgba(0,0,0,0.5)]" />
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-10">
                <div className="flex gap-4">
                    {communityCards.map((card, i) => <motion.div key={i} initial={{ scale: 0.8, opacity: 0, rotateY: 90 }} animate={{ scale: 1, opacity: 1, rotateY: 0 }} transition={{ delay: i * 0.1 }}><PokerCard suit={card.suit as any} value={card.value as any} className="w-20 h-30 shadow-2xl" /></motion.div>)}
                    {Array.from({ length: 5 - communityCards.length }).map((_, i) => <div key={i} className="w-20 h-30 rounded-xl border border-white/5 bg-black/10" />)}
                </div>
                <div className="bg-black/70 px-12 py-3.5 rounded-2xl border border-white/10 shadow-2xl"><span className="text-2xl font-black italic text-white uppercase"><span className="text-white/40 not-italic mr-2">БАНК:</span> ${pot.toFixed(2)}</span></div>
            </div>
        </div>

        {/* PLAYERS */}
        <div className="absolute inset-0 pointer-events-none">
            {rotatedPlayers.map((presencePlayer, i) => {
                if (!presencePlayer) return null
                const pId = String(presencePlayer.id)
                const isMe = pId === myId
                const gp = players.find(p => String(p.id) === pId)
                const pos = getPlayerPosition(i)
                const playerIndexInGame = players.findIndex(p => String(p.id) === pId)
                
                return (
                    <motion.div key={pId} className="absolute pointer-events-auto" style={pos}>
                        <div className={`relative flex gap-4 ${gp?.folded ? 'opacity-30 grayscale' : ''}`}>
                            <div className="flex flex-col gap-1 justify-center">
                                {gp?.cards?.map((card: any, idx: number) => <motion.div key={idx} initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} transition={{ delay: idx * 0.1 }}><PokerCard suit={card.suit as any} value={card.value as any} isFlipped={card.suit === 'X'} className="w-12 h-18 shadow-2xl rounded-sm" /></motion.div>)}
                            </div>
                            <div className={`relative w-40 h-52 glass-panel overflow-hidden border-2 transition-all duration-500 shadow-2xl ${pId === String(currentTurn) ? 'border-[#ff4500] ring-[8px] ring-[#ff4500]/20 scale-105 z-30' : 'border-white/10'}`}>
                                <div className="absolute top-2 left-2 z-20 w-6 h-6 bg-black/80 rounded border border-white/10 flex items-center justify-center text-[10px] font-black text-white/60">{playerIndexInGame !== -1 ? playerIndexInGame + 1 : '?'}</div>
                                {gp?.isDealer && <div className="absolute top-2 right-2 z-20 w-6 h-6 bg-white text-black rounded-full flex items-center justify-center text-[10px] font-black shadow-lg">D</div>}
                                <div className="h-[82%] bg-[#080808] relative group">
                                    {isMe && settings.withWebcams ? (
                                        <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover mirror bg-black" />
                                    ) : (
                                        remoteStreams[pId] ? (
                                            <video autoPlay playsInline className="w-full h-full object-cover bg-black" ref={el => { if (el) el.srcObject = remoteStreams[pId] }} />
                                        ) : (
                                            <img src={presencePlayer.profile_image_url || '/poker/assets/ninja.png'} className="w-full h-full object-cover opacity-60" alt="" />
                                        )
                                    )}
                                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                                </div>
                                <div className="absolute bottom-0 left-0 w-full p-2.5 text-center bg-black/95 border-t border-white/5">
                                    <div className="text-[10px] font-black truncate text-white uppercase tracking-widest">{presencePlayer.display_name} {isMe && '(Вы)'}</div>
                                    <div className="text-[13px] font-black text-green-500 mt-0.5">${(gp?.chips ?? settings.buyIn).toFixed(2)}</div>
                                </div>
                            </div>
                            {gp?.bet > 0 && <div className="absolute -top-24 left-1/2 -translate-x-1/2 flex flex-col items-center"><ChipsStack amount={gp.bet} /><div className="mt-2 bg-black/80 px-4 py-1.5 rounded-full text-[11px] font-black text-white border border-white/10">${gp.bet.toFixed(2)}</div></div>}
                        </div>
                    </motion.div>
                )
            })}
        </div>
      </div>

      {/* BOTTOM LEFT OPTIONS */}
      <div className="absolute bottom-8 left-8 z-40 glass-panel p-6 border-white/5 bg-black/80 space-y-4 min-w-[220px] shadow-2xl">
        {['Фолд на любую ставку', 'Пропускать раздачи', 'Авто-докупка'].map((label, idx) => (
            <label key={idx} className="flex items-center gap-3 cursor-pointer group">
                <div className="relative flex items-center justify-center">
                    <input type="checkbox" className="peer appearance-none w-5 h-5 rounded border-2 border-white/10 bg-white/5 checked:bg-[#ff4500] checked:border-[#ff4500] transition-all cursor-pointer" />
                    <div className="absolute pointer-events-none opacity-0 peer-checked:opacity-100 text-white font-black text-[10px]">✓</div>
                </div>
                <span className="text-[10px] font-black uppercase tracking-widest text-white/30 group-hover:text-white/60 transition-colors">{label}</span>
            </label>
        ))}
      </div>

      {/* BOTTOM RIGHT CONTROLS */}
      <div className="absolute bottom-8 right-8 z-50 flex items-end gap-3">
          <button onClick={() => setShowHandRanks(true)} className="w-16 h-16 glass-panel flex items-center justify-center hover:bg-white/10 transition-all border-white/10 bg-black/80 shadow-2xl group"><HelpCircle className="w-6 h-6 text-white/20 group-hover:text-white" /></button>
          <AnimatePresence>
            {isMyTurn && (
              <motion.div initial={{ x: 100, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: 100, opacity: 0 }} className="flex flex-col items-end gap-4">
                <div className="glass-panel p-6 bg-black/95 border-white/10 shadow-2xl w-[580px]">
                    <div className="flex gap-4 mb-6 h-18">
                        <button onClick={() => handleAction('fold')} className="flex-1 rounded-xl bg-red-950/40 hover:bg-red-900/60 border border-red-500/20 text-xl font-black italic uppercase transition-all shadow-xl">ФОЛД</button>
                        {canCheck ? (
                            <button onClick={() => handleAction('check')} className="flex-1 rounded-xl bg-green-950/40 hover:bg-green-900/60 border border-green-500/20 text-xl font-black italic uppercase transition-all shadow-xl">ЧЕК</button>
                        ) : (
                            <button onClick={() => handleAction('call')} className="flex-1 rounded-xl bg-green-950/40 hover:bg-green-900/60 border border-green-500/20 text-xl font-black italic uppercase flex flex-col items-center justify-center shadow-xl">
                                <span>КОЛЛ</span><span className="text-[10px] font-bold text-green-400 mt-1">${(currentBet - (myPlayer?.bet || 0)).toFixed(2)}</span>
                            </button>
                        )}
                        <button onClick={() => handleAction('raise', raiseAmount)} className="flex-1 rounded-xl bg-green-950/40 hover:bg-green-900/60 border border-green-500/20 text-xl font-black italic uppercase flex flex-col items-center justify-center shadow-xl">
                            <span>РЕЙЗ ДО</span><span className="text-[10px] font-bold text-green-400 mt-1">${raiseAmount.toFixed(2)}</span>
                        </button>
                    </div>
                    <div className="flex items-center gap-6 mb-6 px-2">
                        <button onClick={() => setRaiseAmount(prev => Math.max(prev - settings.blind, currentBet * 2))} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full">-</button>
                        <input type="range" min={currentBet * 2} max={myPlayer?.chips + (myPlayer?.bet || 0)} step={settings.blind} value={raiseAmount} onChange={(e) => setRaiseAmount(parseInt(e.target.value))} className="flex-1 h-1.5 bg-white/10 appearance-none accent-[#ff4500]" />
                        <button onClick={() => setRaiseAmount(prev => prev + settings.blind)} className="w-10 h-10 flex items-center justify-center bg-white/5 rounded-full">+</button>
                        <div className="w-24 bg-black/60 border border-white/10 rounded-lg p-2.5 text-center text-sm font-black italic text-[#ff4500]">${raiseAmount.toFixed(2)}</div>
                    </div>
                    <div className="grid grid-cols-5 gap-2">{['МИН', '1/2', '2/3', 'ПОТ', 'МАКС'].map(label => (<button key={label} className="py-2.5 bg-white/5 rounded-lg text-[9px] font-black uppercase tracking-widest text-white/20 border border-white/5">{label}</button>))}</div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>{showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <motion.div initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-panel p-10 max-w-lg w-full bg-[#111] border-white/10">
                <div className="flex justify-between items-center mb-10"><h2 className="text-3xl font-black italic uppercase tracking-tighter text-[#ff4500]">Настройки</h2><button onClick={() => setShowSettings(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-6 h-6 text-white/40" /></button></div>
                <div className="space-y-10">
                    <div className="grid grid-cols-1 gap-6">
                        <div><label className="block text-[10px] font-black uppercase text-white/30 mb-4">Выберите камеру</label><select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm font-bold"><option value="">По умолчанию</option>{videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></div>
                        <div><label className="block text-[10px] font-black uppercase text-white/30 mb-4">Выберите микрофон</label><select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-xl p-4 outline-none text-sm font-bold"><option value="">По умолчанию</option>{audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}</select></div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase border-2 ${isVideoOn ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{isVideoOn ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}{isVideoOn ? 'Видео ВКЛ' : 'Видео ВЫКЛ'}</button>
                        <button onClick={() => setIsMicOn(!isMicOn)} className={`flex items-center justify-center gap-3 py-4 rounded-xl font-black text-xs uppercase border-2 ${isMicOn ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{isMicOn ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}{isMicOn ? 'Мик ВКЛ' : 'Мик ВЫКЛ'}</button>
                    </div>
                </div>
            </motion.div>
          </motion.div>
      )}</AnimatePresence>

      {/* HAND RANKS SIDEBAR */}
      <AnimatePresence>{showHandRanks && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] flex justify-end p-8 bg-black/40 backdrop-blur-sm" onClick={() => setShowHandRanks(false)}>
             <motion.div initial={{ x: 400 }} animate={{ x: 0 }} exit={{ x: 400 }} className="glass-panel p-8 max-w-md w-full bg-[#0a0a0a] border-white/10 h-full overflow-y-auto custom-scrollbar" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center mb-8"><h2 className="text-2xl font-black italic uppercase tracking-tighter text-[#ff4500]">Комбинации</h2><button onClick={() => setShowHandRanks(false)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-5 h-5 text-white/40" /></button></div>
                <div className="space-y-6">
                    {handRankings.map((rank, i) => (
                        <div key={i} className="bg-white/5 p-4 rounded-2xl border border-white/5 flex flex-col gap-3 group hover:bg-white/10 transition-colors">
                            <span className="text-xs font-black text-white/80 uppercase tracking-[0.2em]">{rank.name}</span>
                            <div className="flex gap-1.5">{rank.cards.map((c, ci) => <PokerCard key={ci} suit={c.s as any} value={c.v as any} className="w-10 h-14 rounded shadow-lg group-hover:-translate-y-1 transition-transform" />)}</div>
                        </div>
                    ))}
                </div>
             </motion.div>
          </motion.div>
      )}</AnimatePresence>

      {/* WINNER OVERLAY */}
      <AnimatePresence>{winnerInfo.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[110] flex items-center justify-center bg-black/80 backdrop-blur-2xl">
             <motion.div initial={{ scale: 0.8, y: 20 }} animate={{ scale: 1, y: 0 }} className="glass-panel p-16 text-center border-[#ff4500]/50 bg-black/60 shadow-[0_0_100px_rgba(255,69,0,0.3)] max-w-lg w-full">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-8 animate-bounce" />
                <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-4 text-white">ПОБЕДИТЕЛЬ!</h2>
                <div className="text-3xl font-black text-[#ff4500] mb-6 uppercase tracking-widest">{players.find(p => p.id === winnerInfo[0]?.id)?.name || 'Кто-то'}</div>
                <div className="text-white/40 font-black uppercase tracking-[0.4em] mb-12 text-sm">{winnerInfo[0]?.handName}</div>
                {joinedPlayers[0]?.id === myId && (<button onClick={startNewGame} className="w-full bg-[#ff4500] hover:bg-[#e63e00] text-white font-black py-5 rounded-2xl transition-all shadow-2xl shadow-[#ff4500]/40 uppercase tracking-widest text-xl italic">Следующая раздача</button>)}
             </motion.div>
          </motion.div>
      )}</AnimatePresence>

      <style jsx global>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255, 69, 0, 0.3); border-radius: 10px; }
        .mirror { transform: scaleX(-1); }
      `}</style>
    </div>
  )
}
