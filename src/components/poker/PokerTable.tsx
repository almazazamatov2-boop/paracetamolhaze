'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Settings as SettingsIcon,
  Users,
  LogOut,
  HelpCircle,
  X,
  Trophy,
  Volume2,
  Camera,
  Mic,
  Video,
  VideoOff,
  MicOff
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'
import { PokerLogic, type PokerPlayer, type PokerGameState, type Card } from '@/lib/pokerLogic'

// --- CONSTANTS ---
const MAX_SEATS = 9
const SEAT_POSITIONS = [
    { left: 50, top: 82 }, // Seat 1 (Bottom Mid - YOU)
    { left: 22, top: 75 }, // Seat 2 (Bottom Left)
    { left: 10, top: 50 }, // Seat 3 (Mid Left)
    { left: 22, top: 25 }, // Seat 4 (Top Left)
    { left: 38, top: 22 }, // Seat 5 (Top Mid Left) - MOVED CLOSER
    { left: 62, top: 22 }, // Seat 6 (Top Mid Right) - MOVED CLOSER
    { left: 78, top: 25 }, // Seat 7 (Top Right)
    { left: 90, top: 50 }, // Seat 8 (Mid Right)
    { left: 78, top: 75 }, // Seat 9 (Bottom Right)
]

const PokerChip = ({ value, index }: { value: number, index: number }) => {
    const colors = [
        { v: 5000, c: 'bg-yellow-500 border-yellow-700' },
        { v: 1000, c: 'bg-orange-500 border-orange-700' },
        { v: 500, c: 'bg-blue-600 border-blue-800' },
        { v: 100, c: 'bg-black border-gray-800' },
        { v: 25, c: 'bg-green-600 border-green-800' },
        { v: 5, c: 'bg-red-600 border-red-800' },
        { v: 1, c: 'bg-slate-200 border-slate-400' },
    ]
    const colorClass = colors.find(col => value >= col.v)?.c || colors[colors.length-1].c
    return (
        <div className={`w-6 h-6 rounded-full border-2 ${colorClass} shadow-lg flex items-center justify-center relative`} style={{ marginTop: index > 0 ? -18 : 0, zIndex: 50 + index }}>
            <span className="text-[6px] font-black text-white">{value}</span>
        </div>
    )
}

const ChipsStack = ({ amount }: { amount: number }) => {
    const denoms = [5000, 1000, 500, 100, 25, 5, 1]
    const chips: number[] = []
    let rem = amount
    denoms.forEach(d => { while (rem >= d && chips.length < 8) { chips.push(d); rem -= d } })
    return <div className="flex flex-col-reverse items-center">{chips.map((v, i) => <PokerChip key={i} value={v} index={i} />)}</div>
}

