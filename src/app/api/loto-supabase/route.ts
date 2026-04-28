import { NextRequest, NextResponse } from 'next/server';
import { createClient, type SupabaseClient } from '@supabase/supabase-js';

export const runtime = 'nodejs';

const SUPABASE_URL =
  process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.SUPABASE_URL ||
  '';
const SUPABASE_SERVICE_KEY =
  process.env.SUPABASE_SERVICE_ROLE_KEY ||
  process.env.SUPABASE_SECRET_KEY ||
  '';

function getSupabaseClient(): SupabaseClient | null {
  if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) return null;
  return createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

function json(data: unknown, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { 'Cache-Control': 'no-store' },
  });
}

function asString(value: unknown): string {
  return String(value ?? '').trim();
}

function normalizeLobbyId(value: unknown): string | null {
  const normalized = asString(value);
  if (!normalized || normalized === 'undefined' || normalized === 'null') return null;
  return normalized;
}

function parseCells(body: any): number[] {
  if (Array.isArray(body?.cells)) return body.cells.map(Number).filter((n: number) => Number.isFinite(n));
  const count = Number(body?.count) || 0;
  return Array.from({ length: Math.max(0, count) }, (_, i) => i);
}

function generateLobbyCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i += 1) code += chars.charAt(Math.floor(Math.random() * chars.length));
  return code;
}

function generateFallbackCard(): (number | null)[][] {
  const rows: (number | null)[][] = [[], [], []];
  for (let col = 0; col < 9; col += 1) {
    const min = col * 10 + 1;
    const max = col === 8 ? 90 : (col + 1) * 10;
    const pool: number[] = [];
    for (let n = min; n <= max; n += 1) pool.push(n);
    for (let i = pool.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [pool[i], pool[j]] = [pool[j], pool[i]];
    }
    for (let r = 0; r < 3; r += 1) rows[r].push(pool[r] ?? null);
  }
  rows.forEach((row) => {
    const filled = row.map((v, i) => (v !== null ? i : -1)).filter((i) => i >= 0);
    for (let i = filled.length - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1));
      [filled[i], filled[j]] = [filled[j], filled[i]];
    }
    filled.slice(5).forEach((i) => {
      row[i] = null;
    });
  });
  return rows;
}

function mapPlayers(players: any[]) {
  return (players || []).map((p) => ({
    id: p.id,
    nickname: p.nickname,
    isAdmin: !!p.is_admin,
    status: p.status,
    progress: Array.isArray(p.marked_cells) ? p.marked_cells.length : 0,
  }));
}

async function findFreeLobbyCode(sb: SupabaseClient): Promise<string> {
  for (let i = 0; i < 20; i += 1) {
    const code = generateLobbyCode();
    const { data, error } = await sb
      .from('loto_lobbies')
      .select('id')
      .eq('code', code)
      .maybeSingle();
    if (error) throw error;
    if (!data) return code;
  }
  return `L${Date.now().toString(36).toUpperCase().slice(-5)}`;
}

async function readLobbyAndPlayers(sb: SupabaseClient, lobbyId: string) {
  const [{ data: lobby, error: lobbyErr }, { data: players, error: playersErr }] = await Promise.all([
    sb.from('loto_lobbies').select('*').eq('id', lobbyId).maybeSingle(),
    sb.from('loto_players').select('*').eq('lobby_id', lobbyId),
  ]);
  if (lobbyErr) throw lobbyErr;
  if (playersErr) throw playersErr;
  return { lobby, players: players || [] };
}

