// =============================================
// LOTO — Supabase Realtime Bridge
// Заменяет WebSocket (ws://) на Supabase Realtime
// Подключить ПОСЛЕ telegram-web-app.js, ДО </body>
// =============================================

const SUPABASE_URL = 'https://dlybapjwphbcynfkdxyk.supabase.co';
const SUPABASE_ANON = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRseWJhcGp3cGhiY3luZmtkeHlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY0NTEzMzQsImV4cCI6MjA5MjAyNzMzNH0.XVjs3XJVUR51NXjxgFKnCrW1f-Irv3AQRItonjeDDPk';

const ADMIN_IDS = [1177637332, 177637332, 6069277, 1374581977];
if (!window.ADMIN_IDS) window.ADMIN_IDS = ADMIN_IDS;

// ── глобальный клиент ──────────────────────────────────────────────────────
let _sb = null;
let _channel_lobby = null;
let _channel_players = null;
let _channel_chat = null;

// Попытка подхватить ID из URL (для админки/оверлея) или из глобала
const _urlParams = new URLSearchParams(window.location.search);
if (!window.userId) window.userId = _urlParams.get('userId') || _urlParams.get('user_id');
if (!window.currentLobbyId) window.currentLobbyId = _urlParams.get('lobbyId');

// Глобальные переменные (если не объявлены в основном файле)
if (typeof window.drawnNumbers === 'undefined') window.drawnNumbers = new Set();
if (typeof window.drawnOrder === 'undefined') window.drawnOrder = [];
if (typeof window.isAdmin === 'undefined') window.isAdmin = false;
if (typeof window.isSuperAdmin === 'undefined') {
    const rawId = window.userId ? window.userId.replace(/^b/, '') : '';
    window.isSuperAdmin = ADMIN_IDS.includes(Number(rawId)) || (window.userId && ADMIN_IDS.includes(Number(window.userId)));
}

// Авто-подписка и проверка прав для админки/оверлея
if (window.currentLobbyId) {
    (async () => {
        const sb = getSB();
        const { data: lobby } = await sb.from('loto_lobbies').select('*').eq('id', window.currentLobbyId).single();
        if (lobby) {
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
            window.isAdmin = (lobby.admin_id === window.userId) || window.isSuperAdmin;
            window.drawnOrder = (lobby.drawn_numbers || []).map(Number);
            window.drawnNumbers = new Set(window.drawnOrder);
            console.log('[Realtime] Initial state loaded, isAdmin:', window.isAdmin, 'Players:', (allPlayers || []).length);
            if (window.updateDisplay) window.updateDisplay(); // для admin.html
            if (window.renderPlayers && allPlayers) window.renderPlayers(window.currentLobby.players); 
        } else {
            console.error('[Realtime] Lobby not found in Supabase:', window.currentLobbyId);
        }
        subscribeToLobby(window.currentLobbyId);
    })();
}

function getSB() {
  if (!_sb) _sb = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON);
  return _sb;
}

