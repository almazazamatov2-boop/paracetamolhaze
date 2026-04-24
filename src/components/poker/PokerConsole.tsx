'use client'

import { useState, useEffect, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { supabase } from '@/lib/supabase'

type TableSize = 2 | 4 | 5 | 6 | 9
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

// Vintage Poker Theme
const theme = {
  colors: {
    primaryCta: 'hsl(202, 49%, 28%)',
    primaryCtaDarker: 'hsl(202, 49%, 18%)',
    secondaryCta: 'hsl(202, 36%, 55%)',
    darkBg: 'hsl(43, 40%, 60%)',
    lightBg: 'hsl(43, 40%, 81%)',
    lightestBg: 'hsl(43, 40%, 86%)',
    fontColorLight: 'hsl(40, 100%, 99%)',
    fontColorDark: 'hsl(36, 71%, 3%)',
    fontColorDarkLighter: 'hsl(36, 71%, 13%)',
    playingCardBg: 'hsl(49, 63%, 92%)',
  },
  fonts: {
    fontFamilySerif: "'Playfair Display', serif",
    fontFamilySansSerif: "'Roboto', sans-serif",
  },
  other: {
    stdBorderRadius: '2rem',
    cardDropShadow: '10px 10px 30px rgba(0, 0, 0, 0.1)',
  }
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
    name: 'POKERLIVE Table',
    size: 5,
    buyIn: 1000,
    blind: 10,
    withWebcams: true,
    password: '',
    ante: 0
  })

  useEffect(() => {
    // Add Google Fonts
    const link = document.createElement('link')
    link.href = 'https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;0,900;1,400;1,700;1,900&family=Roboto:wght@400;700&display=swap'
    link.rel = 'stylesheet'
    document.head.appendChild(link)

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
        <div style={{fontFamily: theme.fonts.fontFamilySerif, fontSize: '2rem'}}>Loading...</div>
      </div>
    )
  }

  if (!user) {
    return (
      <div style={styles.root}>
        <div style={styles.authBox}>
          <h1 style={styles.logo}>POKERLIVE</h1>
          <div style={styles.authCard}>
            <p style={{marginBottom: '2rem', fontFamily: theme.fonts.fontFamilySansSerif, color: theme.colors.fontColorDarkLighter}}>Please authorize with Twitch to play</p>
            <button
              style={styles.primaryBtn}
              onClick={() => window.location.href = '/auth/twitch?source=poker'}
              onMouseEnter={e => (e.currentTarget.style.background = theme.colors.primaryCtaDarker)}
              onMouseLeave={e => (e.currentTarget.style.background = theme.colors.primaryCta)}
            >
              LOGIN WITH TWITCH
            </button>
          </div>
        </div>
      </div>
    )
  }

  // Use dynamic import for the table to avoid SSR issues with canvas/rtc
  const DynamicTable = view === 'game' ? require('./PokerTable').default : null

  return (
    <div style={styles.root}>
      <AnimatePresence mode="wait">
        {view === 'lobby' && (
          <motion.div
            key="lobby"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            style={styles.centeredView}
          >
            <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
              <h1 style={styles.logo}>POKERLIVE</h1>
            </div>

            <div style={styles.lobbyGrid}>
              <div style={styles.card} onClick={() => setView('create')}>
                <h2 style={{fontFamily: theme.fonts.fontFamilySerif, marginBottom: '1rem', color: theme.colors.fontColorDark}}>Create Table</h2>
                <p style={{fontFamily: theme.fonts.fontFamilySansSerif, color: theme.colors.fontColorDarkLighter}}>Host a new game and invite friends.</p>
                <button style={{...styles.primaryBtn, marginTop: '2rem'}}>CREATE</button>
              </div>

              <div style={styles.card} onClick={() => { fetchLobbies(); setView('lobbies') }}>
                <h2 style={{fontFamily: theme.fonts.fontFamilySerif, marginBottom: '1rem', color: theme.colors.fontColorDark}}>Join Table</h2>
                <p style={{fontFamily: theme.fonts.fontFamilySansSerif, color: theme.colors.fontColorDarkLighter}}>Join an existing public table.</p>
                <button style={{...styles.secondaryBtn, marginTop: '2rem'}}>BROWSE</button>
              </div>
            </div>

            <button
              style={{...styles.textBtn, marginTop: '2rem'}}
              onClick={() => window.location.href = '/'}
            >
              ← Back to Main
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
            <div style={{...styles.card, maxWidth: '600px', width: '100%'}}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontFamily: theme.fonts.fontFamilySerif, margin: 0}}>Create Table</h2>
                <button style={styles.textBtn} onClick={() => setView('lobby')}>Cancel</button>
              </div>

              <div style={{display: 'flex', flexDirection: 'column', gap: '1.5rem'}}>
                <div>
                  <label style={styles.label}>Table Name</label>
                  <input style={styles.input} value={settings.name} onChange={e => setSettings({...settings, name: e.target.value})} />
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Seats (Default 5 for vintage)</label>
                    <div style={{display: 'flex', gap: '0.5rem'}}>
                      {[2, 5, 6, 9].map(s => (
                        <button
                          key={s}
                          style={{
                            ...styles.input, 
                            cursor: 'pointer', 
                            textAlign: 'center', 
                            background: settings.size === s ? theme.colors.primaryCta : '#fff',
                            color: settings.size === s ? '#fff' : theme.colors.fontColorDark
                          }}
                          onClick={() => setSettings({...settings, size: s as TableSize})}
                        >
                          {s}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Webcams</label>
                    <button
                      style={{...styles.input, cursor: 'pointer', textAlign: 'center', background: settings.withWebcams ? theme.colors.secondaryCta : '#fff'}}
                      onClick={() => setSettings({...settings, withWebcams: !settings.withWebcams})}
                    >
                      {settings.withWebcams ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                </div>

                <div style={{display: 'flex', gap: '1rem'}}>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Buy-in</label>
                    <input style={styles.input} type="number" value={settings.buyIn} onChange={e => setSettings({...settings, buyIn: parseInt(e.target.value)})} />
                  </div>
                  <div style={{flex: 1}}>
                    <label style={styles.label}>Small Blind</label>
                    <input style={styles.input} type="number" value={settings.blind} onChange={e => setSettings({...settings, blind: parseInt(e.target.value)})} />
                  </div>
                </div>

                <button style={{...styles.primaryBtn, marginTop: '1rem'}} onClick={createRoom}>
                  START GAME
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
            style={{ ...styles.centeredView, justifyContent: 'flex-start', paddingTop: '4rem' }}
          >
            <div style={{ width: '100%', maxWidth: '800px' }}>
              <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem'}}>
                <h2 style={{fontFamily: theme.fonts.fontFamilySerif, margin: 0}}>Open Tables</h2>
                <div style={{display: 'flex', gap: '1rem'}}>
                  <button style={styles.secondaryBtn} onClick={fetchLobbies}>Refresh</button>
                  <button style={styles.textBtn} onClick={() => setView('lobby')}>Back</button>
                </div>
              </div>

              {openLobbies.length === 0 ? (
                <div style={styles.card}>
                  <p style={{fontFamily: theme.fonts.fontFamilySansSerif, textAlign: 'center'}}>No open tables found.</p>
                </div>
              ) : (
                <div style={{display: 'flex', flexDirection: 'column', gap: '1rem'}}>
                  {openLobbies.map(lobby => (
                    <div key={lobby.id} style={{...styles.card, padding: '1.5rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                      <div>
                        <h3 style={{fontFamily: theme.fonts.fontFamilySerif, margin: '0 0 0.5rem 0'}}>{lobby.name}</h3>
                        <p style={{fontFamily: theme.fonts.fontFamilySansSerif, margin: 0, color: theme.colors.fontColorDarkLighter, fontSize: '0.9rem'}}>
                          Blinds: {lobby.blind}/{lobby.blind * 2} | Buy-in: {lobby.buy_in} | Players: {lobby.players_count}/{lobby.size}
                        </p>
                      </div>
                      <div style={{display: 'flex', gap: '1rem', alignItems: 'center'}}>
                        {selectedLobby?.id === lobby.id && lobby.has_password && (
                          <input 
                            style={{...styles.input, width: '120px', padding: '0.5rem'}} 
                            type="password" 
                            placeholder="Password" 
                            value={passwordInput} 
                            onChange={e => setPasswordInput(e.target.value)} 
                          />
                        )}
                        <button 
                          style={selectedLobby?.id === lobby.id ? styles.primaryBtn : styles.secondaryBtn}
                          onClick={() => selectedLobby?.id === lobby.id ? joinLobby(lobby) : setSelectedLobby(lobby)}
                        >
                          {selectedLobby?.id === lobby.id ? 'JOIN' : 'SELECT'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {view === 'game' && DynamicTable && (
          <motion.div
            key="game"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{ width: '100%', height: '100vh', position: 'relative' }}
          >
            <DynamicTable
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

const styles: Record<string, React.CSSProperties> = {
  root: {
    minHeight: '100vh',
    backgroundColor: theme.colors.lightestBg,
    color: theme.colors.fontColorDark,
    fontFamily: theme.fonts.fontFamilySansSerif,
    lineHeight: theme.fonts.fontLineHeight,
    overflow: 'hidden',
  },
  centeredView: {
    position: 'relative',
    zIndex: 10,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: '100vh',
    padding: '2rem',
    width: '100%',
  },
  logo: {
    fontFamily: theme.fonts.fontFamilySerif,
    fontSize: '4rem',
    color: theme.colors.fontColorDark,
    margin: 0,
    fontWeight: 900,
  },
  authBox: {
    textAlign: 'center',
    zIndex: 10,
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    width: '100%',
    maxWidth: '500px',
  },
  card: {
    backgroundColor: theme.colors.playingCardBg,
    borderRadius: theme.other.stdBorderRadius,
    padding: '2.5rem',
    boxShadow: theme.other.cardDropShadow,
  },
  authCard: {
    backgroundColor: theme.colors.playingCardBg,
    borderRadius: theme.other.stdBorderRadius,
    padding: '3rem',
    boxShadow: theme.other.cardDropShadow,
    marginTop: '2rem',
  },
  primaryBtn: {
    backgroundColor: theme.colors.primaryCta,
    color: theme.colors.fontColorLight,
    border: 'none',
    borderRadius: '2rem',
    padding: '0.8rem 2rem',
    fontWeight: 'bold',
    fontFamily: theme.fonts.fontFamilySansSerif,
    cursor: 'pointer',
    transition: 'background 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textTransform: 'uppercase',
    width: '100%',
  },
  secondaryBtn: {
    backgroundColor: theme.colors.secondaryCta,
    color: theme.colors.fontColorLight,
    border: 'none',
    borderRadius: '2rem',
    padding: '0.8rem 2rem',
    fontWeight: 'bold',
    fontFamily: theme.fonts.fontFamilySansSerif,
    cursor: 'pointer',
    transition: 'background 0.2s',
    boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
    textTransform: 'uppercase',
    width: '100%',
  },
  textBtn: {
    backgroundColor: 'transparent',
    color: theme.colors.primaryCta,
    border: 'none',
    fontWeight: 'bold',
    fontFamily: theme.fonts.fontFamilySansSerif,
    cursor: 'pointer',
  },
  lobbyGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
    gap: '2rem',
    width: '100%',
    maxWidth: '800px',
  },
  label: {
    display: 'block',
    fontFamily: theme.fonts.fontFamilySansSerif,
    fontWeight: 'bold',
    marginBottom: '0.5rem',
    color: theme.colors.fontColorDark,
  },
  input: {
    width: '100%',
    padding: '0.8rem 1rem',
    borderRadius: '1rem',
    border: `1px solid ${theme.colors.darkBg}`,
    fontFamily: theme.fonts.fontFamilySansSerif,
    fontSize: '1rem',
    outline: 'none',
    backgroundColor: '#fff',
  }
}
