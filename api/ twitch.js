module.exports = async function (req, res) {
  const url = require('url');
  const query = url.parse(req.url, true).query;
  const a = query.a;
  const u = query.u;

  const CLIENT_ID = 'njwi66jx4ju5kpb25aeh4fd4i2okq5';
  const CLIENT_SECRET = 'uspju8gdepuar3e7fgv7c5q0p5xem8';

  try {
    const tokenRes = await fetch('https://id.twitch.tv/oauth2/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: `client_id=${CLIENT_ID}&client_secret=${CLIENT_SECRET}&grant_type=client_credentials`
    });
    const tokenData = await tokenRes.json();
    
    if (a === 'u' && u) {
      const usersRes = await fetch(`https://api.twitch.tv/helix/users?login=${u}`, {
        headers: {
          'Client-ID': CLIENT_ID,
          'Authorization': `Bearer ${tokenData.access_token}`
        }
      });
      const usersData = await usersRes.json();
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify(usersData.data?.[0] || { error: 'not found' }));
    } else {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({ error: 'bad' }));
    }
  } catch (e) {
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify({ error: e.message }));
  }
};