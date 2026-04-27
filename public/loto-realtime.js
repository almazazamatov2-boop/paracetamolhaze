// =============================================
// LOTO — Supabase Realtime Bridge (V2)
// Переписан с учетом исправлений архитектурных багов
// =============================================

const SUPABASE_URL = 'https://dlybapjwphbcynfkdxyk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWJhcGp3cGhiY3luZmtkeHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTEzMzQsImV4cCI6MjA5MjAyNzMzNH0.XVjs3XJVUR51NXjxgFKnCrW1f-Irv3AQRItonjeDDPk';

const ADMIN_IDS = [1177637332, 177637332, 6069277, 1374581977];
if (!window.ADMIN_IDS) window.ADMIN_IDS = ADMIN_IDS;

let _sb = null;
let _channel_lobby = null;
let _channel_players = null;
let _channel_chat = null;
let _lastEventTs = 0;

// ── Помощники ──────────────────────────────────────────────────────────────

async function waitSupabase() {
  while (!window.supabase) {
    await new Promise(r => setTimeout(r, 50));
  }
}

function getSB() {
  if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

async function waitLobby(id) {
  const sb = getSB();
  console.log('[Realtime] Waiting for lobby...', id);
  for (let i = 0; i < 15; i++) {
    const { data } = await sb.from('loto_lobbies').select('*').eq('id', id).maybeSingle();
    if (data) return data;
    await new Promise(r => setTimeout(r, 300));
  }
  throw new Error("Lobby not found after retries: " + id);
}

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

// ── Инициализация ────────────────────────────────────────────────────────────

(async function initBridge() {
  await waitSupabase();
  const _urlParams = new URLSearchParams(window.location.search);
  if (!window.userId) window.userId = _urlParams.get('userId') || _urlParams.get('user_id');
  if (!window.currentLobbyId) window.currentLobbyId = _urlParams.get('lobbyId');

  // Глобальные переменные
  if (typeof window.drawnNumbers === 'undefined') window.drawnNumbers = new Set();
  if (typeof window.drawnOrder === 'undefined') window.drawnOrder = [];
  if (typeof window.isAdmin === 'undefined') window.isAdmin = false;
  
  if (typeof window.isSuperAdmin === 'undefined') {
    const rawId = window.userId ? String(window.userId).replace(/^b/, '') : '';
    window.isSuperAdmin = ADMIN_IDS.includes(Number(rawId)) || (window.userId && ADMIN_IDS.includes(Number(window.userId)));
  }

  if (window.currentLobbyId) {
    try {
      const sb = getSB();
      const lobby = await waitLobby(window.currentLobbyId);
      
      // Сразу грузим игроков (Начальные данные вручную)
      const { data: allPlayers } = await sb.from('loto_players').select('*').eq('lobby_id', window.currentLobbyId);
      
      window.currentLobby = {
        id: lobby.id,
        code: lobby.code,
        name: lobby.name,
        maxPlayers: lobby.max_players,
        admin_id: lobby.admin_id,
        players: (allPlayers || []).map(p => ({ 
          id: p.id, 
          nickname: p.nickname || 'Игрок', 
          avatar: p.avatar || '👤',
          progress: (p.marked_cells || []).length
        }))
      };

      // Исправление Бага №6: Type mismatch
      window.isAdmin = String(lobby.admin_id) === String(window.userId) || window.isSuperAdmin;
      
      window.drawnOrder = (lobby.drawn_numbers || []).map(Number);
      window.drawnNumbers = new Set(window.drawnOrder);

      console.log('[Realtime] Initial state loaded, isAdmin:', window.isAdmin, 'Players:', (allPlayers || []).length);
      
      if (window.updateDisplay) window.updateDisplay(); 
      if (window.renderPlayers && allPlayers) window.renderPlayers(window.currentLobby.players); 
      
      subscribeToLobby(window.currentLobbyId);
    } catch (e) {
      console.error('[Realtime] Init Error:', e);
    }
  }
})();

// ── Подписки Realtime ──────────────────────────────────────────────────────

function unsubscribeAll() {
  const sb = getSB();
  if (_channel_lobby)  { sb.removeChannel(_channel_lobby);  _channel_lobby  = null; }
  if (_channel_players){ sb.removeChannel(_channel_players); _channel_players = null; }
  if (_channel_chat)   { sb.removeChannel(_channel_chat);   _channel_chat   = null; }
}

function subscribeToLobby(lobbyId) {
  unsubscribeAll();
  const sb = getSB();

  _channel_lobby = sb.channel('loto-lobby-' + lobbyId)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loto_lobbies', filter: `id=eq.${lobbyId}` }, ({ new: row }) => {
      if (Array.isArray(row.drawn_numbers)) {
        const arr = row.drawn_numbers.map(Number);
        const newNums = arr.filter(n => !window.drawnNumbers.has(n));
        window.drawnNumbers = new Set(arr);
        window.drawnOrder = arr;
        if (window.updateDrawnNumbersDisplay) window.updateDrawnNumbersDisplay();
        if (window.updateDisplay) window.updateDisplay();
        if (newNums.length > 0) {
          if (window.playSound) window.playSound('barrel');
        }
      }
      const ev = row.event;
      if (!ev || !ev.type || ev.ts === _lastEventTs) return;
      _lastEventTs = ev.ts;
      if (ev.type === 'game_started') {
        _loadMyCard(lobbyId);
      } else if (ev.type === 'game_won') {
        if (ev.winner_id === window.userId) {
          if (window.showWinModal) window.showWinModal();
        } else {
          showWinnerBanner(ev.winner_name);
        }
      } else if (ev.type === 'lobby_closed') {
        _onLobbyLeft();
      }
    })
    .subscribe();

  _channel_players = sb.channel('loto-players-' + lobbyId)
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loto_players', filter: `lobby_id=eq.${lobbyId}` }, async () => {
      const { data: allPlayers } = await sb.from('loto_players').select('*').eq('lobby_id', lobbyId);
      if (window.currentLobby) {
        window.currentLobby.players = (allPlayers || []).map(p => ({ 
          id: p.id, 
          nickname: p.nickname || 'Игрок', 
          avatar: p.avatar || '👤',
          isAdmin: String(p.id) === String(window.currentLobby.admin_id)
        }));
        if (window.updateLobbyDisplay) window.updateLobbyDisplay();
        if (window.renderPlayers) window.renderPlayers(window.currentLobby.players);
      }
    })
    .subscribe();

  _channel_chat = sb.channel('loto-chat-' + lobbyId)
    .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'loto_chat', filter: `lobby_id=eq.${lobbyId}` }, ({ new: msg }) => {
      if (msg.user_id !== window.userId) {
        if (window.appendChatMessage) window.appendChatMessage({ userId: msg.user_id, nickname: msg.nickname, text: msg.text, timestamp: Date.now() });
      }
    })
    .subscribe();
}

