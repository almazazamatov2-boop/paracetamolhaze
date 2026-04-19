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
  MessageSquare,
  HelpCircle
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'

const SUITS = ['H', 'D', 'C', 'S']
const VALUES = ['2', '3', '4', '5', '6', '7', '8', '9', 'T', 'J', 'Q', 'K', 'A']

interface TableProps {
  roomId: string
  user: { id: string, display_name: string, profile_image_url: string }
  settings: {
    name: string
    size: number
    buyIn: number
    blind: number
    withWebcams: boolean
  }
  onBack: () => void
}

interface Player {
  id: string
  name: string
  chips: number
  isDealer: boolean
  isSmallBlind: boolean
  isBigBlind: boolean
  cards: { suit: string, value: string }[]
  folded: boolean
  bet: number
}

// Helper to evaluate hand strength (Minimal for now)
const evaluateHand = (cards: {suit: string, value: string}[]) => {
    if (cards.length < 2) return ""
    const vals = cards.map(c => c.value)
    if (vals[0] === vals[1]) return `ПАРА ${vals[0]}`
    return "Старшая карта"
}

export default function PokerTable({ roomId, user, settings, onBack }: TableProps) {
  const searchParams = useSearchParams()
  const router = useRouter()
  
  const [players, setPlayers] = useState<Player[]>([])
  const [communityCards, setCommunityCards] = useState<{ suit: string, value: string }[]>([])
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('waiting')
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [currentBet, setCurrentBet] = useState(0)
  const [lastRaiserId, setLastRaiserId] = useState<string | null>(null)
  const [raiseAmount, setRaiseAmount] = useState(40)
  
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)

  const videoRef = useRef<HTMLVideoElement>(null)
  const peerRef = useRef<any>(null)
  const localStreamRef = useRef<MediaStream | null>(null)
  const deckRef = useRef<{ suit: string, value: string }[]>([])
  const dealerIndexRef = useRef(0)
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])

  useEffect(() => {
    localStreamRef.current = localStream
  }, [localStream])

  // --- GAME LOGIC ---
  const createDeck = () => {
    const deck = []
    for (const suit of SUITS) {
      for (const value of VALUES) {
        deck.push({ suit, value })
      }
    }
    return deck.sort(() => Math.random() - 0.5)
  }

  const broadcastMessage = (msg: any) => {
    if (!roomId) return
    supabase.channel(roomId).send({
        type: 'broadcast',
        event: 'game_logic',
        payload: msg
    })
    handleGameMessage(msg)
  }

  const handleGameMessage = (msg: any) => {
    if (msg.state) setGameState(msg.state)
    if (msg.players) setPlayers(msg.players)
    if (msg.pot !== undefined) setPot(msg.pot)
    if (msg.communityCards) setCommunityCards(msg.communityCards)
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn) setCurrentTurn(msg.currentTurn)
    if (msg.deck) deckRef.current = msg.deck
    if (msg.lastRaiserId !== undefined) setLastRaiserId(msg.lastRaiserId)
  }

  const startNewGame = () => {
    const freshDeck = createDeck()
    const activePlayers = joinedPlayers.length
    if (activePlayers < 2) return

    // Rotate Dealer
    dealerIndexRef.current = (dealerIndexRef.current + 1) % activePlayers
    const dIdx = dealerIndexRef.current
    const sbIdx = (dIdx + 1) % activePlayers
    const bbIdx = (dIdx + 2) % activePlayers

    const sbVal = settings.blind
    const bbVal = settings.blind * 2

    const updatedPlayers = joinedPlayers.map((p, i) => {
        let chips = settings.buyIn
        let bet = 0
        if (i === sbIdx) {
            chips -= sbVal
            bet = sbVal
        } else if (i === bbIdx) {
            chips -= bbVal
            bet = bbVal
        }

        const c1 = freshDeck.pop()!
        const c2 = freshDeck.pop()!

        return {
            id: String(p.id),
            name: p.display_name,
            chips,
            bet,
            cards: [c1, c2],
            folded: false,
            isDealer: i === dIdx,
            isSmallBlind: i === sbIdx,
            isBigBlind: i === bbIdx
        }
    })

    const utgIdx = (bbIdx + 1) % activePlayers

    broadcastMessage({
        type: 'game_start',
        state: 'preflop',
        players: updatedPlayers,
        deck: freshDeck,
        communityCards: [],
        pot: sbVal + bbVal,
        currentBet: bbVal,
        currentTurn: updatedPlayers[utgIdx].id,
        lastRaiserId: updatedPlayers[bbIdx].id
    })
  }

  const handleAction = (action: 'fold' | 'call' | 'raise', amount?: number) => {
    if (currentTurn !== String(user.id || user.display_name)) return

    let nextPlayers = JSON.parse(JSON.stringify(players))
    let pIdx = nextPlayers.findIndex((p: any) => String(p.id) === String(user.id || user.display_name))
    if (pIdx === -1) return

    let nextPot = pot
    let nextBetTotal = currentBet
    let nextRaiser = lastRaiserId

    if (action === 'fold') {
        nextPlayers[pIdx].folded = true
    } else if (action === 'call') {
        const toCall = nextBetTotal - nextPlayers[pIdx].bet
        const actual = Math.min(toCall, nextPlayers[pIdx].chips)
        nextPlayers[pIdx].chips -= actual
        nextPlayers[pIdx].bet += actual
        nextPot += actual
    } else if (action === 'raise') {
        const raiseTo = amount || (nextBetTotal + settings.blind * 2)
        const diff = raiseTo - nextPlayers[pIdx].bet
        nextPlayers[pIdx].chips -= diff
        nextPlayers[pIdx].bet = raiseTo
        nextPot += diff
        nextBetTotal = raiseTo
        nextRaiser = nextPlayers[pIdx].id
    }

    // Find next player
    let nextIdx = (pIdx + 1) % nextPlayers.length
    while (nextPlayers[nextIdx].folded || nextPlayers[nextIdx].chips <= 0) {
        nextIdx = (nextIdx + 1) % nextPlayers.length
        if (nextIdx === pIdx) break // All others folded
    }

    // Check round end
    const active = nextPlayers.filter((p: any) => !p.folded)
    const matched = active.every((p: any) => p.bet === nextBetTotal || p.chips === 0)

    if (matched && (nextPlayers[nextIdx].id === nextRaiser || active.length === 1)) {
        transitionStage(nextPlayers, nextPot)
    } else {
        broadcastMessage({
            players: nextPlayers,
            pot: nextPot,
            currentBet: nextBetTotal,
            currentTurn: nextPlayers[nextIdx].id,
            lastRaiserId: nextRaiser
        })
    }
  }

  const transitionStage = (curPlayers: any[], curPot: number) => {
    let nextState = gameState
    let board = [...communityCards]
    const curDeck = [...deckRef.current]

    // Clear bets
    const resetPlayers = curPlayers.map(p => ({ ...p, bet: 0 }))

    if (gameState === 'preflop') {
        nextState = 'flop'
        board = [curDeck.pop()!, curDeck.pop()!, curDeck.pop()!]
    } else if (gameState === 'flop') {
        nextState = 'turn'
        board.push(curDeck.pop()!)
    } else if (gameState === 'turn') {
        nextState = 'river'
        board.push(curDeck.pop()!)
    } else if (gameState === 'river') {
        nextState = 'showdown'
    }

    // Next turn starts from SB (or next active after dealer)
    const dealerIdx = resetPlayers.findIndex(p => p.isDealer)
    let nextTurnIdx = (dealerIdx + 1) % resetPlayers.length
    while (resetPlayers[nextTurnIdx].folded) {
        nextTurnIdx = (nextTurnIdx + 1) % resetPlayers.length
    }

    broadcastMessage({
        state: nextState,
        players: resetPlayers,
        communityCards: board,
        deck: curDeck,
        currentBet: 0,
        currentTurn: resetPlayers[nextTurnIdx].id,
        lastRaiserId: null,
        pot: curPot
    })
  }

  // --- WEBCAM & PEER ---
  useEffect(() => {
    if (!user || !roomId) return
    const myUniqueId = `poker-${roomId}-${String(user.id || user.display_name).replace(/\s+/g, '_')}`
    
    const setupPeer = async () => {
        const { default: Peer } = await import('peerjs')
        const peer = new Peer(myUniqueId, {
            debug: 1,
            config: { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }, { urls: 'stun:stun1.l.google.com:19302' }] }
        })
        peerRef.current = peer
        peer.on('call', (call: any) => {
            const rId = call.peer.replace(`poker-${roomId}-`, '').replace(/_/g, ' ')
            call.answer(localStreamRef.current || undefined)
            call.on('stream', (s: MediaStream) => setRemoteStreams(prev => ({...prev, [rId]: s})))
        })
    }
    setupPeer()

    const channel = supabase.channel(roomId, { config: { presence: { key: String(user.id || user.display_name) } } })
    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const users = Object.values(state).flat() as any[]
        const unique = Array.from(new Map(users.map(u => [u.id, u])).values())
        setJoinedPlayers(unique)

        unique.forEach(u => {
            const rId = String(u.id)
            const rPeerId = `poker-${roomId}-${rId.replace(/\s+/g, '_')}`
            if (rId !== String(user.id || user.display_name) && peerRef.current && !remoteStreams[rId]) {
                if (myUniqueId > rPeerId && localStreamRef.current) {
                    const call = peerRef.current.call(rPeerId, localStreamRef.current)
                    call.on('stream', (s: MediaStream) => setRemoteStreams(prev => ({...prev, [rId]: s})))
                }
            }
        })
      })
      .on('broadcast', { event: 'game_logic' }, (p) => handleGameMessage(p.payload))
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
            await channel.track({ id: user.id || user.display_name, display_name: user.display_name, profile_image_url: user.profile_image_url })
        }
      })

    return () => { channel.unsubscribe(); peerRef.current?.destroy() }
  }, [user, roomId])

  useEffect(() => {
    if (settings.withWebcams) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(s => setLocalStream(s))
            .catch(e => console.error(e))
    }
  }, [settings.withWebcams])

  const playersWithState = useMemo(() => {
    return Array.from({ length: settings.size }).map((_, i) => {
        const pj = joinedPlayers[i]
        if (!pj) return null
        const gp = players.find(p => String(p.id) === String(pj.id))
        return {
            id: pj.id,
            name: pj.display_name,
            profile: pj.profile_image_url,
            chips: gp?.chips ?? settings.buyIn,
            bet: gp?.bet ?? 0,
            folded: gp?.folded ?? false,
            cards: gp?.cards ?? [],
            isDealer: gp?.isDealer ?? false,
            isSB: gp?.isSmallBlind ?? false,
            isBB: gp?.isBigBlind ?? false
        }
    })
  }, [joinedPlayers, players, settings])

  const getPos = (i: number, n: number) => {
    const a = (i / n) * 2 * Math.PI + Math.PI / 2
    return { left: `${50 + 42 * Math.cos(a)}%`, top: `${50 + 38 * Math.sin(a)}%` }
  }

  return (
    <div className="relative w-full h-screen bg-[#050505] text-white flex flex-col items-center justify-center overflow-hidden">
      
      {/* Header */}
      <div className="absolute top-0 w-full p-6 flex justify-between items-center z-50">
        <div className="flex gap-4 items-center">
            <button onClick={onBack} className="p-2 bg-white/5 rounded-full hover:bg-white/10"><ArrowLeft /></button>
            <div>
                <div className="text-primary font-black italic">{settings.name}</div>
                <div className="text-[10px] text-white/40">POT: {pot} | BLINDS: {settings.blind}/{settings.blind*2}</div>
            </div>
        </div>
        <div className="flex gap-2">
            <button onClick={() => window.location.reload()} className="px-4 py-2 bg-primary text-white font-bold rounded-lg text-xs">HARD FIX CAM</button>
            {gameState === 'waiting' && joinedPlayers[0]?.id === (user.id || user.display_name) && (
                <button onClick={startNewGame} className="px-6 py-2 bg-primary text-white font-black italic rounded-lg animate-pulse">START GAME</button>
            )}
        </div>
      </div>

      {/* Table */}
      <div className="relative w-full max-w-5xl aspect-[16/9]">
        <div className="absolute inset-[15%] bg-[#1a4a2e] rounded-[200px] border-[15px] border-[#2c1810] shadow-2xl flex flex-col items-center justify-center gap-4">
            <div className="flex gap-2">
                <AnimatePresence>
                    {communityCards.map((c, i) => (
                        <motion.div key={i} initial={{y:-20, opacity:0}} animate={{y:0, opacity:1}} transition={{delay: i*0.1}}>
                            <PokerCard suit={c.suit} value={c.value} />
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
            <div className="text-white/10 font-black text-6xl italic tracking-tighter">POT: {pot}</div>
        </div>

        {/* Players */}
        {playersWithState.map((p, i) => {
            if (!p) return null
            const pos = getPos(i, settings.size)
            const isMe = String(p.id) === String(user.id || user.display_name)
            const isTurn = String(p.id) === String(currentTurn)

            return (
                <div key={p.id} className="absolute -translate-x-1/2 -translate-y-1/2 flex flex-col items-center" style={{ left: pos.left, top: pos.top }}>
                    <div className={`relative w-28 h-28 md:w-32 md:h-32 rounded-2xl overflow-hidden border-4 transition-all ${isTurn ? 'border-primary ring-8 ring-primary/20 scale-110' : 'border-white/10'}`}>
                        {settings.withWebcams ? (
                            <div className="w-full h-full bg-black">
                                {isMe ? <LocalVideo stream={localStream} /> : <RemoteVideo stream={remoteStreams[p.id]} name={p.name} />}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-white/5 flex items-center justify-center text-4xl">👤</div>
                        )}
                        
                        <div className="absolute bottom-0 w-full bg-black/60 p-1 text-[10px] text-center font-bold">
                            {p.isDealer && <span className="bg-white text-black px-1 mr-1">D</span>}
                            {p.name.substring(0, 10)}
                        </div>
                    </div>
                    
                    <div className="mt-2 bg-black/80 px-3 py-1 rounded-full border border-white/10 text-xs font-black italic text-yellow-500 flex items-center gap-1">
                        <Coins className="w-3 h-3" /> {p.chips}
                    </div>

                    {p.bet > 0 && <div className="mt-1 bg-primary px-2 py-0.5 rounded text-[10px] font-bold">BET: {p.bet}</div>}

                    {/* Cards */}
                    {p.cards.length > 0 && !p.folded && (
                        <div className="absolute -bottom-4 flex gap-1 scale-50">
                            {p.cards.map((c, ci) => (
                                <PokerCard key={ci} suit={c.suit} value={c.value} isFlipped={!isMe && gameState !== 'showdown'} />
                            ))}
                        </div>
                    )}
                </div>
            )
        })}
      </div>

      {/* Controls */}
      {gameState !== 'waiting' && currentTurn === String(user.id || user.display_name) && (
        <div className="absolute bottom-10 flex gap-4 p-6 bg-black/80 border border-white/10 rounded-2xl z-50">
            <button onClick={() => handleAction('fold')} className="px-8 py-3 bg-white/5 hover:bg-white/10 font-bold rounded-lg border border-white/10">FOLD</button>
            <button onClick={() => handleAction('call')} className="px-8 py-3 bg-white/5 hover:bg-white/10 font-bold rounded-lg border border-white/10">
                {currentBet > (players.find(p => String(p.id) === String(user.id))?.bet || 0) ? 'CALL' : 'CHECK'}
            </button>
            <div className="flex flex-col gap-1">
                <div className="flex justify-between items-center px-2 text-[10px] text-primary font-bold">
                    <button onClick={() => setRaiseAmount(Math.max(settings.blind*2, raiseAmount-10))}>-</button>
                    <span>RAISE {raiseAmount}</span>
                    <button onClick={() => setRaiseAmount(raiseAmount+10)}>+</button>
                </div>
                <button onClick={() => handleAction('raise', raiseAmount)} className="px-8 py-3 bg-primary text-white font-bold rounded-lg shadow-lg">RAISE</button>
            </div>
        </div>
      )}
      
      {isMeInGame() && currentTurn === String(user.id || user.display_name) && <div className="absolute bottom-32 text-primary font-black italic animate-bounce">ВАШ ХОД!</div>}
      
      {gameState === 'showdown' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200]">
            <div className="text-center">
                <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
                <h2 className="text-4xl font-black italic mb-6">SHOWDOWN!</h2>
                <button onClick={startNewGame} className="px-10 py-4 bg-primary text-white font-black rounded-xl">СЛЕДУЮЩАЯ РАЗДАЧА</button>
            </div>
        </div>
      )}
    </div>
  )
}

function LocalVideo({ stream }: { stream: MediaStream | null }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream }, [stream])
  return <video ref={ref} autoPlay muted playsInline className="w-full h-full object-cover mirror" />
}

function RemoteVideo({ stream, name }: { stream: MediaStream | null, name: string }) {
  const ref = useRef<HTMLVideoElement>(null)
  useEffect(() => { if (ref.current && stream) ref.current.srcObject = stream }, [stream])
  return stream ? <video ref={ref} autoPlay playsInline className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-[10px] text-white/20 uppercase font-bold text-center p-4">Ожидание камеры {name}...</div>
}

function isMeInGame() { return true }
