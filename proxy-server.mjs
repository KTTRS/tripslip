import http from 'node:http';
import httpProxy from 'http-proxy';

const proxy = httpProxy.createProxyServer({ ws: true });

const routes = [
  { prefix: '/venue', target: 'http://localhost:3001' },
  { prefix: '/teacher', target: 'http://localhost:3002' },
  { prefix: '/parent', target: 'http://localhost:3003' },
  { prefix: '/school', target: 'http://localhost:4200' },
];

function getTarget(url) {
  for (const route of routes) {
    if (url && url.startsWith(route.prefix)) {
      return route.target;
    }
  }
  return 'http://localhost:3000';
}

const server = http.createServer((req, res) => {
  const target = getTarget(req.url);
  proxy.web(req, res, { target });
});

server.on('upgrade', (req, socket, head) => {
  const target = getTarget(req.url);
  proxy.ws(req, socket, head, { target });
});

proxy.on('error', (err, req, res) => {
  console.error('Proxy error:', err.message);
  if (res && res.writeHead) {
    res.writeHead(502, { 'Content-Type': 'text/plain' });
    res.end('App is starting up, please refresh in a moment.');
  }
});

server.listen(5000, '0.0.0.0', () => {
  console.log('Proxy server running on http://0.0.0.0:5000');
  console.log('Routes:');
  console.log('  /          -> landing  (port 3000)');
  console.log('  /venue/*   -> venue    (port 3001)');
  console.log('  /teacher/* -> teacher  (port 3002)');
  console.log('  /parent/*  -> parent   (port 3003)');
  console.log('  /school/*  -> school   (port 4200)');
});
