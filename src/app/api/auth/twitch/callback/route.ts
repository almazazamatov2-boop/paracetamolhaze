import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/overlays?error=${error}`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/overlays?error=no_code`);
  }

  const clientId = process.env.TWITCH_CLIENT_ID;
  const clientSecret = process.env.TWITCH_CLIENT_SECRET;
  const redirectUri = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/api/auth/twitch/callback`;

  try {
    const response = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: clientId!,
        client_secret: clientSecret!,
        code,
        grant_type: 'authorization_code',
        redirect_uri: redirectUri,
      }),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Twitch Auth Error:', data);
      return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/overlays?error=auth_failed`);
    }

    // 1. Fetch user ID to register webhook
    const userRes = await fetch('https://api.twitch.tv/helix/users', {
      headers: { 'Authorization': `Bearer ${data.access_token}`, 'Client-Id': clientId! }
    });
    const userData = await userRes.json();
    
    if (userData?.data?.[0]?.id) {
      const userId = userData.data[0].id;
      const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || 'https://paracetamolhaze.vercel.app';
      
      // 2. Fetch App Access Token
      const appTokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({
          client_id: clientId!,
          client_secret: clientSecret!,
          grant_type: 'client_credentials'
        })
      });
      const appTokenData = await appTokenRes.json();

      // 3. Register EventSub Webhook
      if (appTokenData.access_token) {
        await fetch('https://api.twitch.tv/helix/eventsub/subscriptions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${appTokenData.access_token}`,
            'Client-Id': clientId!,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            type: 'channel.channel_points_custom_reward_redemption.add',
            version: '1',
            condition: { broadcaster_user_id: userId },
            transport: {
              method: 'webhook',
              callback: `${baseUrl}/api/overlays/webhook`,
              secret: process.env.TWITCH_CLIENT_SECRET || 'fallback_secret_1234567890123'
            }
          })
        });
      }
    }

    // Successfully got the token
    // In a real app, we'd save this to a session/cookie.
    // For now, we'll redirect to the dashboard with the token in a cookie.
    const res = NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/overlays/dashboard`);
    res.cookies.set('twitch_token', data.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: data.expires_in,
    });

    return res;
  } catch (err) {
    console.error('Callback error:', err);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/overlays?error=server_error`);
  }
}
