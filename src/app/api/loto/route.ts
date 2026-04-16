import { NextRequest, NextResponse } from 'next/server';
import { Redis } from '@upstash/redis';

const redis = (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN)
  ? new Redis({
      url: process.env.KV_REST_API_URL,
      token: process.env.KV_REST_API_TOKEN,
    })
  : null;

// Helper to generate a 6-char lobby code
function generateLobbyCode() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export async function POST(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  try {
    const body = await req.json();
    const { action, ...data } = body;

    switch (action) {
      case 'auth': {
        const { userId, nickname, telegramId } = data;
        const userKey = `loto:user:${userId}`;
        
        let user = await redis.hgetall(userKey);
        if (!user || Object.keys(user).length === 0) {
          user = {
            id: userId,
            nickname: nickname || 'Игрок',
            avatar: '👤',
            games_played: '0',
            games_won: '0',
            total_score: '0',
            achievements: '[]',
            friends: '[]',
            settings: '{}',
            created_at: Math.floor(Date.now() / 1000).toString(),
          };
          await redis.hset(userKey, user);
        } else {
          await redis.hset(userKey, { nickname: nickname || user.nickname, last_seen: Math.floor(Date.now() / 1000).toString() });
        }
        
        return NextResponse.json({ type: 'auth_success', user });
      }

      case 'create_lobby': {
        const { userId, name, password, maxPlayers, mode, rounds } = data;
        const lobbyId = crypto.randomUUID();
        const code = generateLobbyCode();
        
        const lobby = {
          id: lobbyId,
          code,
          name,
          password: password || '',
          admin_id: userId,
          max_players: maxPlayers || 10,
          status: 'waiting',
          mode: mode || 'classic',
          total_rounds: rounds || 1,
          created_at: Math.floor(Date.now() / 1000).toString(),
        };

        await redis.hset(`loto:lobby:${lobbyId}`, lobby);
        await redis.set(`loto:code_to_id:${code}`, lobbyId);
        await redis.sadd(`loto:active_lobbies`, lobbyId); // Registry
        await redis.sadd(`loto:lobby_players:${lobbyId}`, userId);
        await redis.hset(`loto:player_status:${lobbyId}`, { [userId]: 'ready' });
        
        return NextResponse.json({ type: 'lobby_created', lobby });
      }

      case 'join_lobby': {
        const { userId, code, password } = data;
        const lobbyId = await redis.get<string>(`loto:code_to_id:${code}`);
        if (!lobbyId) return NextResponse.json({ type: 'error', message: 'Лобби не найдено' });

        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.status !== 'waiting') return NextResponse.json({ type: 'error', message: 'Игра уже идет' });
        if (lobby.password && lobby.password !== password) return NextResponse.json({ type: 'error', message: 'Неверный пароль' });

        const playersCount = await redis.scard(`loto:lobby_players:${lobbyId}`);
        if (playersCount >= (lobby.max_players || 10)) return NextResponse.json({ type: 'error', message: 'Лобби заполнено' });

        await redis.sadd(`loto:lobby_players:${lobbyId}`, userId);
        await redis.hset(`loto:player_status:${lobbyId}`, { [userId]: 'waiting' });

        return NextResponse.json({ type: 'lobby_joined', lobbyId });
      }

      case 'start_game': {
        const { userId, lobbyId } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может начать' });

        await redis.hset(`loto:lobby:${lobbyId}`, { status: 'playing', started_at: Math.floor(Date.now() / 1000).toString() });
        
        // In a real game we would generate cards here and store them in Redis
        // For now, the client will generate its own card when it sees status='playing'
        // or we can implement a sync point.
        
        return NextResponse.json({ type: 'game_started' });
      }

      case 'draw_number': {
        const { userId, lobbyId, number } = data;
        const lobby: any = await redis.hgetall(`loto:lobby:${lobbyId}`);
        if (lobby.admin_id !== userId) return NextResponse.json({ type: 'error', message: 'Только админ может тянуть бочонки' });

        await redis.rpush(`loto:drawn:${lobbyId}`, number);
        return NextResponse.json({ type: 'number_drawn', number });
      }

      case 'chat_message': {
        const { userId, lobbyId, text, nickname, avatar } = data;
        const msg = {
          id: crypto.randomUUID(),
          userId,
          nickname,
          avatar,
          text,
          timestamp: Date.now(),
        };
        await redis.rpush(`loto:chat:${lobbyId}`, JSON.stringify(msg));
        await redis.ltrim(`loto:chat:${lobbyId}`, -50, -1); // Keep last 50
        return NextResponse.json({ type: 'chat_sent' });
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    console.error('Loto API Error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  if (!redis) return NextResponse.json({ error: 'Database not configured' }, { status: 500 });

  const { searchParams } = new URL(req.url);
  const action = searchParams.get('action');

  try {
    switch (action) {
      case 'get_state': {
        const lobbyId = searchParams.get('lobbyId');
        if (!lobbyId) return NextResponse.json({ error: 'Missing lobbyId' }, { status: 400 });

        const [lobby, playerIds, playerStatuses, drawn, chat] = await Promise.all([
          redis.hgetall(`loto:lobby:${lobbyId}`),
          redis.smembers(`loto:lobby_players:${lobbyId}`),
          redis.hgetall(`loto:player_status:${lobbyId}`),
          redis.lrange(`loto:drawn:${lobbyId}`, 0, -1),
          redis.lrange(`loto:chat:${lobbyId}`, 0, -1),
        ]);

        // Get profiles for all players
        const players = await Promise.all(playerIds.map(async (pid) => {
          const profile: any = await redis.hgetall(`loto:user:${pid}`);
          return {
            id: pid,
            nickname: profile?.nickname || 'Игрок',
            avatar: profile?.avatar || '👤',
            status: playerStatuses?.[pid] || 'waiting',
            games_played: profile?.games_played || 0,
            isAdmin: pid === (lobby as any)?.admin_id
          };
        }));

        return NextResponse.json({
          type: 'state_update',
          lobby: { ...lobby, players },
          drawn: drawn.map(Number),
          chat: chat.map(m => JSON.parse(m as string))
        });
      }

      case 'list_lobbies': {
        const lobbyIds = await redis.smembers(`loto:active_lobbies`);
        const lobbies = await Promise.all(lobbyIds.map(async (id) => {
          const lobby: any = await redis.hgetall(`loto:lobby:${id}`);
          if (!lobby || lobby.status !== 'waiting') return null;
          const playersCount = await redis.scard(`loto:lobby_players:${id}`);
          return {
            id: lobby.id,
            name: lobby.name,
            code: lobby.code,
            players_count: playersCount,
            max_players: lobby.max_players,
            has_password: lobby.password ? 1 : 0
          };
        }));
        return NextResponse.json(lobbies.filter(l => l !== null));
      }

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }
  } catch (err) {
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}
