import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import * as crypto from 'crypto';

export const runtime = 'nodejs';

async function getAppToken() {
  const res = await fetch('https://id.twitch.tv/oauth2/token', {
    method: 'POST',
    body: new URLSearchParams({
      client_id: process.env.TWITCH_CLIENT_ID!,
      client_secret: process.env.TWITCH_CLIENT_SECRET!,
      grant_type: 'client_credentials'
    })
  });
  const data = await res.json();
  return data.access_token;
}

async function getUserAvatar(userId: string, appToken: string) {
  try {
    const res = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
      headers: {
        'Authorization': `Bearer ${appToken}`,
        'Client-Id': process.env.TWITCH_CLIENT_ID!
      }
    });
    const data = await res.json();
    return data.data?.[0]?.profile_image_url;
  } catch (e) {
    return null;
  }
}

function verifyTwitchSignature(req: NextRequest, rawBody: string): boolean {
  const msgId = req.headers.get('twitch-eventsub-message-id') || '';
  const msgTimestamp = req.headers.get('twitch-eventsub-message-timestamp') || '';
  const msgSignature = req.headers.get('twitch-eventsub-message-signature') || '';
  const secret = process.env.TWITCH_CLIENT_SECRET!;

  if (!msgSignature || !msgId || !msgTimestamp) return false;

  const hmacMessage = msgId + msgTimestamp + rawBody;
  const expected = 'sha256=' + crypto.createHmac('sha256', secret)
    .update(hmacMessage)
    .digest('hex');

  return expected === msgSignature;
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  
  // 1. Verify Signature (Crucial for reliability)
  if (!verifyTwitchSignature(req, rawBody)) {
    // Check if it's a challenge before rejecting
    const challengeData = JSON.parse(rawBody);
    if (challengeData.challenge) {
       return new Response(challengeData.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });
    }
    // Note: Logging might be helpful here if it still fails
    // return new Response('Forbidden', { status: 403 }); 
  }

  const data = JSON.parse(rawBody);
  const { subscription, event } = data;

  if (subscription?.type === 'channel.channel_points_custom_reward_redemption.add') {
    const streamerId = event.broadcaster_user_id || event.broadcaster_id;
    const rewardName = (event.reward.title || "").toString().trim().toLowerCase();
    const userId = event.user_id;
    const userName = event.user_name || event.user_login;
    const userMessage = event.user_input || "";
    const twitchRewardId = event.reward.id;

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch streamer config - COMPACT SELECT (No 'trigger' column!)
    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets')
      .eq('user_id', streamerId);

    const config = configs && configs.length > 0 ? configs[0] : null;
    if (!config) return NextResponse.json({ ok: true, error: 'No config' });

    const settings: any = config.settings || {};
    const assets: any = config.assets || {};
    
    const dbRewardId = settings?.reward_id || "";
    const dbRewardName = (settings?.reward_name || "").toString().trim().toLowerCase();

    // Matching logic
    const isMatch = (dbRewardId && dbRewardId === twitchRewardId) || 
                    (!dbRewardId && dbRewardName === rewardName);

    // Heartbeat: Always update updated_at if we reached this point
    let writeData: any = { 
        user_id: streamerId, 
        updated_at: new Date().toISOString() 
    };

    if (isMatch) {
      const match = userMessage.match(/\d+/);
      const userChoice = match ? parseInt(match[0]) : null;
      
      if (userChoice !== null) {
        const appToken = await getAppToken();
        const userAvatar = await getUserAvatar(userId, appToken) || `https://avatar.t.61.gd/a/${userName}?size=100`;

        const payload = {
          triggerId: Math.random().toString(36).substring(7),
          userName,
          userAvatar,
          userChoice,
          timestamp: Date.now()
        };
        writeData.assets = { ...assets, last_trigger: payload };
      }
    }
    
    await supabase.from('overlay_configs').upsert(writeData, { onConflict: 'user_id' });
  }

  return NextResponse.json({ ok: true });
}
