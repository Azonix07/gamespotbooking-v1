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

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('📥 Health check requested');
  res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
  console.log('📥 Healthz check requested');
  res.status(200).send('OK');
});

// Serve static files from the build directory
app.use(express.static(BUILD_DIR, {
  maxAge: '1h',
  setHeaders: (res, filePath) => {
    if (filePath.endsWith('.html')) {
      res.setHeader('Cache-Control', 'no-cache');
    }
  }
}));

// Handle React routing - return index.html for all routes
app.get('*', (req, res) => {
  console.log('📥 Serving:', req.path);
  res.sendFile(indexPath);
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
});

// Handle server errors
server.on('error', (error) => {
  console.error('❌ Server error:', error);
  if (error.code === 'EADDRINUSE') {
    console.error(`❌ Port ${PORT} is already in use`);
  }
  process.exit(1);
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
