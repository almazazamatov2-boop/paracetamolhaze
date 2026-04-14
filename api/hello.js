export const config = {
  path: '/api/*'
};

export default function handler(req, res) {
  const path = req.url.replace('/api/', '').replace('/', '');
  const pages = {
    '': 'index.html',
    'roz': 'roz.html',
    'check': 'check.html',
    'kino': 'kino.html'
  };
  
  const page = pages[path] || 'index.html';
  
  res.status(200).setHeader('Location', '/' + page);
  res.status(302).end();
}