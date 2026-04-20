import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

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
  const res = await fetch(`https://api.twitch.tv/helix/users?id=${userId}`, {
    headers: {
      'Authorization': `Bearer ${appToken}`,
      'Client-Id': process.env.TWITCH_CLIENT_ID!
    }
  });
  const data = await res.json();
  return data.data?.[0]?.profile_image_url;
}

export async function POST(req: NextRequest) {
  const data = await req.json();
  if (data.challenge) return new Response(data.challenge, { status: 200, headers: { 'Content-Type': 'text/plain' } });

  const { subscription, event } = data;
  if (subscription?.type === 'channel.channel_points_custom_reward_redemption.add') {
    const streamerId = event.broadcaster_user_id || event.broadcaster_id;
    const rewardName = (event.reward.title || "").toString().trim().toLowerCase();
    const userId = event.user_id;
    const userName = event.user_name || event.user_login;
    const userMessage = event.user_input || "";

    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.SUPABASE_URL || '';
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || '';
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // Fetch streamer config
    const { data: configs } = await supabase
      .from('overlay_configs')
      .select('settings, assets, trigger')
      .eq('user_id', streamerId);

    const config = configs && configs.length > 0 ? configs[0] : null;
    const settings: any = config?.settings || {};
    const assets: any = config?.assets || {};
    
    const dbRewardId = settings?.reward_id || "";
    const dbRewardName = (settings?.reward_name || "").toString().trim().toLowerCase();
    const twitchRewardId = event.reward.id;

    const isMatch = (dbRewardId && dbRewardId === twitchRewardId) || 
                    (!dbRewardId && dbRewardName === rewardName);

    if (isMatch) {
      const match = userMessage.match(/\d+/);
      const userChoice = match ? parseInt(match[0]) : null;
      
      if (userChoice !== null) {
        const appToken = await getAppToken();
        const userAvatar = await getUserAvatar(userId, appToken);

        const payload = {
          triggerId: Math.random().toString(36).substring(7),
          userName,
          userAvatar,
          userChoice,
          timestamp: Date.now()
        };
        
        // Store in BOTH places for consistency with test button and overlay logic
        const updatedAssets = { ...assets, last_trigger: payload };

        await supabase
          .from('overlay_configs')
          .upsert({ 
            user_id: streamerId, 
            assets: updatedAssets,
            trigger: payload, // Update dedicated column
            settings: settings,
            updated_at: new Date().toISOString()
          }, { onConflict: 'user_id' });
      }
    }
  }

  return NextResponse.json({ ok: true });
}