export default function PokerTable({ roomId, user, settings, onBack }: any) {
  const [players, setPlayers] = useState<any[]>([])
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])
  const [communityCards, setCommunityCards] = useState<any[]>([])
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState('waiting')
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [currentBet, setCurrentBet] = useState(0)
  const [raiseAmount, setRaiseAmount] = useState(40)
  const [winnerInfo, setWinnerInfo] = useState<any[]>([])
  const [showHandRanks, setShowHandRanks] = useState(false)
  const [showSettings, setShowSettings] = useState(false)
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [isVideoOn, setIsVideoOn] = useState(true)
  const [isMicOn, setIsMicOn] = useState(true)
  const [videoDevices, setVideoDevices] = useState<MediaDeviceInfo[]>([])
  const [audioDevices, setAudioDevices] = useState<MediaDeviceInfo[]>([])
  const [selectedVideo, setSelectedVideo] = useState('')
  const [selectedAudio, setSelectedAudio] = useState('')

  const myId = String(user?.id || user?.display_name || '')
  const videoRef = useRef<HTMLVideoElement>(null)
  const fullStateRef = useRef<PokerGameState | null>(null)

  // --- LOGIC ---
  const applyGameMessage = (msg: any) => {
    if (msg.phase) setGameState(msg.phase)
    if (msg.pot !== undefined) setPot(msg.pot)
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn !== undefined) setCurrentTurn(msg.currentTurn)
    if (msg.communityCards) setCommunityCards(msg.communityCards)
    if (msg.winners) setWinnerInfo(msg.winners)
    if (msg.players) {
        const isShowdown = (msg.phase || gameState) === 'showdown'
        setPlayers(msg.players.map((p: any) => {
            const isMe = String(p.id) === myId
            return { ...p, cards: (isMe || isShowdown) ? (p.cards || []) : (p.cards?.map(() => ({ suit: 'X', value: 'X' })) || []) }
        }))
    }
  }

  useEffect(() => {
    const channel = supabase.channel(roomId, { config: { presence: { key: myId } } })
    channel.on('presence', { event: 'sync' }, () => {
        const raw = Object.values(channel.presenceState()).flat() as any[]
        const unique = Array.from(new Map(raw.map(u => [u.id, u])).values()).sort((a, b) => String(a.id).localeCompare(String(b.id)))
        setJoinedPlayers(unique)
    })
    .on('broadcast', { event: 'game_logic' }, (p) => applyGameMessage(p.payload))
    .subscribe(async (s) => { if (s === 'SUBSCRIBED') await channel.track({ id: user.id, display_name: user.display_name, profile_image_url: user.profile_image_url }) })
    return () => { channel.unsubscribe() }
  }, [roomId])

  useEffect(() => {
    const loadMedia = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices()
            setVideoDevices(devices.filter(d => d.kind === 'videoinput'))
            setAudioDevices(devices.filter(d => d.kind === 'audioinput'))
            
            const stream = await navigator.mediaDevices.getUserMedia({ 
                video: selectedVideo ? { deviceId: { exact: selectedVideo } } : true, 
                audio: selectedAudio ? { deviceId: { exact: selectedAudio } } : true 
            })
            setLocalStream(stream)
            if (videoRef.current) videoRef.current.srcObject = stream
        } catch (e) { console.error(e) }
    }
    loadMedia()
  }, [selectedVideo, selectedAudio])

  useEffect(() => {
    if (localStream) {
        localStream.getVideoTracks().forEach(t => t.enabled = isVideoOn)
        localStream.getAudioTracks().forEach(t => t.enabled = isMicOn)
    }
  }, [isVideoOn, isMicOn, localStream])

  const isMyTurn = String(currentTurn) === myId
  const myPlayer = players.find(p => String(p.id) === myId)

  return (
    <div className="fixed inset-0 bg-[#1a0f0a] overflow-hidden select-none text-white font-sans flex items-center justify-center">
      
      {/* BACKGROUND */}
      <div className="absolute inset-0 opacity-40 pointer-events-none" style={{ background: 'radial-gradient(circle at 50% 50%, #3d2a1d 0%, #1a0f0a 100%)' }} />
      <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.5'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")` }} />

      {/* TOP PANELS */}
      <div className="absolute top-8 left-8 z-50 glass-panel p-4 border-white/5 bg-black/60 shadow-2xl rounded-2xl">
          <div className="text-white/40 text-[10px] font-black uppercase tracking-widest mb-1">NL Hold'em</div>
          <div className="text-3xl font-black italic tracking-tighter">${settings.blind.toFixed(2)} / ${(settings.blind * 2).toFixed(2)}</div>
      </div>

      <div className="absolute top-8 right-8 z-50 flex gap-4">
          {[ 
            {icon: <SettingsIcon />, label: 'Настройки', action: () => setShowSettings(true)}, 
            {icon: <Users />, label: 'Лобби', action: onBack}, 
            {icon: <LogOut />, label: 'Выйти', action: onBack} 
          ].map((b, i) => (
              <button key={i} onClick={b.action} className="w-24 h-24 bg-black/60 border border-white/5 rounded-2xl flex flex-col items-center justify-center hover:bg-white/10 transition-all shadow-2xl group">
                  <div className="text-white/20 group-hover:text-white transition-colors mb-1">{b.icon}</div>
                  <div className="text-[10px] font-black uppercase text-white/20 group-hover:text-white">{b.label}</div>
              </button>
          ))}
      </div>

      {/* THE POKER TABLE */}
      <div className="relative w-[1200px] aspect-[2/1] rounded-[300px] border-[20px] border-[#2b1e14] shadow-[0_50px_100px_rgba(0,0,0,0.8),inset_0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute inset-0 bg-[#073324]" style={{ background: 'radial-gradient(circle at 50% 50%, #0a4d38 0%, #05241b 100%)' }} />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-12">
              <div className="flex gap-4">
                  {Array.from({ length: 5 }).map((_, i) => {
                      const card = communityCards[i]
                      return (
                          <div key={i} className="w-24 h-36 bg-black/20 border border-white/5 rounded-xl flex items-center justify-center shadow-inner">
                              {card && <PokerCard suit={card.suit} value={card.value} className="w-full h-full" />}
                          </div>
                      )
                  })}
              </div>
              <div className="bg-black/60 backdrop-blur-xl px-16 py-4 rounded-3xl border border-white/10 shadow-2xl">
                  <span className="text-3xl font-black italic uppercase tracking-tighter"><span className="text-white/30 not-italic mr-4">БАНК:</span> ${pot.toFixed(2)}</span>
              </div>
          </div>
      </div>

      {/* PLAYERS (FIXED SEATS) */}
      <div className="absolute inset-0 pointer-events-none">
          {Array.from({ length: MAX_SEATS }).map((_, i) => {
              const pos = SEAT_POSITIONS[i]
              const p = joinedPlayers[i]
              const gp = p ? players.find(gp => String(gp.id) === String(p.id)) : null
              const isMe = p && String(p.id) === myId
              const isTurn = p && String(currentTurn) === String(p.id)

              return (
                  <div key={i} className="absolute" style={{ left: `${pos.left}%`, top: `${pos.top}%`, transform: 'translate(-50%, -50%)' }}>
                      <div className={`relative flex flex-col items-center pointer-events-auto ${gp?.folded ? 'opacity-30 grayscale' : ''}`}>
                          <div className={`w-44 h-56 bg-[#0c0c0c] rounded-3xl border-2 transition-all duration-500 overflow-hidden shadow-2xl ${isTurn ? 'border-orange-500 ring-8 ring-orange-500/20 scale-110 z-50' : 'border-white/10'}`}>
                              <div className="h-[80%] relative bg-black">
                                  {isMe ? <video ref={videoRef} autoPlay playsInline muted className="w-full h-full object-cover scale-x-[-1]" /> : (p ? <img src={p.profile_image_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${p.id}`} className="w-full h-full object-cover opacity-80" /> : null)}
                                  {!p && <div className="absolute inset-0 flex items-center justify-center text-white/5 font-black text-4xl">ПУСТО</div>}
                                  <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent opacity-90" />
                              </div>
                              <div className="absolute bottom-0 left-0 w-full p-3 text-center bg-black/95 border-t border-white/5">
                                  <div className="text-[11px] font-black uppercase truncate tracking-widest text-white/80">{p?.display_name || 'СВОБОДНО'}</div>
                                  <div className="text-sm font-black text-green-500 mt-1">${(gp?.chips ?? settings.buyIn).toFixed(2)}</div>
                              </div>
                              {gp?.isDealer && <div className="absolute top-2 right-2 w-7 h-7 bg-white text-black rounded-full flex items-center justify-center font-black text-xs">D</div>}
                          </div>
                          <div className="absolute -bottom-6 flex gap-1 z-50">
                              {gp?.cards?.map((c: any, ci: number) => <PokerCard key={ci} suit={c.suit} value={c.value} isFlipped={c.suit === 'X'} className="w-10 h-14 rounded-lg shadow-2xl" />)}
                          </div>
                          {gp?.bet > 0 && <div className="absolute -top-32 flex flex-col items-center"><ChipsStack amount={gp.bet} /><div className="mt-2 bg-black/90 px-5 py-1.5 rounded-full border border-white/10 text-xs font-black italic shadow-2xl">${gp.bet.toFixed(2)}</div></div>}
                      </div>
                  </div>
              )
          })}
      </div>

      {/* ACTION PANEL (ALWAYS VISIBLE) */}
      <div className="absolute bottom-10 right-10 z-[100] flex flex-col items-end gap-6">
          <button onClick={() => setShowHandRanks(true)} className="w-16 h-16 bg-black/60 rounded-2xl flex items-center justify-center border border-white/5 hover:bg-white/10 transition-all text-white/20 hover:text-white"><HelpCircle className="w-8 h-8" /></button>
          <div className={`w-[600px] bg-black/95 rounded-3xl border border-white/10 p-8 shadow-[0_50px_150px_rgba(0,0,0,1)] transition-all ${isMyTurn ? 'opacity-100' : 'opacity-40 pointer-events-none grayscale'}`}>
              <div className="flex gap-4 mb-8 h-20">
                  <button onClick={() => handleAction('fold')} className="flex-1 bg-[#b03030] rounded-2xl font-black text-2xl italic uppercase hover:opacity-80">ФОЛД</button>
                  <button onClick={() => handleAction('call')} className="flex-1 bg-[#2d9cdb] rounded-2xl font-black text-2xl italic uppercase hover:opacity-80 flex flex-col items-center justify-center">КОЛЛ <span className="text-xs font-bold mt-1">${(currentBet - (myPlayer?.bet || 0)).toFixed(2)}</span></button>
                  <button onClick={() => handleAction('raise', raiseAmount)} className="flex-1 bg-[#2ecc71] rounded-2xl font-black text-2xl italic uppercase hover:opacity-80 flex flex-col items-center justify-center">РЕЙЗ ДО <span className="text-xs font-bold mt-1">${raiseAmount.toFixed(2)}</span></button>
              </div>
              <div className="flex items-center gap-6 mb-8 px-2">
                  <button onClick={() => setRaiseAmount(p => Math.max(p - settings.blind, currentBet * 2))} className="w-12 h-12 rounded-full bg-white/5 text-2xl font-bold">-</button>
                  <input type="range" min={currentBet * 2} max={(myPlayer?.chips || 0) + (myPlayer?.bet || 0)} step={settings.blind} value={raiseAmount} onChange={(e) => setRaiseAmount(Number(e.target.value))} className="flex-1 h-2 bg-white/10 rounded-lg appearance-none accent-orange-500" />
                  <button onClick={() => setRaiseAmount(p => p + settings.blind)} className="w-12 h-12 rounded-full bg-white/5 text-2xl font-bold">+</button>
                  <div className="w-32 bg-black/60 border border-white/10 rounded-2xl p-3 text-center text-xl font-black italic text-orange-500">${raiseAmount.toFixed(2)}</div>
              </div>
              <div className="grid grid-cols-5 gap-3">
                  {['МИН', '1/2', '2/3', 'ПОТ', 'МАКС'].map(l => <button key={l} className="py-3 bg-white/5 border border-white/5 rounded-xl text-[10px] font-black uppercase text-white/30 hover:text-white transition-all">{l}</button>)}
              </div>
          </div>
      </div>

      {/* OPTIONS */}
      <div className="absolute bottom-10 left-10 z-50 bg-black/60 backdrop-blur-2xl p-8 rounded-[40px] border border-white/5 flex flex-col gap-5">
          {['Фолд на любую ставку', 'Пропускать раздачи', 'Авто-докупка'].map((l, i) => (
              <label key={i} className="flex items-center gap-4 cursor-pointer group">
                  <input type="checkbox" className="w-5 h-5 accent-orange-500" defaultChecked={i === 1} />
                  <span className="text-xs font-black uppercase tracking-widest text-white/30 group-hover:text-white">{l}</span>
              </label>
          ))}
      </div>

      {/* SETTINGS MODAL */}
      <AnimatePresence>
        {showSettings && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[200] flex items-center justify-center bg-black/80 backdrop-blur-md">
            <div className="w-full max-w-lg bg-[#111] border border-white/10 rounded-[40px] p-10 shadow-2xl relative">
                <button onClick={() => setShowSettings(false)} className="absolute top-6 right-6 p-2 hover:bg-white/10 rounded-full"><X /></button>
                <h2 className="text-3xl font-black italic uppercase text-orange-500 mb-10">Настройки</h2>
                <div className="space-y-8">
                    <div>
                        <label className="block text-[10px] font-black uppercase text-white/30 mb-4">Камера</label>
                        <select value={selectedVideo} onChange={e => setSelectedVideo(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold">
                            <option value="">По умолчанию</option>
                            {videoDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                    </div>
                    <div>
                        <label className="block text-[10px] font-black uppercase text-white/30 mb-4">Микрофон</label>
                        <select value={selectedAudio} onChange={e => setSelectedAudio(e.target.value)} className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-sm font-bold">
                            <option value="">По умолчанию</option>
                            {audioDevices.map(d => <option key={d.deviceId} value={d.deviceId}>{d.label}</option>)}
                        </select>
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-4">
                        <button onClick={() => setIsVideoOn(!isVideoOn)} className={`py-4 rounded-2xl font-black text-xs uppercase border-2 flex items-center justify-center gap-3 ${isVideoOn ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {isVideoOn ? <Video /> : <VideoOff />} {isVideoOn ? 'ВИДЕО ВКЛ' : 'ВИДЕО ВЫКЛ'}
                        </button>
                        <button onClick={() => setIsMicOn(!isMicOn)} className={`py-4 rounded-2xl font-black text-xs uppercase border-2 flex items-center justify-center gap-3 ${isMicOn ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                            {isMicOn ? <Mic /> : <MicOff />} {isMicOn ? 'МИК ВКЛ' : 'МИК ВЫКЛ'}
                        </button>
                    </div>
                </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {winnerInfo.length > 0 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[150] flex items-center justify-center bg-black/90 backdrop-blur-2xl">
             <div className="bg-black/40 border border-orange-500/50 p-20 rounded-[60px] text-center max-w-lg w-full">
                <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-8 animate-bounce" />
                <h2 className="text-5xl font-black italic uppercase mb-4">ПОБЕДИТЕЛЬ!</h2>
                <div className="text-3xl font-black text-orange-500 uppercase">{players.find(p => p.id === winnerInfo[0]?.id)?.name || 'КТО-ТО'}</div>
                <div className="text-white/20 text-sm font-black uppercase mt-4 mb-10">{winnerInfo[0]?.handName}</div>
                <button onClick={() => setWinnerInfo([])} className="w-full bg-orange-500 py-5 rounded-3xl font-black text-xl italic uppercase tracking-widest">Продолжить</button>
             </div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  )
}
