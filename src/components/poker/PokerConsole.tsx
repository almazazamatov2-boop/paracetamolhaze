'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { 
  Play, 
  Plus, 
  ArrowLeft,
  Video,
  VideoOff
} from 'lucide-react'
import PokerTable from './PokerTable'

type TableSize = 2 | 4 | 6 | 9
type View = 'lobby' | 'create' | 'game' | 'lobbies'

interface TableSettings {
  name: string
  size: TableSize
  buyIn: number
  blind: number
  withWebcams: boolean
  password?: string
  ante?: number
}

export default function PokerConsole() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>('lobby')
  const [roomId, setRoomId] = useState<string>('')
  const [user, setUser] = useState<any>(null)
  const [loadingAuth, setLoadingAuth] = useState(true)
  const [openLobbies, setOpenLobbies] = useState<any[]>([])
  const [selectedLobby, setSelectedLobby] = useState<any>(null)
  const [passwordInput, setPasswordInput] = useState('')
  const [settings, setSettings] = useState<TableSettings>({
    name: 'Стол Paracetamol',
    size: 6,
    buyIn: 1000,
    blind: 10,
    withWebcams: true,
    password: '',
    ante: 0
  })

  // Fetch Auth
  useEffect(() => {
    const fetchUser = async () => {
        try {
            const res = await fetch('/api/auth_me')
            const data = await res.json()
            if (!data.error) setUser(data)
        } catch (e) {
            console.error(e)
        } finally {
            setLoadingAuth(false)
        }
    }
    fetchUser()
  }, [])

  // Handle room join from URL
  useEffect(() => {
    const r = searchParams.get('room')
    const s = searchParams.get('size')
    const ante = searchParams.get('ante')
    const pwd = searchParams.get('pwd')
    
    if (r) {
        setRoomId(r)
        setSettings(prev => ({
            ...prev, 
            size: s ? parseInt(s) as TableSize : prev.size,
            ante: ante ? parseInt(ante) : prev.ante,
            password: pwd || prev.password
        }))
        setView('game')
    }
  }, [searchParams])

  const fetchLobbies = async () => {
    try {
        const { data } = await supabase.from('poker_lobbies').select('*').order('created_at', { ascending: false })
        if (data) setOpenLobbies(data)
    } catch (e) {
        console.error(e)
    }
  }

  const createRoom = async () => {
    const id = Math.random().toString(36).substring(2, 9)
    setRoomId(id)
    
    try {
      await supabase.from('poker_lobbies').insert({
        id,
        name: settings.name,
        size: settings.size,
        buy_in: settings.buyIn,
        blind: settings.blind,
        ante: settings.ante || 0,
        with_webcams: settings.withWebcams,
        has_password: !!settings.password,
        password: settings.password,
        players_count: 1
      })
    } catch (e) {
      console.error(e)
    }

    router.push(`/poker?room=${id}&size=${settings.size}${settings.password ? '&pwd=' + encodeURIComponent(settings.password) : ''}${settings.ante ? '&ante=' + settings.ante : ''}`)
    setView('game')
  }

  const joinLobby = (lobby: any) => {
    if (lobby.has_password && passwordInput !== lobby.password) {
        alert("Неверный пароль")
        return
    }
    setRoomId(lobby.id)
    router.push(`/poker?room=${lobby.id}&size=${lobby.size}${lobby.ante ? '&ante=' + lobby.ante : ''}${lobby.has_password ? '&pwd=' + encodeURIComponent(passwordInput) : ''}`)
    setView('game')
  }

  if (loadingAuth) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-primary font-black italic animate-pulse">AUTENTICATING...</div>
        </div>
    )
  }

  if (!user) {
    return (
        <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center p-4">
             <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-5xl font-black italic tracking-tighter mb-8 paracetamol-di-letters relative inline-block px-4 py-2 bg-primary shadow-[0_0_30px_rgba(255,69,0,0.5)]"
              >
                POKER
              </motion.h1>
             <div className="bg-[#151515] border border-white/10 p-8 rounded-3xl text-center max-w-md">
                <h2 className="text-2xl font-bold mb-4">Вход в игру</h2>
                <p className="text-muted-foreground mb-8 text-sm">Для игры в покер с вебкамерами необходимо авторизоваться через Twitch.</p>
                <button 
                  onClick={() => window.location.href = '/auth/twitch?source=poker'}
                  className="w-full bg-twitch-purple hover:bg-twitch-purple/90 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-twitch-purple/20"
                >
                    АВТОРИЗОВАТЬСЯ ЧЕРЕЗ TWITCH
                </button>
             </div>
        </div>
    )
  }

  return (
    <main className="min-h-screen bg-[#0a0a0a] text-white overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 bg-grid-pattern opacity-10 pointer-events-none" />
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/10 blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-twitch-purple/10 blur-[120px] rounded-full pointer-events-none" />

      <AnimatePresence mode="wait">
        {view === 'lobby' && (
          <motion.div 
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
          >
            <div className="text-center mb-12">
              <motion.h1 
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className="text-7xl font-black italic tracking-tighter mb-2 paracetamol-di-letters relative inline-block px-4 py-2 bg-primary shadow-[0_0_30px_rgba(255,69,0,0.5)]"
              >
                POKER
              </motion.h1>
              <p className="text-muted-foreground mt-4 tracking-[0.3em] uppercase font-light">С вебкамерами</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
              <button 
                onClick={() => setView('create')}
                className="group relative bg-[#151515] border border-white/10 p-8 rounded-2xl hover:border-primary/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Plus className="text-primary w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Создать стол</h2>
                  <p className="text-muted-foreground text-sm">Настройте свои правила и пригласите друзей</p>
                </div>
              </button>

              <button 
                onClick={() => {
                    fetchLobbies()
                    setView('lobbies')
                }}
                className="group relative bg-[#151515] border border-white/10 p-8 rounded-2xl hover:border-twitch-purple/50 transition-all duration-300 overflow-hidden"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-twitch-purple/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                <div className="relative flex flex-col items-center">
                  <div className="w-16 h-16 bg-twitch-purple/20 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                    <Play className="text-twitch-purple w-8 h-8" />
                  </div>
                  <h2 className="text-2xl font-bold mb-2">Войти в игру</h2>
                  <p className="text-muted-foreground text-sm">Присоединиться к уже существующему столу</p>
                </div>
              </button>
            </div>

            <button 
              onClick={() => window.location.href = '/'}
              className="mt-12 text-muted-foreground hover:text-white flex items-center gap-2 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> На главную
            </button>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div 
            key="create"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative z-10 flex flex-col items-center justify-center min-h-screen p-4"
          >
            <div className="w-full max-w-xl bg-[#151515] border border-white/10 rounded-3xl p-8 overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-primary via-twitch-purple to-primary" />
              
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-3xl font-black italic tracking-tight">НАСТРОЙКИ СТОЛА</h2>
                <button onClick={() => setView('lobby')} className="p-2 hover:bg-white/5 rounded-full">
                  <ArrowLeft className="w-6 h-6" />
                </button>
              </div>

              <div className="space-y-6">
                <div>
                  <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Название стола</label>
                  <input 
                    type="text" 
                    value={settings.name}
                    onChange={(e) => setSettings({...settings, name: e.target.value})}
                    className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50 transition-colors"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Размер стола</label>
                    <div className="grid grid-cols-4 gap-2">
                      {[2, 4, 6, 9].map((s) => (
                        <button
                          key={s}
                          onClick={() => setSettings({...settings, size: s as TableSize})}
                          className={`py-2 rounded-lg border transition-all ${settings.size === s ? 'bg-primary border-primary text-white font-bold' : 'bg-black/30 border-white/10 text-muted-foreground hover:border-white/20'}`}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Вебкамеры</label>
                    <button
                      onClick={() => setSettings({...settings, withWebcams: !settings.withWebcams})}
                      className={`w-full flex items-center justify-center gap-2 py-2 rounded-lg border transition-all ${settings.withWebcams ? 'bg-twitch-purple/20 border-twitch-purple text-twitch-purple-light' : 'bg-black/30 border-white/10 text-muted-foreground'}`}
                    >
                      {settings.withWebcams ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                      {settings.withWebcams ? 'Включены' : 'Выключены'}
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Buy-in (фишки)</label>
                    <input 
                      type="number" 
                      value={settings.buyIn}
                      onChange={(e) => setSettings({...settings, buyIn: parseInt(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">Малый блайнд</label>
                    <input 
                      type="number" 
                      value={settings.blind}
                      onChange={(e) => setSettings({...settings, blind: parseInt(e.target.value)})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                        Пароль <span className="text-white/30 text-[10px]">(необязательно)</span>
                    </label>
                    <input 
                      type="text" 
                      value={settings.password || ''}
                      onChange={(e) => setSettings({...settings, password: e.target.value})}
                      placeholder="Без пароля"
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2 flex items-center gap-2">
                        Анте <span className="text-white/30 text-[10px]">(необязательно)</span>
                    </label>
                    <input 
                      type="number" 
                      value={settings.ante || 0}
                      onChange={(e) => setSettings({...settings, ante: parseInt(e.target.value) || 0})}
                      className="w-full bg-black/50 border border-white/10 rounded-xl px-4 py-3 focus:outline-none focus:border-primary/50"
                    />
                  </div>
                </div>
              </div>

              <button 
                onClick={createRoom}
                className="w-full mt-10 bg-primary hover:bg-primary/90 text-white font-black italic tracking-widest py-4 rounded-xl shadow-[0_0_30px_rgba(255,69,0,0.3)] transition-all hover:scale-[1.02] active:scale-[0.98]"
              >
                СОЗДАТЬ И НАЧАТЬ
              </button>
            </div>
          </motion.div>
        )}

        {view === 'lobbies' && (
          <motion.div 
            key="lobbies"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            className="relative z-10 flex flex-col items-center justify-start min-h-screen p-4 pt-24"
          >
            <div className="w-full max-w-4xl">
              <div className="flex items-center justify-between mb-8">
                <h2 className="text-4xl font-black italic tracking-tight uppercase">Открытые столы</h2>
                <div className="flex items-center gap-4">
                  <button onClick={fetchLobbies} className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-colors text-sm font-bold">
                    ОБНОВИТЬ
                  </button>
                  <button onClick={() => setView('lobby')} className="p-2 hover:bg-white/5 rounded-full">
                    <ArrowLeft className="w-6 h-6" />
                  </button>
                </div>
              </div>

              {openLobbies.length === 0 ? (
                  <div className="text-center py-20 bg-[#151515] border border-white/10 rounded-3xl">
                      <p className="text-muted-foreground mb-4">Пока нет открытых столов</p>
                      <button 
                        onClick={() => setView('create')}
                        className="px-6 py-2 bg-primary text-white rounded-xl font-bold"
                      >
                          СОЗДАТЬ СТОЛ
                      </button>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {openLobbies.map(lobby => (
                          <div key={lobby.id} className="bg-[#151515] border border-white/10 rounded-2xl p-6 hover:border-twitch-purple/50 transition-colors">
                              <div className="flex justify-between items-start mb-4">
                                  <div>
                                      <h3 className="text-xl font-bold">{lobby.name}</h3>
                                      <div className="text-xs text-muted-foreground mt-1 flex items-center gap-3">
                                          <span>Blinds: {lobby.blind}/{lobby.blind * 2}</span>
                                          <span>Buy-in: {lobby.buy_in}</span>
                                          {lobby.ante > 0 && <span className="text-yellow-500">Ante: {lobby.ante}</span>}
                                      </div>
                                  </div>
                                  <div className="bg-white/5 px-3 py-1 rounded-full text-xs">
                                      {lobby.players_count} / {lobby.size}
                                  </div>
                              </div>
                              <div className="flex items-center justify-between mt-6">
                                  <div className="flex gap-2 text-xs">
                                      {lobby.with_webcams && <span className="bg-twitch-purple/20 text-twitch-purple px-2 py-1 rounded">Вебкамеры</span>}
                                      {lobby.has_password && <span className="bg-red-500/20 text-red-500 px-2 py-1 rounded">Пароль</span>}
                                  </div>
                                  
                                  {selectedLobby?.id === lobby.id ? (
                                      <div className="flex items-center gap-2">
                                          {lobby.has_password && (
                                              <input 
                                                  type="password"
                                                  placeholder="Пароль"
                                                  value={passwordInput}
                                                  onChange={(e) => setPasswordInput(e.target.value)}
                                                  className="bg-black border border-white/10 rounded-lg px-3 py-1.5 w-24 text-sm focus:outline-none focus:border-twitch-purple"
                                              />
                                          )}
                                          <button 
                                              onClick={() => joinLobby(lobby)}
                                              className="bg-twitch-purple hover:bg-twitch-purple/90 text-white px-4 py-1.5 rounded-lg font-bold text-sm"
                                          >
                                              ВОЙТИ
                                          </button>
                                      </div>
                                  ) : (
                                      <button 
                                          onClick={() => {
                                              setSelectedLobby(lobby)
                                              setPasswordInput('')
                                          }}
                                          className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg font-bold text-sm transition-colors"
                                      >
                                          ВЫБРАТЬ
                                      </button>
                                  )}
                              </div>
                          </div>
                      ))}
                  </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen"
          >
            <PokerTable roomId={roomId} user={user} settings={settings} onBack={() => {
                setView('lobby')
                router.push('/poker')
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
