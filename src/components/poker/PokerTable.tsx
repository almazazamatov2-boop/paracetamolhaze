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
  Plus
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

  // FIX 1: deckRef — хранит колоду между действиями
  const deckRef = useRef<Card[]>([])

  // FIX 2: Канонический стейт — избегаем реконструкции из разрозненных useState
  const fullStateRef = useRef<PokerGameState | null>(null)

  const myCardsRef = useRef<{ suit: string, value: string }[]>([])
  const [timeLeft, setTimeLeft] = useState(20)

  // Звуки из OddSlingers
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
    if (msg.communityCards !== undefined) {
      console.log('--- COMMUNITY CARDS UPDATE ---', msg.communityCards)
      setCommunityCards(msg.communityCards)
    }
    if (msg.currentBet !== undefined) setCurrentBet(msg.currentBet)
    if (msg.currentTurn !== undefined) setCurrentTurn(msg.currentTurn)
    if (msg.deck !== undefined) deckRef.current = msg.deck
    if (msg.dealerIndex !== undefined) dealerIndexRef.current = msg.dealerIndex
    if (msg.winners !== undefined) setWinnerInfo(msg.winners || [])

    // Сохраняем канонический стейт
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
        settings.buyIn,
        settings.ante || 0
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
    if (!fullStateRef.current) return
    const state = fullStateRef.current

    // Проверяем ход
    const activePlayer = state.players[state.activePlayerIndex]
    if (!activePlayer || String(activePlayer.id) !== myId) return

    let raiseAmt = amount
    if (action === 'raise' && raiseAmt !== undefined) {
      const minPossible = currentBet * 2 || settings.blind * 2
      if (raiseAmt < minPossible) raiseAmt = minPossible
    }

    const nextState = PokerLogic.handleAction(state, myId, action, raiseAmt)
    
    // Играем звук действия
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

  // --- AUTO ADVANCE FOR ALL-INS (HOST ONLY) ---
  useEffect(() => {
    const isHost = joinedPlayers[0]?.id === myId
    if (!isHost || !fullStateRef.current) return

    const state = fullStateRef.current
    if (state.phase === 'showdown' || state.phase === 'waiting') return

    // Если круг завершен И остался максимум один игрок с фишками (остальные all-in)
    // тогда хост двигает фазы чтобы раскрыть карты
    const canAct = state.players.filter(p => !p.folded && !p.allIn)
    const isRoundComplete = PokerLogic.isRoundComplete(state)

    if (canAct.length <= 1 && isRoundComplete) {
      const timer = setTimeout(() => {
        const nextState = state.phase === 'river' 
          ? PokerLogic.resolveShowdown(state)
          : PokerLogic.nextPhase(state)

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
    const radiusX = 46 // %
    const radiusY = 46 // %
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
  const myPlayer = players.find(p => String(p.id) === myId)
  const myBalance = myPlayer?.chips || 0
  const myCurrentBet = myPlayer?.bet || 0
  const canCheck = myCurrentBet >= currentBet
  const isMyTurn = String(currentTurn) === myId

  const minRaise = currentBet * 2 || settings.blind * 2
  const maxPossibleRaise = myBalance + myCurrentBet

  // Синхронизация ползунка при изменении стейка или ставки
  useEffect(() => {
    if (isMyTurn) {
        setRaiseAmount(Math.min(minRaise, maxPossibleRaise))
    }
  }, [isMyTurn, minRaise, maxPossibleRaise])

  // Победитель
  const winnerPlayer = winnerInfo.length > 0
    ? players.find(p => String(p.id) === String(winnerInfo[0]?.id))
    : null

  // Вычисляем сдвиг, чтобы ВЫ (myId) всегда были на нулевой (нижней) позиции
  const myIndex = playersWithState.findIndex(p => p && String(p.id) === myId)
  const shiftAmount = myIndex >= 0 ? myIndex : 0

  const rotatedSeats = Array.from({ length: settings.size }).map((_, renderIndex) => {
      const originalIndex = (renderIndex + shiftAmount) % settings.size;
      return playersWithState[originalIndex]
  })

  // Вектор сдвига для фишек (к центру стола)
  const getBetOffset = (index: number, total: number) => {
    const angle = (index / total) * 2 * Math.PI + Math.PI / 2
    const angleTowardsCenter = angle + Math.PI 
    const dist = (typeof window !== 'undefined' && window.innerWidth < 768) ? 55 : 85; // px
    return {
        x: Math.cos(angleTowardsCenter) * dist,
        y: Math.sin(angleTowardsCenter) * dist,
    }
  }


  const isHost = joinedPlayers[0]?.id === (user?.id || user?.display_name)

  return (
    <div className="relative w-full h-screen flex flex-col overflow-hidden bg-[#02050A]">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_#0f2a1a_0%,_transparent_70%)] opacity-40 pointer-events-none" />

      {/* HUD: Top Bar */}
      <div className="absolute top-0 left-0 w-full p-4 md:p-6 flex items-center justify-between z-[100] bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-2 hover:bg-white/10 rounded-full transition-colors text-white">
            <ArrowLeft className="w-5 h-5 md:w-6 md:h-6" />
          </button>
          <div>
            <h1 className="text-lg md:text-xl font-bold italic text-white drop-shadow-md">{settings.name}</h1>
            <div className="flex items-center gap-2 text-[10px] md:text-xs text-white/60 font-medium tracking-wide">
              <span className="flex items-center gap-1">
                <Coins className="w-3 h-3 text-amber-500" />
                Blinds: {settings.blind}/{settings.blind * 2}
                {settings.ante ? <span className="ml-1 text-amber-500/80">| Ante: {settings.ante}</span> : null}
              </span>
              {gameState !== 'waiting' && (
                <span className="bg-amber-500/20 text-amber-500 border border-amber-500/30 px-2 py-0.5 rounded text-[9px] md:text-[10px] uppercase font-bold tracking-widest">
                  {gameState}
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 md:gap-3">
          <button
            onClick={() => { navigator.clipboard.writeText(window.location.href); alert('Ссылка скопирована!') }}
            className="px-3 md:px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white rounded-xl text-[10px] md:text-xs font-bold transition-all uppercase tracking-widest"
          >
            Invite
          </button>
          {gameState === 'waiting' && isHost && (
            <button
              onClick={startNewGame}
              className="px-4 md:px-6 py-2 bg-gradient-to-r from-amber-500 to-orange-600 text-white font-black italic rounded-xl shadow-[0_0_20px_rgba(245,158,11,0.4)] hover:scale-105 transition-all text-xs uppercase"
            >
              Start Game
            </button>
          )}
        </div>
      </div>

      {/* RENDER TABLE */}
      <div className="flex-1 w-full flex items-center justify-center p-2 pt-20 pb-[220px] md:pb-[180px]">
        <div className="relative w-full max-w-[1000px] flex items-center justify-center">

          {/* Table Graphic (MiceXx style) */}
          <img src="/table.png" alt="Poker Table" className="w-full h-auto object-contain drop-shadow-2xl" />

          {/* Absolute overlay exactly matching the image bounds */}
          <div className="absolute inset-0 pointer-events-none">
            
            {/* Center Game Area (Pot & Cards) */}
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4">
              
              {/* Community Cards */}
              <div className="flex items-center gap-1.5 md:gap-2 translate-y-[-10px] md:translate-y-[-20px]">
                  <AnimatePresence>
                    {communityCards.map((card, i) => (
                      <motion.div
                        key={`${card.suit}-${card.value}-${i}`}
                        initial={{ y: -30, opacity: 0, rotateY: 180, scale: 0.8 }}
                        animate={{ y: 0, opacity: 1, rotateY: 0, scale: 1 }}
                        transition={{ delay: 0.1 + i * 0.1, type: 'spring' }}
                      >
                        <PokerCard suit={card.suit} value={card.value} />
                      </motion.div>
                    ))}
                  </AnimatePresence>
                  {communityCards.length < 5 && Array.from({ length: 5 - communityCards.length }).map((_, i) => (
                    <div key={i} className="w-12 h-16 md:w-16 md:h-24 rounded-md md:rounded-lg bg-black/20 border border-white/10 border-dashed" />
                  ))}
                </div>

                {/* Pot Display */}
                <div className="flex flex-col items-center translate-y-[-10px]">
                  <motion.div 
                    key={pot}
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="bg-black/60 backdrop-blur-md px-4 md:px-6 py-1.5 md:py-2 rounded-full border border-white/10 flex items-center gap-2 shadow-2xl"
                  >
                    <div className="w-4 h-4 md:w-5 md:h-5 rounded-full border-2 border-dashed border-black bg-gradient-to-br from-amber-300 to-amber-600 flex items-center justify-center">
                       <div className="w-1.5 h-1.5 md:w-2 md:h-2 rounded-full border border-black/30" />
                    </div>
                    <span className="text-amber-400 font-black text-sm md:text-xl italic tracking-widest uppercase">
                      БАНК: {pot}
                    </span>
                  </motion.div>
                </div>

                {/* Showdown Winner */}
                <AnimatePresence>
                  {gameState === 'showdown' && winnerInfo.length > 0 && (
                    <motion.div
                      initial={{ y: 20, opacity: 0, scale: 0.8 }}
                      animate={{ y: 0, opacity: 1, scale: 1 }}
                      className="absolute top-[70%] flex flex-col items-center pointer-events-auto z-50"
                    >
                      <div className="bg-gradient-to-r from-amber-500/20 via-amber-400/40 to-amber-500/20 backdrop-blur-xl border border-amber-400/50 px-6 py-3 rounded-2xl shadow-[0_0_30px_rgba(251,191,36,0.3)]">
                        {winnerInfo.map(w => (
                          <div key={w.id} className="text-amber-300 font-black italic text-sm md:text-lg uppercase tracking-widest flex items-center gap-2">
                            🏆 {players.find(p => p.id === w.id)?.name} ({w.handName})
                          </div>
                        ))}
                      </div>
                      {isHost && (
                        <button
                          onClick={startNewGame}
                          className="mt-4 px-6 py-2 bg-amber-500 text-black font-black italic rounded-xl shadow-lg hover:scale-105 transition-transform uppercase text-xs tracking-widest"
                        >
                          СЛЕДУЮЩАЯ РАЗДАЧА
                        </button>
                      )}
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>

            {/* Players Render */}
          {rotatedSeats.map((player, renderIndex) => {
            const pos = getPlayerPosition(renderIndex, settings.size)
            
            // Render Empty Seat
            if (!player) {
              return (
                <div
                  key={`empty-${renderIndex}`}
                  className="absolute z-10 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center opacity-30 scale-75 md:scale-90"
                  style={{ left: pos.left, top: pos.top }}
                >
                  <div className="w-[70px] h-[70px] md:w-[90px] md:h-[90px] rounded-[20px] border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-1 bg-black/20 backdrop-blur-sm">
                    <Plus className="w-5 h-5 text-white/30" />
                    <span className="text-[7px] font-bold uppercase tracking-widest text-white/30">СВОБОДНО</span>
                  </div>
                </div>
              )
            }

            const isMe = String(player.id) === myId

            return (
              <motion.div
                key={player.id}
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                className={`absolute z-20 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center ${isMe ? 'z-40' : ''}`}
                style={{ left: pos.left, top: pos.top }}
              >
                
                {/* Dealer Button */}
                {player.isDealer && (
                  <div className="absolute -top-2 -right-2 w-5 h-5 md:w-6 md:h-6 bg-white text-black font-black rounded-full border-2 border-black flex items-center justify-center shadow-[0_0_10px_rgba(255,255,255,0.5)] text-[9px] md:text-[10px] z-40">
                    D
                  </div>
                )}

                {/* Webcam / Avatar Container */}
                <div className="relative">
                  <div 
                    className={`relative w-[80px] h-[80px] md:w-[110px] md:h-[110px] rounded-[18px] md:rounded-[24px] overflow-hidden border-[3px] transition-all duration-300 shadow-xl bg-[#0a0a0c] ${player.isCurrent ? 'border-amber-500 shadow-[0_0_30px_rgba(245,158,11,0.5)]' : 'border-[#222]'} ${player.folded ? 'grayscale opacity-50' : ''}`}
                  >
                    {/* Time Bank Liquid Overlay */}
                    {player.isCurrent && (
                        <motion.div 
                            initial={{ height: '100%' }}
                            animate={{ height: `${(timeLeft / 20) * 100}%` }}
                            transition={{ duration: 1, ease: 'linear' }}
                            className={`absolute inset-0 ${timeLeft <= 5 ? 'bg-red-500/20' : 'bg-amber-500/10'} pointer-events-none z-10`}
                        />
                    )}
                    
                    {settings.withWebcams ? (
                      <div className="w-full h-full">
                        {isMe ? (
                          <LocalVideo stream={localStream} />
                        ) : (
                          <RemoteVideo stream={remoteStreams[player.id]} name={player.name} />
                        )}
                      </div>
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        {isMe && user?.profile_image_url ? (
                          <img src={user.profile_image_url} alt={player.name} className="w-full h-full object-cover" />
                        ) : (
                          <span className="text-3xl md:text-5xl opacity-50">👤</span>
                        )}
                      </div>
                    )}
                  </div>

                  {/* Player Info Badge (Name & Chips) */}
                  <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 w-[110%] md:w-auto md:min-w-[90%] bg-[#0a0a0c]/90 backdrop-blur-md px-2 md:px-4 py-1.5 rounded-xl border border-white/10 flex flex-col items-center shadow-xl z-20">
                    <span className="text-[9px] md:text-[10px] font-bold uppercase text-white/80 truncate w-full text-center">
                      {player.isSB && <span className="text-blue-400 mr-1">SB</span>}
                      {player.isBB && <span className="text-red-400 mr-1">BB</span>}
                      {player.name} {isMe ? '(ВЫ)' : ''}
                    </span>
                    <span className="text-[10px] md:text-xs text-amber-400 font-black italic flex items-center gap-1">
                      <Coins className="w-3 h-3 opacity-80" /> {player.chips}
                    </span>
                  </div>
                </div>

                {/* Bet Badge (Points towards table center) */}
                <AnimatePresence>
                  {player.bet > 0 && (
                    <motion.div
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      exit={{ scale: 0, opacity: 0 }}
                      className="absolute z-50 pointer-events-none"
                      style={{
                        left: '50%', top: '50%',
                        transform: `translate(calc(-50% + ${getBetOffset(renderIndex, settings.size).x}px), calc(-50% + ${getBetOffset(renderIndex, settings.size).y}px))`
                      }}
                    >
                      <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full border shadow-xl backdrop-blur-md transition-all ${player.isCurrent ? 'bg-amber-500/20 border-amber-500/50 scale-110' : 'bg-black/60 border-white/10'}`}>
                        <div className="w-3.5 h-3.5 rounded-full border border-dashed border-black/40 bg-gradient-to-b from-amber-400 to-amber-600 flex items-center justify-center shadow-inner">
                          <div className="w-1.5 h-1.5 rounded-full border border-black/20" />
                        </div>
                        <span className="text-amber-400 font-bold text-[10px] md:text-xs tracking-tight">{player.bet}</span>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Cards */}
                {player.cards.length > 0 && !player.folded && (
                  <div className="absolute -right-4 -top-2 flex gap-0.5 md:gap-1 scale-[0.5] md:scale-[0.55] origin-bottom-left z-30 pointer-events-none drop-shadow-xl">
                    {player.cards.map((card, ci) => {
                      const isHidden = card.suit === 'X'
                      return (
                        <motion.div
                          key={ci}
                          initial={{ x: -20, opacity: 0, rotate: -5 + ci * 10 }}
                          animate={{ x: 0, opacity: 1 }}
                          transition={{ delay: 0.2 + ci * 0.1 }}
                        >
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
                
                {player.allIn && (
                   <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-red-600 text-white text-[10px] md:text-xs font-black px-2 py-0.5 rounded rotate-[-15deg] shadow-lg border border-white/20 z-50">
                     ALL-IN
                   </div>
                )}
              </motion.div>
            )
          })}
        </div>
      </div>

      {/* CONTROLS: Modern Bottom HUD */}
      <div className="absolute bottom-0 left-0 w-full p-4 pb-6 md:p-8 flex items-end justify-center z-[100] pointer-events-none">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 w-full max-w-5xl bg-[#0a0a0c]/95 backdrop-blur-3xl border border-white/10 p-4 md:p-6 rounded-[32px] shadow-[0_0_50px_rgba(0,0,0,0.8)] pointer-events-auto">

          {/* User Status / Hint */}
          <div className="flex items-center justify-between w-full md:w-auto gap-4">
            <div className="flex flex-col">
              <span className="text-[9px] md:text-[10px] text-white/40 uppercase tracking-widest font-bold">Баланс</span>
              <span className="text-lg md:text-xl font-black italic text-amber-500 flex items-center gap-2 tracking-tight">
                <Coins className="w-5 h-5 opacity-80" />
                {players.find(p => String(p.id) === myId)?.chips?.toLocaleString() || '0'}
              </span>
            </div>
            
            {handHint && (
              <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl">
                 <span className="text-xs md:text-sm font-black italic text-white/80 tracking-widest uppercase">{handHint}</span>
              </div>
            )}
            
            {/* AV Controls for Mobile */}
            <div className="flex md:hidden gap-2">
              <button onClick={toggleMic} className={`p-3 rounded-xl transition-all ${isMicOn ? 'bg-white/10' : 'bg-red-500/20 text-red-500'}`}>
                {isMicOn ? <Mic className="w-4 h-4 text-white" /> : <MicOff className="w-4 h-4" />}
              </button>
              <button onClick={toggleVideo} className={`p-3 rounded-xl transition-all ${isVideoOn ? 'bg-white/10' : 'bg-red-500/20 text-red-500'}`}>
                {isVideoOn ? <Video className="w-4 h-4 text-white" /> : <VideoOff className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center justify-center gap-2 md:gap-3 w-full md:w-auto flex-1 max-w-2xl">
            <button
              onClick={() => handleAction('fold')}
              disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown'}
              className="flex-1 px-2 md:px-6 py-3 md:py-4 bg-[#1a1c23] hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-black italic transition-all active:scale-95 border border-white/5 uppercase text-[10px] md:text-sm text-white/70 hover:text-white"
            >
              Fold
            </button>

            <button
              onClick={() => handleAction(canCheck ? 'check' : 'call')}
              disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown'}
              className="flex-1 px-2 md:px-6 py-3 md:py-4 bg-[#1a1c23] hover:bg-[#252830] disabled:opacity-30 disabled:cursor-not-allowed rounded-2xl font-black italic transition-all active:scale-95 border border-blue-500/30 uppercase text-[10px] md:text-sm text-blue-400 hover:text-blue-300 hover:border-blue-400/50"
            >
              {canCheck ? 'Check' : (myBalance <= (currentBet - myCurrentBet) ? 'All In' : `Call ${currentBet - myCurrentBet}`)}
            </button>

            <div className="flex flex-col flex-2 min-w-[140px] md:min-w-[200px]">
              <div className="flex items-center justify-between px-3 py-1 bg-black/40 rounded-t-2xl border-x border-t border-amber-500/20 gap-2 md:gap-4 mb-1">
                <input 
                  type="range"
                  min={minRaise}
                  max={maxPossibleRaise}
                  step={settings.blind}
                  value={raiseAmount}
                  onChange={(e) => setRaiseAmount(Number(e.target.value))}
                  className="flex-1 accent-amber-500 h-1 bg-white/10 rounded-full appearance-none cursor-pointer"
                />
                <button
                  onClick={() => setRaiseAmount(maxPossibleRaise)}
                  className="text-[9px] md:text-[10px] font-black bg-white/10 hover:bg-white/20 px-2 py-0.5 rounded text-white/80"
                >MAX</button>
              </div>
              <button
                onClick={() => handleAction('raise', raiseAmount)}
                disabled={!isMyTurn || gameState === 'waiting' || gameState === 'showdown' || (raiseAmount < minRaise && raiseAmount < maxPossibleRaise)}
                className="w-full py-3 md:py-4 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-400 hover:to-orange-500 disabled:opacity-30 disabled:grayscale disabled:cursor-not-allowed text-white rounded-b-2xl font-black italic shadow-[0_0_20px_rgba(245,158,11,0.3)] transition-all active:scale-95 uppercase text-[10px] md:text-sm"
              >
                {raiseAmount >= maxPossibleRaise ? 'All In' : `Raise ${raiseAmount}`}
              </button>
            </div>
          </div>

          {/* AV Controls for Desktop */}
          <div className="hidden md:flex gap-3">
            <button onClick={toggleMic} className={`p-4 rounded-2xl transition-all border ${isMicOn ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
              {isMicOn ? <Mic className="w-5 h-5 text-white/80" /> : <MicOff className="w-5 h-5" />}
            </button>
            <button onClick={toggleVideo} className={`p-4 rounded-2xl transition-all border ${isVideoOn ? 'bg-white/5 border-white/10 hover:bg-white/10' : 'bg-red-500/10 border-red-500/30 text-red-500'}`}>
              {isVideoOn ? <Video className="w-5 h-5 text-white/80" /> : <VideoOff className="w-5 h-5" />}
            </button>
          </div>
        </div>
      </div>

      {/* Turn Indicator */}
      {isMyTurn && gameState !== 'showdown' && gameState !== 'waiting' && (
        <div className="absolute bottom-[160px] md:bottom-[140px] left-1/2 -translate-x-1/2 pointer-events-none z-[90]">
          <motion.div
            initial={{ scale: 0.8, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            className="bg-amber-500 text-black px-6 py-2 rounded-full font-black italic shadow-[0_0_40px_rgba(245,158,11,0.6)] text-xs md:text-sm uppercase tracking-widest"
          >
            Твой ход
          </motion.div>
        </div>
      )}

      {/* Waiting State */}
      {gameState === 'waiting' && !isHost && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none z-50">
          <div className="bg-black/80 border border-white/10 text-white/60 px-8 py-4 rounded-2xl font-bold text-sm backdrop-blur-xl">
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
