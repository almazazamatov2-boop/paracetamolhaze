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
  History,
  Plus,
  Settings,
  Share2
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'
import { PokerLogic, type PokerPlayer, type PokerGameState, type Card } from '@/lib/pokerLogic'

// --- POKER CHIP COMPONENT ---
const CHIP_COLORS: Record<number, string> = {
  1: 'bg-slate-200 border-slate-400 text-slate-800',   // White
  5: 'bg-red-600 border-red-800 text-white',         // Red
  25: 'bg-green-600 border-green-800 text-white',    // Green
  100: 'bg-black border-gray-800 text-white',       // Black
  500: 'bg-blue-600 border-blue-800 text-white',     // Blue
  1000: 'bg-orange-500 border-orange-700 text-white',// Orange
  5000: 'bg-yellow-500 border-yellow-700 text-white',// Gold
}

const PokerChip = ({ value, index }: { value: number, index: number }) => {
  const colorClass = Object.entries(CHIP_COLORS)
    .reverse()
    .find(([v]) => value >= Number(v))?.[1] || CHIP_COLORS[1]

  return (
    <motion.div
      initial={{ y: -5, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className={`w-8 h-8 md:w-10 md:h-10 rounded-full border-4 ${colorClass} shadow-lg flex items-center justify-center relative translate-z-0`}
      style={{ 
        marginTop: index > 0 ? -32 : 0, 
        zIndex: 50 + index,
        boxShadow: '0 4px 0 rgba(0,0,0,0.3)'
      }}
    >
      <div className="absolute inset-1 border border-white/20 rounded-full" />
      <div className="absolute inset-0 border-4 border-dashed border-white/10 rounded-full scale-105" />
      <span className="text-[8px] md:text-[10px] font-black italic">{value}</span>
    </motion.div>
  )
}

const ChipsStack = ({ amount, className = "" }: { amount: number, className?: string }) => {
  const denominations = [5000, 1000, 500, 100, 25, 5, 1]
  const chips: number[] = []
  let remaining = amount
  
  denominations.forEach(d => {
    while (remaining >= d && chips.length < 12) {
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

interface Player {
  id: string
  name: string
  chips: number
  isReady: boolean
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  isCurrent: boolean
  cards: { suit: string, value: string }[]
  folded: boolean
  bet: number
  allIn: boolean
  hasActed: boolean
  totalBet: number
}

export default function PokerTable({ roomId, user, settings, onBack }: TableProps) {
  const [players, setPlayers] = useState<Player[]>([])
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

  // Звуки
  const SOUNDS = {
    deal: '/audio/deal_player.mp3',
    deal_board: '/audio/deal_board.mp3',
    chip: '/audio/bet.mp3',
    check: '/audio/check.mp3',
    fold: '/audio/fold.mp3',
    win: '/audio/win.mp3',
    tick: '/audio/your_turn.mp3',
    all_in: '/audio/all_in.mp3',
    raise: '/audio/raise.mp3',
    reveal: '/audio/reveal_hand.mp3',
  }

  const playSound = (type: keyof typeof SOUNDS) => {
    const audio = new Audio(SOUNDS[type])
    audio.volume = 0.4
    audio.play().catch(() => {})
  }

  // Таймер хода
  useEffect(() => {
    if (gameState === 'waiting' || !currentTurn) {
        setTimeLeft(20)
        return
    }

    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 6 && prev > 1) {
            playSound('tick')
        }
        
        if (prev <= 1) {
          if (String(currentTurn) === myId) {
             const currentPlayer = fullStateRef.current?.players.find(p => String(p.id) === myId)
             const canCheckNow = (fullStateRef.current?.currentBet || 0) <= (currentPlayer?.bet || 0)
             handleAction(canCheckNow ? 'check' : 'fold')
          }
          return 20
        }
        return prev - 1
      })
    }, 1000)

    return () => clearInterval(timer)
  }, [currentTurn, gameState])

  const peerRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(localStream)
  useEffect(() => { localStreamRef.current = localStream }, [localStream])

  const myId = String(user?.id || user?.display_name || '')

  // --- TOGGLE HANDLERS ---
  const toggleMic = () => {
    if (localStream) {
      const newState = !isMicOn
      localStream.getAudioTracks().forEach(track => track.enabled = newState)
      setIsMicOn(newState)
    }
  }

  const toggleVideo = () => {
    if (localStream) {
      const newState = !isVideoOn
      localStream.getVideoTracks().forEach(track => track.enabled = newState)
      setIsVideoOn(newState)
    }
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
        if (validCards.length > 0) {
          myCardsRef.current = validCards
        }
      }

      const sanitized = msg.players.map((p: any) => {
        const isMe = String(p.id) === myId
        let cards: { suit: string, value: string }[]
        if (isMe) {
          cards = myCardsRef.current.length > 0 ? myCardsRef.current : (p.cards || [])
        } else if (isShowdown) {
          cards = p.cards || []
        } else {
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

  const startNewGame = () => {
    if (joinedPlayers.length < 2) {
      alert('Нужно минимум 2 игрока!')
      return
    }
    const playersWithChips = joinedPlayers.map(jp => {
      const prev = players.find(p => String(p.id) === String(jp.id))
      return {
        ...jp,
        chips: prev?.chips && prev.chips > 0 ? prev.chips : settings.buyIn
      }
    })
    dealerIndexRef.current = (dealerIndexRef.current + 1) % playersWithChips.length
    try {
      const newState = PokerLogic.prepareNewHand(playersWithChips, dealerIndexRef.current, settings.blind, settings.buyIn, settings.ante || 0)
      setWinnerInfo([])
      myCardsRef.current = []
      const meInState = newState.players.find(p => String(p.id) === myId)
      if (meInState?.cards) myCardsRef.current = meInState.cards
      deckRef.current = newState.deck
      fullStateRef.current = newState
      const currentTurnId = newState.players[newState.activePlayerIndex]?.id
      broadcastMessage({
        phase: newState.phase,
        state: newState.phase,
        players: newState.players,
        pot: newState.pot,
        sidePots: newState.sidePots,
        currentBet: newState.currentBet,
        currentTurn: currentTurnId,
        communityCards: newState.communityCards,
        deck: newState.deck,
        lastRaiserId: newState.lastRaiserId,
        dealerIndex: newState.dealerIndex,
        winners: [],
      })
    } catch (e: any) { alert(e.message || 'Ошибка запуска игры') }
  }

  const handleAction = (action: 'fold' | 'call' | 'raise' | 'check', amount?: number) => {
    if (!fullStateRef.current) return
    const state = fullStateRef.current
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || String(activePlayer.id) !== myId) return
    let raiseAmt = amount
    if (action === 'raise' && raiseAmt !== undefined) {
      const minPossible = currentBet * 2 || settings.blind * 2
      if (raiseAmt < minPossible) raiseAmt = minPossible
    }
    const nextState = PokerLogic.handleAction(state, myId, action, raiseAmt)
    if (action === 'fold') playSound('fold')
    else if (action === 'raise') playSound('chip')
    else if (action === 'call') playSound('chip')
    else playSound('check')
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

  useEffect(() => {
    const isHost = joinedPlayers[0]?.id === myId
    if (!isHost || !fullStateRef.current) return
    const state = fullStateRef.current
    if (state.phase === 'showdown' || state.phase === 'waiting') return
    const canAct = state.players.filter(p => !p.folded && !p.allIn)
    const isRoundComplete = PokerLogic.isRoundComplete(state)
    if (canAct.length <= 1 && isRoundComplete) {
      const timer = setTimeout(() => {
        const nextState = state.phase === 'river' ? PokerLogic.resolveShowdown(state) : PokerLogic.nextPhase(state)
        deckRef.current = nextState.deck
        fullStateRef.current = nextState
        const turnId = nextState.players[nextState.activePlayerIndex]?.id
        broadcastMessage({
          phase: nextState.phase,
          state: nextState.phase,
          players: nextState.players,
          pot: nextState.pot,
          currentBet: nextState.currentBet,
          currentTurn: turnId,
          communityCards: nextState.communityCards,
          deck: nextState.deck,
          winners: nextState.winners || [],
        })
      }, 2000)
      return () => clearTimeout(timer)
    }
  }, [players, currentTurn, joinedPlayers])

  useEffect(() => {
    if (!user || !roomId) return
    const safeName = myId.toString().replace(/\s+/g, '_')
    const myPeerId = `poker-${roomId}-${safeName}`
    const initPeer = async () => {
      const { default: Peer } = await import('peerjs')
      const peer = new Peer(myPeerId, {
        debug: 1,
        config: {
          iceServers: [
            { urls: 'stun:stun.l.google.com:19302' },
            { urls: 'stun:stun1.l.google.com:19302' },
          ]
        }
      })
      peerRef.current = peer
      peer.on('call', (call: any) => {
        const remoteUserId = call.peer.replace(`poker-${roomId}-`, '').replace(/_/g, ' ')
        call.answer(localStreamRef.current || undefined)
        call.on('stream', (remoteStream: MediaStream) => {
          setRemoteStreams(prev => {
            if (prev[remoteUserId]?.id === remoteStream.id) return prev
            return { ...prev, [remoteUserId]: remoteStream }
          })
        })
      })
    }
    initPeer()
    const channel = supabase.channel(roomId, { config: { presence: { key: myId.toString() } } })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineUsers = Object.values(state).flat() as any[]
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.id, u])).values())
        setJoinedPlayers(uniqueUsers)
        uniqueUsers.forEach(u => {
          if (!u?.id) return
          const remoteId = String(u.id)
          const remotePeerId = `poker-${roomId}-${remoteId.replace(/\s+/g, '_')}`
          if (remoteId !== myId && peerRef.current && !remoteStreams[remoteId]) {
            if (myPeerId > remotePeerId && localStreamRef.current) {
              const call = peerRef.current.call(remotePeerId, localStreamRef.current)
              call?.on('stream', (remoteStream: MediaStream) => {
                setRemoteStreams(prev => ({ ...prev, [remoteId]: remoteStream }))
              })
            }
          }
        })
      })
      .on('broadcast', { event: 'game_logic' }, (payload) => applyGameMessage(payload.payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await channel.track({
            id: user.id || user.display_name,
            display_name: user.display_name,
            profile_image_url: user.profile_image_url,
            joined_at: new Date().toISOString()
          })
        }
      })
    return () => {
      channel.unsubscribe()
      peerRef.current?.destroy()
    }
  }, [user, roomId])

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
    setPlayers(prev => {
      const newPlayers = [...prev]
      joinedPlayers.forEach(jp => {
        if (!newPlayers.find(p => String(p.id) === String(jp.id))) {
          newPlayers.push({
            id: jp.id,
            name: jp.display_name,
            chips: settings.buyIn,
            isReady: true,
            isDealer: false,
            isSmallBlind: false,
            isBigBlind: false,
            isCurrent: false,
            cards: [],
            folded: false,
            bet: 0,
            allIn: false,
            hasActed: false,
            totalBet: 0,
          })
        }
      })
      return newPlayers
    })
  }, [joinedPlayers, settings.buyIn])

  const playersWithState = useMemo(() => {
    return Array.from({ length: settings.size }).map((_, i) => {
      const presencePlayer = joinedPlayers[i]
      if (!presencePlayer) return null
      const presenceId = String(presencePlayer.id)
      const gp = players.find(p => String(p.id) === presenceId)
      return {
        id: presencePlayer.id,
        name: presencePlayer.display_name || 'Player',
        profile: presencePlayer.profile_image_url,
        chips: gp?.chips ?? settings.buyIn,
        isCurrent: presenceId === String(currentTurn),
        isDealer: gp?.isDealer || false,
        isSB: gp?.isSmallBlind || false,
        isBB: gp?.isBigBlind || false,
        folded: gp?.folded || false,
        allIn: gp?.allIn || false,
        bet: gp?.bet || 0,
        cards: gp?.cards || [],
      }
    })
  }, [joinedPlayers, players, settings, currentTurn])

  const myPlayer = players.find(p => String(p.id) === myId)
  const myBalance = myPlayer?.chips || 0
  const myCurrentBet = myPlayer?.bet || 0
  const canCheck = myCurrentBet >= currentBet
  const isMyTurn = String(currentTurn) === myId
  const minRaise = currentBet * 2 || settings.blind * 2
  const maxPossibleRaise = myBalance + myCurrentBet

  useEffect(() => {
    if (isMyTurn) setRaiseAmount(Math.min(minRaise, maxPossibleRaise))
  }, [isMyTurn, minRaise, maxPossibleRaise])

  const winnerPlayer = winnerInfo.length > 0 ? players.find(p => String(p.id) === String(winnerInfo[0]?.id)) : null

  // Circular positioning for modern table
  const getPlayerPosition = (index: number, size: number) => {
    const angle = (index / size) * Math.PI * 2 + Math.PI / 2
    const rx = 42
    const ry = 35
    const x = 50 + rx * Math.cos(angle)
    const y = 50 + ry * Math.sin(angle)
    return { left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }
  }

  const isHost = joinedPlayers[0]?.id === (user?.id || user?.display_name)

  return (
    <div className="fixed inset-0 overflow-hidden select-none bg-[#111] text-white">
      
      {/* HEADER */}
      <div className="absolute top-0 left-0 w-full px-6 py-4 flex items-center justify-between z-50 pointer-events-auto bg-gradient-to-b from-black/50 to-transparent">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-black italic tracking-tighter">POKER<span className="text-[#ff4500]">LIVE</span></h1>
            <div className="flex items-center gap-2 text-[10px] font-bold text-white/40 uppercase tracking-widest">
              <Coins className="w-3 h-3" />
              {settings.name} &nbsp;·&nbsp; {settings.blind}/{settings.blind * 2}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Invite link copied!') }}
            className="px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-widest bg-white/5 border border-white/10 hover:bg-white/10 transition-all flex items-center gap-2"
          >
            <Share2 className="w-3 h-3" /> Invite
          </button>
          {gameState === 'waiting' && isHost && (
            <button
              onClick={startNewGame}
              className="px-6 py-2 rounded-lg font-black uppercase text-xs tracking-widest bg-[#ff4500] hover:bg-[#e63e00] transition-all shadow-lg shadow-[#ff4500]/20"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* GAME AREA */}
      <div className="absolute inset-0 flex items-center justify-center p-12">
        
        {/* Table Graphic (CSS-based) */}
        <div className="relative w-full max-w-[1100px] aspect-[2.1/1] rounded-[240px] border-[12px] border-[#1e293b] shadow-[0_0_100px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Felt */}
            <div className="absolute inset-0 bg-[#064e3b]" />
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_transparent_0%,_rgba(0,0,0,0.5)_100%)]" />
            
            {/* Table Line */}
            <div className="absolute inset-[40px] border border-white/5 rounded-[200px]" />

            {/* Table Center Logo */}
            <div className="absolute inset-0 flex items-center justify-center opacity-[0.03] pointer-events-none">
                <Trophy className="w-64 h-64 text-white" />
            </div>

            {/* Community Cards Area */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center gap-6">
                {/* Community Cards */}
                <div className="flex items-center justify-center gap-2 md:gap-3">
                    <AnimatePresence>
                      {communityCards.map((card, i) => (
                        <motion.div
                          key={`${card.suit}-${card.value}-${i}`}
                          initial={{ y: -50, opacity: 0, rotateY: 180 }}
                          animate={{ y: 0, opacity: 1, rotateY: 0 }}
                          transition={{ delay: i * 0.1, type: 'spring', damping: 15 }}
                        >
                          <PokerCard suit={card.suit} value={card.value} className="w-14 h-20 md:w-20 md:h-28" />
                        </motion.div>
                      ))}
                      {/* Placeholders for remaining cards */}
                      {communityCards.length < 5 && Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                        <div key={`empty-${i}`} className="w-14 h-20 md:w-20 md:h-28 rounded-xl border-2 border-white/5 bg-black/10" />
                      ))}
                    </AnimatePresence>
                </div>

                {/* Pot Display */}
                {pot > 0 && (
                    <motion.div 
                        initial={{ scale: 0.8, opacity: 0 }}
                        animate={{ scale: 1, opacity: 1 }}
                        key={pot}
                        className="bg-black/40 backdrop-blur-md px-6 py-2 rounded-full border border-white/10 flex items-center gap-3 shadow-2xl"
                    >
                        <Coins className="text-yellow-500 w-5 h-5" />
                        <span className="text-lg font-black tracking-tight">{pot.toLocaleString()}</span>
                    </motion.div>
                )}
            </div>
        </div>

        {/* Players Section */}
        <div className="absolute inset-0 pointer-events-none">
            {playersWithState.map((player, i) => {
                if (!player) return null
                const pos = getPlayerPosition(i, settings.size)
                
                return (
                    <motion.div
                        key={player.id}
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="absolute pointer-events-auto"
                        style={pos}
                    >
                        <div className={`relative flex flex-col items-center group ${player.folded ? 'opacity-40 grayscale' : ''}`}>
                            {/* Dealer/SB/BB Buttons */}
                            <div className="absolute -top-4 left-1/2 -translate-x-1/2 flex gap-1 z-50">
                                {player.isDealer && <div className="w-6 h-6 rounded-full bg-white text-black text-[10px] font-black flex items-center justify-center border-2 border-black shadow-lg">D</div>}
                                {player.isSB && <div className="w-6 h-6 rounded-full bg-blue-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-black shadow-lg">SB</div>}
                                {player.isBB && <div className="w-6 h-6 rounded-full bg-red-500 text-white text-[10px] font-black flex items-center justify-center border-2 border-black shadow-lg">BB</div>}
                            </div>

                            {/* Cards */}
                            <div className="flex gap-1 mb-2">
                                <AnimatePresence>
                                    {player.cards.map((card, idx) => (
                                        <motion.div
                                            key={`${player.id}-card-${idx}`}
                                            initial={{ y: 10, opacity: 0, rotate: -10 }}
                                            animate={{ y: 0, opacity: 1, rotate: idx === 0 ? -5 : 5 }}
                                            className="first:mr-[-30px]"
                                        >
                                            <PokerCard suit={card.suit} value={card.value} isFlipped={card.suit === 'X'} className="w-12 h-18 md:w-16 md:h-22" />
                                        </motion.div>
                                    ))}
                                </AnimatePresence>
                            </div>

                            {/* Player Info Card */}
                            <div className={`glass-panel p-2 min-w-[140px] flex items-center gap-3 border-2 transition-all duration-300 ${player.isCurrent ? 'border-[#ff4500] shadow-[0_0_20px_rgba(255,69,0,0.3)] scale-110' : 'border-white/10'}`}>
                                <div className="relative">
                                    <img src={player.profile || '/poker/assets/ninja.png'} className="w-10 h-10 rounded-lg object-cover bg-black/20" alt="" />
                                    {player.isCurrent && (
                                        <div className="absolute inset-0 rounded-lg border-2 border-[#ff4500] animate-ping" />
                                    )}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <div className="text-xs font-black truncate uppercase tracking-tight">{player.name}</div>
                                    <div className="text-sm font-black text-yellow-500 flex items-center gap-1">
                                        <Coins className="w-3 h-3" /> {player.chips.toLocaleString()}
                                    </div>
                                </div>
                            </div>

                            {/* Bet Display */}
                            {player.bet > 0 && (
                                <div className="absolute -top-12 flex flex-col items-center">
                                    <ChipsStack amount={player.bet} />
                                    <div className="bg-black/60 backdrop-blur-sm px-3 py-0.5 rounded-full text-[10px] font-black border border-white/10 mt-1">
                                        {player.bet}
                                    </div>
                                </div>
                            )}

                            {/* Status Tags */}
                            <div className="absolute -bottom-6 flex gap-1">
                                {player.allIn && <div className="bg-red-600 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter animate-pulse">All-In</div>}
                                {player.folded && <div className="bg-slate-700 text-white text-[8px] font-black px-2 py-0.5 rounded uppercase tracking-tighter">Folded</div>}
                            </div>
                        </div>
                    </motion.div>
                )
            })}
        </div>
      </div>

      {/* WINNER OVERLAY */}
      <AnimatePresence>
        {winnerInfo.length > 0 && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm"
          >
            <motion.div
              initial={{ scale: 0.5, y: 50 }}
              animate={{ scale: 1, y: 0 }}
              className="glass-panel p-12 text-center max-w-xl w-full border-[#ff4500]/50"
            >
              <Trophy className="w-20 h-20 text-yellow-500 mx-auto mb-6" />
              <h2 className="text-5xl font-black italic uppercase tracking-tighter mb-2">WINNER!</h2>
              <div className="text-2xl font-bold text-[#ff4500] mb-8 uppercase tracking-widest">{winnerPlayer?.name || 'Someone'}</div>
              <div className="text-white/40 font-bold uppercase tracking-[0.3em] mb-10">{winnerInfo[0]?.handName}</div>
              
              {isHost && (
                <button
                  onClick={startNewGame}
                  className="bg-[#ff4500] hover:bg-[#e63e00] text-white font-black py-4 px-12 rounded-xl transition-all shadow-xl shadow-[#ff4500]/20 uppercase tracking-widest"
                >
                  Play Next Hand
                </button>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTROLS (Only if it's my turn) */}
      <AnimatePresence>
        {isMyTurn && gameState !== 'showdown' && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-0 left-0 w-full p-8 z-[60] flex flex-col items-center gap-4 bg-gradient-to-t from-black/80 to-transparent pointer-events-none"
          >
            {/* Raise Slider */}
            <div className="w-full max-w-md glass-panel p-4 flex flex-col gap-3 pointer-events-auto">
              <div className="flex justify-between text-xs font-black uppercase tracking-widest text-white/40">
                <span>Min: {minRaise}</span>
                <span className="text-[#ff4500]">Raise: {raiseAmount}</span>
                <span>Max: {maxPossibleRaise}</span>
              </div>
              <input
                type="range"
                min={minRaise}
                max={maxPossibleRaise}
                step={settings.blind}
                value={raiseAmount}
                onChange={(e) => setRaiseAmount(parseInt(e.target.value))}
                className="w-full h-2 bg-white/10 rounded-lg appearance-none cursor-pointer accent-[#ff4500]"
              />
            </div>

            {/* Buttons */}
            <div className="flex items-center gap-4 pointer-events-auto">
              <button
                onClick={() => handleAction('fold')}
                className="px-10 py-5 rounded-2xl bg-slate-800 hover:bg-slate-700 text-white font-black uppercase tracking-widest transition-all border border-white/10"
              >
                Fold
              </button>
              {canCheck ? (
                <button
                  onClick={() => handleAction('check')}
                  className="px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                >
                  Check
                </button>
              ) : (
                <button
                  onClick={() => handleAction('call')}
                  className="px-10 py-5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-blue-500/20"
                >
                  Call {currentBet - myCurrentBet}
                </button>
              )}
              <button
                onClick={() => handleAction('raise', raiseAmount)}
                className="px-10 py-5 rounded-2xl bg-[#ff4500] hover:bg-[#e63e00] text-white font-black uppercase tracking-widest transition-all shadow-lg shadow-[#ff4500]/20"
              >
                Raise to {raiseAmount}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FOOTER / DEVICE CONTROLS */}
      <div className="fixed bottom-6 right-6 flex gap-3 z-50">
        <button
          onClick={toggleMic}
          className={`p-4 rounded-2xl backdrop-blur-md border transition-all ${isMicOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/50 text-red-500'}`}
        >
          {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
        </button>
        <button
          onClick={toggleVideo}
          className={`p-4 rounded-2xl backdrop-blur-md border transition-all ${isVideoOn ? 'bg-white/10 border-white/20 text-white' : 'bg-red-500/20 border-red-500/50 text-red-500'}`}
        >
          {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
        </button>
        <button className="p-4 rounded-2xl bg-white/10 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all">
          <Settings className="w-5 h-5" />
        </button>
      </div>

    </div>
  )
}
