#!/bin/bash
set -e

echo "🔧 Starting Railway Deployment Setup..."
echo ""

# Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo "❌ ERROR: package.json not found!"
    echo "This script must be run from the frontend directory"
    exit 1
fi

echo "✅ Found package.json"
echo ""

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Build the application
echo "🏗️  Building application..."
CI=false npm run build

# Verify build output
if [ ! -d "build" ]; then
    echo "❌ ERROR: Build directory not created!"
    exit 1
fi

if [ ! -f "build/index.html" ]; then
    echo "❌ ERROR: index.html not found in build!"
    exit 1
fi

echo "✅ Build successful"
echo "✅ Build directory: $(pwd)/build"
echo "✅ Files in build:"
ls -la build/ | head -10
echo ""

# Start the server
echo "🚀 Starting server..."
node server.js
