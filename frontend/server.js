#!/usr/bin/env node

const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

console.log('🚀 Starting GameSpot Frontend Server...');
console.log('📁 Build directory:', BUILD_DIR);
console.log('🔌 Port:', PORT);
console.log('📂 Current directory:', __dirname);
console.log('📂 Process cwd:', process.cwd());

// Check if build directory exists
if (!fs.existsSync(BUILD_DIR)) {
  console.error('❌ ERROR: Build directory does not exist!');
  console.error('❌ Expected path:', BUILD_DIR);
  console.error('❌ Please run "npm run build" first');
  process.exit(1);
}

// Check if index.html exists
const indexPath = path.join(BUILD_DIR, 'index.html');
if (!fs.existsSync(indexPath)) {
  console.error('❌ ERROR: index.html not found in build directory!');
  console.error('❌ Expected path:', indexPath);
  process.exit(1);
}

console.log('✅ Build directory found');
console.log('✅ index.html found');

// Middleware to log all requests
app.use((req, res, next) => {
  console.log(`📥 ${req.method} ${req.url} from ${req.ip}`);
  next();
});

// Health check endpoints - MUST respond quickly
app.get('/health', (req, res) => {
  console.log('✅ Health check OK');
  res.status(200).type('text/plain').send('OK');
});

app.get('/healthz', (req, res) => {
  console.log('✅ Healthz check OK');
  res.status(200).type('text/plain').send('OK');
});

// Root health check for Railway
app.get('/healthcheck', (req, res) => {
  console.log('✅ Healthcheck OK');
  res.status(200).type('text/plain').send('OK');
});

// Serve static files from the build directory
app.use(express.static(BUILD_DIR, {
  maxAge: '1h',
  etag: true,
  lastModified: true,
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle React routing - return index.html for all other routes
app.get('*', (req, res) => {
  console.log('� Serving index.html for:', req.path);
  res.sendFile(indexPath, (err) => {
    if (err) {
      console.error('❌ Error sending index.html:', err);
      res.status(500).send('Internal Server Error');
    }
  });
});

// Start server
const server = app.listen(PORT, '0.0.0.0', () => {
  console.log('');
  console.log('='.repeat(50));
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`✅ Ready to accept connections`);
  console.log(`✅ Health check available at /health`);
  console.log('='.repeat(50));
  console.log('');
  
  // Test the server is actually listening
  console.log('🔍 Testing server connectivity...');
  const http = require('http');
  const testReq = http.get(`http://localhost:${PORT}/health`, (testRes) => {
    console.log(`✅ Self-test successful! Status: ${testRes.statusCode}`);
  }).on('error', (err) => {
    console.error('❌ Self-test failed:', err.message);
  });
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
});

// Keep the server alive
server.on('listening', () => {
  console.log('✅ Server is actively listening for connections');
});

// Handle errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
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

process.on('SIGINT', () => {
  console.log('🛑 SIGINT received, shutting down gracefully...');
  server.close(() => {
    console.log('👋 Server closed');
    process.exit(0);
  });
});
