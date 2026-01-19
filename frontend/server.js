#!/usr/bin/env node

const handler = require('serve-handler');
const http = require('http');

const PORT = process.env.PORT || 3000;

const server = http.createServer((request, response) => {
  return handler(request, response, {
    public: 'build',
    rewrites: [
      { source: '**', destination: '/index.html' }
    ]
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`✅ Ready to accept connections`);
});
