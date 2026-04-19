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
  isReady: boolean
  isDealer: boolean
  isCurrent: boolean
  cards: { suit: string, value: string }[]
  folded: boolean
  bet: number
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
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnections = useRef<Record<string, any>>({})
  const deckRef = useRef<{ suit: string, value: string }[]>([])
  const [currentTurn, setCurrentTurn] = useState<string | null>(null)
  const [currentBet, setCurrentBet] = useState(0)
  const [joinedPlayers, setJoinedPlayers] = useState<any[]>([])

  // --- TOGGLE HANDLERS ---
  const toggleMic = () => {
    if (localStream) {
        console.log("TOGGLE MIC", !isMicOn)
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

  // --- GAME LOGIC HELPERS ---
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
  }

  const startNewGame = () => {
    const newDeck = createDeck()
    const dealerId = players[0]?.id
    
    const updatedPlayers = players.map((p, i) => ({
        ...p,
        cards: [newDeck.pop()!, newDeck.pop()!],
        folded: false,
        bet: 0,
        isCurrent: p.id === dealerId
    }))

    broadcastMessage({
        type: 'game_update',
        state: 'preflop',
        players: updatedPlayers,
        deck: newDeck,
        communityCards: [],
        pot: settings.blind * 3,
        currentBet: settings.blind * 2,
        currentTurn: dealerId
    })
  }

  const nextStage = () => {
    let nextS: typeof gameState = 'preflop'
    let newCards = [...communityCards]
    const currentDeck = [...deckRef.current]

    if (gameState === 'preflop') {
        nextS = 'flop'
        newCards = [currentDeck.pop()!, currentDeck.pop()!, currentDeck.pop()!]
    } else if (gameState === 'flop') {
        nextS = 'turn'
        newCards.push(currentDeck.pop()!)
    } else if (gameState === 'turn') {
        nextS = 'river'
        newCards.push(currentDeck.pop()!)
    } else if (gameState === 'river') {
        nextS = 'showdown'
    }

    broadcastMessage({
        type: 'game_update',
        state: nextS,
        communityCards: newCards,
        deck: currentDeck,
        currentBet: 0,
        players: players.map(p => ({ ...p, bet: 0 })) 
    })
  }

  // --- AUTOMATION EFFECT ---
  useEffect(() => {
    // Only the "Host" (first player in list) manages automation to avoid conflicts
    if (players[0]?.id !== (user?.id || user?.display_name)) return
    if (gameState === 'waiting' || gameState === 'showdown') return

    const activePlayers = players.filter(p => !p.folded)
    const allMatched = activePlayers.every(p => p.bet === currentBet)
    
    // In a real game we'd also check if everyone had a chance to act
    if (allMatched && activePlayers.length > 0 && currentBet >= 0) {
        // Simple delay before next stage for better UX
        const timer = setTimeout(() => {
            if (gameState === 'river') {
                setGameState('showdown')
            } else {
                nextStage()
            }
        }, 2000)
        return () => clearTimeout(timer)
    }
  }, [players, currentBet, gameState])

  // Automatically enroll new presence players into the game state
  useEffect(() => {
    setPlayers(prev => {
        const newPlayers = [...prev]
        joinedPlayers.forEach(jp => {
            if (!newPlayers.find(p => p.id === jp.id)) {
                newPlayers.push({
                    id: jp.id,
                    name: jp.display_name,
                    chips: settings.buyIn,
                    isReady: true,
                    isDealer: false,
                    isCurrent: false,
                    cards: [],
                    folded: false,
                    bet: 0
                })
            }
        })
        return newPlayers
    })
  }, [joinedPlayers, settings.buyIn])

  // Setup PeerJS and Supabase Presence
  useEffect(() => {
    if (!user || !roomId) return
    
    let peer: any = null
    const myId = `poker-${roomId}-${(user.id || user.display_name).toString().replace(/\s+/g, '_')}`

    const initPeer = async () => {
        const { default: Peer } = await import('peerjs')
        peer = new Peer(myId, {
            debug: 1,
            config: {
                iceServers: [
                    { urls: 'stun:stun.l.google.com:19302' },
                    { urls: 'stun:stun1.l.google.com:19302' }
                ]
            }
        })

        // Handle incoming calls
        peer.on('call', (call: any) => {
            console.log('Incoming call from:', call.peer)
            call.answer(localStream || undefined)
            
            call.on('stream', (remoteStream: MediaStream) => {
                const remoteUserId = call.peer.replace(`poker-${roomId}-`, '').replace(/_/g, ' ')
                setRemoteStreams(prev => ({ ...prev, [remoteUserId]: remoteStream }))
            })
        })

        peer.on('error', (err: any) => console.error('PeerJS error:', err))
    }

    initPeer()

    const channel = supabase.channel(roomId, {
      config: { presence: { key: (user.id || user.display_name).toString() } }
    })

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineUsers = Object.values(state).flat() as any[]
        const uniqueUsers = Array.from(new Map(onlineUsers.map(u => [u.id, u])).values())
        setJoinedPlayers(uniqueUsers)

        // Find people to call
        uniqueUsers.forEach(u => {
            const remoteUserId = u.id.toString()
            const remotePeerId = `poker-${roomId}-${remoteUserId.replace(/\s+/g, '_')}`
            
            if (remoteUserId !== (user.id || user.display_name).toString() && peer && !remoteStreams[remoteUserId]) {
                // Initiator logic
                if (myId > remotePeerId && localStream) {
                    console.log('Calling peer:', remotePeerId)
                    const call = peer.call(remotePeerId, localStream)
                    call.on('stream', (remoteStream: MediaStream) => {
                        setRemoteStreams(prev => ({ ...prev, [remoteUserId]: remoteStream }))
                    })
                }
            }
        })
      })
      .on('broadcast', { event: 'game_logic' }, (payload) => {
        handleGameMessage(payload.payload)
      })
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
      peer?.destroy()
    }
  }, [user, roomId, localStream, settings.withWebcams])

  // Unified webcam initialization
  useEffect(() => {
    let activeStream: MediaStream | null = null
    
    if (settings.withWebcams) {
        navigator.mediaDevices.getUserMedia({ video: true, audio: true })
            .then(stream => {
                activeStream = stream
                setLocalStream(stream)
                if (videoRef.current) videoRef.current.srcObject = stream
            })
            .catch(err => console.error("Webcam error:", err))
    }

  }, [settings.withWebcams])


  // Sync state logic (Dynamic players)
  const playersWithState = useMemo(() => {
    return Array.from({ length: settings.size }).map((_, i) => {
        // Find player who specifically joined this seat (or just distribute them)
        const presencePlayer = joinedPlayers[i]
        if (!presencePlayer) return null
        
        const gameStatePlayer = players.find(p => p.id === presencePlayer.id)
        return {
            id: presencePlayer.id,
            name: presencePlayer.display_name,
            profile: presencePlayer.profile_image_url,
            chips: gameStatePlayer?.chips ?? settings.buyIn,
            isCurrent: gameStatePlayer?.isCurrent || false,
            isDealer: gameStatePlayer?.isDealer || false,
            folded: gameStatePlayer?.folded || false,
            bet: gameStatePlayer?.bet || 0,
            cards: gameStatePlayer?.cards || []
        }
    })
  }, [joinedPlayers, players, settings])

  // Player positions around the table (percentages)
  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2
    const radiusX = 42 // table width radius
    const radiusY = 38 // table height radius
    return {
      left: `${50 + radiusX * Math.cos(angle)}%`,
      top: `${50 + radiusY * Math.sin(angle)}%`
    }
  }

  // Hand Evaluation Hint (Simplified for Demo)
  const handHint = useMemo(() => {
    const me = players.find(p => p.id === (user?.id || user?.display_name || 'me'))
    const myCards = me?.cards || []
    if (myCards.length === 0 || me?.folded) return null

    if (myCards.length >= 2 && myCards[0].value === myCards[1].value) {
        return `ПАРА (${myCards[0].value}, ${myCards[1].value})`
    }
    return null
  }, [players, communityCards, user])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-start pt-16 md:pt-24 p-4 bg-radial-gradient from-[#0f2a1a] to-[#050505]">
      
      {/* HUD: Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-[100]">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <div>
            <h1 className="text-xl font-bold italic text-primary">{settings.name}</h1>
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <span className="flex items-center gap-1"><Coins className="w-3 h-3 text-yellow-500" /> Blinds: {settings.blind}/{settings.blind*2}</span>
              <span className="bg-white/10 px-2 py-0.5 rounded uppercase tracking-tighter">POT: {pot}</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
            <button 
              onClick={() => {
                navigator.clipboard.writeText(window.location.href)
                alert("Ссылка на стол скопирована!")
              }}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
            >
                INVITE
            </button>
            <button 
              onClick={() => {
                setJoinedPlayers([])
                supabase.channel(roomId).track({ refresh: Date.now() })
                alert("Синхронизация запущена...")
              }}
              className="px-4 py-2 bg-white/5 hover:bg-white/10 text-white/50 rounded-xl text-[10px] font-bold transition-all"
            >
                RECONNECT
            </button>
            {gameState === 'waiting' && joinedPlayers[0]?.id === (user?.id || user?.display_name) && (
                <button 
                  onClick={startNewGame}
                  className="px-6 py-2 bg-primary text-white font-black italic rounded-xl shadow-lg shadow-primary/20 animate-pulse"
                >
                    START GAME
                </button>
            )}
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"><History className="w-5 h-5" /></button>
        </div>
      </div>

      {/* RENDER TABLE */}
      <div className="relative w-full max-w-5xl aspect-[16/10] flex items-center justify-center">
        
        {/* The Felt Table */}
        <div className="absolute w-[80%] h-[70%] bg-[#1a4a2e] rounded-[150px] border-[12px] border-[#2c1810] shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
            {/* Table inner glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />
            <div className="absolute inset-0 bg-grid-pattern opacity-10" />
            
            {/* Community Cards */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
                <div className="flex items-center gap-3">
                    <AnimatePresence>
                        {communityCards.map((card, i) => (
                            <motion.div
                                key={`${card.suit}-${card.value}`}
                                initial={{ y: -50, opacity: 0, rotateY: 180 }}
                                animate={{ y: 0, opacity: 1, rotateY: 0 }}
                                transition={{ delay: 0.2 + i * 0.1 }}
                            >
                                <PokerCard suit={card.suit} value={card.value} />
                            </motion.div>
                        ))}
                    </AnimatePresence>
                    {communityCards.length < 5 && Array.from({length: 5 - communityCards.length}).map((_, i) => (
                        <div key={i} className="w-16 h-24 md:w-20 md:h-28 rounded-lg bg-black/20 border border-white/5 border-dashed" />
                    ))}
                </div>
                <div className="text-center">
                    <div className="text-4xl font-black italic text-white/20 tracking-widest uppercase">POT: {pot}</div>
                </div>
            </div>
        </div>

        {/* Players */}
        {playersWithState.map((player, i) => {
            if (!player) {
                const pos = getPlayerPosition(i, settings.size)
                return (
                    <div 
                        key={`empty-${i}`} 
                        className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-30 scale-75 cursor-pointer hover:opacity-50 transition-all"
                        style={{ left: pos.left, top: pos.top }}
                    >
                        <div className="w-24 h-24 md:w-32 md:h-32 rounded-2xl border-2 border-dashed border-white/40 flex flex-col items-center justify-center gap-2">
                             <span className="text-2xl">🪑</span>
                             <span className="text-[10px] font-bold uppercase tracking-widest text-white/40">СВОБОДНО</span>
                        </div>
                    </div>
                )
            }

            const pos = getPlayerPosition(i, settings.size)
            const isMe = player.id === (user?.id || user?.display_name)

            return (
                <motion.div
                    key={player.id}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center"
                    style={{ left: pos.left, top: pos.top }}
                >
                    {/* Dealer Button */}
                    {player.isDealer && (
                        <div className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black font-bold rounded-full border-2 border-black flex items-center justify-center shadow-lg text-[10px]">D</div>
                    )}

                    {/* Player Card (Webcam or Avatar) */}
                    <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${player.isCurrent ? 'border-primary ring-4 ring-primary/20 scale-110 shadow-[0_0_30px_rgba(255,69,0,0.4)]' : 'border-white/10 grayscale-[0.5]'} hover:grayscale-0`}>
                        {settings.withWebcams ? (
                            <div className="relative w-full h-full bg-black">
                                {isMe ? (
                                    <LocalVideo stream={localStream} />
                                ) : (
                                    <RemoteVideo stream={remoteStreams[player.id]} name={player.name} />
                                )}
                            </div>
                        ) : (
                            <div className="w-full h-full bg-[#151515] flex items-center justify-center">
                                {isMe && user?.profile_image_url ? (
                                    <img src={user.profile_image_url} alt={player.name} className="w-full h-full object-cover" />
                                ) : (
                                    <span className="text-4xl">👤</span>
                                )}
                            </div>
                        )}
                        
                        {/* Status Overlay */}
                        <div className="absolute bottom-0 left-0 w-full bg-black/60 backdrop-blur-md p-1 px-2">
                            <div className="text-[10px] font-bold uppercase truncate">{player.name} {isMe ? '(ВЫ)' : ''}</div>
                            <div className="text-[12px] text-yellow-500 font-black italic flex items-center gap-1">
                                <Coins className="w-3 h-3" /> {player.chips}
                            </div>
                        </div>

                        {/* Bet Amount */}
                        {player.bet > 0 && (
                            <motion.div 
                                initial={{ y: 20, opacity: 0 }} 
                                animate={{ y: 0, opacity: 1 }}
                                className="absolute -top-10 bg-primary/20 border border-primary text-primary px-3 py-1 rounded-full text-xs font-bold"
                            >
                                {player.bet}
                            </motion.div>
                        )}
                    </div>

                    {/* Hand Cards (Visible if Me or Showdown) - MOVED TO THE RIGHT */}
                    {isMe && player.cards.length > 0 && !player.folded && (
                         <div className="absolute left-[110%] top-1/2 -translate-y-1/2 flex gap-4 scale-50 md:scale-75 origin-left z-30">
                            {player.cards.map((card, ci) => (
                                <motion.div
                                    key={ci}
                                    initial={{ x: -20, opacity: 0, rotate: -5 + ci * 10 }}
                                    animate={{ x: 0, opacity: 1 }}
                                    transition={{ delay: 0.5 + ci * 0.1 }}
                                >
                                    <PokerCard suit={card.suit} value={card.value} />
                                </motion.div>
                            ))}
                         </div>
                    )}
                </motion.div>
            )
        })}
      </div>

      {/* CONTROLS: Bottom HUD */}
      <div className="absolute bottom-0 left-0 w-full p-8 flex items-end justify-center z-[100] pointer-events-auto">
        <div className="flex flex-wrap items-center gap-4 bg-black/90 backdrop-blur-3xl border border-white/20 p-4 md:p-6 rounded-3xl shadow-2xl">
            
            <div className="flex items-center gap-3">
              <button 
                onClick={() => {
                    broadcastMessage({
                        type: 'action',
                        players: players.map(p => p.id === (user?.id || user?.display_name) ? {...p, folded: true} : p)
                    })
                }}
                className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase"
              >
                FOLD
              </button>
              <button 
                onClick={() => {
                    const me = players.find(p => p.id === (user?.id || user?.display_name))
                    const callAmount = currentBet - (me?.bet || 0)
                    if (me && me.chips >= callAmount) {
                        broadcastMessage({
                            type: 'action',
                            players: players.map(p => p.id === (user?.id || user?.display_name) ? {...p, chips: p.chips - callAmount, bet: p.bet + callAmount} : p),
                            pot: pot + callAmount
                        })
                    }
                }}
                className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase"
              >
                {currentBet > (players.find(p => p.id === (user?.id || user?.display_name))?.bet || 0) ? 'CALL' : 'CHECK'}
              </button>
              
              <div className="flex flex-col gap-1 min-w-[200px]">
                <div className="flex items-center justify-between px-3 py-1 bg-black/40 rounded-t-xl border-x border-t border-white/5">
                    <button 
                      onClick={() => setRaiseAmount(Math.max(settings.blind * 2, raiseAmount - 10))}
                      className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >-</button>
                    <span className="text-[10px] font-black tracking-widest text-primary">RAISE {raiseAmount}</span>
                    <button 
                      onClick={() => setRaiseAmount(raiseAmount + 10)}
                      className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors"
                    >+</button>
                </div>
                <button 
                  disabled={!players.find(p => p.id === (user?.id || user?.display_name))?.isCurrent}
                  onClick={() => {
                    const me = players.find(p => p.id === (user?.id || user?.display_name))
                    if (me && me.chips >= raiseAmount) {
                      broadcastMessage({
                          type: 'action',
                          players: players.map(p => p.id === (user?.id || user?.display_name) ? {...p, chips: p.chips - raiseAmount, bet: p.bet + raiseAmount, isCurrent: false} : p),
                          pot: pot + raiseAmount,
                          currentBet: (me.bet || 0) + raiseAmount
                      })
                    }
                  }}
                  className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed text-white rounded-b-xl font-black italic shadow-lg shadow-primary/20 transition-all active:scale-95 border border-primary/20 uppercase"
                >
                  RAISE {raiseAmount}
                </button>
              </div>
            </div>

            <div className="h-12 w-px bg-white/10 mx-4 hidden md:block" />

            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">ВАШ СТЕК</span>
                    <span className="text-xl font-black italic text-yellow-500 flex items-center gap-2 tracking-tight">
                        <Coins className="w-5 h-5" /> 
                        {players.find(p => p.id === (user?.id || user?.display_name || 'me'))?.chips?.toLocaleString() || '0'}
                    </span>
                </div>
                
                <div className="flex gap-4 items-center">
                    {handHint && (
                        <div className="px-4 py-2 bg-primary/10 border border-primary/20 rounded-xl backdrop-blur-md">
                            <span className="text-[10px] font-black italic text-primary mr-2 uppercase">HINT:</span>
                            <span className="text-xs font-bold text-white tracking-widest">{handHint}</span>
                        </div>
                    )}

                    <div className="flex gap-2">
                    <button 
                      onClick={toggleMic}
                      className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-twitch-purple/20 text-twitch-purple hover:bg-twitch-purple/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                      {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                    </button>
                    <button 
                      onClick={toggleVideo}
                      className={`p-4 rounded-xl transition-all ${isVideoOn ? 'bg-twitch-purple/20 text-twitch-purple hover:bg-twitch-purple/30' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                    >
                      {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                    </button>
                </div>
              </div>
            </div>
        </div>
      </div>

      {/* Combination info button */}
      <div className="absolute bottom-8 right-8">
        <button className="p-4 bg-black/40 border border-white/10 rounded-full hover:bg-black/60 transition-all text-white/50 hover:text-white">
            <HelpCircle />
        </button>
      </div>

    </div>
  )
}

function LocalVideo({ stream }: { stream: MediaStream | null }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(e => console.error("Remote Play Error:", e))
        }
    }, [stream])

    return <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
}

function RemoteVideo({ stream, name }: { stream?: MediaStream, name: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && stream) {
            console.log("ATTACHING STREAM TO LOCAL VIDEO")
            videoRef.current.srcObject = stream
            videoRef.current.play().catch(e => console.error("Play error:", e))
        }
    }, [stream])

    if (!stream) {
        return (
            <div className="w-full h-full bg-[#151515] flex items-center justify-center">
                <span className="text-muted-foreground text-[10px] text-center px-2">Ожидание камеры...</span>
            </div>
        )
    }

    return <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
}