function showWinnerBanner(name) {
  const banner = document.createElement('div');
  banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#FFD700;color:#000;padding:15px 25px;border-radius:15px;font-weight:800;font-size:16px;z-index:999;animation:fadeIn .3s ease';
  banner.textContent = `🎉 ${name} кричит ЛОТО!`;
  document.body.appendChild(banner);
  setTimeout(() => banner.remove(), 4000);
}

async function _loadMyCard(lobbyId) {
  const sb = getSB();
  const { data } = await sb.from('loto_players').select('card').eq('id', window.userId).eq('lobby_id', lobbyId).maybeSingle();
  if (data?.card) {
    window.cardNumbers = data.card;
    if (window.markedCells) window.markedCells.clear();
    window.drawnNumbers.clear();
    window.drawnOrder = [];
    window.gameScreenShown = true;
    if (window.renderCard) window.renderCard();
    if (window.updateGameStats) window.updateGameStats();
    if (window.updateGameDisplay) window.updateGameDisplay();
    if (window.showScreen) window.showScreen('gameScreen');
  }
}

function _onLobbyLeft() {
  unsubscribeAll();
  window.currentLobby = null;
  window.currentLobbyId = null;
  window.isAdmin = false;
  window.gameScreenShown = false;
  if (window.showScreen) window.showScreen('mainMenu');
}

// ── OVERRIDE: fetch (Баг №4: Глобальный блок Redis API) ────────────────────

