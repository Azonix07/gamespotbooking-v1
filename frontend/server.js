#!/usr/bin/env node

const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const BUILD_DIR = path.join(__dirname, 'build');

console.log('🚀 Starting GameSpot Frontend Server...');
console.log('📁 Build directory:', BUILD_DIR);
console.log('🔌 Port:', PORT);

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).send('OK');
});

app.get('/healthz', (req, res) => {
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
  res.sendFile(path.join(BUILD_DIR, 'index.html'));
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`✅ Server running at http://0.0.0.0:${PORT}`);
  console.log(`✅ Ready to accept connections`);
  console.log(`✅ Health check available at /health`);
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
