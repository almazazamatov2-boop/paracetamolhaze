'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'
import { Play, Plus, ArrowLeft, Video, VideoOff } from 'lucide-react'
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
    name: 'Стол POKERLIVE',
    size: 6,
    buyIn: 1000,
    blind: 10,
    withWebcams: true,
    password: '',
    ante: 0
  })

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
      alert('Неверный пароль')
      return
    }
    setRoomId(lobby.id)
    router.push(`/poker?room=${lobby.id}&size=${lobby.size}${lobby.ante ? '&ante=' + lobby.ante : ''}${lobby.has_password ? '&pwd=' + encodeURIComponent(passwordInput) : ''}`)
    setView('game')
  }

  if (loadingAuth) {
    return (
      <div style={styles.root}>
        <div style={styles.loadingText}>AUTHENTICATING...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={styles.root}>
        <div style={styles.authBox}>
          <div style={styles.logo}>POKERLIVE</div>
          <p style={styles.authSubtitle}>♠ TEXAS HOLD&apos;EM С ВЕБКАМЕРАМИ ♠</p>
          <div style={styles.authCard}>
            <p style={styles.authDesc}>Для игры в покер необходимо авторизоваться через Twitch</p>
            <button
              style={styles.twitchBtn}
              onClick={() => window.location.href = '/auth/twitch?source=poker'}
              onMouseEnter={e => (e.currentTarget.style.background = '#9147ff')}
              onMouseLeave={e => (e.currentTarget.style.background = '#7c3aed')}
            >
              <span>ВОЙТИ ЧЕРЕЗ TWITCH</span>
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div style={styles.root}>
      {/* Felt texture overlay */}
      <div style={styles.feltOverlay} />

      <AnimatePresence mode="wait">
        {view === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={styles.centeredView}
          >
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <div style={styles.logo}>POKERLIVE</div>
              <p style={styles.logoSub}>♠ TEXAS HOLD&apos;EM С ВЕБКАМЕРАМИ ♣</p>
            </div>

            <div style={styles.lobbyGrid}>
              <button
                style={styles.lobbyCard}
                onClick={() => setView('create')}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)' }}
              >
                <div style={styles.lobbyCardIcon}>♠</div>
                <h2 style={styles.lobbyCardTitle}>Создать стол</h2>
                <p style={styles.lobbyCardDesc}>Настройте правила и пригласите друзей</p>
              </button>

              <button
                style={styles.lobbyCard}
                onClick={() => { fetchLobbies(); setView('lobbies') }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = '#d4af37'; e.currentTarget.style.background = 'rgba(212,175,55,0.08)' }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = 'rgba(212,175,55,0.3)'; e.currentTarget.style.background = 'rgba(0,0,0,0.3)' }}
              >
                <div style={styles.lobbyCardIcon}>♣</div>
                <h2 style={styles.lobbyCardTitle}>Войти в игру</h2>
                <p style={styles.lobbyCardDesc}>Присоединиться к открытому столу</p>
              </button>
            </div>

            <button
              style={styles.backBtn}
              onClick={() => window.location.href = '/'}
            >
              ← На главную
            </button>
          </motion.div>
        )}

        {view === 'create' && (
          <motion.div
            key="create"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            style={styles.centeredView}
          >
            <div style={styles.formCard}>
              <div style={styles.formGoldBar} />
              <div style={styles.formHeader}>
                <h2 style={styles.formTitle}>НАСТРОЙКИ СТОЛА</h2>
                <button style={styles.backBtn} onClick={() => setView('lobby')}>← Назад</button>
              </div>

              <div style={styles.formBody}>
                <label style={styles.label}>Название стола</label>
                <input
                  style={styles.input}
                  value={settings.name}
                  onChange={e => setSettings({ ...settings, name: e.target.value })}
                />

                <div style={styles.formRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Размер стола</label>
                    <div style={styles.sizeGrid}>
                      {[2, 4, 6, 9].map(s => (
                        <button
                          key={s}
                          style={{ ...styles.sizeBtn, ...(settings.size === s ? styles.sizeBtnActive : {}) }}
                          onClick={() => setSettings({ ...settings, size: s as TableSize })}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Вебкамеры</label>
                    <button
                      style={{ ...styles.camBtn, ...(settings.withWebcams ? styles.camBtnOn : styles.camBtnOff) }}
                      onClick={() => setSettings({ ...settings, withWebcams: !settings.withWebcams })}
                    >
                      {settings.withWebcams ? '📹 Включены' : '🚫 Выключены'}
                    </button>
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Buy-in (фишки)</label>
                    <input style={styles.input} type="number" value={settings.buyIn} onChange={e => setSettings({ ...settings, buyIn: parseInt(e.target.value) })} />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Малый блайнд</label>
                    <input style={styles.input} type="number" value={settings.blind} onChange={e => setSettings({ ...settings, blind: parseInt(e.target.value) })} />
                  </div>
                </div>

                <div style={styles.formRow}>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Пароль <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>(необязательно)</span></label>
                    <input style={styles.input} type="text" value={settings.password || ''} onChange={e => setSettings({ ...settings, password: e.target.value })} placeholder="Без пароля" />
                  </div>
                  <div style={{ flex: 1 }}>
                    <label style={styles.label}>Анте <span style={{ color: 'rgba(255,255,255,0.3)', fontSize: 10 }}>(необязательно)</span></label>
                    <input style={styles.input} type="number" value={settings.ante || 0} onChange={e => setSettings({ ...settings, ante: parseInt(e.target.value) || 0 })} />
                  </div>
                </div>

                <button
                  style={styles.goldBtn}
                  onClick={createRoom}
                  onMouseEnter={e => (e.currentTarget.style.opacity = '0.9')}
                  onMouseLeave={e => (e.currentTarget.style.opacity = '1')}
                >
                  СОЗДАТЬ И НАЧАТЬ →
                </button>
              </div>
            </div>
          </motion.div>
        )}

        {view === 'lobbies' && (
          <motion.div
            key="lobbies"
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            style={{ ...styles.centeredView, justifyContent: 'flex-start', paddingTop: 80 }}
          >
            <div style={{ width: '100%', maxWidth: 900 }}>
              <div style={styles.lobbiesHeader}>
                <h2 style={styles.formTitle}>ОТКРЫТЫЕ СТОЛЫ</h2>
                <div style={{ display: 'flex', gap: 12 }}>
                  <button style={styles.smallBtn} onClick={fetchLobbies}>ОБНОВИТЬ</button>
                  <button style={styles.backBtn} onClick={() => setView('lobby')}>← Назад</button>
                </div>
              </div>

              {openLobbies.length === 0 ? (
                <div style={styles.emptyState}>
                  <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: 16 }}>Пока нет открытых столов</p>
                  <button style={styles.goldBtn} onClick={() => setView('create')}>СОЗДАТЬ СТОЛ</button>
                </div>
              ) : (
                <div style={styles.lobbiesGrid}>
                  {openLobbies.map(lobby => (
                    <div key={lobby.id} style={styles.lobbyRow}>
                      <div style={{ flex: 1 }}>
                        <div style={styles.lobbyRowTitle}>{lobby.name}</div>
                        <div style={styles.lobbyRowMeta}>
                          Blinds: {lobby.blind}/{lobby.blind * 2} &nbsp;·&nbsp; Buy-in: {lobby.buy_in}
                          {lobby.ante > 0 && <span style={{ color: '#d4af37' }}> &nbsp;·&nbsp; Ante: {lobby.ante}</span>}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          {lobby.with_webcams && <span style={styles.tagCam}>📹 Камеры</span>}
                          {lobby.has_password && <span style={styles.tagPwd}>🔒 Пароль</span>}
                        </div>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                        <div style={styles.playerCount}>{lobby.players_count}/{lobby.size}</div>
                        {selectedLobby?.id === lobby.id ? (
                          <>
                            {lobby.has_password && (
                              <input
                                type="password"
                                placeholder="Пароль"
                                value={passwordInput}
                                onChange={e => setPasswordInput(e.target.value)}
                                style={{ ...styles.input, width: 100, margin: 0 }}
                              />
                            )}
                            <button style={styles.goldBtn} onClick={() => joinLobby(lobby)}>ВОЙТИ</button>
                          </>
                        ) : (
                          <button style={styles.smallBtn} onClick={() => { setSelectedLobby(lobby); setPasswordInput('') }}>ВЫБРАТЬ</button>
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
            style={{ width: '100%', height: '100vh' }}
          >
            <PokerTable
              roomId={roomId}
              user={user}
              settings={settings}
              onBack={() => { setView('lobby'); router.push('/poker') }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

// ── Inline styles (vintage poker palette) ──────────────────────────────────
const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    background: 'linear-gradient(160deg, #0d2b1a 0%, #0a1f13 50%, #061209 100%)',
    color: '#fff',
    fontFamily: "'Georgia', 'Times New Roman', serif",
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    overflow: 'hidden',
  },
  feltOverlay: {
    position: 'absolute',
    inset: 0,
    backgroundImage: `
      radial-gradient(ellipse at 50% 50%, rgba(30,100,50,0.15) 0%, transparent 70%),
      repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px),
      repeating-linear-gradient(90deg, transparent, transparent 2px, rgba(0,0,0,0.03) 2px, rgba(0,0,0,0.03) 4px)
    `,
    pointerEvents: 'none',
  },
  centeredView: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '24px',
    width: '100%',
  },
  logo: {
    fontSize: 72,
    fontWeight: 900,
    fontStyle: 'italic',
    letterSpacing: '-2px',
    color: '#d4af37',
    textShadow: '0 0 40px rgba(212,175,55,0.5), 0 4px 0 rgba(0,0,0,0.5)',
    fontFamily: "'Georgia', serif",
  },
  logoSub: {
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: '0.3em',
    fontSize: 13,
    marginTop: 8,
    textTransform: 'uppercase',
  },
  loadingText: {
    fontSize: 24,
    color: '#d4af37',
    letterSpacing: '0.3em',
    animation: 'pulse 1.5s infinite',
    fontStyle: 'italic',
  },
  authBox: {
    textAlign: 'center',
    zIndex: 10,
    position: 'relative',
  },
  authSubtitle: {
    color: 'rgba(212,175,55,0.6)',
    letterSpacing: '0.3em',
    fontSize: 13,
    marginTop: 8,
    marginBottom: 32,
  },
  authCard: {
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 16,
    padding: '32px 40px',
    maxWidth: 400,
  },
  authDesc: {
    color: 'rgba(255,255,255,0.6)',
    marginBottom: 24,
    lineHeight: 1.6,
  },
  twitchBtn: {
    width: '100%',
    background: '#7c3aed',
    color: '#fff',
    border: 'none',
    borderRadius: 8,
    padding: '14px 24px',
    fontWeight: 700,
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontSize: 14,
    transition: 'background 0.2s',
  },
  lobbyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 24,
    width: '100%',
    maxWidth: 640,
  },
  lobbyCard: {
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 16,
    padding: '40px 32px',
    cursor: 'pointer',
    textAlign: 'center',
    transition: 'all 0.2s',
    color: '#fff',
    fontFamily: "'Georgia', serif",
  },
  lobbyCardIcon: {
    fontSize: 48,
    color: '#d4af37',
    marginBottom: 16,
    display: 'block',
  },
  lobbyCardTitle: {
    fontSize: 22,
    fontWeight: 700,
    marginBottom: 8,
    color: '#fff',
    fontStyle: 'italic',
  },
  lobbyCardDesc: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.5)',
    lineHeight: 1.5,
    margin: 0,
  },
  formCard: {
    width: '100%',
    maxWidth: 560,
    background: 'rgba(0,0,0,0.5)',
    border: '1px solid rgba(212,175,55,0.3)',
    borderRadius: 20,
    overflow: 'hidden',
    position: 'relative',
  },
  formGoldBar: {
    height: 3,
    background: 'linear-gradient(90deg, #d4af37, #f5d060, #d4af37)',
  },
  formHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '24px 32px 0',
  },
  formTitle: {
    fontSize: 28,
    fontWeight: 900,
    fontStyle: 'italic',
    color: '#d4af37',
    letterSpacing: '-0.5px',
    margin: 0,
  },
  formBody: {
    padding: '24px 32px 32px',
    display: 'flex',
    flexDirection: 'column',
    gap: 16,
  },
  formRow: {
    display: 'flex',
    gap: 16,
  },
  label: {
    display: 'block',
    fontSize: 11,
    textTransform: 'uppercase',
    letterSpacing: '0.15em',
    color: 'rgba(255,255,255,0.5)',
    marginBottom: 8,
    fontFamily: 'sans-serif',
  },
  input: {
    width: '100%',
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 8,
    padding: '10px 14px',
    color: '#fff',
    fontSize: 14,
    outline: 'none',
    fontFamily: 'sans-serif',
    boxSizing: 'border-box',
  },
  sizeGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(4, 1fr)',
    gap: 6,
  },
  sizeBtn: {
    padding: '8px 4px',
    borderRadius: 6,
    border: '1px solid rgba(255,255,255,0.1)',
    background: 'rgba(0,0,0,0.3)',
    color: 'rgba(255,255,255,0.5)',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 14,
    fontFamily: 'sans-serif',
  },
  sizeBtnActive: {
    background: '#d4af37',
    border: '1px solid #d4af37',
    color: '#000',
  },
  camBtn: {
    width: '100%',
    padding: '10px 14px',
    borderRadius: 8,
    border: '1px solid',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 13,
    fontFamily: 'sans-serif',
    transition: 'all 0.2s',
  },
  camBtnOn: {
    background: 'rgba(212,175,55,0.15)',
    borderColor: 'rgba(212,175,55,0.5)',
    color: '#d4af37',
  },
  camBtnOff: {
    background: 'rgba(0,0,0,0.3)',
    borderColor: 'rgba(255,255,255,0.1)',
    color: 'rgba(255,255,255,0.4)',
  },
  goldBtn: {
    background: 'linear-gradient(135deg, #b8860b, #d4af37, #b8860b)',
    color: '#000',
    border: 'none',
    borderRadius: 8,
    padding: '12px 24px',
    fontWeight: 900,
    fontStyle: 'italic',
    letterSpacing: '0.1em',
    cursor: 'pointer',
    fontSize: 14,
    fontFamily: "'Georgia', serif",
    transition: 'opacity 0.2s',
    whiteSpace: 'nowrap',
  },
  smallBtn: {
    background: 'rgba(255,255,255,0.08)',
    color: '#fff',
    border: '1px solid rgba(255,255,255,0.15)',
    borderRadius: 8,
    padding: '8px 16px',
    cursor: 'pointer',
    fontWeight: 700,
    fontSize: 12,
    letterSpacing: '0.1em',
    fontFamily: 'sans-serif',
    whiteSpace: 'nowrap',
  },
  backBtn: {
    background: 'transparent',
    border: 'none',
    color: 'rgba(255,255,255,0.4)',
    cursor: 'pointer',
    fontSize: 13,
    fontFamily: 'sans-serif',
    padding: 0,
  },
  lobbiesHeader: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  lobbiesGrid: {
    display: 'flex',
    flexDirection: 'column',
    gap: 12,
  },
  lobbyRow: {
    background: 'rgba(0,0,0,0.4)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 12,
    padding: '16px 20px',
    display: 'flex',
    alignItems: 'center',
    gap: 16,
  },
  lobbyRowTitle: {
    fontSize: 16,
    fontWeight: 700,
    color: '#fff',
    marginBottom: 4,
    fontStyle: 'italic',
  },
  lobbyRowMeta: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.4)',
    fontFamily: 'sans-serif',
  },
  tagCam: {
    background: 'rgba(212,175,55,0.15)',
    color: '#d4af37',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'sans-serif',
  },
  tagPwd: {
    background: 'rgba(239,68,68,0.15)',
    color: '#f87171',
    padding: '2px 8px',
    borderRadius: 4,
    fontSize: 11,
    fontFamily: 'sans-serif',
  },
  playerCount: {
    background: 'rgba(255,255,255,0.08)',
    padding: '4px 12px',
    borderRadius: 20,
    fontSize: 12,
    fontFamily: 'sans-serif',
    whiteSpace: 'nowrap',
  },
  emptyState: {
    textAlign: 'center',
    padding: '60px 0',
    background: 'rgba(0,0,0,0.3)',
    border: '1px solid rgba(212,175,55,0.2)',
    borderRadius: 16,
  },
}