// ── Monkey-patch fetch (Ultimate Redis Protection) ──────────────────────
const _origFetch = window.fetch;
window.fetch = async function(...args) {
  const url = typeof args[0] === 'string' ? args[0] : (args[0] instanceof URL ? args[0].href : '');
  const options = args[1] || {};
  
  if (url.includes('/api/loto') || url.includes('/api/drawn')) {
    console.log('[fetch Redirected to Supabase]', url);
    let body = {};
    try { if (options.body) body = JSON.parse(options.body); } catch(e) {}
    
    const action = (new URL(url, location.origin)).searchParams.get('action') || body.action || body.type;

    // Редирект действий на Supabase функции
    if (action === 'draw_number' || action === 'add_barrel') {
      const num = body.number || (new URL(url, location.origin)).searchParams.get('number');
      if (num) await window.adminAddBarrel(num);
      return new Response(JSON.stringify({ type: 'success', drawn: Array.from(drawnNumbers) }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    
    if (action === 'get_state') {
      const drawn = window.drawnOrder || [];
      return new Response(JSON.stringify({ 
        type: 'state', 
        drawn: drawn,
        lobby: window.currentLobby || { players: [] } 
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    if (action === 'list_lobbies' || url.includes('/api/lobbies')) {
      // Это сложнее, т.к. возвращает массив. Но обычно вызывается через refreshLobbyList()
      return new Response(JSON.stringify([]), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }

    return new Response(JSON.stringify({ type: 'redirected' }), { status: 200, headers: { 'Content-Type': 'application/json' } });
  }
  return _origFetch(...args);
};

// ── Утилиты ────────────────────────────────────────────────────────────────
function genCode(len = 6) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let s = '';
  for (let i = 0; i < len; i++) s += chars[Math.floor(Math.random() * chars.length)];
  return s;
}

function generateLotoCardSrv() {
  const ranges = [[1,9],[10,19],[20,29],[30,39],[40,49],[50,59],[60,69],[70,79],[80,90]];
  for (let attempt = 0; attempt < 2000; attempt++) {
    const colCount = Array(9).fill(0);
    const mask = Array(3).fill(null).map(() => Array(9).fill(false));
    let ok = true;
    const cols9 = [0,1,2,3,4,5,6,7,8].sort(() => Math.random() - 0.5);
    for (let i = 0; i < 9; i++) { mask[Math.floor(i/3)][cols9[i]] = true; colCount[cols9[i]]++; }
    for (let row = 0; row < 3; row++) {
      const need = 5 - mask[row].filter(Boolean).length;
      const avail = [];
      for (let c = 0; c < 9; c++) if (!mask[row][c] && colCount[c] < 2) avail.push(c);
      if (avail.length < need) { ok = false; break; }
      avail.sort(() => Math.random() - 0.5).slice(0, need).forEach(c => { mask[row][c] = true; colCount[c]++; });
    }
    if (!ok) continue;
    let valid = mask.every(r => r.filter(Boolean).length === 5) && colCount.every(c => c >= 1 && c <= 2);
    if (!valid) continue;
    const card = Array(3).fill(null).map(() => Array(9).fill(null));
    for (let col = 0; col < 9; col++) {
      const [mn, mx] = ranges[col];
      const rows = [0,1,2].filter(r => mask[r][col]);
      const pool = Array.from({length: mx - mn + 1}, (_, i) => mn + i).sort(() => Math.random() - 0.5);
      pool.slice(0, rows.length).sort((a,b) => a-b).forEach((n, i) => { card[rows.sort((a,b)=>a-b)[i]][col] = n; });
    }
    return card;
  }
  return Array(3).fill(null).map(() => Array(9).fill(null));
}

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

  // ── Лобби: статус, drawn_numbers, event ───────────────────────────────
  _channel_lobby = sb
    .channel('loto-lobby-' + lobbyId)
    .on('postgres_changes', {
      event: 'UPDATE', schema: 'public', table: 'loto_lobbies',
      filter: `id=eq.${lobbyId}`
    }, ({ new: row }) => {
      // Синхронизируем выпавшие бочонки
      if (Array.isArray(row.drawn_numbers)) {
        const arr = row.drawn_numbers.map(Number);
        const newNums = arr.filter(n => !drawnNumbers.has(n));
        drawnNumbers = new Set(arr);
        drawnOrder = arr;
        if (window.updateDrawnNumbersDisplay) window.updateDrawnNumbersDisplay();
        if (window.updateDisplay) window.updateDisplay();
        if (newNums.length > 0) {
          updateDrawnNumbersDisplay();
          playSound('barrel');
          if (settings.vibration && tg?.HapticFeedback) tg.HapticFeedback.impactOccurred('medium');
        } else {
          updateDrawnNumbersDisplay();
        }
      }
      // Обрабатываем event-объект
      const ev = row.event;
      if (!ev || !ev.type || ev.ts === _lastEventTs) return;
      _lastEventTs = ev.ts;
      if (ev.type === 'game_started') {
        // Загружаем свою карточку
        _loadMyCard(lobbyId);
      } else if (ev.type === 'game_won') {
        if (ev.winner_id === userId) {
          showWinModal();
        } else {
          const banner = document.createElement('div');
          banner.style.cssText = 'position:fixed;top:20px;left:50%;transform:translateX(-50%);background:#FFD700;color:#000;padding:15px 25px;border-radius:15px;font-weight:800;font-size:16px;z-index:999;animation:fadeIn .3s ease';
          banner.textContent = `🎉 ${ev.winner_name} кричит ЛОТО!`;
          document.body.appendChild(banner);
          setTimeout(() => banner.remove(), 4000);
        }
      } else if (ev.type === 'lobby_closed') {
        _onLobbyLeft();
      }
    })
    .subscribe();

  // ── Игроки: join / leave ───────────────────────────────────────────────
  _channel_players = sb
    .channel('loto-players-' + lobbyId)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'loto_players',
      filter: `lobby_id=eq.${lobbyId}`
    }, ({ new: p }) => {
      if (!currentLobby) return;
      if (!currentLobby.players.find(x => x.id === p.id)) {
        currentLobby.players.push({ id: p.id, nickname: p.nickname || 'Игрок', avatar: p.avatar || '👤', isAdmin: false });
        if (window.updateLobbyDisplay) window.updateLobbyDisplay();
        if (window.renderPlayers) window.renderPlayers(currentLobby.players);
      }
    })
    .on('postgres_changes', {
      event: 'DELETE', schema: 'public', table: 'loto_players',
      filter: `lobby_id=eq.${lobbyId}`
    }, ({ old: p }) => {
      if (!currentLobby) return;
      currentLobby.players = currentLobby.players.filter(x => x.id !== p.id);
      if (window.updateLobbyDisplay) window.updateLobbyDisplay();
      if (window.renderPlayers) window.renderPlayers(currentLobby.players);
    })
    .subscribe();

  // ── Чат ───────────────────────────────────────────────────────────────
  _channel_chat = sb
    .channel('loto-chat-' + lobbyId)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'loto_chat',
      filter: `lobby_id=eq.${lobbyId}`
    }, ({ new: m }) => {
      if (m.user_id === userId) return; // свои уже показаны оптимистично
      appendChatMessage({ userId: m.user_id, nickname: m.nickname || 'Игрок', text: m.text, timestamp: new Date(m.created_at).getTime() });
    })
    .subscribe();
}

let _lastEventTs = 0;

// ── Загрузка карточки после game_started ──────────────────────────────────
async function _loadMyCard(lobbyId) {
  const sb = getSB();
  const { data } = await sb.from('loto_players').select('card').eq('id', userId).eq('lobby_id', lobbyId).maybeSingle();
  if (data?.card) {
    cardNumbers = data.card;
    markedCells.clear();
    drawnNumbers.clear();
    drawnOrder = [];
    alreadyWon = false;
    alreadyNotified14 = false;
    gameScreenShown = true;
    renderCard();
    updateGameStats();
    if (window.updateGameDisplay) window.updateGameDisplay();
    if (currentScreen !== 'gameScreen') showScreen('gameScreen');
  }
}

function _onLobbyLeft() {
  unsubscribeAll();
  currentLobby = null;
  currentLobbyId = null;
  isAdmin = false;
  gameScreenShown = false;
  showScreen('mainMenu');
}

// ── OVERRIDE: initWS (заменяем оригинал) ──────────────────────────────────
window.initWS = async function() {
  setConnStatus('connecting', 'Подключение...');
  const sb = getSB();
  
  // Установка прав админа по ID (синхронизация с ADMIN_IDS из index.html)
  if (window.ADMIN_IDS && window.ADMIN_IDS.includes(Number(userId))) {
      window.isSuperAdmin = true;
      const btn = document.getElementById('adminMenuBtn');
      if (btn) btn.style.display = 'flex';
  }

  // Upsert игрока в loto_players
  await sb.from('loto_players').upsert({
    id: userId,
    nickname: userProfile.nickname || 'Игрок',
    avatar: userProfile.avatar || '👤',
  }, { onConflict: 'id' });
  setConnStatus('connected', 'Онлайн');
  wsReady = true;
};

// ── OVERRIDE: sendAPI (перехватываем все прямые вызовы) ──────────────────
window.sendAPI = async function(data) {
  const sb = getSB();
  try {
    const action = data.action || data.type;
    console.log('[sendAPI Override]', action, data);
    
    if (action === 'chat_message') {
      const chatMsg = { lobby_id: data.lobbyId || currentLobbyId, user_id: userId, nickname: data.nickname || userProfile.nickname || 'Игрок', text: data.text };
      appendChatMessage({ userId, nickname: chatMsg.nickname, text: data.text, timestamp: Date.now() });
      await sb.from('loto_chat').insert(chatMsg);
      return { type: 'chat_message_sent' };
    }
    
    if (action === 'auth') {
      return { type: 'auth_success', user: { id: userId, nickname: userProfile.nickname } };
    }

    // Если что-то не обработано, пробуем через sendWS
    if (window.sendWS) return window.sendWS({ ...data, type: action });

  } catch(e) {
    console.error('[sendAPI Override Error]', e);
    return { type: 'error', message: e.message };
  }
};

// ── OVERRIDE: sendWS (заменяем оригинал) ─────────────────────────────────
window.sendWS = async function(msg) {
  const sb = getSB();
  try {
    switch (msg.type) {

      // ── Создание лобби ──────────────────────────────────────────────
      case 'create_lobby': {
        const code = genCode();
        const { data: lobby, error } = await sb.from('loto_lobbies').insert({
          code,
          name: msg.name || 'Моя игра',
          admin_id: userId,
          max_players: msg.maxPlayers || 10,
          status: 'waiting',
          password: msg.password || null,
          drawn_numbers: [],
          event: { type: 'none', ts: 0 }
        }).select().single();
        if (error) { alert('❌ Ошибка создания лобби'); return; }

        await sb.from('loto_players').upsert({
          id: userId,
          nickname: userProfile.nickname,
          avatar: userProfile.avatar || '👤',
          lobby_id: lobby.id,
          status: 'ready'
        }, { onConflict: 'id' });

        currentLobbyId = lobby.id;
        currentLobby = { code: lobby.code, name: lobby.name, maxPlayers: lobby.max_players, players: [{ id: userId, nickname: userProfile.nickname, avatar: userProfile.avatar || '👤', isAdmin: true }] };
        isAdmin = true;
        gameScreenShown = false;
        subscribeToLobby(lobby.id);
        showScreen('lobbyWaitScreen');
        if (window.updateLobbyDisplay) window.updateLobbyDisplay();
        if (window.updateGameDisplay) window.updateGameDisplay();
        break;
      }

      // ── Вход в лобби ────────────────────────────────────────────────
      case 'join_lobby': {
        let q = sb.from('loto_lobbies').select('*').eq('code', msg.code.toUpperCase()).eq('status', 'waiting');
        const { data: lobbies } = await q;
        if (!lobbies || lobbies.length === 0) { alert('❌ Лобби не найдено или уже идёт игра'); return; }
        const lobby = lobbies[0];
        if (lobby.password && lobby.password !== msg.password) { alert('❌ Неверный пароль'); return; }

        const { data: existing } = await sb.from('loto_players').select('id').eq('lobby_id', lobby.id);
        if ((existing || []).length >= lobby.max_players) { alert('❌ Лобби заполнено'); return; }

        await sb.from('loto_players').upsert({
          id: userId,
          nickname: userProfile.nickname,
          avatar: userProfile.avatar || '👤',
          lobby_id: lobby.id,
          status: 'waiting'
        }, { onConflict: 'id' });

        const { data: allPlayers } = await sb.from('loto_players').select('*').eq('lobby_id', lobby.id);
        currentLobbyId = lobby.id;
        currentLobby = {
          code: lobby.code, name: lobby.name,
          maxPlayers: lobby.max_players,
          players: (allPlayers || []).map(p => ({ id: p.id, nickname: p.nickname || 'Игрок', avatar: p.avatar || '👤', isAdmin: p.id === lobby.admin_id }))
        };
        isAdmin = (lobby.admin_id === userId);
        gameScreenShown = false;
        subscribeToLobby(lobby.id);
        showScreen('lobbyWaitScreen');
        if (window.updateLobbyDisplay) window.updateLobbyDisplay();
        if (window.updateGameDisplay) window.updateGameDisplay();
        break;
      }

      // ── Старт игры ──────────────────────────────────────────────────
      case 'start_game': {
        if (!isAdmin || !currentLobbyId) return;
        const { data: players } = await sb.from('loto_players').select('id').eq('lobby_id', currentLobbyId);
        if (!players) return;
        // Раздаём карточки
        for (const p of players) {
          const card = generateLotoCardSrv();
          await sb.from('loto_players').update({ card, status: 'playing' }).eq('id', p.id).eq('lobby_id', currentLobbyId);
        }
        await sb.from('loto_lobbies').update({
          status: 'playing',
          started_at: new Date().toISOString(),
          event: { type: 'game_started', ts: Date.now() }
        }).eq('id', currentLobbyId);
        // Сразу показываем игру для самого админа
        _loadMyCard(currentLobbyId);
        break;
      }

      // ── Выход из лобби ──────────────────────────────────────────────
      case 'leave_lobby': {
        if (!currentLobbyId) return;
        await sb.from('loto_players').update({ lobby_id: null, status: 'waiting' }).eq('id', userId).eq('lobby_id', currentLobbyId);
        unsubscribeAll();
        currentLobby = null;
        currentLobbyId = null;
        isAdmin = false;
        gameScreenShown = false;
        break;
      }

      // ── Сообщение в чат ─────────────────────────────────────────────
      case 'chat_message': {
        if (!currentLobbyId) return;
        const chatMsg = { lobby_id: currentLobbyId, user_id: userId, nickname: userProfile.nickname || 'Игрок', text: msg.text };
        // Оптимистичное отображение сразу
        appendChatMessage({ userId, nickname: userProfile.nickname || 'Игрок', text: msg.text, timestamp: Date.now() });
        await sb.from('loto_chat').insert(chatMsg);
        break;
      }

      // ── Обновление профиля ──────────────────────────────────────────
      case 'update_profile': {
        await sb.from('loto_players').upsert({ id: userId, nickname: msg.nickname, avatar: msg.avatar }, { onConflict: 'id' });
        break;
      }
    }
  } catch(e) {
    console.error('[sendWS]', e);
  }
};

// ── OVERRIDE: refreshLobbyList (REST через Supabase) ──────────────────────
window.refreshLobbyList = async function() {
  const box = document.getElementById('lobbiesList');
  if (!box) return;
  box.innerHTML = '<div class="lobby-empty">⏳ Загрузка...</div>';
  try {
    const sb = getSB();
    const { data: lobbies, error } = await sb
      .from('loto_lobbies')
      .select('id, code, name, max_players, password, status')
      .eq('status', 'waiting')
      .order('last_activity', { ascending: false })
      .limit(50);

    if (error || !lobbies || lobbies.length === 0) {
      box.innerHTML = '<div class="lobby-empty">🎲 Нет активных лобби.<br><span style="font-size:13px;">Создайте первое!</span></div>';
      return;
    }

    // Считаем игроков
    const ids = lobbies.map(l => l.id);
    const { data: pcRows } = await sb.from('loto_players').select('lobby_id').in('lobby_id', ids);
    const pcMap = {};
    (pcRows || []).forEach(r => { pcMap[r.lobby_id] = (pcMap[r.lobby_id] || 0) + 1; });

    box.innerHTML = '';
    lobbies.forEach((l, idx) => {
      const pc = pcMap[l.id] || 0;
      const mp = l.max_players || 10;
      const locked = !!l.password;
      const row = document.createElement('div');
      row.className = 'lobby-row';
      row.innerHTML = `
        <div class="lobby-row-num">${idx + 1}</div>
        <div class="lobby-row-left">
          <div class="lobby-row-name">${escapeHtml(l.name || 'Лобби')} ${locked ? '🔒' : ''}</div>
          <div class="lobby-row-meta">👥 ${pc} из ${mp}</div>
        </div>
        <button class="lobby-join-btn-sm">${locked ? '🔒' : '▶'}</button>
      `;
      row.querySelector('button').onclick = () => {
        playSound('click');
        document.getElementById('lobbyCodeInput').value = l.code;
        if (locked) {
          document.getElementById('lobbyPasswordInput').focus();
        } else {
          document.getElementById('lobbyPasswordInput').value = '';
          joinLobby();
        }
      };
      box.appendChild(row);
    });
  } catch(e) {
    box.innerHTML = '<div class="lobby-empty">❌ Ошибка загрузки.</div>';
  }
};

// ── OVERRIDE: adminAddBarrel через Supabase ───────────────────────────────
window.adminAddBarrel = async function(val) {
  if (!window.isSuperAdmin && !window.isAdmin) { alert('❌ Нет доступа'); return; }
  if (!window.currentLobbyId) { alert('Сначала создай лобби'); return; }
  const n = Number(val || document.getElementById('adminAddNumber')?.value || document.getElementById('numberInput')?.value);
  if (!(n >= 1 && n <= 90)) { alert('Введите число 1-90'); return; }
  const sb = getSB();
  const { data: lobby } = await sb.from('loto_lobbies').select('drawn_numbers').eq('id', window.currentLobbyId).single();
  const arr = (lobby?.drawn_numbers || []).map(Number);
  if (arr.includes(n)) { showToast('⚠️ Уже выпало'); return; }
  arr.push(n);
  await sb.from('loto_lobbies').update({ drawn_numbers: arr, last_activity: new Date().toISOString() }).eq('id', currentLobbyId);
  el.value = '';
  playSound('barrel');
};

window.adminUndoLast = async function() {
  if (!window.isAdmin) { alert('❌ Нет доступа'); return; }
  if (!window.currentLobbyId) return;
  const sb = getSB();
  const { data: lobby } = await sb.from('loto_lobbies').select('drawn_numbers').eq('id', window.currentLobbyId).single();
  const arr = (lobby?.drawn_numbers || []).map(Number);
  if (!arr.length) return;
  arr.pop();
  await sb.from('loto_lobbies').update({ drawn_numbers: arr }).eq('id', window.currentLobbyId);
};

window.adminResetBarrels = async function() {
  if (!window.isAdmin) { alert('❌ Нет доступа'); return; }
  if (!confirm('Сбросить все выпавшие бочонки?')) return;
  if (!window.currentLobbyId) return;
  const sb = getSB();
  await sb.from('loto_lobbies').update({ drawn_numbers: [] }).eq('id', window.currentLobbyId);
};

// ── Объявить победу ───────────────────────────────────────────────────────
const _origCheckWinLocal = window.checkWinLocal;
window.checkWinLocal = async function() {
  if (typeof _origCheckWinLocal === 'function') _origCheckWinLocal();
  // После победы — записываем в Supabase
  const allNums = [];
  for (let r = 0; r < 3; r++)
    for (let c = 0; c < 9; c++)
      if (cardNumbers[r]?.[c]) allNums.push(cardNumbers[r][c]);
  const total = allNums.length;
  const marked = allNums.filter(n => markedCells.has(n)).length;
  if (total > 0 && marked === total && window.currentLobbyId) {
    const sb = getSB();
    // Обновляем статистику
    const { data: p } = await sb.from('loto_players').select('games_played,games_won').eq('id', window.userId).maybeSingle();
    await sb.from('loto_players').update({ games_played: (p?.games_played||0)+1, games_won: (p?.games_won||0)+1 }).eq('id', window.userId);
    // Сигнализируем всем через event
    await sb.from('loto_lobbies').update({
      status: 'finished',
      event: { type: 'game_won', winner_id: window.userId, winner_name: window.userProfile.nickname || 'Игрок', ts: Date.now() }
    }).eq('id', window.currentLobbyId);
  }
};

console.log('[LotoRealtime] bridge loaded ✓');