const _origFetch = window.fetch;
window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : '');
  const options = args[1] || {};
  
  if (url.includes('/api/loto') || url.includes('/api/drawn') || url.includes('/api/lobbies') || url.includes('/api/users')) {
    console.log('[fetch Intercepted]', url);
    let body = {};
    try { if (options.body) body = JSON.parse(options.body); } catch(e) {}
    const urlObj = new URL(url, location.origin);
    const action = urlObj.searchParams.get('action') || body.action || body.type;

    if (action === 'draw_number' || action === 'add_barrel') {
      const num = body.number || urlObj.searchParams.get('number');
      if (num) await window.adminAddBarrel(num);
      return new Response(JSON.stringify({ type: 'success', drawn: window.drawnOrder }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (action === 'get_state') {
      return new Response(JSON.stringify({ 
        type: 'state', 
        drawn: window.drawnOrder || [],
        lobby: window.currentLobby || { players: [] } 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    // Блокируем остальные Redis API чтобы они не уходили на бэкенд
    return new Response(JSON.stringify({ blocked: true, type: 'success' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }

  return _origFetch(...args);
};

// ── OVERRIDE: sendWS ────────────────────────────────────────────────────────

window.sendWS = async function(msg) {
  const sb = getSB();
  try {
    switch (msg.type) {
      case 'create_lobby': {
        const code = genCode();
        const { data: lobby, error } = await sb.from('loto_lobbies').insert({
          code,
          name: msg.name || 'Моя игра',
          admin_id: window.userId,
          max_players: msg.maxPlayers || 10,
          status: 'waiting',
          password: msg.password || null,
          drawn_numbers: [],
          event: { type: 'none', ts: Date.now() }
        }).select().single();
        
        if (error) throw error;

        await sb.from('loto_players').upsert({
          id: window.userId,
          lobby_id: lobby.id,
          nickname: window.userName || 'Админ',
          avatar: window.userProfile?.avatar || '👤',
          is_admin: true,
          status: 'ready'
        });

        window.currentLobbyId = lobby.id;
        window.isAdmin = true;
        subscribeToLobby(lobby.id);
        if (window.showScreen) window.showScreen('lobbyWaitScreen');
        if (window.updateLobbyDisplay) window.updateLobbyDisplay();
        break;
      }

      case 'join_lobby': {
        const { data: lobby } = await sb.from('loto_lobbies').select('*').eq('code', msg.code.toUpperCase()).eq('status', 'waiting').maybeSingle();
        if (!lobby) { alert('Лобби не найдено'); return; }
        
        await sb.from('loto_players').upsert({
          id: window.userId,
          lobby_id: lobby.id,
          nickname: window.userName || 'Игрок',
          avatar: window.userProfile?.avatar || '👤',
          status: 'waiting'
        });

        window.currentLobbyId = lobby.id;
        window.isAdmin = String(lobby.admin_id) === String(window.userId);
        subscribeToLobby(lobby.id);
        if (window.showScreen) window.showScreen('lobbyWaitScreen');
        break;
      }

      case 'start_game': {
        if (!window.isAdmin || !window.currentLobbyId) return;
        const { data: players } = await sb.from('loto_players').select('id').eq('lobby_id', window.currentLobbyId);
        if (!players) return;
        
        for (const p of players) {
          const card = window.generateLotoCard ? window.generateLotoCard() : [[null]]; 
          await sb.from('loto_players').update({ card, status: 'playing' }).eq('id', p.id).eq('lobby_id', window.currentLobbyId);
        }
        
        await sb.from('loto_lobbies').update({
          status: 'playing',
          started_at: new Date().toISOString(),
          event: { type: 'game_started', ts: Date.now() }
        }).eq('id', window.currentLobbyId);
        break;
      }
      
      case 'chat_message': {
        if (!window.currentLobbyId) return;
        await sb.from('loto_chat').insert({
          lobby_id: window.currentLobbyId,
          user_id: window.userId,
          nickname: window.userName || 'Игрок',
          text: msg.text
        });
        break;
      }
    }
  } catch(e) {
    console.error('[sendWS Bridge Error]', e);
  }
};

// ── Функции админа ─────────────────────────────────────────────────────────

window.adminAddBarrel = async function(val) {
  if (!window.isAdmin) { alert('❌ Нет доступа'); return; }
  if (!window.currentLobbyId) return;
  const n = Number(val);
  const sb = getSB();
  const { data: lobby } = await sb.from('loto_lobbies').select('drawn_numbers').eq('id', window.currentLobbyId).single();
  const arr = lobby.drawn_numbers || [];
  if (arr.includes(n)) return;
  const newArr = [...arr, n];
  await sb.from('loto_lobbies').update({ 
    drawn_numbers: newArr, 
    last_activity: new Date().toISOString(),
    event: { type: 'barrel', n, ts: Date.now() }
  }).eq('id', window.currentLobbyId);
};

window.adminUndoLast = async function() {
  if (!window.isAdmin || !window.currentLobbyId) return;
  const sb = getSB();
  const { data: lobby } = await sb.from('loto_lobbies').select('drawn_numbers').eq('id', window.currentLobbyId).single();
  const arr = lobby.drawn_numbers || [];
  if (!arr.length) return;
  arr.pop();
  await sb.from('loto_lobbies').update({ drawn_numbers: arr, event: { type: 'undo', ts: Date.now() } }).eq('id', window.currentLobbyId);
};

window.adminResetBarrels = async function() {
  if (!window.isAdmin || !window.currentLobbyId) return;
  if (!confirm('Сбросить?')) return;
  const sb = getSB();
  await sb.from('loto_lobbies').update({ drawn_numbers: [], event: { type: 'reset', ts: Date.now() } }).eq('id', window.currentLobbyId);
};
