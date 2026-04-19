'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Users, 
  Settings as SettingsIcon, 
  Play, 
  Plus, 
  Video, 
  VideoOff, 
  ArrowLeft,
  ChevronRight,
  Info,
  Trophy,
  Dices
} from 'lucide-react'
import { useSearchParams } from 'next/navigation'
import PokerTable from '@/components/poker/PokerTable'

// Types
type TableSize = 2 | 4 | 6 | 9
type View = 'lobby' | 'create' | 'game'

interface TableSettings {
  name: string
  size: TableSize
  buyIn: number
  blind: number
  withWebcams: boolean
}

export default function PokerPage() {
  return (
    <Suspense fallback={
        <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
            <div className="text-primary font-black italic animate-pulse">LOADING POKER...</div>
        </div>
    }>
        <PokerConsole />
    </Suspense>
  )
}

function PokerConsole() {
  const searchParams = useSearchParams()
  const [view, setView] = useState<View>('lobby')
  const [roomId, setRoomId] = useState<string>('')
  const [settings, setSettings] = useState<TableSettings>({
    name: 'Стол Paracetamol',
    size: 6,
    buyIn: 1000,
    blind: 10,
    withWebcams: true
  })

  // Handle room join from URL
  useEffect(() => {
    const r = searchParams.get('room')
    if (r) {
        setRoomId(r)
        setView('game')
    }
  }, [searchParams])

  const createRoom = () => {
    const id = Math.random().toString(36).substring(2, 9)
    setRoomId(id)
    window.history.pushState({}, '', `?room=${id}`)
    setView('game')
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
              <p className="text-muted-foreground mt-4 tracking-[0.3em] uppercase font-light">С вебкамерами & Twitch Auth</p>
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
                onClick={() => setView('game')} // Quick join placeholder
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

        {view === 'game' && (
          <motion.div 
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="w-full h-screen"
          >
            <PokerTable roomId={roomId} settings={settings} onBack={() => {
                setView('lobby')
                window.history.pushState({}, '', '/poker')
            }} />
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  )
}
