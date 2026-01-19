#!/usr/bin/env node

const handler = require('serve-handler');
const http = require('http');
const path = require('path');

const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

console.log('🚀 Starting GameSpot Frontend Server...');
console.log('📁 Build directory:', BUILD_DIR);
console.log('🔌 Port:', PORT);

const server = http.createServer(async (request, response) => {
  // Log all requests
  console.log(`📥 ${request.method} ${request.url}`);
  
  // Health check endpoint
  if (request.url === '/health' || request.url === '/healthz') {
    response.writeHead(200, { 'Content-Type': 'text/plain' });
    response.end('OK');
    return;
  }

  // Serve static files
  try {
    await handler(request, response, {
      public: BUILD_DIR,
      rewrites: [
        { source: '**', destination: '/index.html' }
      ],
      headers: [
        {
          source: '**',
          headers: [
            {
              key: 'Cache-Control',
              value: 'public, max-age=3600'
            }
          ]
        }
      ]
    });
  } catch (error) {
    console.error('❌ Error serving file:', error);
    response.writeHead(500, { 'Content-Type': 'text/plain' });
    response.end('Internal Server Error');
  }
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`✅ Ready to accept connections`);
  console.log(`✅ Health check available at /health`);
});

// Handle errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  process.exit(1);
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
