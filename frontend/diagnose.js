#!/usr/bin/env node

// Diagnostic script for Railway deployment issues
console.log('='.repeat(60));
console.log('🔍 Railway Deployment Diagnostics');
console.log('='.repeat(60));
console.log('');

const fs = require('fs');
const path = require('path');

// 1. Environment Check
console.log('📋 Environment Variables:');
console.log('  NODE_ENV:', process.env.NODE_ENV || 'not set');
console.log('  PORT:', process.env.PORT || 'not set (will use 3000)');
console.log('  REACT_APP_API_URL:', process.env.REACT_APP_API_URL || 'not set');
console.log('');

// 2. Directory Check
console.log('📁 Directory Information:');
console.log('  __dirname:', __dirname);
console.log('  process.cwd():', process.cwd());
console.log('');

// 3. Files Check
console.log('📂 File Structure:');
const files = [
  'package.json',
  'server.js',
  'build',
  'build/index.html',
  'build/static'
];

files.forEach(file => {
  const fullPath = path.join(__dirname, file);
  const exists = fs.existsSync(fullPath);
  console.log(`  ${exists ? '✅' : '❌'} ${file}`);
  if (exists && fs.statSync(fullPath).isDirectory()) {
    const contents = fs.readdirSync(fullPath);
    console.log(`     Contents: ${contents.slice(0, 5).join(', ')}${contents.length > 5 ? '...' : ''}`);
  }
});
console.log('');

// 4. Package.json Check
console.log('📦 Package.json Information:');
try {
  const pkg = require('./package.json');
  console.log('  Name:', pkg.name);
  console.log('  Version:', pkg.version);
  console.log('  Scripts:', Object.keys(pkg.scripts || {}).join(', '));
  console.log('  Dependencies:', Object.keys(pkg.dependencies || {}).length, 'packages');
  console.log('  Express installed:', pkg.dependencies?.express ? '✅' : '❌');
} catch (error) {
  console.log('  ❌ Error reading package.json:', error.message);
}
console.log('');

// 5. Network Check
console.log('🌐 Network Information:');
console.log('  Hostname:', require('os').hostname());
console.log('  Platform:', process.platform);
console.log('  Node Version:', process.version);
console.log('');

// 6. Build Check
console.log('🏗️  Build Verification:');
const buildPath = path.join(__dirname, 'build');
const indexPath = path.join(buildPath, 'index.html');

if (fs.existsSync(buildPath)) {
  console.log('  ✅ Build directory exists');
  if (fs.existsSync(indexPath)) {
    console.log('  ✅ index.html exists');
    const indexSize = fs.statSync(indexPath).size;
    console.log('  📊 index.html size:', indexSize, 'bytes');
    
    // Count files in build
    const countFiles = (dir) => {
      let count = 0;
      fs.readdirSync(dir).forEach(file => {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
          count += countFiles(fullPath);
        } else {
          count++;
        }
      });
      return count;
    };
    console.log('  📊 Total files in build:', countFiles(buildPath));
  } else {
    console.log('  ❌ index.html NOT found');
  }
} else {
  console.log('  ❌ Build directory does NOT exist');
}
console.log('');

console.log('='.repeat(60));
console.log('✅ Diagnostics complete');
console.log('='.repeat(60));
console.log('');
console.log('If everything shows ✅ above, the issue is likely:');
console.log('  1. Railway Root Directory not set to "frontend"');
console.log('  2. Port binding issue (check Railway logs)');
console.log('  3. Health check timing out');
console.log('');
console.log('Next step: Starting the server...');
console.log('');

// Now start the actual server
require('./server.js');
