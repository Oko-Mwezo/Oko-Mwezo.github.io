/**
 * DualTrack Hub - simple Node.js server
 * ------------------------------------
 * Serves dualtrack-hub.html. No npm packages needed (Node 14+).
 *
 * Run:   node server.js
 * Open:  http://localhost:3000
 *
 * Optional settings:
 *   PORT=8080 node server.js          (change the port)
 *   HOST=127.0.0.1 node server.js     (only this computer; default is all devices on your network)
 */

const http = require('http');
const fs = require('fs');
const os = require('os');
const path = require('path');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '0.0.0.0';
const APP_FILE = path.join(__dirname, 'dualtrack-hub.html');

// Only these URLs are served. Everything else is a 404 (no folder browsing).
const APP_ROUTES = new Set(['/', '/index.html', '/dualtrack-hub.html']);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'X-Frame-Options': 'SAMEORIGIN',
  'Referrer-Policy': 'no-referrer'
};

function send(res, status, body, headers) {
  res.writeHead(status, Object.assign({}, SECURITY_HEADERS, headers));
  res.end(body);
}

const server = http.createServer(function (req, res) {
  if (req.method !== 'GET' && req.method !== 'HEAD') {
    return send(res, 405, 'Method not allowed', { 'Content-Type': 'text/plain; charset=utf-8', 'Allow': 'GET, HEAD' });
  }

  let pathname;
  try {
    pathname = decodeURIComponent(new URL(req.url, 'http://localhost').pathname);
  } catch (err) {
    return send(res, 400, 'Bad request', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  if (pathname === '/health') {
    return send(res, 200, JSON.stringify({ status: 'ok' }), { 'Content-Type': 'application/json; charset=utf-8' });
  }

  if (pathname === '/favicon.ico') {
    return send(res, 204, '');
  }

  if (!APP_ROUTES.has(pathname)) {
    return send(res, 404, 'Not found', { 'Content-Type': 'text/plain; charset=utf-8' });
  }

  fs.readFile(APP_FILE, function (err, html) {
    if (err) {
      console.error('Could not read ' + APP_FILE + ':', err.message);
      return send(res, 500, 'dualtrack-hub.html not found. Keep it in the same folder as server.js.', { 'Content-Type': 'text/plain; charset=utf-8' });
    }
    send(res, 200, req.method === 'HEAD' ? '' : html, {
      'Content-Type': 'text/html; charset=utf-8',
      'Content-Length': html.length,
      'Cache-Control': 'no-cache'
    });
  });
});

server.on('error', function (err) {
  if (err.code === 'EADDRINUSE') {
    console.error('Port ' + PORT + ' is already in use. Try: PORT=' + (PORT + 1) + ' node server.js');
  } else {
    console.error('Server error:', err.message);
  }
  process.exit(1);
});

server.listen(PORT, HOST, function () {
  console.log('');
  console.log('DualTrack Hub is running');
  console.log('  This computer:  http://localhost:' + PORT);

  if (HOST === '0.0.0.0') {
    const nets = os.networkInterfaces();
    Object.keys(nets).forEach(function (name) {
      (nets[name] || []).forEach(function (net) {
        if (net.family === 'IPv4' && !net.internal) {
          console.log('  Same Wi-Fi:     http://' + net.address + ':' + PORT);
        }
      });
    });
  }
  console.log('');
  console.log('Note: your data is saved in the browser you use, so always open the');
  console.log('same address (localhost and the Wi-Fi address keep separate data).');
  console.log('Press Ctrl+C to stop.');
  console.log('');
});

function shutdown() {
  console.log('\nStopping server...');
  server.close(function () { process.exit(0); });
  setTimeout(function () { process.exit(0); }, 2000).unref();
}
process.on('SIGINT', shutdown);
process.on('SIGTERM', shutdown);