async function handleAction(
  sb: SupabaseClient,
  action: string | null,
  body: any,
  lobbyId: string | null,
  userId: string,
  nickname: string
) {
  switch (action) {
    case 'auth':
      return json({
        type: 'auth_success',
        user: {
          id: userId,
          nickname,
          games_played: 0,
          games_won: 0,
        },
      });

    case 'get_state': {
      if (!lobbyId) return json({ type: 'no_change' });
      const { lobby, players } = await readLobbyAndPlayers(sb, lobbyId);
      if (!lobby) return json({ error: 'Lobby not found' }, 404);

      let card: (number | null)[][] | null = null;
      let markedCells: number[] = [];
      if (userId) {
        const { data: playerRow, error: playerErr } = await sb
          .from('loto_players')
          .select('card, marked_cells')
          .eq('id', userId)
          .eq('lobby_id', lobbyId)
          .maybeSingle();
        if (playerErr) throw playerErr;
        if (playerRow) {
          card = playerRow.card || null;
          markedCells = Array.isArray(playerRow.marked_cells) ? playerRow.marked_cells : [];
        }
      }

      const updatedAt = lobby.updated_at || lobby.created_at || new Date().toISOString();
      const version = String(new Date(updatedAt).getTime() || Date.now());

      return json({
        type: 'state_update',
        version,
        drawn: (lobby.drawn_numbers || []).map(Number),
        isAdmin: String(lobby.admin_id) === userId,
        card,
        markedCells,
        lobby: {
          id: lobby.id,
          code: lobby.code,
          name: lobby.name,
          status: lobby.status,
          admin_id: lobby.admin_id,
          max_players: lobby.max_players,
          players: mapPlayers(players),
        },
      });
    }

    case 'list_lobbies': {
      const { data: lobbies, error: lobbiesErr } = await sb
        .from('loto_lobbies')
        .select('id, code, name, max_players, status')
        .in('status', ['waiting', 'playing'])
        .order('created_at', { ascending: false })
        .limit(20);
      if (lobbiesErr) throw lobbiesErr;
      if (!lobbies?.length) return json([]);

      const mapped = await Promise.all(
        lobbies.map(async (lobby) => {
          const { count, error: countErr } = await sb
            .from('loto_players')
            .select('id', { count: 'exact', head: true })
            .eq('lobby_id', lobby.id);
          if (countErr) throw countErr;
          return {
            ...lobby,
            players_count: count || 0,
            has_password: 0,
          };
        })
      );
      return json(mapped);
    }

    case 'create_lobby': {
      const code = await findFreeLobbyCode(sb);
      const { data: lobby, error: createErr } = await sb
        .from('loto_lobbies')
        .insert({
          code,
          name: body?.name || 'My game',
          admin_id: userId,
          max_players: body?.maxPlayers || 10,
          status: 'waiting',
          drawn_numbers: [],
        })
        .select()
        .single();
      if (createErr) throw createErr;

      const { error: upsertErr } = await sb.from('loto_players').upsert(
        {
          id: userId,
          lobby_id: lobby.id,
          nickname,
          is_admin: true,
          status: 'waiting',
        },
        { onConflict: 'id,lobby_id' }
      );
      if (upsertErr) throw upsertErr;

      return json({
        type: 'lobby_created',
        lobby: {
          id: lobby.id,
          code: lobby.code,
          name: lobby.name,
          status: lobby.status,
          admin_id: lobby.admin_id,
          max_players: lobby.max_players,
          players: [{ id: userId, nickname, isAdmin: true }],
        },
      });
    }

    case 'join_lobby': {
      const code = asString(body?.code).toUpperCase();
      if (!code) return json({ type: 'error', message: 'Enter lobby code' });

      const { data: lobby, error: lobbyErr } = await sb
        .from('loto_lobbies')
        .select('*')
        .eq('code', code)
        .maybeSingle();
      if (lobbyErr) throw lobbyErr;

      if (!lobby) return json({ type: 'error', message: 'Lobby not found' });
      if (lobby.status === 'finished') return json({ type: 'error', message: 'Game is already finished' });

      const isAdminHere = String(lobby.admin_id) === userId;
      const { error: joinErr } = await sb.from('loto_players').upsert(
        {
          id: userId,
          lobby_id: lobby.id,
          nickname,
          is_admin: isAdminHere,
          status: 'waiting',
        },
        { onConflict: 'id,lobby_id' }
      );
      if (joinErr) throw joinErr;

      return json({
        type: 'lobby_joined',
        lobbyId: lobby.id,
        isAdmin: isAdminHere,
      });
    }

    case 'leave_lobby': {
      if (lobbyId && userId) {
        const { error } = await sb
          .from('loto_players')
          .delete()
          .eq('id', userId)
          .eq('lobby_id', lobbyId);
        if (error) throw error;
      }
      return json({ type: 'left_lobby' });
    }

    case 'start_game': {
      if (!lobbyId) return json({ type: 'error', message: 'No lobby id' });

      const { data: lobby, error: lobbyErr } = await sb
        .from('loto_lobbies')
        .select('admin_id')
        .eq('id', lobbyId)
        .single();
      if (lobbyErr) throw lobbyErr;
      if (!lobby || String(lobby.admin_id) !== userId) {
        return json({ type: 'error', message: 'Only host can start game' });
      }

      const { data: players, error: playersErr } = await sb
        .from('loto_players')
        .select('id')
        .eq('lobby_id', lobbyId);
      if (playersErr) throw playersErr;

      for (const player of players || []) {
        const { error: updErr } = await sb
          .from('loto_players')
          .update({ card: generateFallbackCard(), status: 'playing', marked_cells: [] })
          .eq('id', player.id)
          .eq('lobby_id', lobbyId);
        if (updErr) throw updErr;
      }

      const { error: startErr } = await sb
        .from('loto_lobbies')
        .update({
          status: 'playing',
          drawn_numbers: [],
          event: { type: 'game_started', ts: Date.now() },
        })
        .eq('id', lobbyId);
      if (startErr) throw startErr;

      return json({ type: 'state_update', lobby: { status: 'playing' } });
    }

    case 'draw_number': {
      if (!lobbyId) return json({ type: 'error', message: 'No lobby id' });
      const number = Number(body?.number);
      if (!Number.isInteger(number) || number < 1 || number > 90) {
        return json({ type: 'error', message: 'Number must be between 1 and 90' });
      }

      const { data: lobby, error: lobbyErr } = await sb
        .from('loto_lobbies')
        .select('drawn_numbers, admin_id')
        .eq('id', lobbyId)
        .single();
      if (lobbyErr) throw lobbyErr;
      if (!lobby) return json({ error: 'Lobby not found' }, 404);
      if (String(lobby.admin_id) !== userId) {
        return json({ type: 'error', message: 'Only host can draw numbers' });
      }

      const drawn = Array.isArray(lobby.drawn_numbers) ? [...lobby.drawn_numbers] : [];
      if (drawn.includes(number)) return json({ type: 'error', message: 'Number already drawn' });
      drawn.push(number);

      const { error: updErr } = await sb
        .from('loto_lobbies')
        .update({ drawn_numbers: drawn })
        .eq('id', lobbyId);
      if (updErr) throw updErr;

      return json({ type: 'state_update', drawn, all: drawn });
    }

    case 'undo_number': {
      if (!lobbyId) return json({ type: 'state_update', all: [], drawn: [] });
      const number = Number(body?.number);
      const { data: lobby, error: lobbyErr } = await sb
        .from('loto_lobbies')
        .select('drawn_numbers')
        .eq('id', lobbyId)
        .single();
      if (lobbyErr) throw lobbyErr;
      const current = Array.isArray(lobby?.drawn_numbers) ? lobby.drawn_numbers.map(Number) : [];
      const next =
        Number.isInteger(number) && number > 0
          ? current.filter((n) => n !== number)
          : current.slice(0, -1);
      const { error: updErr } = await sb
        .from('loto_lobbies')
        .update({ drawn_numbers: next })
        .eq('id', lobbyId);
      if (updErr) throw updErr;
      return json({ type: 'state_update', all: next, drawn: next });
    }

    case 'reset_numbers': {
      if (lobbyId) {
        const { error: resetErr } = await sb
          .from('loto_lobbies')
          .update({ drawn_numbers: [] })
          .eq('id', lobbyId);
        if (resetErr) throw resetErr;
      }
      return json({ type: 'state_update', all: [], drawn: [] });
    }

    case 'chat_message': {
      if (!lobbyId) return json({ type: 'success' });
      const { data: msg, error: msgErr } = await sb
        .from('loto_chat')
        .insert({
          lobby_id: lobbyId,
          user_id: userId,
          nickname,
          text: body?.text || '',
        })
        .select()
        .single();
      if (msgErr) throw msgErr;

      return json({
        type: 'chat_message',
        message: msg
          ? {
              id: msg.id,
              userId: msg.user_id,
              nickname: msg.nickname,
              text: msg.text,
              timestamp: msg.created_at,
            }
          : null,
      });
    }

    case 'update_profile': {
      if (lobbyId && userId && body?.nickname) {
        const { error: profileErr } = await sb
          .from('loto_players')
          .update({ nickname: body.nickname })
          .eq('id', userId)
          .eq('lobby_id', lobbyId);
        if (profileErr) throw profileErr;
      }
      return json({ type: 'success' });
    }

    case 'mark_cell': {
      if (lobbyId && userId) {
        const { error: markErr } = await sb
          .from('loto_players')
          .update({ marked_cells: parseCells(body) })
          .eq('id', userId)
          .eq('lobby_id', lobbyId);
        if (markErr) throw markErr;
      }
      return json({ type: 'success' });
    }

    default:
      return json({ error: 'Unknown action' }, 400);
  }
}

