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
} from 'lucide-react'
import { supabase } from '@/lib/supabase'
import PokerCard from './PokerCard'
import { PokerLogic, type PokerPlayer, type PokerGameState, type Card } from '@/lib/pokerLogic'

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

  // FIX 1: deckRef — хранит колоду между действиями
  const deckRef = useRef<Card[]>([])

  // FIX 2: Канонический стейт — избегаем реконструкции из разрозненных useState
  const fullStateRef = useRef<PokerGameState | null>(null)

  // FIX 3: Собственные карты — не теряем их при получении broadcast
  const myCardsRef = useRef<{ suit: string, value: string }[]>([])

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

  // --- BROADCAST ---
  const broadcastMessage = (msg: any) => {
    if (!roomId) return
    supabase.channel(roomId).send({
      type: 'broadcast',
      event: 'game_logic',
      payload: msg
    })
    // Обрабатываем локально (Supabase не возвращает broadcast отправителю)
    applyGameMessage(msg)
  }

  /**
   * FIX 4: Обработка сообщения игры
   * - Сохраняем свои карты в myCardsRef
   * - Скрываем карты других игроков (рубашки) пока не showdown
   */
  const applyGameMessage = (msg: any) => {
    if (msg.phase !== undefined) setGameState(msg.phase)
    else if (msg.state !== undefined) setGameState(msg.state)

    if (msg.players) {
      const isShowdown = (msg.phase || msg.state) === 'showdown'

      // Находим свои карты в сообщении и сохраняем
      const meInMsg = msg.players.find((p: any) => String(p.id) === myId)
      if (meInMsg?.cards?.length > 0) {
        const validCards = meInMsg.cards.filter((c: any) => c.suit !== 'X')
        if (validCards.length > 0) {
          myCardsRef.current = validCards
        }
      }

      // Применяем карты: свои — реальные, чужие — рубашки (кроме showdown)
      const sanitized = msg.players.map((p: any) => {
        const isMe = String(p.id) === myId
        let cards: { suit: string, value: string }[]

        if (isMe) {
          // Свои карты — берём из myCardsRef (самые актуальные)
          cards = myCardsRef.current.length > 0 ? myCardsRef.current : (p.cards || [])
        } else if (isShowdown) {
          // На шоудауне показываем всем карты
          cards = p.cards || []
        } else {
          // Чужие карты — скрываем рубашкой
          cards = p.cards?.length > 0
            ? p.cards.map(() => ({ suit: 'X', value: 'X' }))
            : []
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

    // Сохраняем канонический стейт
    if (msg.players && msg.deck !== undefined) {
      fullStateRef.current = {
        players: msg.players, // полные данные (с реальными картами)
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

  // --- START GAME ---
  const startNewGame = () => {
    if (joinedPlayers.length < 2) {
      alert('Нужно минимум 2 игрока!')
      return
    }

    // Переносим актуальные фишки из последнего состояния
    const playersWithChips = joinedPlayers.map(jp => {
      const prev = players.find(p => String(p.id) === String(jp.id))
      return {
        ...jp,
        chips: prev?.chips && prev.chips > 0 ? prev.chips : settings.buyIn
      }
    })

    // Следующая позиция дилера
    dealerIndexRef.current = (dealerIndexRef.current + 1) % playersWithChips.length

    try {
      const newState = PokerLogic.prepareNewHand(
        playersWithChips,
        dealerIndexRef.current,
        settings.blind,
        settings.buyIn
      )

      // Очищаем showdown данные
      setWinnerInfo([])
      myCardsRef.current = []

      // Сохраняем свои карты сразу
      const meInState = newState.players.find(p => String(p.id) === myId)
      if (meInState?.cards) {
        myCardsRef.current = meInState.cards
      }

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
    } catch (e: any) {
      alert(e.message || 'Ошибка запуска игры')
    }
  }

  // --- HANDLE ACTION ---
  const handleAction = (action: 'fold' | 'call' | 'raise' | 'check', amount?: number) => {
    // FIX 5: Берём состояние из fullStateRef (не из React useState)
    if (!fullStateRef.current) {
      console.error('fullStateRef is null, cannot handle action')
      return
    }

    const state = fullStateRef.current

    // Проверяем что сейчас наш ход
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || String(activePlayer.id) !== myId) {
      return
    }

    // При рейзе проверяем минимальный рейз
    let raiseAmt = amount
    if (action === 'raise' && raiseAmt !== undefined) {
      const minRaise = state.currentBet * 2 || settings.blind * 2
      if (raiseAmt < minRaise) raiseAmt = minRaise
    }

    const nextState = PokerLogic.handleAction(state, myId, action, raiseAmt)

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

  // --- SUPABASE + WEBRTC SETUP ---
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

    const channel = supabase.channel(roomId, {
      config: { presence: { key: myId.toString() } }
    })

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
      .on('broadcast', { event: 'game_logic' }, (payload) => {
        applyGameMessage(payload.payload)
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
      peerRef.current?.destroy()
    }
  }, [user, roomId])

  // Вебкамера
  useEffect(() => {
    if (!settings.withWebcams) return
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then(stream => {
        setLocalStream(stream)
        if (videoRef.current) videoRef.current.srcObject = stream
      })
      .catch(err => console.error('Webcam error:', err))
  }, [settings.withWebcams])

  // Автоподключение новых игроков к списку
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

  // Позиции вокруг стола
  const getPlayerPosition = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2
    const radiusX = 42
    const radiusY = 38
    return {
      left: `${50 + radiusX * Math.cos(angle)}%`,
      top: `${50 + radiusY * Math.sin(angle)}%`
    }
  }

  // Данные игроков для рендера
  const playersWithState = useMemo(() => {
    return Array.from({ length: settings.size }).map((_, i) => {
      const presencePlayer = joinedPlayers[i]
      if (!presencePlayer) return null

      const presenceId = String(presencePlayer.id)
      const gp = players.find(p => String(p.id) === presenceId)

      return {
        id: presencePlayer.id,
        name: presencePlayer.display_name,
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

  // Подсказка по руке
  const handHint = useMemo(() => {
    const myCards = myCardsRef.current
    if (myCards.length < 2) return null
    if (myCards[0].suit === 'X') return null

    const allCards = [...myCards, ...communityCards]
    if (allCards.length >= 5) {
      const score = PokerLogic.evaluateHand(allCards as any)
      return PokerLogic.getHandName(score)
    }
    if (myCards[0].value === myCards[1].value) {
      return `Пара ${myCards[0].value}`
    }
    return null
  }, [players, communityCards])

  // Мой текущий бет (для кнопки CALL/CHECK)
  const myCurrentBet = players.find(p => String(p.id) === myId)?.bet || 0
  const canCheck = myCurrentBet >= currentBet
  const isMyTurn = String(currentTurn) === myId

  // Победитель
  const winnerPlayer = winnerInfo.length > 0
    ? players.find(p => String(p.id) === String(winnerInfo[0]?.id))
    : null

  const isHost = joinedPlayers[0]?.id === (user?.id || user?.display_name)

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
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-yellow-500" />
                Blinds: {settings.blind}/{settings.blind * 2}
              </span>
              <span className="bg-white/10 px-2 py-0.5 rounded uppercase tracking-tighter">
                POT: {pot}
              </span>
              {gameState !== 'waiting' && (
                <span className="bg-primary/20 text-primary px-2 py-0.5 rounded uppercase tracking-tighter font-bold">
                  {gameState.toUpperCase()}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Ссылка скопирована!') }}
            className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2"
          >
            INVITE
          </button>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-primary text-white rounded-xl text-[10px] font-bold transition-all shadow-lg shadow-primary/20"
          >
            HARD FIX CAM
          </button>
          {/* START GAME — только хост может начать */}
          {gameState === 'waiting' && isHost && (
            <button
              onClick={startNewGame}
              className="px-6 py-2 bg-primary text-white font-black italic rounded-xl shadow-lg shadow-primary/20"
            >
              START GAME
            </button>
          )}
          <button className="p-3 bg-white/5 hover:bg-white/10 rounded-xl transition-colors">
            <History className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* RENDER TABLE */}
      <div className="relative w-full max-w-5xl aspect-[16/10] flex items-center justify-center">

        {/* The Felt Table */}
        <div className="absolute w-[80%] h-[70%] bg-[#1a4a2e] rounded-[150px] border-[12px] border-[#2c1810] shadow-[0_0_100px_rgba(0,0,0,0.8),inset_0_0_50px_rgba(0,0,0,0.5)] overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(255,255,255,0.05)_0%,_transparent_70%)]" />

          {/* Community Cards */}
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-6">
            <div className="flex items-center gap-3">
              <AnimatePresence>
                {communityCards.map((card, i) => (
                  <motion.div
                    key={`${card.suit}-${card.value}-${i}`}
                    initial={{ y: -50, opacity: 0, rotateY: 180 }}
                    animate={{ y: 0, opacity: 1, rotateY: 0 }}
                    transition={{ delay: 0.2 + i * 0.1 }}
                  >
                    <PokerCard suit={card.suit} value={card.value} />
                  </motion.div>
                ))}
              </AnimatePresence>
              {communityCards.length < 5 && Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                <div key={i} className="w-16 h-24 md:w-20 md:h-28 rounded-lg bg-black/20 border border-white/5 border-dashed" />
              ))}
            </div>
            <div className="text-4xl font-black italic text-white/20 tracking-widest uppercase">
              POT: {pot}
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
                className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-30 scale-75"
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
          const isMe = String(player.id) === myId

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
                <div className="absolute -top-4 -right-4 w-8 h-8 bg-white text-black font-bold rounded-full border-2 border-black flex items-center justify-center shadow-lg text-[10px] z-30">D</div>
              )}

              {/* Player Card (Webcam or Avatar) */}
              <div className={`relative w-24 h-24 md:w-32 md:h-32 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${player.isCurrent ? 'border-primary scale-110' : 'border-white/10'} ${player.folded ? 'grayscale opacity-50' : ''}`}>
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
                <div className="absolute top-[105%] left-0 w-full bg-black/40 backdrop-blur-md p-1 px-2 rounded-lg border border-white/5">
                  <div className="text-[10px] font-bold uppercase truncate text-white/90">
                    {player.isDealer && <span className="text-white bg-white/20 px-1 rounded mr-1">D</span>}
                    {player.isSB && <span className="text-white bg-blue-500/40 px-1 rounded mr-1">SB</span>}
                    {player.isBB && <span className="text-white bg-red-500/40 px-1 rounded mr-1">BB</span>}
                    {player.allIn && <span className="text-yellow-400 bg-yellow-400/20 px-1 rounded mr-1">ALL-IN</span>}
                    {player.name} {isMe ? '(ВЫ)' : ''}
                  </div>
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

              {/* FIX 6: Карты игрока — рубашкой для чужих, лицом для своих */}
              {player.cards.length > 0 && !player.folded && (
                <div className="absolute left-[110%] top-1/2 -translate-y-1/2 flex gap-2 scale-50 md:scale-75 origin-left z-30">
                  {player.cards.map((card, ci) => {
                    const isHidden = card.suit === 'X'
                    return (
                      <motion.div
                        key={ci}
                        initial={{ x: -20, opacity: 0, rotate: -5 + ci * 10 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ delay: 0.5 + ci * 0.1 }}
                      >
                        {/* Если рубашка — показываем перевёрнутую карту */}
                        {isHidden ? (
                          <PokerCard suit="H" value="A" isFlipped={true} />
                        ) : (
                          <PokerCard suit={card.suit as any} value={card.value as any} />
                        )}
                      </motion.div>
                    )
                  })}
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
              onClick={() => handleAction('fold')}
              disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown'}
              className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase"
            >
              FOLD
            </button>

            {/* FIX 7: CHECK или CALL в зависимости от ставки */}
            <button
              onClick={() => handleAction(canCheck ? 'check' : 'call')}
              disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown'}
              className="min-w-[120px] px-8 py-4 bg-[#2a2a2a] hover:bg-[#353535] disabled:opacity-40 disabled:cursor-not-allowed rounded-xl font-black italic transition-all active:scale-95 border border-white/5 uppercase"
            >
              {canCheck ? 'CHECK' : `CALL ${currentBet - myCurrentBet}`}
            </button>

            <div className="flex flex-col gap-1 min-w-[200px]">
              <div className="flex items-center justify-between px-3 py-1 bg-black/40 rounded-t-xl border-x border-t border-white/5">
                <button
                  onClick={() => setRaiseAmount(Math.max(settings.blind * 2, raiseAmount - settings.blind))}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >-</button>
                <span className="text-[10px] font-black tracking-widest text-primary">RAISE {raiseAmount}</span>
                <button
                  onClick={() => setRaiseAmount(raiseAmount + settings.blind)}
                  className="w-6 h-6 rounded bg-white/5 hover:bg-white/10 transition-colors"
                >+</button>
              </div>
              <button
                onClick={() => handleAction('raise', raiseAmount)}
                disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown'}
                className="w-full py-4 bg-primary hover:bg-primary/90 disabled:opacity-40 disabled:grayscale disabled:cursor-not-allowed text-white rounded-b-xl font-black italic shadow-lg shadow-primary/20 transition-all active:scale-95 uppercase"
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
                {players.find(p => String(p.id) === myId)?.chips?.toLocaleString() || '0'}
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
                  className={`p-4 rounded-xl transition-all ${isMicOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                  {isMicOn ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </button>
                <button
                  onClick={toggleVideo}
                  className={`p-4 rounded-xl transition-all ${isVideoOn ? 'bg-white/10 hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}
                >
                  {isVideoOn ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SHOWDOWN OVERLAY */}
      {gameState === 'showdown' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200]">
          <div className="text-center">
            <Trophy className="w-16 h-16 text-yellow-500 mx-auto mb-4 animate-bounce" />
            <h2 className="text-4xl font-black italic mb-4">SHOWDOWN!</h2>
            {winnerInfo.length > 0 && (
              <div className="mb-6">
                {winnerInfo.map(w => {
                  const wp = players.find(p => String(p.id) === String(w.id))
                  return (
                    <div key={w.id} className="text-primary font-bold text-xl uppercase tracking-widest">
                      🏆 {wp?.name || w.id} — {w.handName}
                    </div>
                  )
                })}
              </div>
            )}
            {/* Только хост может начать следующую раздачу */}
            {isHost && (
              <button
                onClick={startNewGame}
                className="px-10 py-4 bg-primary text-white font-black rounded-xl hover:scale-110 transition-transform"
              >
                СЛЕДУЮЩАЯ РАЗДАЧА
              </button>
            )}
          </div>
        </div>
      )}

      {/* ВАШ ХОД индикатор */}
      {isMyTurn && gameState !== 'showdown' && gameState !== 'waiting' && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none">
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-primary/20 border border-primary text-primary px-8 py-2 rounded-full font-black italic backdrop-blur-sm"
          >
            ВАШ ХОД!
          </motion.div>
        </div>
      )}

      {/* Ожидание игроков */}
      {gameState === 'waiting' && !isHost && (
        <div className="absolute bottom-32 left-1/2 -translate-x-1/2 pointer-events-none">
          <div className="bg-white/5 border border-white/10 text-white/60 px-8 py-2 rounded-full font-bold text-sm">
            Ожидание начала игры...
          </div>
        </div>
      )}
    </div>
  )
}

function LocalVideo({ stream }: { stream: MediaStream | null }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => console.error('Local play error:', e))
    }
  }, [stream])
  return <video ref={videoRef} autoPlay muted playsInline className="w-full h-full object-cover scale-x-[-1]" />
}

function RemoteVideo({ stream, name }: { stream?: MediaStream, name: string }) {
  const videoRef = useRef<HTMLVideoElement>(null)
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream
      videoRef.current.play().catch(e => console.error('Remote play error:', e))
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
