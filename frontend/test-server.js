#!/usr/bin/env node

// Minimal test server for Railway
const http = require('http');

const PORT = process.env.PORT || 8080;

console.log('🚀 Starting MINIMAL test server...');
console.log('PORT:', PORT);

const server = http.createServer((req, res) => {
  console.log(`📥 Request: ${req.method} ${req.url}`);
  
  res.writeHead(200, { 'Content-Type': 'text/plain' });
  res.end('Hello from Railway! Server is working!\n');
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Minimal server running on 0.0.0.0:${PORT}`);
});

server.on('error', (err) => {
  console.error('❌ Server error:', err);
  process.exit(1);
});