function getIdentity(bodyOrParams: any) {
  const lobbyId = normalizeLobbyId(bodyOrParams?.lobbyId);
  const userId = asString(bodyOrParams?.userId);
  const nickname = asString(bodyOrParams?.nickname) || 'Player';
  return { lobbyId, userId, nickname };
}

export async function POST(req: NextRequest) {
  const sb = getSupabaseClient();
  if (!sb) return json({ error: 'Supabase is not configured on server' }, 500);

  try {
    const body = await req.json().catch(() => ({}));
    const action = asString(body?.action || body?.type) || null;
    const { lobbyId, userId, nickname } = getIdentity(body);
    return await handleAction(sb, action, body, lobbyId, userId, nickname);
  } catch (error: any) {
    const message = String(error?.message || error || 'Internal server error');
    console.error('Loto Supabase API Error:', message);
    return json({ error: message }, 500);
  }
}

export async function GET(req: NextRequest) {
  const sb = getSupabaseClient();
  if (!sb) return json({ error: 'Supabase is not configured on server' }, 500);

  try {
    const { searchParams } = new URL(req.url);
    const action = asString(searchParams.get('action')) || null;
    const lobbyId = normalizeLobbyId(searchParams.get('lobbyId'));
    const userId = asString(searchParams.get('userId'));
    const nickname = asString(searchParams.get('nickname')) || 'Player';
    return await handleAction(sb, action, { lobbyId, userId, nickname }, lobbyId, userId, nickname);
  } catch (error: any) {
    const message = String(error?.message || error || 'Internal server error');
    console.error('Loto Supabase API Error:', message);
    return json({ error: message }, 500);
  }
}

