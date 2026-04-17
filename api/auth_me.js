export default async function handler(req, res) {
  let token = req.cookies?.twitch_token;
  
  // Manual parse if req.cookies is missing
  if (!token && req.headers.cookie) {
    const cookies = Object.fromEntries(req.headers.cookie.split('; ').map(v => v.split('=')));
    token = cookies.twitch_token;
  }

  if (!token) return res.status(401).json({ error: 'Unauthorized (missing token)' });

  const clientId = process.env.TWITCH_CLIENT_ID;
  if (!clientId) return res.status(500).json({ error: 'Server config missing (Client ID)' });

  try {
    const response = await fetch('https://api.twitch.tv/helix/users', {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Client-Id': clientId,
      },
    });

    const data = await response.json();
    if (!response.ok || !data.data?.[0]) {
      console.error('Twitch API error:', data);
      return res.status(response.status).json({ error: 'Twitch API error', details: data });
    }

    const user = data.data[0];
    return res.status(200).json({
      id: user.id,
      login: user.login,
      display_name: user.display_name,
      profile_image_url: user.profile_image_url,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
