// =============================================
// LOTO — Supabase Realtime Bridge (V3 - Bulletproof)
// Переписан на чистые перехватчики функций без вмешательства в fetch
// =============================================

const SUPABASE_URL = 'https://dlybapjwphbcynfkdxyk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWJhcGp3cGhiY3luZmtkeHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTEzMzQsImV4cCI6MjA5MjAyNzMzNH0.XVjs3XJVUR51NXjxgFKnCrW1f-Irv3AQRItonjeDDPk';

const ADMIN_IDS = [1177637332, 177637332, 6069277, 1374581977];

let _sb = null;
let _channel_lobby = null;
let _channel_players = null;
let _channel_chat = null;
let _lastEventTs = 0;

function getSB() {
  if (!_sb && window.supabase) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

function genCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let res = '';
  for (let i = 0; i < 6; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
  return res;
}

// ── Перехват функций (Monkey-patching) ──────────────────────────────────────

(function setupBridge() {
  console.log('[Realtime Bridge] Initializing hooks...');

  // Ждем, пока основная страница определит свои функции
  const checkInterval = setInterval(() => {
    if (window.initWS && !window.initWS._patched) {
      console.log('[Realtime Bridge] Patching global functions...');
      
      const _origInitWS = window.initWS;
      window.initWS = async function() {
        window.initWS._patched = true;
        console.log('[Realtime Bridge] initWS called');
        
        // Подхватываем параметры из URL
        const params = new URLSearchParams(window.location.search);
        if (!window.userId) window.userId = params.get('userId') || params.get('user_id');
        if (!window.currentLobbyId) window.currentLobbyId = params.get('lobbyId');

        // Инициализируем Supabase
        const sb = getSB();
        if (!sb) { console.error('Supabase not loaded!'); _origInitWS(); return; }

        // Если мы в лобби — грузим данные
        if (window.currentLobbyId) {
          const { data: lobby } = await sb.from('loto_lobbies').select('*').eq('id', window.currentLobbyId).maybeSingle();
          if (lobby) {
            window.isAdmin = String(lobby.admin_id) === String(window.userId) || (window.ADMIN_IDS && window.ADMIN_IDS.includes(Number(window.userId)));
            window.drawnOrder = (lobby.drawn_numbers || []).map(Number);
            window.drawnNumbers = new Set(window.drawnOrder);
            subscribeToLobby(window.currentLobbyId);
          }
        }

        // Вызываем оригинал для настройки UI (он вызовет наш пропатченный sendAPI для auth)
        _origInitWS();
      };
      window.initWS._patched = true;

      // Патчим sendAPI (HTTP запросы)
      const _origSendAPI = window.sendAPI;
      window.sendAPI = async function(data) {
        console.log('[Realtime Bridge] sendAPI intercepted:', data.action || data.type);
        const action = data.action || data.type;

        if (action === 'auth') {
          return { type: 'auth_success', user: { id: window.userId, nickname: window.userName } };
        }

        if (action === 'get_state') {
          return { 
            type: 'state', 
            drawn: window.drawnOrder || [],
            lobby: window.currentLobby || { players: [] } 
          };
        }

        // Для действий админа из старого кода (admin.html)
        if (action === 'draw_number' || action === 'add_barrel') {
          await window.adminAddBarrel(data.number);
          return { type: 'success' };
        }

        return { type: 'success', blocked: true };
      };

      // Патчим sendWS (WebSocket команды)
      window.sendWS = async function(msg) {
        console.log('[Realtime Bridge] sendWS intercepted:', msg.type);
        const sb = getSB();
        if (!sb) return;

        try {
          switch (msg.type) {
            case 'create_lobby': {
              const code = genCode();
              const { data: lobby } = await sb.from('loto_lobbies').insert({
                code,
                name: msg.name || 'Моя игра',
                admin_id: window.userId,
                max_players: msg.maxPlayers || 10,
                status: 'waiting'
              }).select().single();

              await sb.from('loto_players').upsert({
                id: window.userId,
                lobby_id: lobby.id,
                nickname: window.userName || 'Админ',
                is_admin: true
              });

              window.currentLobbyId = lobby.id;
              window.isAdmin = true;
              subscribeToLobby(lobby.id);
              if (window.showScreen) window.showScreen('lobbyWaitScreen');
              break;
            }

            case 'join_lobby': {
              const { data: lobby } = await sb.from('loto_lobbies').select('*').eq('code', msg.code.toUpperCase()).maybeSingle();
              if (!lobby) { alert('Лобби не найдено'); return; }
              
              await sb.from('loto_players').upsert({
                id: window.userId,
                lobby_id: lobby.id,
                nickname: window.userName || 'Игрок'
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
              for (const p of players) {
                const card = window.generateLotoCard ? window.generateLotoCard() : [[null]];
                await sb.from('loto_players').update({ card, status: 'playing' }).eq('id', p.id).eq('lobby_id', window.currentLobbyId);
              }
              await sb.from('loto_lobbies').update({ status: 'playing', event: { type: 'game_started', ts: Date.now() } }).eq('id', window.currentLobbyId);
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
        } catch(e) { console.error(e); }
      };

      clearInterval(checkInterval);
    }
  }, 100);
})();

// ── Подписки и Логика ───────────────────────────────────────────────────────

function subscribeToLobby(lobbyId) {
  const sb = getSB();
  if (!sb) return;

  sb.channel('loto-' + lobbyId)
    .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'loto_lobbies', filter: `id=eq.${lobbyId}` }, ({ new: row }) => {
      if (row.drawn_numbers) {
        window.drawnOrder = row.drawn_numbers.map(Number);
        window.drawnNumbers = new Set(window.drawnOrder);
        if (window.updateDisplay) window.updateDisplay();
        if (window.updateDrawnNumbersDisplay) window.updateDrawnNumbersDisplay();
      }
      const ev = row.event;
      if (ev && ev.type === 'game_started') {
        _loadMyCard(lobbyId);
      }
    })
    .on('postgres_changes', { event: '*', schema: 'public', table: 'loto_players', filter: `lobby_id=eq.${lobbyId}` }, async () => {
      const { data: players } = await sb.from('loto_players').select('*').eq('lobby_id', lobbyId);
      window.currentLobby = { ...window.currentLobby, players: players.map(p => ({ id: p.id, nickname: p.nickname, isAdmin: p.is_admin })) };
      if (window.updateLobbyDisplay) window.updateLobbyDisplay();
      if (window.renderPlayers) window.renderPlayers(window.currentLobby.players);
    })
    .subscribe();
}

async function _loadMyCard(lobbyId) {
  const sb = getSB();
  const { data } = await sb.from('loto_players').select('card').eq('id', window.userId).eq('lobby_id', lobbyId).maybeSingle();
  if (data?.card) {
    window.cardNumbers = data.card;
    window.gameScreenShown = true;
    if (window.renderCard) window.renderCard();
    if (window.showScreen) window.showScreen('gameScreen');
  }
}

window.adminAddBarrel = async function(val) {
  const sb = getSB();
  if (!sb || !window.currentLobbyId) return;
  const { data: lobby } = await sb.from('loto_lobbies').select('drawn_numbers').eq('id', window.currentLobbyId).single();
  const arr = [...(lobby.drawn_numbers || []), Number(val)];
  await sb.from('loto_lobbies').update({ drawn_numbers: arr }).eq('id', window.currentLobbyId);
};
