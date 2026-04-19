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

interface TableProps {
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

export default function PokerTable({ settings, onBack }: TableProps) {
  const [players, setPlayers] = useState<Player[]>([])
  const [communityCards, setCommunityCards] = useState<{ suit: string, value: string }[]>([])
  const [pot, setPot] = useState(0)
  const [gameState, setGameState] = useState<'waiting' | 'preflop' | 'flop' | 'turn' | 'river' | 'showdown'>('waiting')
  const [localStream, setLocalStream] = useState<MediaStream | null>(null)
  const [user, setUser] = useState<{ id: string, display_name: string, profile_image_url: string } | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<Record<string, MediaStream>>({})
  const [isMicOn, setIsMicOn] = useState(true)
  const [isVideoOn, setIsVideoOn] = useState(true)
  
  const videoRef = useRef<HTMLVideoElement>(null)
  const peerConnections = useRef<Record<string, RTCPeerConnection>>({})
  const roomId = useMemo(() => "poker-main-room", []) // Static for now, can be dynamic

  // Fetch Twitch User
  useEffect(() => {
    fetch('/api/auth_me')
      .then(res => res.json())
      .then(data => {
        if (!data.error) setUser(data)
      })
      .catch(console.error)
  }, [])

  // Setup WebRTC and Supabase Signaling
  useEffect(() => {
    if (!user || !settings.withWebcams) return

    const channel = supabase.channel(roomId, {
      config: { presence: { key: user.id || user.display_name } }
    })

    const createPeerConnection = (targetId: string, isInitiator: boolean) => {
      const pc = new RTCPeerConnection({
        iceServers: [{ urls: 'stun:stun.l.google.com:19302' }]
      })

      if (localStream) {
        localStream.getTracks().forEach(track => pc.addTrack(track, localStream))
      }

      pc.ontrack = (event) => {
        setRemoteStreams(prev => ({ ...prev, [targetId]: event.streams[0] }))
      }

      pc.onicecandidate = (event) => {
        if (event.candidate) {
          channel.send({
            type: 'broadcast',
            event: 'signal',
            payload: { to: targetId, from: user.id || user.display_name, iceCandidate: event.candidate }
          })
        }
      }

      if (isInitiator) {
        pc.createOffer().then(offer => {
            pc.setLocalDescription(offer)
            channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { to: targetId, from: user.id || user.display_name, offer }
            })
        })
      }

      return pc
    }

    channel
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState()
        const onlineIds = Object.keys(state)

        // Connect to new peers
        onlineIds.forEach(pid => {
            if (pid !== (user.id || user.display_name) && !peerConnections.current[pid]) {
                peerConnections.current[pid] = createPeerConnection(pid, true)
            }
        })

        // Cleanup disconnected peers
        Object.keys(peerConnections.current).forEach(pid => {
            if (!onlineIds.includes(pid)) {
                peerConnections.current[pid].close()
                delete peerConnections.current[pid]
                setRemoteStreams(prev => {
                    const next = { ...prev }
                    delete next[pid]
                    return next
                })
            }
        })
      })
      .on('broadcast', { event: 'signal' }, (payload) => {
        const { to, from, offer, answer, iceCandidate } = payload.payload
        if (to !== (user.id || user.display_name)) return

        let pc = peerConnections.current[from]
        if (!pc) {
            pc = createPeerConnection(from, false)
            peerConnections.current[from] = pc
        }

        if (offer) {
          pc.setRemoteDescription(new RTCSessionDescription(offer))
          pc.createAnswer().then(ans => {
            pc.setLocalDescription(ans)
            channel.send({
                type: 'broadcast',
                event: 'signal',
                payload: { to: from, from: user.id || user.display_name, answer: ans }
            })
          })
        } else if (answer) {
          pc.setRemoteDescription(new RTCSessionDescription(answer))
        } else if (iceCandidate) {
          pc.addIceCandidate(new RTCIceCandidate(iceCandidate))
        }
      })
      .subscribe()

    return () => {
      channel.unsubscribe()
      Object.values(peerConnections.current).forEach(pc => pc.close())
    }
  }, [user, localStream, settings.withWebcams])

  // Setup local webcam
  useEffect(() => {
    if (settings.withWebcams && !localStream) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream)
        })
        .catch(err => console.error("Webcam error:", err))
    }
  }, [settings.withWebcams])

  // Toggle handlers
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

  useEffect(() => {
    if (videoRef.current && localStream) videoRef.current.srcObject = localStream
  }, [localStream])

  // Initialize players
  useEffect(() => {
    const mockPlayers: Player[] = Array.from({ length: settings.size }).map((_, i) => ({
      id: i === 0 ? (user?.id || user?.display_name || 'me') : `player-${i}`,
      name: i === 0 ? (user?.display_name || 'Вы (You)') : `Игрок ${i + 1}`,
      chips: settings.buyIn,
      isReady: true,
      isDealer: i === 1,
      isCurrent: i === 0,
      cards: i === 0 ? [{ suit: 'H', value: 'A' }, { suit: 'S', value: 'A' }] : [],
      folded: false,
      bet: 0
    }))
    setPlayers(mockPlayers)

    // In a real app, we'd start the game logic here
    setCommunityCards([
        { suit: 'D', value: 'T' },
        { suit: 'H', value: 'K' },
        { suit: 'C', value: 'A' }
    ])
    setPot(450)
  }, [settings])

  // Setup webcam
  useEffect(() => {
    if (settings.withWebcams) {
      navigator.mediaDevices.getUserMedia({ video: true, audio: true })
        .then(stream => {
          setLocalStream(stream)
          if (videoRef.current) videoRef.current.srcObject = stream
        })
        .catch(err => console.error("Webcam error:", err))
    }
    return () => {
      localStream?.getTracks().forEach(track => track.stop())
    }
  }, [settings.withWebcams])

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
    const myCards = players.find(p => p.id === 'me')?.cards || []
    if (myCards.length === 0) return null

    // Real logic would combine myCards + communityCards
    // For demo, we just look at our hand
    if (myCards[0].value === myCards[1].value) return "У вас ПАРА (Тройка тузов с учетом стола)"
    return "Высокая карта"
  }, [players, communityCards])

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center p-4 bg-radial-gradient from-[#0f2a1a] to-[#050505]">
      
      {/* HUD: Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex items-center justify-between z-50">
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
            <div className="px-4 py-2 bg-black/40 border border-white/10 rounded-xl backdrop-blur-md">
                <span className="text-primary font-black italic mr-2">HINT:</span>
                <span className="text-white/80 animate-pulse">{handHint}</span>
            </div>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"><History className="w-5 h-5" /></button>
            <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors"><MessageSquare className="w-5 h-5" /></button>
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
        {players.map((player, i) => {
            const pos = getPlayerPosition(i, players.length)
            const isMe = player.id === 'me'

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
                                    <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
                                ) : (
                                    <RemoteVideo stream={remoteStreams[player.id]} name={player.name} />
                                )}
                                <div className="absolute top-2 right-2 flex gap-1">
                                    <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
                                </div>
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
                            <div className="text-[10px] font-bold uppercase truncate">{player.name}</div>
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
                         <div className="absolute left-[110%] top-1/2 -translate-y-1/2 flex gap-1 scale-50 md:scale-75 origin-left z-30">
                            {player.cards.map((card, ci) => (
                                <motion.div
                                    key={ci}
                                    initial={{ x: -20, opacity: 0, rotate: -10 + ci * 20 }}
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
      <div className="absolute bottom-0 left-0 w-full p-8 flex items-end justify-center pointer-events-none">
        <div className="flex flex-wrap items-center gap-4 bg-black/80 backdrop-blur-2xl border border-white/10 p-4 md:p-6 rounded-3xl pointer-events-auto transform translate-y-[10px] hover:translate-y-0 transition-all duration-500 shadow-2xl">
            
            <div className="flex items-center gap-3">
              <button className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase">FOLD</button>
              <button className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase">CHECK</button>
              
              <div className="flex flex-col gap-1 min-w-[200px]">
                <div className="flex items-center justify-between px-3 py-1 bg-black/40 rounded-t-xl border-x border-t border-white/5">
                    <button className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors">-</button>
                    <span className="text-[10px] font-black tracking-widest text-primary">RAISE 2.5X</span>
                    <button className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors">+</button>
                </div>
                <button className="w-full py-4 bg-primary hover:bg-primary/90 text-white rounded-b-xl font-black italic shadow-lg shadow-primary/20 transition-all active:scale-95 border border-primary/20 uppercase">RAISE 40</button>
              </div>
            </div>

            <div className="h-12 w-px bg-white/10 mx-4 hidden md:block" />

            <div className="flex items-center gap-6">
                <div className="flex flex-col">
                    <span className="text-[10px] text-muted-foreground uppercase tracking-widest">ВАШ СТЕК</span>
                    <span className="text-xl font-black italic text-yellow-500 flex items-center gap-2 tracking-tight"><Coins className="w-5 h-5" /> 1,450</span>
                </div>
                
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

      {/* Combination info button */}
      <div className="absolute bottom-8 right-8">
        <button className="p-4 bg-black/40 border border-white/10 rounded-full hover:bg-black/60 transition-all text-white/50 hover:text-white">
            <HelpCircle />
        </button>
      </div>

    </div>
  )
}

function RemoteVideo({ stream, name }: { stream?: MediaStream, name: string }) {
    const videoRef = useRef<HTMLVideoElement>(null)

    useEffect(() => {
        if (videoRef.current && stream) {
            videoRef.current.srcObject = stream
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
